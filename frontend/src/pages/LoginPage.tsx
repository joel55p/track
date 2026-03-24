import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("tecnico@demo.tp");
  const [password, setPassword] = useState("demo123");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (user) {
    if (user.role === "tecnico") return <Navigate to="/tecnico/ruta" replace />;
    return <Navigate to="/supervisor" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch {
      setErr("No se pudo iniciar sesión. Verifique correo y contraseña.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: "center", padding: "1rem" }}>
      <div className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>Teleprogreso Track</h2>
        <p style={{ color: "var(--tp-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Supervisión de personal y activos (demo alineada al Corte 3).
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err ? <p className="error">{err}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || loading}>
            {busy ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p style={{ fontSize: "0.8rem", color: "var(--tp-muted)", marginTop: "1rem" }}>
          Demo: <code>tecnico@demo.tp</code> / <code>supervisor@demo.tp</code> — contraseña{" "}
          <code>demo123</code>
        </p>
      </div>
    </div>
  );
}
