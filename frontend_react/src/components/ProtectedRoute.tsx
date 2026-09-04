import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — Guarda de rutas administrativas.
 * Si no hay sesión activa en localStorage, redirige automáticamente a /login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("smilelink_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
