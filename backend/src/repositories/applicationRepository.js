import * as supabase from "../../supabase-store.js";

const noFallback = () => { throw Object.assign(new Error("Application persistence requires Supabase."), { status: 503 }); };
export const getApplicationSettings = () => supabase.isSupabaseConfigured() ? supabase.getApplicationSettings() : Promise.resolve(null);
export const updateApplicationSettings = (v) => supabase.isSupabaseConfigured() ? supabase.updateApplicationSettings(v) : noFallback();
export const uploadApplicationForm = (...a) => supabase.isSupabaseConfigured() ? supabase.uploadApplicationForm(...a) : noFallback();
export const downloadApplicationForm = (...a) => supabase.isSupabaseConfigured() ? supabase.downloadApplicationForm(...a) : noFallback();
export const deleteApplicationForm = (...a) => supabase.isSupabaseConfigured() ? supabase.deleteApplicationForm(...a) : noFallback();
export const updateApplicationFormMetadata = (...a) => supabase.isSupabaseConfigured() ? supabase.updateApplicationFormMetadata(...a) : noFallback();
export const uploadApplicationSubmission = (...a) => supabase.isSupabaseConfigured() ? supabase.uploadApplicationSubmission(...a) : noFallback();
export const downloadApplicationSubmission = (...a) => supabase.isSupabaseConfigured() ? supabase.downloadApplicationSubmission(...a) : noFallback();
export const deleteApplicationSubmission = (...a) => supabase.isSupabaseConfigured() ? supabase.deleteApplicationSubmission(...a) : noFallback();
export const createApplicationSubmission = (...a) => supabase.isSupabaseConfigured() ? supabase.createApplicationSubmission(...a) : noFallback();
export const getApplicationSubmissionById = (...a) => supabase.isSupabaseConfigured() ? supabase.getApplicationSubmissionById(...a) : noFallback();
export const listApplicationSubmissions = (...a) => supabase.isSupabaseConfigured() ? supabase.listApplicationSubmissions(...a) : Promise.resolve([]);
