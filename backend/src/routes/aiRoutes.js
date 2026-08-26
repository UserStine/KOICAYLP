import { Router } from "express";
import { aiLimiter } from "../middleware/rateLimit.js";
import { optionalAuth } from "../middleware/auth.js";
import { addPekoMessage, createPekoConversation, getPekoConversation } from "../repositories/chatRepository.js";
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

router.post("/chat", aiLimiter, optionalAuth, async (req, res, next) => {
  const message = String(req.body?.message || "").trim().slice(0, 2000);
  if (message.length < 2) {
    return res.status(400).json({ error: "Enter a message." });
  }

  const language = String(req.body?.language || "en").toLowerCase().slice(0, 12);
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const wantsStream = String(req.get("accept") || "")
    .toLowerCase()
    .includes("text/event-stream");

  let conversationId = String(req.body?.conversationId || "").trim();
  if (req.user) {
    try {
      if (conversationId) {
        const existing = await getPekoConversation(req.user.id, conversationId);
        if (!existing) conversationId = "";
      }
      if (!conversationId) {
        const conversation = await createPekoConversation({
          participantId: req.user.id,
          title: message,
          language,
        });
        conversationId = conversation.id;
      }
      await addPekoMessage({ participantId: req.user.id, conversationId, role: "user", content: message });
    } catch (error) {
      console.warn(`[peko-chat] persist_user_failed user=${req.user.id} message=${String(error?.message || error).slice(0, 220)}`);
      conversationId = "";
    }
  }

  if (!wantsStream) {
    try {
      const result = await answerWithGemini({ message, language, history });
      if (req.user && conversationId) {
        try { await addPekoMessage({ participantId: req.user.id, conversationId, role: "assistant", content: result.reply, sources: result.sources }); } catch (error) { console.warn(`[peko-chat] persist_assistant_failed user=${req.user.id} message=${String(error?.message || error).slice(0,220)}`); }
      }
      return res.json({ ...result, conversationId: conversationId || null, persisted: Boolean(req.user && conversationId) });
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
    writeSse(res, "start", { provider: "gemini", conversationId: conversationId || null, persisted: Boolean(req.user && conversationId) });

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

    if (req.user && conversationId) {
      try { await addPekoMessage({ participantId: req.user.id, conversationId, role: "assistant", content: result.reply, sources: result.sources }); } catch (error) { console.warn(`[peko-chat] persist_assistant_failed user=${req.user.id} message=${String(error?.message || error).slice(0,220)}`); }
    }

    if (!res.writableEnded && !res.destroyed) {
      writeSse(res, "done", {
        sources: result.sources,
        retrievalMode: result.retrievalMode,
        provider: result.provider,
        conversationId: conversationId || null,
        persisted: Boolean(req.user && conversationId),
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
