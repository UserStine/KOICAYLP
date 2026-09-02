import crypto from "node:crypto";
import * as supabase from "../../supabase-store.js";
import { readJson, writeJson } from "./jsonStore.js";

const STORE = "pin-reset-requests.json";
const clean = (v) => String(v || "").trim();

function normalizeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    participantId: row.participant_id ?? row.participantId,
    participantName: row.participant_name ?? row.participantName ?? "",
    country: row.country || "",
    track: row.track || "",
    status: row.status || "pending",
    note: row.note || "",
    requestedAt: row.requested_at ?? row.requestedAt,
    reviewedAt: row.reviewed_at ?? row.reviewedAt ?? null,
    reviewedBy: row.reviewed_by ?? row.reviewedBy ?? null,
  };
}

export async function createPinResetRequest(participant) {
  if (supabase.isSupabaseConfigured()) {
    const client = supabase.getSupabaseClient();
    const { data: existing, error: findError } = await client
      .from("pin_reset_requests")
      .select("*")
      .eq("participant_id", participant.id)
      .eq("status", "pending")
      .maybeSingle();
    if (findError) throw new Error(`Unable to check PIN reset request: ${findError.message}`);
    if (existing) return normalizeRow(existing);

    const { data, error } = await client.from("pin_reset_requests").insert({
      participant_id: participant.id,
      participant_name: clean(participant.name),
      country: clean(participant.country),
      track: clean(participant.track),
      status: "pending",
      updated_at: new Date().toISOString(),
    }).select("*").single();
    if (error) throw new Error(`Unable to create PIN reset request: ${error.message}`);
    return normalizeRow(data);
  }

  const rows = readJson(STORE, []);
  const existing = rows.find((r) => r.participantId === participant.id && r.status === "pending");
  if (existing) return existing;
  const row = {
    id: crypto.randomUUID(), participantId: participant.id,
    participantName: clean(participant.name), country: clean(participant.country),
    track: clean(participant.track), status: "pending", note: "",
    requestedAt: new Date().toISOString(), reviewedAt: null, reviewedBy: null,
  };
  rows.push(row); writeJson(STORE, rows); return row;
}

export async function listPinResetRequests() {
  if (supabase.isSupabaseConfigured()) {
    const client = supabase.getSupabaseClient();
    const { data, error } = await client.from("pin_reset_requests").select("*").order("requested_at", { ascending: false });
    if (error) throw new Error(`Unable to list PIN reset requests: ${error.message}`);
    return (data || []).map(normalizeRow);
  }
  return readJson(STORE, []).sort((a,b) => String(b.requestedAt).localeCompare(String(a.requestedAt)));
}

export async function getPinResetRequestById(id) {
  if (supabase.isSupabaseConfigured()) {
    const client = supabase.getSupabaseClient();
    const { data, error } = await client.from("pin_reset_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Unable to read PIN reset request: ${error.message}`);
    return normalizeRow(data);
  }
  return readJson(STORE, []).find((r) => r.id === id) || null;
}

export async function resolvePinResetRequest(id, status, reviewedBy, note = "") {
  const reviewedAt = new Date().toISOString();
  if (supabase.isSupabaseConfigured()) {
    const client = supabase.getSupabaseClient();
    const { data, error } = await client.from("pin_reset_requests").update({
      status, reviewed_at: reviewedAt, reviewed_by: reviewedBy || null,
      note: clean(note).slice(0, 500), updated_at: reviewedAt,
    }).eq("id", id).select("*").single();
    if (error) throw new Error(`Unable to update PIN reset request: ${error.message}`);
    return normalizeRow(data);
  }
  const rows = readJson(STORE, []); const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = { ...rows[i], status, reviewedAt, reviewedBy: reviewedBy || null, note: clean(note).slice(0,500) };
  writeJson(STORE, rows); return rows[i];
}
