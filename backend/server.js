/* ==========================================================================
   KOICA YLP - Backend API
   Auth: participant name + KOICA PIN
   Storage: JSON files
   ========================================================================== */

import { loadEnvFile } from "node:process";

try {
  loadEnvFile();
} catch {}

import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_VERCEL = Boolean(process.env.VERCEL);

const RUNTIME_ROOT = IS_VERCEL
  ? path.join("/tmp", "koica-ylp")
  : __dirname;

const SEED_DATA = path.join(__dirname, "data");
const DATA = path.join(RUNTIME_ROOT, "data");

const RESOURCE_DIR = path.join(
  RUNTIME_ROOT,
  "uploads",
  "resources"
);

const PRESENTATION_DIR = path.join(
  RUNTIME_ROOT,
  "uploads",
  "module-presentations"
);

const MAX_RESOURCE_BYTES = 50 * 1024 * 1024;

const ALLOWED_RESOURCE_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".zip",
  ".mp4",
  ".webm",
  ".mp3",
  ".wav",
]);

for (const dir of [
  DATA,
  RESOURCE_DIR,
  PRESENTATION_DIR,
]) {
  fs.mkdirSync(dir, {
    recursive: true,
  });
}

function seedRuntimeDataFile(fileName) {
  const runtimeFile = path.join(DATA, fileName);

  if (fs.existsSync(runtimeFile)) {
    return;
  }

  const seedFile = path.join(
    SEED_DATA,
    fileName
  );

  if (fs.existsSync(seedFile)) {
    fs.copyFileSync(
      seedFile,
      runtimeFile
    );
  }
}

for (const fileName of [
  "content.json",
  "participants.json",
  "progress.json",
]) {
  seedRuntimeDataFile(fileName);
}

/* --------------------------------------------------------------------------
   Secret
   -------------------------------------------------------------------------- */

const SECRET =
  process.env.YLP_SECRET ||
  crypto.randomBytes(32).toString("hex");

if (!process.env.YLP_SECRET) {
  console.warn(
    "[ylp] No YLP_SECRET set. Using temporary secret."
  );
}

/* --------------------------------------------------------------------------
   JSON store
   -------------------------------------------------------------------------- */

const read = (fileName, fallback) => {
  const runtimeFile = path.join(
    DATA,
    fileName
  );

  const seedFile = path.join(
    SEED_DATA,
    fileName
  );

  for (const candidate of [
    runtimeFile,
    seedFile,
  ]) {
    try {
      return JSON.parse(
        fs.readFileSync(
          candidate,
          "utf8"
        )
      );
    } catch {
      // Try next location.
    }
  }

  return fallback;
};

const write = (fileName, value) => {
  fs.mkdirSync(DATA, {
    recursive: true,
  });

  fs.writeFileSync(
    path.join(DATA, fileName),
    JSON.stringify(
      value,
      null,
      2
    )
  );
};

/* --------------------------------------------------------------------------
   PIN hashing
   -------------------------------------------------------------------------- */

export const hashPin = (
  pin,
  salt
) =>
  crypto
    .scryptSync(
      pin
        .trim()
        .toUpperCase(),
      salt,
      32
    )
    .toString("hex");

const verifyPin = (
  pin,
  participant
) => {
  try {
    const attempt = hashPin(
      pin,
      participant.salt
    );

    return crypto.timingSafeEqual(
      Buffer.from(
        attempt,
        "hex"
      ),
      Buffer.from(
        participant.pinHash,
        "hex"
      )
    );
  } catch {
    return false;
  }
};

const normalizeName = (value) =>
  (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[^a-z\s]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

/* --------------------------------------------------------------------------
   Authentication tokens
   -------------------------------------------------------------------------- */

const TOKEN_TTL =
  12 * 60 * 60 * 1000;

function issueToken(id) {
  const body = Buffer.from(
    JSON.stringify({
      id,
      exp:
        Date.now() +
        TOKEN_TTL,
    })
  ).toString(
    "base64url"
  );

  const sig = crypto
    .createHmac(
      "sha256",
      SECRET
    )
    .update(body)
    .digest(
      "base64url"
    );

  return `${body}.${sig}`;
}

function readToken(token) {
  if (
    !token ||
    !token.includes(".")
  ) {
    return null;
  }

  const [body, sig] =
    token.split(".");

  const expected = crypto
    .createHmac(
      "sha256",
      SECRET
    )
    .update(body)
    .digest(
      "base64url"
    );

  if (
    sig.length !==
    expected.length
  ) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expected)
    )
  ) {
    return null;
  }

  try {
    const data =
      JSON.parse(
        Buffer.from(
          body,
          "base64url"
        ).toString()
      );

    return data.exp >
      Date.now()
      ? data
      : null;
  } catch {
    return null;
  }
}

