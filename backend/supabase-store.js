import { createClient } from "@supabase/supabase-js";

let cachedClient = null;
let cachedUrl = "";
let cachedKey = "";

function getSupabaseConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").trim(),
    key: String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!cachedClient || cachedUrl !== url || cachedKey !== key) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cachedUrl = url;
    cachedKey = key;
  }

  return cachedClient;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function fromParticipantRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email || "",
    country: row.country || "",
    organization: row.organization || "",
    track: row.track || "public",
    cohort: row.cohort || "",
    role: row.role || "participant",
    salt: row.pin_salt || "",
    pinHash: row.pin_hash || "",
    passwordSalt: row.password_salt || "",
    passwordHash: row.password_hash || "",
    mustChangePin: Boolean(row.must_change_pin),
  };
}

function toParticipantRow(participant) {
  return {
    id: String(participant.id || "").trim(),
    name: String(participant.name || "").trim(),
    normalized_name: normalizeName(participant.name),
    email: String(participant.email || "").trim().toLowerCase() || null,
    country: String(participant.country || "").trim(),
    organization: String(participant.organization || "").trim(),
    track: String(participant.track || "public").trim() || "public",
    cohort: String(participant.cohort || "").trim(),
    role: String(participant.role || "participant").trim() || "participant",
    pin_salt: String(participant.salt || "").trim() || null,
    pin_hash: String(participant.pinHash || "").trim() || null,
    password_salt: String(participant.passwordSalt || "").trim() || null,
    password_hash: String(participant.passwordHash || "").trim() || null,
    must_change_pin: Boolean(participant.mustChangePin),
    updated_at: new Date().toISOString(),
  };
}

export async function getApplicationSettings() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("application_settings")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to read application settings: ${error.message}`);
  return data;
}

export async function updateApplicationSettings({
  applicationsOpen,
  closedMessage,
  closeAt = null,
  publicFormUrl = "",
  privateFormUrl = "",
  publicSubmitUrl = "",
  privateSubmitUrl = "",
}) {
  const supabase = requireClient();
  const existing = await getApplicationSettings();
  const message = String(closedMessage || "Applications are currently closed.").trim();
  const values = {
    applications_open: Boolean(applicationsOpen),
    closed_message: message,
    close_at: closeAt || null,
    public_form_url: String(publicFormUrl || "").trim() || null,
    private_form_url: String(privateFormUrl || "").trim() || null,
    public_submit_url: String(publicSubmitUrl || "").trim() || null,
    private_submit_url: String(privateSubmitUrl || "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (!existing) {
    const { data, error } = await supabase
      .from("application_settings")
      .insert(values)
      .select()
      .single();
    if (error) throw new Error(`Unable to create application settings: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from("application_settings")
    .update(values)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) throw new Error(`Unable to update application settings: ${error.message}`);
  return data;
}


const APPLICATION_FORMS_BUCKET = "application-forms";

export async function uploadApplicationForm(storagePath, buffer, contentType) {
  const supabase = requireClient();
  const { error } = await supabase.storage
    .from(APPLICATION_FORMS_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
      cacheControl: "3600",
    });
  if (error) throw new Error(`Unable to upload application form: ${error.message}`);
  return storagePath;
}

export async function downloadApplicationForm(storagePath) {
  const supabase = requireClient();
  const { data, error } = await supabase.storage
    .from(APPLICATION_FORMS_BUCKET)
    .download(storagePath);
  if (error) throw new Error(`Unable to download application form: ${error.message}`);
  const bytes = Buffer.from(await data.arrayBuffer());
  return bytes;
}

export async function deleteApplicationForm(storagePath) {
  if (!storagePath) return;
  const supabase = requireClient();
  const { error } = await supabase.storage
    .from(APPLICATION_FORMS_BUCKET)
    .remove([storagePath]);
  if (error) throw new Error(`Unable to remove application form: ${error.message}`);
}

export async function updateApplicationFormMetadata(track, file) {
  const supabase = requireClient();
  const existing = await getApplicationSettings();
  if (!existing) throw new Error("Application settings have not been created yet.");
  const prefix = track === "private" ? "private" : "public";
  const values = {
    [`${prefix}_form_path`]: file?.path || null,
    [`${prefix}_form_name`]: file?.name || null,
    [`${prefix}_form_mime`]: file?.mime || null,
    [`${prefix}_form_url`]: null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("application_settings")
    .update(values)
    .eq("id", existing.id)
    .select()
    .single();
  if (error) throw new Error(`Unable to update application form metadata: ${error.message}`);
  return data;
}



const APPLICATION_SUBMISSIONS_BUCKET = "application-submissions";

export async function uploadApplicationSubmission(storagePath, buffer, contentType) {
  const supabase = requireClient();
  const { error } = await supabase.storage
    .from(APPLICATION_SUBMISSIONS_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
      cacheControl: "3600",
    });
  if (error) throw new Error(`Unable to upload application submission: ${error.message}`);
  return storagePath;
}

