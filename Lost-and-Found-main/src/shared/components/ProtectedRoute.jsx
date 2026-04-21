import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

export default function ProtectedRoute({ children, studentOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (studentOnly) {
    const isStudent = user.role === "User" && user.status === "Active";
    if (!isStudent) {
      const redirectPath = user.role === "Admin" ? "/admin/dashboard" : "/login";
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
}
