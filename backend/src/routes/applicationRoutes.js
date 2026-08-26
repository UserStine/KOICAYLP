import crypto from "node:crypto";
import path from "node:path";
import { Router } from "express";
import { signupLimiter, uploadLimiter } from "../middleware/rateLimit.js";
import { decodeDataUrlUpload } from "../middleware/upload.js";
import {
  createApplicationSubmission,
  deleteApplicationSubmission,
  downloadApplicationForm,
  getApplicationSettings,
  uploadApplicationSubmission,
} from "../repositories/applicationRepository.js";

const router = Router();
const cleanPublicUrl = (value) => { if (!value) return ""; try { const url = new URL(String(value)); return ["https:","http:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } };
const fallbackStatus = () => ({ open:false, closeAt:null, message:"Applications are currently closed.", forms:{public:"",private:""}, submissions:{public:"",private:""} });

router.get("/application-status", async (_req,res) => {
  const fallback=fallbackStatus();
  try {
    const settings=await getApplicationSettings();
    if(!settings)return res.json({...fallback,source:"supabase-empty"});
    const closeAtMs=settings.close_at?Date.parse(settings.close_at):null, hasCloseAt=Number.isFinite(closeAtMs), open=Boolean(settings.applications_open)&&(!hasCloseAt||Date.now()<closeAtMs);
    return res.json({...fallback,open,closeAt:hasCloseAt?new Date(closeAtMs).toISOString():null,message:open?"Applications are currently open.":settings.closed_message||fallback.message,forms:{public:settings.public_form_path?"/api/application-forms/public/download":cleanPublicUrl(settings.public_form_url),private:settings.private_form_path?"/api/application-forms/private/download":cleanPublicUrl(settings.private_form_url)},submissions:{public:cleanPublicUrl(settings.public_submit_url),private:cleanPublicUrl(settings.private_submit_url)},source:"supabase"});
  } catch(error){ console.error(`[application-status] lookup_failed message=${String(error?.message||error).slice(0,300)}`); return res.status(200).json({...fallback,source:"fallback"}); }
});

router.get("/application-forms/:track/download", async(req,res)=>{
  try {
    const track=["public","private"].includes(req.params.track)?req.params.track:""; if(!track)return res.status(404).json({error:"Application form not found."});
    const settings=await getApplicationSettings(); if(!settings)return res.status(404).json({error:"Application form not found."});
    const closeAtMs=settings.close_at?Date.parse(settings.close_at):null, open=Boolean(settings.applications_open)&&(!Number.isFinite(closeAtMs)||Date.now()<closeAtMs); if(!open)return res.status(403).json({error:"Applications are currently closed."});
    const prefix=track; const storagePath=settings[`${prefix}_form_path`]; const fileName=settings[`${prefix}_form_name`]||`${track}-sector-application-form`; const mime=settings[`${prefix}_form_mime`]||"application/octet-stream"; if(!storagePath)return res.status(404).json({error:"Application form not found."});
    const buffer=await downloadApplicationForm(storagePath); res.setHeader("Content-Type",mime); res.setHeader("Content-Length",String(buffer.length)); res.setHeader("Content-Disposition",`attachment; filename="${String(fileName).replace(/[\r\n"]/g,"_")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`); res.send(buffer);
  } catch(error){ console.error(`[application-form-download] failed message=${String(error?.message||error).slice(0,300)}`); res.status(503).json({error:"Application form is temporarily unavailable."}); }
});

router.post("/applications/submit", signupLimiter, uploadLimiter, async(req,res)=>{
  let uploadedPath="";
  try {
    const settings=await getApplicationSettings(); if(!settings)return res.status(503).json({error:"Application service is temporarily unavailable."});
    const closeAtMs=settings.close_at?Date.parse(settings.close_at):null, open=Boolean(settings.applications_open)&&(!Number.isFinite(closeAtMs)||Date.now()<closeAtMs); if(!open)return res.status(403).json({error:"Applications are currently closed."});
    const track=["public","private"].includes(req.body?.track)?req.body.track:""; if(!track)return res.status(400).json({error:"Choose an application track."});
    const fullName=String(req.body?.fullName||"").trim().slice(0,160), email=String(req.body?.email||"").trim().toLowerCase().slice(0,254), phone=String(req.body?.phone||"").trim().slice(0,40), country=String(req.body?.country||"").trim().slice(0,100), organization=String(req.body?.organization||"").trim().slice(0,180);
    if(fullName.length<2)return res.status(400).json({error:"Enter your full name."}); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:"Enter a valid email address."}); if(phone.length<6)return res.status(400).json({error:"Enter a valid phone number."}); if(!country)return res.status(400).json({error:"Enter your country."}); if(!organization)return res.status(400).json({error:"Enter your organization or institution."});
    let upload; try { upload=decodeDataUrlUpload(req.body?.file); } catch(e){ return res.status(400).json({error:e.message.includes("size")?"Completed applications must be 10 MB or smaller.":e.message.includes("extension")||e.message.includes("type")?"Completed applications must be PDF, DOC, or DOCX files.":"The uploaded application file is invalid."}); }
    const reference=`YLP-${new Date().getUTCFullYear()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`; const safeBase=path.basename(upload.fileName).replace(/[^A-Za-z0-9._-]+/g,"-").slice(-120); uploadedPath=`${track}/${new Date().toISOString().slice(0,10)}/${reference}-${safeBase}`;
    await uploadApplicationSubmission(uploadedPath,upload.buffer,upload.mime); await createApplicationSubmission({reference,track,fullName,email,phone,country,organization,filePath:uploadedPath,fileName:upload.fileName,fileMime:upload.mime,fileSize:upload.buffer.length});
    res.status(201).json({ok:true,reference,message:"Application submitted successfully."});
  } catch(error){ if(uploadedPath){try{await deleteApplicationSubmission(uploadedPath);}catch{}} console.error(`[applications] submit_failed message=${String(error?.message||error).slice(0,300)}`); res.status(503).json({error:"We could not submit your application. Please try again."}); }
});

export default router;
