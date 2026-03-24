import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "@/api/client";
import type { AlertItem, MapPoint } from "@/api/types";
import { MapView } from "@/components/MapView";

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "criticos" | "advertencias">("todos");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [a, m] = await Promise.all([
          client.get<AlertItem[]>("/api/supervision/alerts"),
          client.get<MapPoint[]>("/api/supervision/map"),
        ]);
        if (!cancel) {
          setAlerts(a.data);
          setPoints(m.data);
          if (a.data[0]) setSelectedId(a.data[0].task_id);
        }
      } catch {
        if (!cancel) setErr("No se pudieron cargar las alertas.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "criticos") return alerts.filter((x) => x.priority === "urgente" || x.priority === "alta");
    if (filter === "advertencias") return alerts.filter((x) => x.priority === "media" || x.priority === "baja");
    return alerts;
  }, [alerts, filter]);

  const selected = alerts.find((a) => a.task_id === selectedId) ?? filtered[0] ?? null;

  const point = selected
    ? points.find((p) => p.full_name === selected.technician_name) ?? points[0]
    : points[0];

  const center: [number, number] = point ? [point.lat, point.lng] : [14.4653, -90.4418];

  const markers = point
    ? [
        {
          id: point.user_id,
          lat: point.lat,
          lng: point.lng,
          title: point.full_name,
          subtitle: "Técnico en parada",
        },
      ]
    : [];

  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>Gestión de alertas operativas</h1>
      <p style={{ color: "var(--tp-muted)", fontSize: "0.9rem" }}>
        Monitoreo de retrasos e incidencias alineado al tablero de Visily.
      </p>
      {err ? <p className="error">{err}</p> : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {(
          [
            ["todos", `Todos (${alerts.length})`],
            ["criticos", `Críticos (${alerts.filter((a) => a.priority === "urgente" || a.priority === "alta").length})`],
            ["advertencias", `Advertencias (${alerts.filter((a) => a.priority === "media" || a.priority === "baja").length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="btn btn-outline"
            style={{
              borderRadius: 999,
              fontSize: "0.8rem",
              background: filter === key ? "var(--tp-blue-soft)" : "#fff",
              borderColor: filter === key ? "var(--tp-blue)" : "var(--tp-border)",
            }}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="alertas-grid">
        <div className="card" style={{ margin: 0, maxHeight: 520, overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong style={{ fontSize: "0.8rem" }}>INCIDENTES ACTIVOS ({filtered.length})</strong>
            <button type="button" className="tp-icon-btn" aria-label="Actualizar">
              ↻
            </button>
          </div>
          {filtered.length === 0 ? (
            <p style={{ color: "var(--tp-muted)", fontSize: "0.9rem" }}>No hay incidentes en este filtro.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filtered.map((a) => (
                <li key={a.task_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.task_id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.65rem",
                      marginBottom: 8,
                      borderRadius: 10,
                      border: "1px solid var(--tp-border)",
                      background: selectedId === a.task_id ? "var(--tp-blue-soft)" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{a.technician_name ?? "Técnico"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--tp-muted)", marginTop: 4 }}>{a.title}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className="badge badge-status-retrasada">+25 MIN</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card" style={{ margin: 0 }}>
          {selected ? (
            <>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="tp-avatar" style={{ width: 56, height: 56, fontSize: "1.1rem" }}>
                  {(selected.technician_name ?? "T")
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{selected.technician_name ?? "Técnico"}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--tp-muted)" }}>Técnico de campo · Teleprogreso</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}>
                      Contactar
                    </button>
                    <button type="button" className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}>
                      Chat
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: "0.75rem", background: "#f8f9fa", borderRadius: 10 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--tp-muted)" }}>DETALLE DEL RETRASO</div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.85rem" }}>
                  <div>
                    <div style={{ color: "var(--tp-muted)", fontSize: "0.7rem" }}>ETA PROGRAMADO</div>
                    <strong>10:30 AM</strong>
                  </div>
                  <div>
                    <div style={{ color: "var(--tp-muted)", fontSize: "0.7rem" }}>ETA ACTUALIZADO</div>
                    <strong style={{ color: "var(--tp-danger)" }}>10:55 AM</strong>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--tp-muted)" }}>UBICACIÓN DE LA PARADA</div>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>{selected.title}</p>
                <p style={{ margin: "0.25rem 0 0", color: "var(--tp-muted)", fontSize: "0.85rem" }}>
                  Dirección registrada en la orden de servicio.
                </p>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "1px solid var(--tp-border)",
                  background: "#fffbeb",
                  fontSize: "0.85rem",
                }}
              >
                <strong>Resolución sugerida</strong>
                <p style={{ margin: "0.5rem 0 0" }}>
                  El técnico presenta un retraso operativo. Se recomienda reasignar si el tiempo de espera supera el umbral
                  acordado.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Link to="/supervisor/reasignar" className="btn btn-primary" style={{ flex: 1, textAlign: "center" }}>
                    Reasignar servicio
                  </Link>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }}>
                    Ignorar alerta
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: "var(--tp-muted)" }}>Seleccione un incidente.</p>
          )}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <strong style={{ fontSize: "0.85rem" }}>Monitoreo GPS en tiempo real</strong>
          <p style={{ fontSize: "0.8rem", color: "var(--tp-muted)", margin: "0.35rem 0 0.5rem" }}>
            Técnico online · señal hace 2 min
          </p>
          <MapView center={center} zoom={14} markers={markers} className="map-wrap map-compact" />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--tp-muted)" }}>MÉTRICAS DEL DÍA</div>
            <div style={{ marginTop: 8, fontSize: "0.85rem" }}>
              <div>Progreso de ruta: 3 / 5 paradas</div>
              <div style={{ marginTop: 6 }}>Horas de conducción: 2.4h</div>
              <div style={{ marginTop: 6, color: "var(--tp-danger)", fontWeight: 700 }}>Retraso acumulado: +38m</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "0.65rem",
              borderRadius: 10,
              background: "#fff5f5",
              border: "1px solid #fecdd3",
              fontSize: "0.8rem",
            }}
          >
            <strong>Nota de supervisor</strong>
            <p style={{ margin: "0.35rem 0 0" }}>Tráfico pesado en zona por obras. Validar ETAs con campo.</p>
          </div>
        </div>
      </div>
    </>
  );
}