function auth(
  req,
  res,
  next
) {
  const token = (
    req.headers.authorization ||
    ""
  ).replace(
    "Bearer ",
    ""
  );

  const data =
    readToken(token);

  if (!data) {
    return res
      .status(401)
      .json({
        error:
          "Session expired. Please log in again.",
      });
  }

  const participant =
    read(
      "participants.json",
      []
    ).find(
      (participant) =>
        participant.id ===
        data.id
    );

  if (!participant) {
    return res
      .status(401)
      .json({
        error:
          "Account not found.",
      });
  }

  req.user =
    participant;

  next();
}

/* --------------------------------------------------------------------------
   Login throttle
   -------------------------------------------------------------------------- */

const attempts =
  new Map();

const MAX_TRIES = 8;
const LOCKOUT =
  15 * 60 * 1000;

function throttle(
  req,
  res,
  next
) {
  const ip = req.ip;
  const record =
    attempts.get(ip);

  if (
    record &&
    record.count >=
      MAX_TRIES &&
    Date.now() -
      record.first <
      LOCKOUT
  ) {
    const minutes =
      Math.ceil(
        (
          LOCKOUT -
          (Date.now() -
            record.first)
        ) /
          60000
      );

    return res
      .status(429)
      .json({
        error:
          `Too many attempts. Try again in ${minutes} minute(s).`,
      });
  }

  if (
    record &&
    Date.now() -
      record.first >=
      LOCKOUT
  ) {
    attempts.delete(ip);
  }

  next();
}

const noteFail = (ip) => {
  const record =
    attempts.get(ip) || {
      count: 0,
      first: Date.now(),
    };

  record.count += 1;

  attempts.set(
    ip,
    record
  );
};

/* --------------------------------------------------------------------------
   Express
   -------------------------------------------------------------------------- */

const app = express();

app.set(
  "trust proxy",
  1
);

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) =>
    origin
      .trim()
      .replace(
        /\/$/,
        ""
      )
  )
  .filter(Boolean);

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      const normalized =
        origin.replace(
          /\/$/,
          ""
        );

      if (
        allowedOrigins.includes(
          normalized
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          "Origin not allowed by CORS"
        )
      );
    },

    credentials: false,
  })
);

app.use(
  (
    req,
    res,
    next
  ) => {
    const isFileUpload =
      req.method ===
        "POST" &&
      (
        req.path ===
          "/api/admin/resources" ||
        req.path ===
          "/api/admin/modules"
      );

    return express.json({
      limit:
        isFileUpload
          ? "220mb"
          : "1mb",
    })(
      req,
      res,
      next
    );
  }
);

const publicUser = (
  participant
) => ({
  id: participant.id,
  name: participant.name,
  pin: participant.pin,
  country:
    participant.country,
  track:
    participant.track,
  cohort:
    participant.cohort,
  role:
    participant.role ||
    "participant",
});

/* --------------------------------------------------------------------------
   Root
   -------------------------------------------------------------------------- */

app.get(
  "/",
  (_req, res) => {
    res.json({
      ok: true,
      service:
        "KOICA YLP Backend API",
      runtime:
        IS_VERCEL
          ? "vercel"
          : "node",
    });
  }
);

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      ok: true,
      service:
        "KOICA YLP Backend API",
    });
  }
);

/* --------------------------------------------------------------------------
   Login
   -------------------------------------------------------------------------- */

