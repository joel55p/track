import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "@/api/client";
import type { AlertItem, DashboardStats, MapPoint } from "@/api/types";
import { MapView } from "@/components/MapView";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [s, m, a] = await Promise.all([
          client.get<DashboardStats>("/api/supervision/dashboard"),
          client.get<MapPoint[]>("/api/supervision/map"),
          client.get<AlertItem[]>("/api/supervision/alerts"),
        ]);
        if (!cancel) {
          setStats(s.data);
          setPoints(m.data);
          setAlerts(a.data);
        }
      } catch {
        if (!cancel) setErr("No se pudo cargar el dashboard.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const center: [number, number] =
    points[0] != null ? [points[0].lat, points[0].lng] : [14.4653, -90.4418];

  const markers = points.map((p) => ({
    id: p.user_id,
    lat: p.lat,
    lng: p.lng,
    title: p.full_name,
    subtitle: p.status_label,
  }));

  const libres = stats ? Math.max(0, 24 - stats.tecnicos_activos + 12) : 0;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: "1 1 280px" }}>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.35rem" }}>Panel de control operativo</h1>
          <p style={{ margin: 0, color: "var(--tp-muted)", fontSize: "0.9rem" }}>
            Supervisión en tiempo real de Teleprogreso S.A.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-outline">
            Filtros avanzados
          </button>
          <button type="button" className="btn btn-primary">
            Generar reporte diario
          </button>
        </div>
      </div>

      {err ? <p className="error">{err}</p> : null}

      {stats ? (
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-lbl">Técnicos activos</div>
            <div className="kpi-val">{stats.tecnicos_activos}</div>
            <div className="kpi-sub">Capacidad operativa del día</div>
          </div>
          <div className="kpi-card critical">
            <div className="kpi-lbl">Alertas críticas</div>
            <div className="kpi-val" style={{ color: "var(--tp-danger)" }}>
              {String(stats.alertas_abiertas).padStart(2, "0")}
            </div>
            <div className="kpi-sub">Atención inmediata</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">Tareas completadas</div>
            <div className="kpi-val">{stats.tareas_completadas_hoy}</div>
            <div className="kpi-sub">Meta operativa / histórico</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">Activos libres</div>
            <div className="kpi-val">{libres}</div>
            <div className="kpi-sub">Módem y fibra (estimado)</div>
          </div>
        </div>
      ) : null}

      <div className="dash-split">
        <div className="card" style={{ margin: 0, padding: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Vista de flota en tiempo real</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--tp-muted)" }}>Leyenda: activo · retraso · crítico</span>
          </div>
          <MapView center={center} zoom={11} markers={markers} />
        </div>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Alertas recientes</strong>
            <Link to="/supervisor/alertas" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
              Ver todas
            </Link>
          </div>
          {alerts.length === 0 ? (
            <p style={{ color: "var(--tp-muted)", fontSize: "0.9rem" }}>Sin alertas activas.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {alerts.slice(0, 4).map((a) => (
                <li
                  key={a.task_id}
                  style={{
                    padding: "0.65rem 0",
                    borderBottom: "1px solid var(--tp-border)",
                    fontSize: "0.88rem",
                  }}
                >
                  <span className="badge badge-status-retrasada" style={{ marginRight: 8 }}>
                    Retraso
                  </span>
                  <strong>{a.title}</strong>
                  <div style={{ color: "var(--tp-muted)", marginTop: 4, fontSize: "0.8rem" }}>
                    {a.technician_name ?? "Técnico"} · {a.reason}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}>
                      Detalles
                    </button>
                    <Link to="/supervisor/reasignar" className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}>
                      Reasignar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {alerts.length > 0 ? (
            <div
              style={{
                marginTop: 12,
                padding: "0.65rem",
                borderRadius: 10,
                background: "var(--tp-blue-soft)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--tp-blue)",
              }}
            >
              Sugerencia: reasignar servicios retrasados para evitar efecto cascada.
            </div>
          ) : null}
        </div>
      </div>

      <div className="dashboard-triple">
        <div className="card" style={{ margin: 0 }}>
          <strong style={{ fontSize: "0.85rem" }}>Consumo de materiales</strong>
          {["Fibra óptica (m)", "Routers ONT", "Conectores SC/APC"].map((label, i) => {
            const pct = [45, 24, 44][i];
            return (
              <div key={label} style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                  <span>{label}</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 8, background: "#e9ecef", borderRadius: 99, marginTop: 4 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--tp-blue)", borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="card" style={{ margin: 0 }}>
          <strong style={{ fontSize: "0.85rem" }}>Estado de flota vehicular</strong>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem" }}>Pickups activas: 18 / 20</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>En mantenimiento: 02</p>
        </div>
        <div className="card" style={{ margin: 0 }}>
          <strong style={{ fontSize: "0.85rem" }}>Resumen de soporte</strong>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem" }}>Tiempo medio de respuesta: 4.5 min</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>Técnicos libres estimados (1h): 06</p>
          <Link to="/supervisor/inventario" className="btn btn-outline btn-block" style={{ marginTop: 12, textAlign: "center" }}>
            Consultar inventario completo
          </Link>
        </div>
      </div>
    </>
  );
}
