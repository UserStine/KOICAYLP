import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

function mongoConfig() {
  const uri = String(process.env.MONGODB_URI || "").trim();
  const dbName = String(process.env.MONGODB_DB || "koica_ylp").trim();
  const collectionName = String(process.env.MONGODB_STORE_COLLECTION || "app_store").trim();

  if (!uri) {
    throw new Error("MONGODB_URI is required.");
  }

  return { uri, dbName, collectionName };
}

async function getMongoClient() {
  const { uri } = mongoConfig();
  const globalKey = "__koicaMongoClientPromise";

  if (!globalThis[globalKey]) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
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

function cloneFallback(value) {
  if (value == null) return value;
  return structuredClone(value);
}

function sanitizeValue(fileName, value) {
  const cloned = cloneFallback(value);

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

/**
 * Mongo-backed replacement for the old JSON read/write helpers.
 * Each former JSON file is stored as one durable MongoDB document so the
 * existing API data shapes and frontend contract stay unchanged.
 */
export function createMongoStore({ seedDataDir }) {
  if (!seedDataDir) {
    throw new Error("seedDataDir is required.");
  }

  async function read(fileName, fallback) {
    const collection = await storeCollection();
    const existing = await collection.findOne({ _id: fileName });

    if (existing && Object.hasOwn(existing, "value")) {
      return existing.value;
    }

    const seedValue = readSeed(seedDataDir, fileName, fallback);

    await collection.updateOne(
      { _id: fileName },
      {
        $setOnInsert: {
          value: seedValue,
          createdAt: new Date(),
        },
        $set: {
          lastReadAt: new Date(),
        },
      },
      { upsert: true }
    );

    const seeded = await collection.findOne({ _id: fileName });
    return seeded?.value ?? seedValue;
  }

  async function write(fileName, value) {
    const collection = await storeCollection();
    const safeValue = sanitizeValue(fileName, value);

    await collection.updateOne(
      { _id: fileName },
      {
        $set: {
          value: safeValue,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return safeValue;
  }

  return { read, write };
}

export async function mongoHealth() {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  return { ok: true, database: db.databaseName };
}
