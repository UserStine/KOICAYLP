import { readJson, writeJson } from "./jsonStore.js";
export const getContent = () => readJson("content.json", { modules: [], announcements: [], resources: [], sessions: [] });
export const saveContent = (content) => (writeJson("content.json", content), content);
export function getModule(id) { return getContent().modules?.find((m) => m.id === id) || null; }
export function getResource(id) { return getContent().resources?.find((r) => r.id === id) || null; }