app.post(
  "/api/login",
  throttle,
  (req, res) => {
    const {
      name = "",
      pin = "",
    } =
      req.body || {};

    if (
      !name.trim() ||
      !pin.trim()
    ) {
      return res
        .status(400)
        .json({
          error:
            "Enter both your name and your KOICA PIN.",
        });
    }

    const participants =
      read(
        "participants.json",
        []
      );

    const match =
      participants.find(
        (participant) =>
          participant.pin
            .toUpperCase() ===
            pin
              .trim()
              .toUpperCase() &&
          normalizeName(
            participant.name
          ) ===
            normalizeName(
              name
            )
      );

    if (
      !match ||
      !verifyPin(
        pin,
        match
      )
    ) {
      noteFail(
        req.ip
      );

      return res
        .status(401)
        .json({
          error:
            "We couldn't match that name and PIN. Check both and try again.",
        });
    }

    attempts.delete(
      req.ip
    );

    res.json({
      token:
        issueToken(
          match.id
        ),
      user:
        publicUser(
          match
        ),
    });
  }
);

/* --------------------------------------------------------------------------
   Current user
   -------------------------------------------------------------------------- */

app.get(
  "/api/me",
  auth,
  (req, res) => {
    res.json({
      user:
        publicUser(
          req.user
        ),
    });
  }
);

/* --------------------------------------------------------------------------
   Dashboard
   -------------------------------------------------------------------------- */

app.get(
  "/api/dashboard",
  auth,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          modules: [],
          announcements: [],
          sessions: [],
        }
      );

    const progress =
      read(
        "progress.json",
        {}
      )[
        req.user.id
      ] || {
        lessons: {},
      };

    const track =
      req.user.track;

    const modules =
      content.modules.filter(
        (module) =>
          !module.track ||
          module.track ===
            track
      );

    const allLessons =
      modules.flatMap(
        (module) =>
          module.lessons.map(
            (lesson) =>
              `${module.id}:${lesson.id}`
          )
      );

    const done =
      allLessons.filter(
        (key) =>
          progress.lessons[
            key
          ]
      );

    res.json({
      user:
        publicUser(
          req.user
        ),

      announcements:
        content.announcements,

      progress: {
        completed:
          done.length,

        total:
          allLessons.length,

        percent:
          allLessons.length
            ? Math.round(
                (
                  done.length /
                  allLessons.length
                ) * 100
              )
            : 0,
      },

      modules:
        modules.map(
          (module) => {
            const total =
              module.lessons.length;

            const finished =
              module.lessons.filter(
                (lesson) =>
                  progress.lessons[
                    `${module.id}:${lesson.id}`
                  ]
              ).length;

            return {
              ...module,
              completed:
                finished,
              total,
              percent:
                total
                  ? Math.round(
                      (
                        finished /
                        total
                      ) * 100
                    )
                  : 0,
            };
          }
        ),
    });
  }
);

/* --------------------------------------------------------------------------
   Module details
   -------------------------------------------------------------------------- */

app.get(
  "/api/modules/:id",
  auth,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          modules: [],
        }
      );

    const module =
      content.modules.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!module) {
      return res
        .status(404)
        .json({
          error:
            "Module not found.",
        });
    }

    if (
      module.track &&
      module.track !==
        req.user.track
    ) {
      return res
        .status(403)
        .json({
          error:
            "That module belongs to the other track.",
        });
    }

    const progress =
      read(
        "progress.json",
        {}
      )[
        req.user.id
      ] || {
        lessons: {},
      };

    res.json({
      module: {
        ...module,

        lessons:
          module.lessons.map(
            (lesson) => ({
              ...lesson,

              done: Boolean(
                progress.lessons[
                  `${module.id}:${lesson.id}`
                ]
              ),
            })
          ),
      },
    });
  }
);

/* --------------------------------------------------------------------------
   Resolve stored files
   -------------------------------------------------------------------------- */

function resolveStoredFile(
  filePath,
  runtimeDirectory,
  legacyDirectory
) {
  if (!filePath) {
    return null;
  }

  const candidates = [];

  if (
    path.isAbsolute(
      filePath
    )
  ) {
    candidates.push(
      path.resolve(
        filePath
      )
    );
  } else {
    candidates.push(
      path.resolve(
        RUNTIME_ROOT,
        filePath
      )
    );

    candidates.push(
      path.resolve(
        __dirname,
        filePath
      )
    );
  }

  const allowedRoots = [
    runtimeDirectory,
    legacyDirectory,
  ].map(
    (root) =>
      path.resolve(
        root
      ) + path.sep
  );

  for (
    const candidate
    of candidates
  ) {
    const allowed =
      allowedRoots.some(
        (root) =>
          candidate.startsWith(
            root
          )
      );

    if (!allowed) {
      continue;
    }

    if (
      fs.existsSync(
        candidate
      )
    ) {
      return candidate;
    }
  }

  return null;
}

