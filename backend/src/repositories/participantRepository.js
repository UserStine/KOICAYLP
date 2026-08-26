import * as supabase from "../../supabase-store.js";
import { readJson, writeJson } from "./jsonStore.js";

const normalize = (value) => String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

export async function listParticipants() {
  if (supabase.isSupabaseConfigured()) return supabase.listParticipants();
  return readJson("participants.json", []);
}
export async function getParticipantById(id) {
  if (supabase.isSupabaseConfigured()) return supabase.getParticipantById(id);
  return readJson("participants.json", []).find((p) => p.id === id) || null;
}
export async function getParticipantByEmail(email) {
  if (supabase.isSupabaseConfigured()) return supabase.getParticipantByEmail(email);
  const needle = String(email || "").trim().toLowerCase();
  return readJson("participants.json", []).find((p) => String(p.email || "").toLowerCase() === needle) || null;
}
export async function getParticipantByName(name) {
  if (supabase.isSupabaseConfigured()) return supabase.getParticipantByName(name);
  const needle = normalize(name);
  return readJson("participants.json", []).find((p) => normalize(p.name) === needle) || null;
}
export async function createParticipant(participant) {
  if (supabase.isSupabaseConfigured()) return supabase.createParticipant(participant);
  const rows = readJson("participants.json", []);
  rows.push(participant); writeJson("participants.json", rows); return participant;
}
export async function updateParticipant(id, changes) {
  if (supabase.isSupabaseConfigured()) return supabase.updateParticipant(id, changes);
  const rows = readJson("participants.json", []); const idx = rows.findIndex((p) => p.id === id);
  if (idx < 0) return null; rows[idx] = { ...rows[idx], ...changes }; writeJson("participants.json", rows); return rows[idx];
}
export async function upsertParticipants(participants) {
  if (supabase.isSupabaseConfigured()) return supabase.upsertParticipants(participants);
  const rows = readJson("participants.json", []); const map = new Map(rows.map((p) => [p.id, p]));
  for (const p of participants) map.set(p.id, { ...(map.get(p.id) || {}), ...p });
  const result = [...map.values()]; writeJson("participants.json", result); return result;
}
