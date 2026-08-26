import { Router } from "express";
import { aiLimiter } from "../middleware/rateLimit.js";
import { aiHealth, answerWithGemini, streamWithGemini } from "../services/aiService.js";

const router = Router();

function writeSse(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

router.get("/health", async (_req, res, next) => {
  try {
    res.json(await aiHealth());
  } catch (error) {
    next(error);
  }
});

router.post("/chat", aiLimiter, async (req, res, next) => {
  const message = String(req.body?.message || "").trim().slice(0, 2000);
  if (message.length < 2) {
    return res.status(400).json({ error: "Enter a message." });
  }

  const language = String(req.body?.language || "en").toLowerCase().slice(0, 12);
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const wantsStream = String(req.get("accept") || "")
    .toLowerCase()
    .includes("text/event-stream");

  if (!wantsStream) {
    try {
      return res.json(await answerWithGemini({ message, language, history }));
    } catch (error) {
      return next(error);
    }
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  try {
    writeSse(res, "start", { provider: "gemini" });

    const result = await streamWithGemini({
      message,
      language,
      history,
      signal: abortController.signal,
      onToken: (text) => {
        if (!res.writableEnded && !res.destroyed) {
          writeSse(res, "token", { text });
        }
      },
    });

    if (!res.writableEnded && !res.destroyed) {
      writeSse(res, "done", {
        sources: result.sources,
        retrievalMode: result.retrievalMode,
        provider: result.provider,
      });
      res.end();
    }
  } catch (error) {
    if (abortController.signal.aborted || res.destroyed) return;

    const messageText = error?.publicMessage || "AI service is temporarily unavailable.";
    writeSse(res, "error", { error: messageText });
    res.end();
  }
});

export default router;