/* --------------------------------------------------------------------------
   Module attachments
   -------------------------------------------------------------------------- */

app.get(
  "/api/modules/:id/presentations/:presentationId/download",
  auth,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          modules: [],
        }
      );

    const module =
      content.modules.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!module) {
      return res
        .status(404)
        .json({
          error:
            "Module not found.",
        });
    }

    if (
      module.track &&
      module.track !==
        req.user.track
    ) {
      return res
        .status(403)
        .json({
          error:
            "That module belongs to the other track.",
        });
    }

    const presentation =
      (
        module.presentations ||
        []
      ).find(
        (item) =>
          item.id ===
          req.params
            .presentationId
      );

    if (
      !presentation
        ?.filePath
    ) {
      return res
        .status(404)
        .json({
          error:
            "Presentation not found.",
        });
    }

    const fullPath =
      resolveStoredFile(
        presentation.filePath,
        PRESENTATION_DIR,
        path.join(
          __dirname,
          "uploads",
          "module-presentations"
        )
      );

    if (!fullPath) {
      return res
        .status(404)
        .json({
          error:
            "The presentation file is missing.",
        });
    }

    res.download(
      fullPath,
      presentation.originalFileName ||
        path.basename(
          fullPath
        )
    );
  }
);

/* --------------------------------------------------------------------------
   Progress
   -------------------------------------------------------------------------- */

app.post(
  "/api/progress",
  auth,
  (req, res) => {
    const {
      moduleId,
      lessonId,
      done,
    } =
      req.body || {};

    if (
      !moduleId ||
      !lessonId
    ) {
      return res
        .status(400)
        .json({
          error:
            "Missing module or lesson.",
        });
    }

    const all =
      read(
        "progress.json",
        {}
      );

    const mine =
      all[
        req.user.id
      ] || {
        lessons: {},
      };

    const key =
      `${moduleId}:${lessonId}`;

    if (done) {
      mine.lessons[
        key
      ] =
        new Date()
          .toISOString();
    } else {
      delete mine.lessons[
        key
      ];
    }

    all[
      req.user.id
    ] =
      mine;

    write(
      "progress.json",
      all
    );

    res.json({
      ok: true,
      done:
        Boolean(
          done
        ),
    });
  }
);

/* --------------------------------------------------------------------------
   Resources
   -------------------------------------------------------------------------- */

app.get(
  "/api/resources",
  auth,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          resources: [],
        }
      );

    const list =
      (
        content.resources ||
        []
      ).filter(
        (resource) =>
          !resource.track ||
          resource.track ===
            req.user.track
      );

    res.json({
      resources: list,
    });
  }
);

app.get(
  "/api/resources/:id/download",
  auth,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          resources: [],
        }
      );

    const resource =
      (
        content.resources ||
        []
      ).find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!resource) {
      return res
        .status(404)
        .json({
          error:
            "Resource not found.",
        });
    }

    if (
      resource.track &&
      resource.track !==
        req.user.track
    ) {
      return res
        .status(403)
        .json({
          error:
            "That resource belongs to the other track.",
        });
    }

    if (
      !resource.filePath
    ) {
      return res
        .status(404)
        .json({
          error:
            "No uploaded file is attached to this resource.",
        });
    }

    const fullPath =
      resolveStoredFile(
        resource.filePath,
        RESOURCE_DIR,
        path.join(
          __dirname,
          "uploads",
          "resources"
        )
      );

    if (!fullPath) {
      return res
        .status(404)
        .json({
          error:
            "The resource file is missing.",
        });
    }

    res.download(
      fullPath,
      resource.originalFileName ||
        path.basename(
          fullPath
        )
    );
  }
);

/* --------------------------------------------------------------------------
   Admin middleware
   -------------------------------------------------------------------------- */

