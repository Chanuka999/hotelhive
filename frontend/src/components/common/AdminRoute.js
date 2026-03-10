import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function AdminRoute({ children }) {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
