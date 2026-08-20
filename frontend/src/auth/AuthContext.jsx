import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const KEY = "ylp-token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!token);

  /* restore the session on load */
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setUser(d.user))
      .catch(() => { setToken(null); try { localStorage.removeItem(KEY); } catch {} })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (name, pin) => {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed. Please try again.");
    try { localStorage.setItem(KEY, data.token); } catch {}
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
    setToken(null);
    setUser(null);
  }, []);

  /* authenticated fetch helper used by the LMS pages */
  const api = useCallback(async (pathname, options = {}) => {
    const res = await fetch(`${API}${pathname}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (res.status === 401) { logout(); throw new Error("Your session expired. Please log in again."); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