function adminOnly(
  req,
  res,
  next
) {
  if (
    (
      req.user.role ||
      "participant"
    ) !== "admin"
  ) {
    return res
      .status(403)
      .json({
        error:
          "Admin access only.",
      });
  }

  next();
}

const nextId = (
  list,
  prefix
) => {
  let number = 1;

  const used =
    new Set(
      list.map(
        (item) =>
          item.id
      )
    );

  while (
    used.has(
      `${prefix}${number}`
    )
  ) {
    number += 1;
  }

  return `${prefix}${number}`;
};

/* --------------------------------------------------------------------------
   Admin content
   -------------------------------------------------------------------------- */

app.get(
  "/api/admin/content",
  auth,
  adminOnly,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          modules: [],
          announcements: [],
          resources: [],
        }
      );

    res.json(
      content
    );
  }
);

/* --------------------------------------------------------------------------
   Admin modules
   -------------------------------------------------------------------------- */

app.post(
  "/api/admin/modules",
  auth,
  adminOnly,
  (req, res) => {
    const {
      id,
      title,
      summary,
      phase,
      track,
      lessons,
      presentations = [],
      presentationUploads = [],
    } =
      req.body || {};

    if (
      !title ||
      !title.trim()
    ) {
      return res
        .status(400)
        .json({
          error:
            "A module needs a title.",
        });
    }

    const content =
      read(
        "content.json",
        {
          modules: [],
        }
      );

    content.modules =
      content.modules ||
      [];

    const index =
      content.modules.findIndex(
        (module) =>
          module.id === id
      );

    const existing =
      index > -1
        ? content.modules[
            index
          ]
        : null;

    const existingPresentations =
      existing
        ?.presentations ||
      [];

    const keepIds =
      new Set(
        (
          presentations ||
          []
        )
          .map(
            (item) =>
              item.id
          )
          .filter(
            Boolean
          )
      );

    for (
      const old
      of existingPresentations
    ) {
      if (
        keepIds.has(
          old.id
        ) ||
        !old.filePath
      ) {
        continue;
      }

      const oldPath =
        resolveStoredFile(
          old.filePath,
          PRESENTATION_DIR,
          path.join(
            __dirname,
            "uploads",
            "module-presentations"
          )
        );

      if (
        oldPath &&
        oldPath.startsWith(
          path.resolve(
            PRESENTATION_DIR
          ) +
            path.sep
        )
      ) {
        fs.unlinkSync(
          oldPath
        );
      }
    }

    const keptPresentations =
      existingPresentations.filter(
        (item) =>
          keepIds.has(
            item.id
          )
      );

    const uploadedPresentations =
      [];

    for (
      const file
      of presentationUploads ||
      []
    ) {
      const originalFileName =
        path.basename(
          String(
            file?.name ||
            "module-file"
          )
        );

      const extension =
        path
          .extname(
            originalFileName
          )
          .toLowerCase();

      if (
        ![
          ".pdf",
          ".ppt",
          ".pptx",
        ].includes(
          extension
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Module files must be PDF, PPT, or PPTX files.",
          });
      }

      const match =
        String(
          file?.dataUrl ||
          ""
        ).match(
          /^data:([^;]+);base64,(.+)$/s
        );

      if (!match) {
        return res
          .status(400)
          .json({
            error:
              "A module file could not be read.",
          });
      }

      let buffer;

      try {
        buffer =
          Buffer.from(
            match[2],
            "base64"
          );
      } catch {
        return res
          .status(400)
          .json({
            error:
              "A module file is invalid.",
          });
      }

      if (
        !buffer.length ||
        buffer.length >
          MAX_RESOURCE_BYTES
      ) {
        return res
          .status(400)
          .json({
            error:
              "Module files must be 50 MB or smaller.",
          });
      }

      const storedName =
        `${Date.now()}-${crypto
          .randomBytes(8)
          .toString(
            "hex"
          )}${extension}`;

      const fullPath =
        path.join(
          PRESENTATION_DIR,
          storedName
        );

      fs.writeFileSync(
        fullPath,
        buffer
      );

      uploadedPresentations.push({
        id:
          `p-${crypto
            .randomBytes(6)
            .toString(
              "hex"
            )}`,

        filePath:
          path
            .relative(
              RUNTIME_ROOT,
              fullPath
            )
            .replaceAll(
              "\\",
              "/"
            ),

        originalFileName,

        mime:
          match[1] ||
          file.mime ||
          "application/octet-stream",

        size:
          buffer.length,
      });
    }

    const clean = {
      title:
        title.trim(),

      summary:
        (
          summary ||
          ""
        ).trim(),

      phase:
        (
          phase ||
          "Online Training"
        ).trim(),

      lessons:
        (
          lessons ||
          []
        )
          .map(
            (
              lesson,
              index
            ) => ({
              id:
                lesson.id ||
                `l${index + 1}`,

              title:
                (
                  lesson.title ||
                  ""
                ).trim(),

              type:
                [
                  "video",
                  "reading",
                  "task",
                  "lecture",
                  "workshop",
                  "visit",
                  "event",
                  "self-study",
                ].includes(
                  lesson.type
                )
                  ? lesson.type
                  : "reading",

              minutes:
                Number(
                  lesson.minutes
                ) || 0,

              time:
                (
                  lesson.time ||
                  ""
                ).trim(),

              facilitator:
                (
                  lesson.facilitator ||
                  ""
                ).trim(),
            })
          )
          .filter(
            (lesson) =>
              lesson.title
          ),

      presentations: [
        ...keptPresentations,
        ...uploadedPresentations,
      ],
    };

    if (
      track ===
        "public" ||
      track ===
        "private"
    ) {
      clean.track =
        track;
    }

    if (
      index > -1
    ) {
      const kept = {
        ...content.modules[
          index
        ],
        ...clean,
      };

      if (
        !clean.track
      ) {
        delete kept.track;
      }

      content.modules[
        index
      ] =
        kept;
    } else {
      content.modules.push({
        id: nextId(
          content.modules,
          "m"
        ),
        ...clean,
      });
    }

    write(
      "content.json",
      content
    );

    res.json({
      ok: true,
      modules:
        content.modules,
    });
  }
);

