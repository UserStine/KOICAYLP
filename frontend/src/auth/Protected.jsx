import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import PekoLoader from "../components/PekoLoader";

export default function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="portal-loading">
        <PekoLoader />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== "admin" && user.mustChangePin && location.pathname !== "/change-pin") return <Navigate to="/change-pin" replace />;
  return children;
}
