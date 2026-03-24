import { useMemo, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { BrandMark } from "@/components/BrandMark";

function IconRuta({ active }: { active?: boolean }) {
  const c = active ? "var(--tp-blue)" : "currentColor";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconMapa({ active }: { active?: boolean }) {
  const c = active ? "var(--tp-blue)" : "currentColor";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4L4 6v14l5-2 5 2 5-2V4l-5 2-5-2z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPausas({ active }: { active?: boolean }) {
  const c = active ? "var(--tp-blue)" : "currentColor";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <path d="M10 9v6M14 9v6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconEquipo({ active }: { active?: boolean }) {
  const c = active ? "var(--tp-blue)" : "currentColor";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8h10v9H7zM9 8V6h6v2"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const titles: Record<string, string> = {
  "/tecnico/ruta": "Mi Ruta Diaria",
  "/tecnico/mapa": "Navegación",
  "/tecnico/asistencia": "Control de asistencia",
  "/tecnico/activos": "Equipamiento",
};

const links = [
  { to: "/tecnico/ruta", label: "Ruta", Icon: IconRuta },
  { to: "/tecnico/mapa", label: "Mapa", Icon: IconMapa },
  { to: "/tecnico/asistencia", label: "Pausas", Icon: IconPausas },
  { to: "/tecnico/activos", label: "Equipo", Icon: IconEquipo },
];

export default function TecnicoLayout() {
  const { user, loading, logout } = useAuth();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = useMemo(() => {
    const base = loc.pathname.split("?")[0];
    return titles[base] ?? "Teleprogreso";
  }, [loc.pathname]);

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (!user || user.role !== "tecnico") {
    return <Navigate to="/login" replace />;
  }

  const initials = user.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell" style={{ position: "relative" }}>
      <header className="tp-mobile-header">
        <div className="tp-title-row">
          <BrandMark size={34} />
          <h1>{title}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span className="tp-avatar" aria-hidden>
            {initials}
          </span>
          <button
            type="button"
            className="tp-icon-btn"
            aria-label="Menú"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
      {menuOpen ? (
        <div className="tp-menu" role="menu">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
      <main className="page" style={{ paddingTop: 0 }}>
        <Outlet />
      </main>
      <nav className="nav-bottom">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setMenuOpen(false)}
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
