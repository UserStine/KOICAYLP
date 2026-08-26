import test from "node:test";
import assert from "node:assert/strict";
import { createGeminiSseParser } from "../src/services/aiService.js";

test("Gemini SSE parser handles events split across network chunks", () => {
  const payloads = [];
  const parser = createGeminiSseParser((payload) => payloads.push(payload));

  parser.push('data: {"candidates":[{"content":{"parts":[{"text":"Hel');
  parser.push('lo "}]}}]}\n\n');
  parser.push('data: {"candidates":[{"content":{"parts":[{"text":"world"}]}}]}\n\n');
  parser.finish();

  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].candidates[0].content.parts[0].text, "Hello ");
  assert.equal(payloads[1].candidates[0].content.parts[0].text, "world");
});

test("Gemini SSE parser ignores DONE marker", () => {
  const payloads = [];
  const parser = createGeminiSseParser((payload) => payloads.push(payload));
  parser.push("data: [DONE]\n\n");
  parser.finish();
  assert.deepEqual(payloads, []);
});
