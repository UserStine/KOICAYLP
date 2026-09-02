import crypto from "node:crypto";
import * as supabase from "../../supabase-store.js";
import { readJson, writeJson } from "./jsonStore.js";

const STORE = "password-reset-tokens.json";

function digestToken(raw) {
  return crypto.createHash("sha256").update(String(raw || "")).digest("hex");
}

export async function createPasswordResetToken(participantId, ttlMs) {
  const raw = crypto.randomBytes(32).toString("base64url");
  const digest = digestToken(raw);
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  if (supabase.isSupabaseConfigured()) {
    const client = supabase.getSupabaseClient();
    const now = new Date().toISOString();
    await client
      .from("password_reset_tokens")
      .update({ used_at: now })
      .eq("participant_id", participantId)
      .is("used_at", null);

    const { error } = await client.from("password_reset_tokens").insert({
      participant_id: participantId,
      token_digest: digest,
      expires_at: expiresAt,
    });
    if (error) throw new Error(`Unable to create password reset token: ${error.message}`);
    return raw;
  }

  const rows = readJson(STORE, []).map((row) =>
    row.participantId === participantId && !row.usedAt ? { ...row, usedAt: Date.now() } : row
  );
  rows.push({ participantId, digest, expiresAt: Date.parse(expiresAt), usedAt: null });
  writeJson(STORE, rows);
  return raw;
}

export async function consumePasswordResetToken(raw) {
  const digest = digestToken(raw);

  if (supabase.isSupabaseConfigured()) {
    const client = supabase.getSupabaseClient();
    const { data, error } = await client
      .from("password_reset_tokens")
      .select("id, participant_id, expires_at, used_at")
      .eq("token_digest", digest)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Unable to verify password reset token: ${error.message}`);
    if (!data || data.used_at || Date.parse(data.expires_at) <= Date.now()) return null;

    const { data: used, error: updateError } = await client
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id)
      .is("used_at", null)
      .select("participant_id")
      .maybeSingle();
    if (updateError) throw new Error(`Unable to consume password reset token: ${updateError.message}`);
    return used ? { participantId: used.participant_id } : null;
  }

  const rows = readJson(STORE, []);
  const row = rows.find((item) => !item.usedAt && item.expiresAt > Date.now() && item.digest === digest);
  if (!row) return null;
  row.usedAt = Date.now();
  writeJson(STORE, rows);
  return { participantId: row.participantId };
}
