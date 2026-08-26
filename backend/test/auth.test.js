import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hashPassword, hashPin, issueSessionToken, readSessionToken, safeEqualHex } from "../src/services/authService.js";

test("password hashing uses unique salts and verifies consistently", () => {
  const a=hashPassword("correct horse battery staple");
  const b=hashPassword("correct horse battery staple");
  assert.notEqual(a.salt,b.salt); assert.notEqual(a.hash,b.hash);
  assert.equal(hashPassword("correct horse battery staple",a.salt).hash,a.hash);
});

test("PIN hashing is deterministic for a supplied salt",()=>{
  const salt=crypto.randomBytes(16).toString("hex");
  assert.equal(hashPin("ab1234",salt),hashPin("AB1234",salt));
});

test("safe hex comparison rejects different values",()=>assert.equal(safeEqualHex("aa","bb"),false));

test("session token round-trips",()=>{
  const token=issueSessionToken("kylp054",1_000); const parsed=readSessionToken(token,1_001);
  assert.equal(parsed.id,"kylp054");
});