/* --------------------------------------------------------------------------
   Delete module
   -------------------------------------------------------------------------- */

app.delete(
  "/api/admin/modules/:id",
  auth,
  adminOnly,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          modules: [],
        }
      );

    const existing =
      (
        content.modules ||
        []
      ).find(
        (module) =>
          module.id ===
          req.params.id
      );

    for (
      const presentation
      of existing
        ?.presentations ||
      []
    ) {
      if (
        !presentation.filePath
      ) {
        continue;
      }

      const fullPath =
        resolveStoredFile(
          presentation.filePath,
          PRESENTATION_DIR,
          path.join(
            __dirname,
            "uploads",
            "module-presentations"
          )
        );

      if (
        fullPath &&
        fullPath.startsWith(
          path.resolve(
            PRESENTATION_DIR
          ) +
            path.sep
        )
      ) {
        fs.unlinkSync(
          fullPath
        );
      }
    }

    content.modules =
      (
        content.modules ||
        []
      ).filter(
        (module) =>
          module.id !==
          req.params.id
      );

    write(
      "content.json",
      content
    );

    res.json({
      ok: true,
      modules:
        content.modules,
    });
  }
);

/* --------------------------------------------------------------------------
   Announcements
   -------------------------------------------------------------------------- */

app.post(
  "/api/admin/announcements",
  auth,
  adminOnly,
  (req, res) => {
    const {
      id,
      title,
      body,
      tag,
    } =
      req.body || {};

    if (
      !title ||
      !title.trim()
    ) {
      return res
        .status(400)
        .json({
          error:
            "An announcement needs a title.",
        });
    }

    const content =
      read(
        "content.json",
        {
          announcements: [],
        }
      );

    content.announcements =
      content.announcements ||
      [];

    const clean = {
      title:
        title.trim(),

      body:
        (
          body ||
          ""
        ).trim(),

      tag:
        (
          tag ||
          "News"
        ).trim(),
    };

    const index =
      content.announcements.findIndex(
        (announcement) =>
          announcement.id ===
          id
      );

    if (
      index > -1
    ) {
      content.announcements[
        index
      ] = {
        ...content.announcements[
          index
        ],
        ...clean,
      };
    } else {
      content.announcements.unshift({
        id: nextId(
          content.announcements,
          "a"
        ),
        ...clean,
      });
    }

    write(
      "content.json",
      content
    );

    res.json({
      ok: true,
      announcements:
        content.announcements,
    });
  }
);

