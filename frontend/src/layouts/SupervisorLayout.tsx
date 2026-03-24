import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { BrandMark } from "@/components/BrandMark";

function canSupervise(role: string | undefined) {
  return role === "supervisor" || role === "admin" || role === "gerente";
}

const links = [
  { to: "/supervisor", label: "Dashboard", end: true, icon: "▦" },
  { to: "/supervisor/alertas", label: "Alertas", icon: "⚠" },
  { to: "/supervisor/reasignar", label: "Reasignar", icon: "🔁" },
  { to: "/supervisor/inventario", label: "Inventario", icon: "📦" },
];

export default function SupervisorLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (!user || !canSupervise(user.role)) {
    return <Navigate to="/login" replace />;
  }

  const initials = user.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="super-app">
      <header className="super-top">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrandMark size={32} />
          <span className="logo-txt">Teleprogreso</span>
        </div>
        <div className="super-search">
          <input type="search" placeholder="Buscar técnicos o alertas…" aria-label="Buscar" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              color: "var(--tp-muted)",
            }}
            title="Notificaciones"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--tp-danger)",
              }}
            />
          </span>
          <span className="tp-avatar">{initials}</span>
        </div>
      </header>
      <div className="super-body">
        <aside className="super-side">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              <span style={{ width: 22, textAlign: "center" }} aria-hidden>
                {l.icon}
              </span>
              {l.label}
            </NavLink>
          ))}
          <div className="spacer" />
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0.55rem 0.65rem",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "var(--tp-muted)",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            ⚙
            Configuración
          </button>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              marginTop: 8,
              padding: "0.55rem 0.65rem",
              borderRadius: 8,
              border: "1px solid var(--tp-border)",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </aside>
        <div className="super-content">
          <Outlet />
        </div>
      </div>
      <footer className="super-foot">
        <span>© {new Date().getFullYear()} Teleprogreso S.A. — Gestión operativa.</span>
        <span>
          <a href="#">Soporte</a>
          {" · "}
          <a href="#">Privacidad</a>
        </span>
      </footer>
    </div>
  );
}
