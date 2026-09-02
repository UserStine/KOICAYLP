import { createContext, useContext, useState, useEffect, useCallback } from "react";

const configuredApi = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

// Production always uses the same-origin /api proxy. This keeps the session
// cookie first-party on mobile browsers (especially iOS Safari).
export const API = import.meta.env.DEV
  ? (configuredApi || "http://localhost:4000")
  : "";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (name, pin) => {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Login failed (${res.status}). Please try again.`);

    // Confirm that the HttpOnly session cookie survived the login response
    // before navigating into the protected portal. This prevents the UI from
    // appearing to log in and immediately bouncing back out.
    const sessionCheck = await fetch(`${API}/api/me`, { credentials: "include", cache: "no-store" });
    const sessionData = await sessionCheck.json().catch(() => ({}));
    if (!sessionCheck.ok || !sessionData.user) {
      throw new Error("Sign-in could not create a persistent session. Please try again.");
    }

    setUser(sessionData.user);
    return sessionData.user;
  }, []);


  const refreshUser = useCallback(async () => {
    const res = await fetch(`${API}/api/me`, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.user) { setUser(null); throw new Error("Your session expired. Please log in again."); }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/api/logout`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
    } catch {}
    setUser(null);
  }, []);

  const api = useCallback(async (pathname, options = {}) => {
    const res = await fetch(`${API}${pathname}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    if (res.status === 401) { setUser(null); throw new Error("Your session expired. Please log in again."); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout, api, refreshUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
