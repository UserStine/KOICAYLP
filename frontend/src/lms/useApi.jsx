import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import PekoLoader from "../components/PekoLoader";

/* Small data-fetching helper shared by the LMS pages. */
export default function useApi(path, deps = []) {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api(path)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  return { data, error, loading, reload: () => setTick((t) => t + 1) };
}

export function Loading() {
  return <div className="portal-loading"><PekoLoader /></div>;
}

export function ErrorNote({ children }) {
  return <div className="portal-error" role="alert">{children}</div>;
}
