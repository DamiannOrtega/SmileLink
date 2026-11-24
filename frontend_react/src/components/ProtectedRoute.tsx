import { Navigate } from "react-router-dom";
import { clearSession, getToken, isTokenVigente } from "@/lib/auth";

/**
 * ProtectedRoute — Guarda de rutas administrativas.
 * Si no hay token o ya venció (claim "exp" del JWT), borra la sesión
 * y redirige a /login. La validación real de la firma la hace el backend.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!isTokenVigente(token)) {
    clearSession();
    // Solo avisamos "sesión expirada" si había un token; si no, es la primera visita.
    return <Navigate to={token ? "/login?expirada=1" : "/login"} replace />;
  }
  return <>{children}</>;
}
