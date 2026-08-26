import path from "node:path";

export const APPLICATION_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
export const APPLICATION_MAX_BYTES = 10 * 1024 * 1024;

export function uploadMatchesExtension(buffer, extension) {
  const head = buffer.subarray(0, 16);
  const ascii = head.toString("ascii");
  const hex = head.toString("hex");
  const isZip = hex.startsWith("504b0304") || hex.startsWith("504b0506") || hex.startsWith("504b0708");
  const isOle = hex.startsWith("d0cf11e0a1b11ae1");
  if (extension === ".pdf") return ascii.startsWith("%PDF-");
  if ([".docx", ".pptx", ".xlsx"].includes(extension)) return isZip;
  if ([".doc", ".ppt", ".xls"].includes(extension)) return isOle;
  if ([".jpg", ".jpeg"].includes(extension)) return hex.startsWith("ffd8ff");
  if (extension === ".png") return hex.startsWith("89504e470d0a1a0a");
  if (extension === ".gif") return ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a");
  if (extension === ".webp") return ascii.startsWith("RIFF") && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if ([".txt", ".csv"].includes(extension)) return !buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0);
  return false;
}

export function decodeDataUrlUpload(file, { allowed = APPLICATION_EXTENSIONS, maxBytes = APPLICATION_MAX_BYTES } = {}) {
  const fileName = path.basename(String(file?.name || "upload"));
  const extension = path.extname(fileName).toLowerCase();
  if (!allowed.has(extension)) throw Object.assign(new Error("Unsupported file type."), { status: 400 });
  const match = String(file?.dataUrl || "").match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw Object.assign(new Error("Invalid upload."), { status: 400 });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw Object.assign(new Error("Upload exceeds size limit."), { status: 400 });
  if (!uploadMatchesExtension(buffer, extension)) throw Object.assign(new Error("File contents do not match the extension."), { status: 400 });
  return { fileName, extension, buffer, mime: match[1] || file?.mime || "application/octet-stream" };
}

// Multipart-ready middleware for future browser uploads. Existing JSON/base64
// endpoints remain supported for backward compatibility.
let multerFactory = null;
export async function createMultipartUpload() {
  if (!multerFactory) multerFactory = (await import("multer")).default;
  return multerFactory({
    storage: multerFactory.memoryStorage(),
    limits: { fileSize: APPLICATION_MAX_BYTES, files: 1 },
  });
}
