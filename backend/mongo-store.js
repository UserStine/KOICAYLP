/* ==========================================================================
   Data store.

   Uses MongoDB when MONGODB_URI is set and reachable. Otherwise it falls back
   to a local file store seeded from backend/data/*.json so the app still runs.

   The fallback exists so a demo is never blocked by a database outage. It is
   NOT a substitute for Mongo in production: on Vercel it writes to /tmp, which
   is per-instance and wiped between deployments, so admin edits and lesson
   progress will not survive. Set MONGODB_URI for anything that must persist.
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";

const IS_VERCEL = Boolean(process.env.VERCEL);

/* --------------------------------------------------------------------------
   Mode selection
   -------------------------------------------------------------------------- */

const configuredUri = String(process.env.MONGODB_URI || "").trim();

// Explicit opt-out, useful for a demo on a flaky network.
const forceLocal =
  String(process.env.STORE_MODE || "").toLowerCase() === "local" || !configuredUri;

let mongoDisabled = forceLocal;
let warnedLocal = false;

function useLocal(reason) {
  if (!mongoDisabled) {
    mongoDisabled = true;
    console.warn(`[store] falling back to local files: ${reason}`);
  }
  if (!warnedLocal) {
    warnedLocal = true;
    console.warn("[store] writes will NOT persist across restarts or deployments.");
  }
}

if (forceLocal) {
  useLocal(configuredUri ? "STORE_MODE=local" : "MONGODB_URI is not set");
}

/* --------------------------------------------------------------------------
   Mongo
   -------------------------------------------------------------------------- */

function mongoConfig() {
  return {
    uri: configuredUri,
    dbName: String(process.env.MONGODB_DB || "koica_ylp").trim(),
    collectionName: String(process.env.MONGODB_STORE_COLLECTION || "app_store").trim(),
  };
}

async function getMongoClient() {
  const { uri } = mongoConfig();
  const globalKey = "__koicaMongoClientPromise";

  if (!globalThis[globalKey]) {
    // Imported lazily so a missing driver or bad URI cannot crash startup.
    const { MongoClient } = await import("mongodb");

    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 4_000,
      connectTimeoutMS: 4_000,
      socketTimeoutMS: 20_000,
    });

    globalThis[globalKey] = client.connect().catch((error) => {
      delete globalThis[globalKey];
      throw error;
    });
  }

  return globalThis[globalKey];
}

export async function getMongoDb() {
  const { dbName } = mongoConfig();
  const client = await getMongoClient();
  return client.db(dbName);
}

async function storeCollection() {
  const { collectionName } = mongoConfig();
  const db = await getMongoDb();
  return db.collection(collectionName);
}

/* --------------------------------------------------------------------------
   Shared helpers
   -------------------------------------------------------------------------- */

function sanitizeValue(fileName, value) {
  const cloned = value == null ? value : structuredClone(value);

  if (fileName === "participants.json" && Array.isArray(cloned)) {
    for (const participant of cloned) {
      if (participant && typeof participant === "object") {
        delete participant.pin;
      }
    }
  }

  return cloned;
}

function readSeed(seedDataDir, fileName, fallback) {
  try {
    const seedPath = path.join(seedDataDir, fileName);
    return sanitizeValue(fileName, JSON.parse(fs.readFileSync(seedPath, "utf8")));
  } catch {
    return sanitizeValue(fileName, fallback);
  }
}

function assertSafePath(fieldPath) {
  for (const segment of String(fieldPath).split(".")) {
    if (!segment || segment.startsWith("$")) {
      throw new Error(`Unsafe field path segment: ${segment}`);
    }
  }
}

function setPath(target, fieldPath, value) {
  const parts = String(fieldPath).split(".");
  let cursor = target;

  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cursor[parts[i]] !== "object" || cursor[parts[i]] === null) {
      cursor[parts[i]] = {};
    }
    cursor = cursor[parts[i]];
  }

  if (value === undefined) delete cursor[parts.at(-1)];
  else cursor[parts.at(-1)] = value;
}

/* --------------------------------------------------------------------------
   Local file store
   -------------------------------------------------------------------------- */

