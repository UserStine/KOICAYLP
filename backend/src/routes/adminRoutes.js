import { Router } from "express";
import { auth, adminOnly } from "../middleware/auth.js";
import { deleteKnowledgeArticle, listKnowledgeArticles, saveKnowledgeArticle } from "../repositories/knowledgeRepository.js";
const router=Router();
router.use(auth,adminOnly);
router.get("/knowledge",async(_req,res,next)=>{try{res.json({articles:await listKnowledgeArticles()});}catch(e){next(e);}});
router.post("/knowledge",async(req,res,next)=>{try{const id=String(req.body?.id||"").trim()||undefined,title=String(req.body?.title||"").trim().slice(0,180),category=String(req.body?.category||"program").trim().slice(0,80),content=String(req.body?.content||"").trim().slice(0,12000),language=["en","fr","ko","all"].includes(req.body?.language)?req.body.language:"en",source=String(req.body?.source||"KOICA YLP knowledge base").trim().slice(0,240),isPublished=Boolean(req.body?.isPublished ?? req.body?.is_published);if(title.length<2||content.length<5)return res.status(400).json({error:"Title and content are required."});const article=await saveKnowledgeArticle({id,title,category,content,language,source,isPublished});res.json({article});}catch(e){next(e);}});
router.delete("/knowledge/:id",async(req,res,next)=>{try{await deleteKnowledgeArticle(req.params.id);res.json({ok:true});}catch(e){next(e);}});
export default router;
