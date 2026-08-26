import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createPekoConversation,
  deletePekoConversation,
  listPekoConversations,
  listPekoMessages,
} from "../repositories/chatRepository.js";

const router = Router();

router.get("/conversations", auth, async (req, res, next) => {
  try {
    const conversations = await listPekoConversations(req.user.id, req.query.limit);
    res.json({ conversations });
  } catch (error) { next(error); }
});

router.post("/conversations", auth, async (req, res, next) => {
  try {
    const conversation = await createPekoConversation({
      participantId: req.user.id,
      title: req.body?.title,
      language: req.body?.language,
    });
    res.status(201).json({ conversation });
  } catch (error) { next(error); }
});

router.get("/conversations/:id", auth, async (req, res, next) => {
  try {
    const result = await listPekoMessages(req.user.id, req.params.id);
    if (!result) return res.status(404).json({ error: "Conversation not found." });
    res.json(result);
  } catch (error) { next(error); }
});

router.delete("/conversations/:id", auth, async (req, res, next) => {
  try {
    await deletePekoConversation(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
