import { Navigate, useLocation } from "react-router-dom";

export default function AdminRoute({ children }) {
  const location = useLocation();

  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("unifind_admin"));
    } catch {
      return null;
    }
  })();

  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