export async function downloadApplicationSubmission(storagePath) {
  const supabase = requireClient();
  const { data, error } = await supabase.storage
    .from(APPLICATION_SUBMISSIONS_BUCKET)
    .download(storagePath);
  if (error) throw new Error(`Unable to download application submission: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteApplicationSubmission(storagePath) {
  if (!storagePath) return;
  const supabase = requireClient();
  const { error } = await supabase.storage
    .from(APPLICATION_SUBMISSIONS_BUCKET)
    .remove([storagePath]);
  if (error) throw new Error(`Unable to remove application submission: ${error.message}`);
}

export async function createApplicationSubmission(values) {
  const supabase = requireClient();
  const row = {
    reference: String(values.reference || "").trim(),
    track: values.track === "private" ? "private" : "public",
    full_name: String(values.fullName || "").trim(),
    email: String(values.email || "").trim().toLowerCase(),
    phone: String(values.phone || "").trim(),
    country: String(values.country || "").trim(),
    organization: String(values.organization || "").trim(),
    file_path: String(values.filePath || "").trim(),
    file_name: String(values.fileName || "").trim(),
    file_mime: String(values.fileMime || "application/octet-stream").trim(),
    file_size: Number(values.fileSize || 0),
    status: "submitted",
  };
  const { data, error } = await supabase
    .from("application_submissions")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Unable to save application submission: ${error.message}`);
  return data;
}

export async function getApplicationSubmissionById(id) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("application_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to read application submission: ${error.message}`);
  return data;
}

export async function listApplicationSubmissions() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("application_submissions")
    .select("id,reference,track,full_name,email,phone,country,organization,file_name,file_mime,file_size,status,submitted_at")
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(`Unable to list application submissions: ${error.message}`);
  return data || [];
}

export async function listParticipants() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(`Unable to list participants: ${error.message}`);
  return (data || []).map(fromParticipantRow);
}

export async function getParticipantById(id) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("id", String(id || "").trim())
    .maybeSingle();
  if (error) throw new Error(`Unable to read participant: ${error.message}`);
  return fromParticipantRow(data);
}

export async function getParticipantByName(name) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("normalized_name", normalizeName(name))
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Unable to find participant by name: ${error.message}`);
  return fromParticipantRow(data);
}

export async function getParticipantByEmail(email) {
  const supabase = requireClient();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Unable to find participant by email: ${error.message}`);
  return fromParticipantRow(data);
}

export async function createParticipant(participant) {
  const supabase = requireClient();
  const row = toParticipantRow(participant);
  if (!row.id || !row.name) throw new Error("Participant id and name are required.");

  const { data, error } = await supabase
    .from("participants")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Unable to create participant: ${error.message}`);
  return fromParticipantRow(data);
}

export async function updateParticipant(id, changes) {
  const supabase = requireClient();
  const current = await getParticipantById(id);
  if (!current) return null;

  const row = toParticipantRow({ ...current, ...changes, id: current.id });
  delete row.id;

  const { data, error } = await supabase
    .from("participants")
    .update(row)
    .eq("id", current.id)
    .select()
    .single();
  if (error) throw new Error(`Unable to update participant: ${error.message}`);
  return fromParticipantRow(data);
}

export async function upsertParticipants(participants) {
  const supabase = requireClient();
  const rows = participants.map(toParticipantRow);
  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("participants")
    .upsert(rows, { onConflict: "id" })
    .select();
  if (error) throw new Error(`Unable to import participants: ${error.message}`);
  return (data || []).map(fromParticipantRow);
}


/* --------------------------------------------------------------------------
   Peko knowledge base
   -------------------------------------------------------------------------- */

function fromKnowledgeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "",
    category: row.category || "program",
    content: row.content || "",
    language: row.language || "en",
    source: row.source || "KOICA YLP knowledge base",
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export async function listKnowledgeArticles({ publishedOnly = false } = {}) {
  const supabase = requireClient();
  let query = supabase
    .from("knowledge_articles")
    .select("id,title,category,content,language,source,is_published,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (publishedOnly) query = query.eq("is_published", true);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to list knowledge articles: ${error.message}`);
  return (data || []).map(fromKnowledgeRow);
}

export async function listPublishedKnowledgeArticles() {
  return listKnowledgeArticles({ publishedOnly: true });
}