app.delete(
  "/api/admin/announcements/:id",
  auth,
  adminOnly,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          announcements: [],
        }
      );

    content.announcements =
      (
        content.announcements ||
        []
      ).filter(
        (announcement) =>
          announcement.id !==
          req.params.id
      );

    write(
      "content.json",
      content
    );

    res.json({
      ok: true,
      announcements:
        content.announcements,
    });
  }
);

/* --------------------------------------------------------------------------
   Admin resources
   -------------------------------------------------------------------------- */

app.post(
  "/api/admin/resources",
  auth,
  adminOnly,
  (req, res) => {
    const {
      id,
      title,
      type,
      note,
      track,
      file,
    } =
      req.body || {};

    if (
      !title ||
      !title.trim()
    ) {
      return res
        .status(400)
        .json({
          error:
            "A resource needs a title.",
        });
    }

    const content =
      read(
        "content.json",
        {
          resources: [],
        }
      );

    content.resources =
      content.resources ||
      [];

    const index =
      content.resources.findIndex(
        (resource) =>
          resource.id ===
          id
      );

    const existing =
      index > -1
        ? content.resources[
            index
          ]
        : null;

    let uploaded =
      null;

    if (file) {
      const originalFileName =
        path.basename(
          String(
            file.name ||
            "resource"
          )
        );

      const extension =
        path
          .extname(
            originalFileName
          )
          .toLowerCase();

      if (
        !ALLOWED_RESOURCE_EXTENSIONS.has(
          extension
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "That file type is not allowed.",
          });
      }

      const match =
        String(
          file.dataUrl ||
          ""
        ).match(
          /^data:([^;]+);base64,(.+)$/s
        );

      if (!match) {
        return res
          .status(400)
          .json({
            error:
              "The uploaded file could not be read.",
          });
      }

      let buffer;

      try {
        buffer =
          Buffer.from(
            match[2],
            "base64"
          );
      } catch {
        return res
          .status(400)
          .json({
            error:
              "The uploaded file is invalid.",
          });
      }

      if (
        !buffer.length ||
        buffer.length >
          MAX_RESOURCE_BYTES
      ) {
        return res
          .status(400)
          .json({
            error:
              "Files must be 50 MB or smaller.",
          });
      }

      const storedName =
        `${Date.now()}-${crypto
          .randomBytes(8)
          .toString(
            "hex"
          )}${extension}`;

      const fullPath =
        path.join(
          RESOURCE_DIR,
          storedName
        );

      fs.writeFileSync(
        fullPath,
        buffer
      );

      uploaded = {
        filePath:
          path
            .relative(
              RUNTIME_ROOT,
              fullPath
            )
            .replaceAll(
              "\\",
              "/"
            ),

        originalFileName,

        mime:
          match[1] ||
          file.mime ||
          "application/octet-stream",

        size:
          buffer.length,

        type:
          extension
            .slice(1)
            .toUpperCase() ||
          (
            type ||
            "FILE"
          )
            .trim()
            .toUpperCase(),
      };
    } else if (
      !existing?.filePath
    ) {
      return res
        .status(400)
        .json({
          error:
            "Choose a file to upload.",
        });
    }

    const clean = {
      title:
        title.trim(),

      type:
        uploaded?.type ||
        (
          type ||
          existing?.type ||
          "FILE"
        )
          .trim()
          .toUpperCase(),

      note:
        (
          note ||
          ""
        ).trim(),

      ...(
        uploaded ||
        {}
      ),
    };

    if (
      track ===
        "public" ||
      track ===
        "private"
    ) {
      clean.track =
        track;
    }

    if (existing) {
      const kept = {
        ...existing,
        ...clean,
      };

      delete kept.url;

      if (
        !clean.track
      ) {
        delete kept.track;
      }

      content.resources[
        index
      ] =
        kept;

      if (
        uploaded &&
        existing.filePath &&
        existing.filePath !==
          uploaded.filePath
      ) {
        const oldPath =
          resolveStoredFile(
            existing.filePath,
            RESOURCE_DIR,
            path.join(
              __dirname,
              "uploads",
              "resources"
            )
          );

        if (
          oldPath &&
          oldPath.startsWith(
            path.resolve(
              RESOURCE_DIR
            ) +
              path.sep
          )
        ) {
          fs.unlinkSync(
            oldPath
          );
        }
      }
    } else {
      content.resources.push({
        id: nextId(
          content.resources,
          "r"
        ),
        ...clean,
      });
    }

    write(
      "content.json",
      content
    );

    res.json({
      ok: true,
      resources:
        content.resources,
    });
  }
);

