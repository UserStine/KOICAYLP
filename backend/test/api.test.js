import test from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";

async function withServer(fn){const server=app.listen(0);await new Promise((r)=>server.once("listening",r));try{const {port}=server.address();await fn(`http://127.0.0.1:${port}`);}finally{await new Promise((r)=>server.close(r));}}

test("root health endpoint remains available",()=>withServer(async(base)=>{const r=await fetch(`${base}/api/health`);assert.equal(r.status,200);const body=await r.json();assert.equal(body.ok,true);}));
test("AI health endpoint preserves response contract",()=>withServer(async(base)=>{const r=await fetch(`${base}/api/ai/health`);assert.equal(r.status,200);const body=await r.json();assert.equal(body.provider,"gemini");assert.ok("knowledgeChunks" in body);}));
