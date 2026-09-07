import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/admin-login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }

      // Guardar sesión en localStorage
      localStorage.setItem("smilelink_token", data.token);
      localStorage.setItem("smilelink_admin", JSON.stringify(data.admin));

      navigate("/dashboard", { replace: true });
    } catch {
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Fondo con gradiente animado */}
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />
      </div>

      <div className="login-card-wrapper">
        {/* Logo / Marca */}
        <div className="login-brand">
          <div className="login-logo">
            <Heart className="login-logo-icon" strokeWidth={2.5} />
          </div>
          <h1 className="login-title">SmileLink</h1>
          <p className="login-subtitle">Panel de Administración</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Iniciar sesión</h2>
            <p className="login-card-desc">Acceso exclusivo para encargados del sistema</p>
          </div>

          <form onSubmit={handleLogin} className="login-form" noValidate>
            {/* Error global */}
            {error && (
              <div className="login-error">
                <AlertCircle className="login-error-icon" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Campo email */}
            <div className="login-field">
              <label htmlFor="login-email" className="login-label">
                Correo electrónico
              </label>
              <div className="login-input-wrapper">
                <Mail className="login-input-icon" size={16} />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="encargado@smilelink.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Contraseña
              </label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" size={16} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="login-input login-input-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botón de submit */}
            <button
              id="login-submit"
              type="submit"
              className={`login-btn${loading ? " login-btn-loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>

        <p className="login-footer">
          SmileLink © {new Date().getFullYear()} · Sistema de Gestión de Apadrinamientos
        </p>
      </div>

      <style>{`
        /* ── Reset & root ── */
        .login-root {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #0a0a14;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Fondo animado ── */
        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #7c3aed, transparent 70%);
          top: -120px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #db2777, transparent 70%);
          bottom: -80px; right: -80px;
          animation-delay: 3s;
        }
        .orb-3 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, #2563eb, transparent 70%);
          top: 50%; left: 55%;
          animation-delay: 5s;
          opacity: 0.15;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-20px) scale(1.05); }
        }

        /* ── Wrapper central ── */
        .login-card-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          width: 100%;
          max-width: 420px;
        }

        /* ── Marca ── */
        .login-brand {
          text-align: center;
        }
        .login-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px; height: 68px;
          border-radius: 20px;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
          box-shadow: 0 0 40px rgba(124, 58, 237, 0.5);
          margin-bottom: 0.75rem;
          animation: pulse-logo 3s ease-in-out infinite;
        }
        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 0 40px rgba(124, 58, 237, 0.5); }
          50%       { box-shadow: 0 0 60px rgba(219, 39, 119, 0.6); }
        }
        .login-logo-icon {
          width: 34px; height: 34px;
          color: #fff;
        }
        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.03em;
          margin: 0 0 0.25rem;
        }
        .login-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0;
          font-weight: 400;
        }

        /* ── Tarjeta ── */
        .login-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 4px 6px rgba(0,0,0,0.3),
            0 20px 60px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .login-card-header {
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .login-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.35rem;
        }
        .login-card-desc {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }

        /* ── Formulario ── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        /* ── Error global ── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 0.83rem;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
        }
        .login-error-icon { flex-shrink: 0; }

        /* ── Campos ── */
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .login-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.01em;
        }
        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 0.85rem;
          color: #475569;
          pointer-events: none;
          transition: color 0.2s;
        }
        .login-input-wrapper:focus-within .login-input-icon {
          color: #7c3aed;
        }
        .login-input {
          width: 100%;
          padding: 0.7rem 0.85rem 0.7rem 2.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #f1f5f9;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: #334155; }
        .login-input:focus {
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.07);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }
        .login-input-password {
          padding-right: 2.8rem;
        }
        .login-eye-btn {
          position: absolute;
          right: 0.85rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #475569;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .login-eye-btn:hover { color: #94a3b8; }

        /* ── Botón submit ── */
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          margin-top: 0.5rem;
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124, 58, 237, 0.55);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled, .login-btn-loading {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* ── Spinner ── */
        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .login-footer {
          font-size: 0.72rem;
          color: #334155;
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
