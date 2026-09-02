import crypto from "node:crypto";
import { Router } from "express";
import { auth, adminOnly } from "../middleware/auth.js";
import { deleteKnowledgeArticle, listKnowledgeArticles, saveKnowledgeArticle } from "../repositories/knowledgeRepository.js";
import { getParticipantById, updateParticipant } from "../repositories/participantRepository.js";
import { getPinResetRequestById, listPinResetRequests, resolvePinResetRequest } from "../repositories/pinResetRepository.js";
import { hashPin } from "../services/authService.js";

const router=Router();
router.use(auth,adminOnly);
router.get("/knowledge",async(_req,res,next)=>{try{res.json({articles:await listKnowledgeArticles()});}catch(e){next(e);}});
router.post("/knowledge",async(req,res,next)=>{try{const id=String(req.body?.id||"").trim()||undefined,title=String(req.body?.title||"").trim().slice(0,180),category=String(req.body?.category||"program").trim().slice(0,80),content=String(req.body?.content||"").trim().slice(0,12000),language=["en","fr","ko","all"].includes(req.body?.language)?req.body.language:"en",source=String(req.body?.source||"KOICA YLP knowledge base").trim().slice(0,240),isPublished=Boolean(req.body?.isPublished ?? req.body?.is_published);if(title.length<2||content.length<5)return res.status(400).json({error:"Title and content are required."});const article=await saveKnowledgeArticle({id,title,category,content,language,source,isPublished});res.json({article});}catch(e){next(e);}});
router.delete("/knowledge/:id",async(req,res,next)=>{try{await deleteKnowledgeArticle(req.params.id);res.json({ok:true});}catch(e){next(e);}});

router.get("/pin-resets", async(_req,res,next)=>{try{
  res.json({ requests: await listPinResetRequests() });
}catch(e){next(e);}});

router.post("/pin-resets/:id/approve", async(req,res,next)=>{try{
  const request = await getPinResetRequestById(req.params.id);
  if (!request) return res.status(404).json({ error:"PIN reset request not found." });
  if (request.status !== "pending") return res.status(409).json({ error:"This request has already been reviewed." });
  const participant = await getParticipantById(request.participantId);
  if (!participant) return res.status(404).json({ error:"Participant account not found." });
  const tempPin = `TMP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const salt = crypto.randomBytes(16).toString("hex");
  await updateParticipant(participant.id, {
    salt, pinHash: hashPin(tempPin, salt), passwordSalt:"", passwordHash:"", mustChangePin:true,
  });
  await resolvePinResetRequest(request.id, "approved", req.user.id, req.body?.note);
  // tempPin is intentionally returned once and never persisted in plaintext.
  res.json({ ok:true, tempPin, participant:{ id:participant.id, name:participant.name } });
}catch(e){next(e);}});

router.post("/pin-resets/:id/reject", async(req,res,next)=>{try{
  const request = await getPinResetRequestById(req.params.id);
  if (!request) return res.status(404).json({ error:"PIN reset request not found." });
  if (request.status !== "pending") return res.status(409).json({ error:"This request has already been reviewed." });
  await resolvePinResetRequest(request.id, "rejected", req.user.id, req.body?.note);
  res.json({ ok:true });
}catch(e){next(e);}});

export default router;
