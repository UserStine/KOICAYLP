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