app.delete(
  "/api/admin/resources/:id",
  auth,
  adminOnly,
  (req, res) => {
    const content =
      read(
        "content.json",
        {
          resources: [],
        }
      );

    const existing =
      (
        content.resources ||
        []
      ).find(
        (resource) =>
          resource.id ===
          req.params.id
      );

    if (
      existing?.filePath
    ) {
      const fullPath =
        resolveStoredFile(
          existing.filePath,
          RESOURCE_DIR,
          path.join(
            __dirname,
            "uploads",
            "resources"
          )
        );

      if (
        fullPath &&
        fullPath.startsWith(
          path.resolve(
            RESOURCE_DIR
          ) +
            path.sep
        )
      ) {
        fs.unlinkSync(
          fullPath
        );
      }
    }

    content.resources =
      (
        content.resources ||
        []
      ).filter(
        (resource) =>
          resource.id !==
          req.params.id
      );

    write(
      "content.json",
      content
    );

    res.json({
      ok: true,
      resources:
        content.resources,
    });
  }
);

/* --------------------------------------------------------------------------
   Admin participants
   -------------------------------------------------------------------------- */

app.get(
  "/api/admin/participants",
  auth,
  adminOnly,
  (req, res) => {
    const participants =
      read(
        "participants.json",
        []
      );

    const progress =
      read(
        "progress.json",
        {}
      );

    const content =
      read(
        "content.json",
        {
          modules: [],
        }
      );

    const rows =
      participants.map(
        (participant) => {
          const mine =
            progress[
              participant.id
            ] || {
              lessons: {},
            };

          const modules =
            content.modules.filter(
              (module) =>
                !module.track ||
                module.track ===
                  participant.track
            );

          const total =
            modules.reduce(
              (
                count,
                module
              ) =>
                count +
                module.lessons.length,
              0
            );

          const done =
            modules.reduce(
              (
                count,
                module
              ) =>
                count +
                module.lessons.filter(
                  (lesson) =>
                    mine.lessons[
                      `${module.id}:${lesson.id}`
                    ]
                ).length,
              0
            );

          return {
            id:
              participant.id,

            name:
              participant.name,

            pin:
              participant.pin,

            country:
              participant.country,

            track:
              participant.track,

            role:
              participant.role ||
              "participant",

            completed:
              done,

            total,

            percent:
              total
                ? Math.round(
                    (
                      done /
                      total
                    ) * 100
                  )
                : 0,
          };
        }
      );

    res.json({
      participants:
        rows,
    });
  }
);

/* --------------------------------------------------------------------------
   Error handler
   -------------------------------------------------------------------------- */

app.use(
  (
    err,
    _req,
    res,
    _next
  ) => {
    console.error(
      "[ylp] Unhandled request error:",
      err
    );

    if (
      res.headersSent
    ) {
      return;
    }

    res
      .status(500)
      .json({
        error:
          "Internal server error.",
      });
  }
);

/* --------------------------------------------------------------------------
   Local development only
   -------------------------------------------------------------------------- */

if (!IS_VERCEL) {
  const PORT =
    Number(
      process.env.PORT
    ) || 4000;

  app.listen(
    PORT,
    () => {
      console.log(
        `[ylp] API listening on port ${PORT}`
      );

      console.log(
        `[ylp] Allowed frontend origin(s): ${allowedOrigins.join(", ")}`
      );
    }
  );
}

/* --------------------------------------------------------------------------
   Vercel export
   -------------------------------------------------------------------------- */

export default app;