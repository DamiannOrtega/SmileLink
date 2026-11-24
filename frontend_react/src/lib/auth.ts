/**
 * Manejo de la sesión del administrador (token JWT).
 *
 * - El token lo entrega el backend en /auth/admin-login/ y se guarda en localStorage.
 * - services/api.ts lo envía en cada petición como "Authorization: Bearer <token>".
 * - El token trae su fecha de vencimiento (claim "exp"); aquí solo la LEEMOS para
 *   saber si ya expiró. Quien realmente valida la firma es el backend.
 */

const TOKEN_KEY = "smilelink_token";
const ADMIN_KEY = "smilelink_admin";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  } catch {
    // localStorage no disponible: nada que limpiar
  }
}

/** Lee el payload del JWT (la parte del medio). No verifica la firma. */
function leerPayload(token: string): { exp?: number } | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")));
  } catch {
    return null;
  }
}

/** true si hay token y su "exp" todavía no llega. */
export function isTokenVigente(token: string | null = getToken()): boolean {
  if (!token) return false;
  const payload = leerPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

/** Borra la sesión y manda al login (se usa cuando el backend responde 401). */
export function cerrarSesionPorExpiracion(): void {
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login?expirada=1");
  }
}