export async function saveKnowledgeArticle(values) {
  const supabase = requireClient();
  const row = {
    title: String(values.title || "").trim(),
    category: String(values.category || "program").trim().toLowerCase() || "program",
    content: String(values.content || "").trim(),
    language: ["en", "fr", "ko", "all"].includes(String(values.language || "en").toLowerCase())
      ? String(values.language || "en").toLowerCase()
      : "en",
    source: String(values.source || "KOICA YLP knowledge base").trim() || "KOICA YLP knowledge base",
    is_published: Boolean(values.isPublished),
    updated_at: new Date().toISOString(),
  };
  if (!row.title || !row.content) throw new Error("Knowledge title and content are required.");

  if (values.id) {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .update(row)
      .eq("id", values.id)
      .select()
      .single();
    if (error) throw new Error(`Unable to update knowledge article: ${error.message}`);
    return fromKnowledgeRow(data);
  }

  const { data, error } = await supabase
    .from("knowledge_articles")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Unable to create knowledge article: ${error.message}`);
  return fromKnowledgeRow(data);
}

export async function deleteKnowledgeArticle(id) {
  const supabase = requireClient();
  const { error } = await supabase.from("knowledge_articles").delete().eq("id", id);
  if (error) throw new Error(`Unable to delete knowledge article: ${error.message}`);
}

/* --------------------------------------------------------------------------
   Peko conversations and messages
   -------------------------------------------------------------------------- */

function fromPekoConversationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    participantId: row.participant_id,
    title: row.title || "New conversation",
    language: row.language || "en",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function fromPekoMessageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content || "",
    sources: Array.isArray(row.sources) ? row.sources : [],
    createdAt: row.created_at || null,
  };
}

export async function createPekoConversation({ participantId, title, language = "en" }) {
  const supabase = requireClient();
  const safeLanguage = ["en", "fr", "ko"].includes(language) ? language : "en";
  const { data, error } = await supabase
    .from("peko_conversations")
    .insert({
      participant_id: participantId,
      title: String(title || "New conversation").trim().slice(0, 120) || "New conversation",
      language: safeLanguage,
    })
    .select()
    .single();
  if (error) throw new Error(`Unable to create Peko conversation: ${error.message}`);
  return fromPekoConversationRow(data);
}

export async function listPekoConversations(participantId, limit = 20) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("peko_conversations")
    .select("id,participant_id,title,language,created_at,updated_at")
    .eq("participant_id", participantId)
    .order("updated_at", { ascending: false })
    .limit(Math.max(1, Math.min(Number(limit) || 20, 50)));
  if (error) throw new Error(`Unable to list Peko conversations: ${error.message}`);
  return (data || []).map(fromPekoConversationRow);
}

export async function getPekoConversation(participantId, conversationId) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("peko_conversations")
    .select("id,participant_id,title,language,created_at,updated_at")
    .eq("id", conversationId)
    .eq("participant_id", participantId)
    .maybeSingle();
  if (error) throw new Error(`Unable to read Peko conversation: ${error.message}`);
  return fromPekoConversationRow(data);
}

export async function listPekoMessages(participantId, conversationId) {
  const conversation = await getPekoConversation(participantId, conversationId);
  if (!conversation) return null;
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("peko_messages")
    .select("id,conversation_id,role,content,sources,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Unable to list Peko messages: ${error.message}`);
  return { conversation, messages: (data || []).map(fromPekoMessageRow) };
}

export async function addPekoMessage({ participantId, conversationId, role, content, sources = [] }) {
  const conversation = await getPekoConversation(participantId, conversationId);
  if (!conversation) throw new Error("Peko conversation not found.");
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("peko_messages")
    .insert({
      conversation_id: conversationId,
      role: role === "assistant" ? "assistant" : "user",
      content: String(content || "").trim().slice(0, 12000),
      sources: Array.isArray(sources) ? sources : [],
    })
    .select()
    .single();
  if (error) throw new Error(`Unable to save Peko message: ${error.message}`);

  const titleUpdate = role === "user" && conversation.title === "New conversation"
    ? String(content || "").replace(/\s+/g, " ").trim().slice(0, 70) || "New conversation"
    : conversation.title;

  await supabase
    .from("peko_conversations")
    .update({ title: titleUpdate, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("participant_id", participantId);

  return fromPekoMessageRow(data);
}

export async function deletePekoConversation(participantId, conversationId) {
  const supabase = requireClient();
  const { error } = await supabase
    .from("peko_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("participant_id", participantId);
  if (error) throw new Error(`Unable to delete Peko conversation: ${error.message}`);
}