function localDir(seedDataDir) {
  const dir = IS_VERCEL
    ? path.join("/tmp", "koica-ylp", "store")
    : path.join(seedDataDir, "..", ".local-store");

  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createLocalStore({ seedDataDir }) {
  const dir = localDir(seedDataDir);
  const cache = new Map();

  const filePath = (fileName) => path.join(dir, fileName);

  function load(fileName, fallback) {
    if (cache.has(fileName)) return cache.get(fileName);

    let value;
    try {
      value = JSON.parse(fs.readFileSync(filePath(fileName), "utf8"));
    } catch {
      value = readSeed(seedDataDir, fileName, fallback);
    }

    cache.set(fileName, value);
    return value;
  }

  function persist(fileName, value) {
    cache.set(fileName, value);
    try {
      // Write to a temp file then rename, so a crash mid-write cannot leave
      // truncated JSON that fails to parse on the next boot.
      const target = filePath(fileName);
      const temp = `${target}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(value, null, 2));
      fs.renameSync(temp, target);
    } catch (error) {
      console.warn(`[store] could not persist ${fileName}: ${error.message}`);
    }
  }

  return {
    async read(fileName, fallback) {
      return load(fileName, fallback);
    },

    async write(fileName, value) {
      const safeValue = sanitizeValue(fileName, value);
      persist(fileName, safeValue);
      return safeValue;
    },

    async updateField(fileName, fieldPath, value) {
      assertSafePath(fieldPath);
      const current = load(fileName, {});
      setPath(current, fieldPath, value);
      persist(fileName, current);
    },
  };
}

/* --------------------------------------------------------------------------
   Public store
   -------------------------------------------------------------------------- */

export function createMongoStore({ seedDataDir }) {
  if (!seedDataDir) {
    throw new Error("seedDataDir is required.");
  }

  const local = createLocalStore({ seedDataDir });

  // Any Mongo failure downgrades to local for the rest of the process rather
  // than surfacing a 500 to the participant mid-session.
  async function withMongo(operation, fallbackOperation) {
    if (mongoDisabled) return fallbackOperation();

    try {
      return await operation();
    } catch (error) {
      useLocal(error.message);
      return fallbackOperation();
    }
  }

  async function read(fileName, fallback) {
    return withMongo(
      async () => {
        const collection = await storeCollection();
        const existing = await collection.findOne({ _id: fileName });

        if (existing && Object.hasOwn(existing, "value")) {
          return existing.value;
        }

        const seedValue = readSeed(seedDataDir, fileName, fallback);

        await collection.updateOne(
          { _id: fileName },
          { $setOnInsert: { value: seedValue, createdAt: new Date() } },
          { upsert: true }
        );

        const seeded = await collection.findOne({ _id: fileName });
        return seeded?.value ?? seedValue;
      },
      () => local.read(fileName, fallback)
    );
  }

  async function write(fileName, value) {
    const safeValue = sanitizeValue(fileName, value);

    return withMongo(
      async () => {
        const collection = await storeCollection();

        await collection.updateOne(
          { _id: fileName },
          {
            $set: { value: safeValue, updatedAt: new Date() },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        return safeValue;
      },
      () => local.write(fileName, safeValue)
    );
  }

  /**
   * Atomically set or clear ONE nested field. read() + mutate + write() is a
   * read-modify-write race: two participants ticking a lesson at the same
   * moment both load the full map and the second write discards the first.
   */
  async function updateField(fileName, fieldPath, value) {
    assertSafePath(fieldPath);

    return withMongo(
      async () => {
        const collection = await storeCollection();
        const key = `value.${fieldPath}`;

        await collection.updateOne(
          { _id: fileName },
          value === undefined
            ? { $unset: { [key]: "" }, $set: { updatedAt: new Date() } }
            : { $set: { [key]: value, updatedAt: new Date() } },
          { upsert: true }
        );
      },
      () => local.updateField(fileName, fieldPath, value)
    );
  }

  return { read, write, updateField };
}

export async function mongoHealth() {
  if (mongoDisabled) {
    return { ok: true, storage: "local-files", database: null };
  }

  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    return { ok: true, storage: "mongodb", database: db.databaseName };
  } catch (error) {
    useLocal(error.message);
    return { ok: true, storage: "local-files", database: null };
  }
}