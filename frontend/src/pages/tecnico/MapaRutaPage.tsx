import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "@/api/client";
import type { Task } from "@/api/types";
import { MapView } from "@/components/MapView";
import { priorityBadgeClass, statusLabel } from "@/lib/badges";
import { clientLabel, inferJobType } from "@/lib/taskUi";

const prioOrder: Task["priority"][] = ["urgente", "alta", "media", "baja"];

export default function MapaRutaPage() {
  const [params] = useSearchParams();
  const paradaId = Number(params.get("parada") || 0) || null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const { data } = await client.get<Task[]>("/api/tasks");
    setTasks(data);
  }, []);

  useEffect(() => {
    load().catch(() => setErr("No se pudo cargar el mapa."));
  }, [load]);

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => prioOrder.indexOf(a.priority) - prioOrder.indexOf(b.priority)),
    [tasks],
  );

  const focus = useMemo(
    () => (paradaId ? sorted.find((t) => t.id === paradaId) ?? null : null),
    [sorted, paradaId],
  );

  const stopIndex = focus ? sorted.findIndex((t) => t.id === focus.id) + 1 : 0;

  const center: [number, number] = useMemo(() => {
    if (focus) return [focus.lat, focus.lng];
    if (sorted.length === 0) return [14.4653, -90.4418];
    const t = sorted[0];
    return [t.lat, t.lng];
  }, [sorted, focus]);

  const markers = sorted.map((t) => ({
    id: t.id,
    lat: t.lat,
    lng: t.lng,
    title: clientLabel(t),
    subtitle: `${t.priority.toUpperCase()} · ${statusLabel(t.status)}`,
  }));

  async function patchStatus(id: number, status: Task["status"]) {
    await client.patch(`/api/tasks/${id}`, { status });
    await load();
  }

  const mapsUrl = focus
    ? `https://www.google.com/maps/dir/?api=1&destination=${focus.lat},${focus.lng}`
    : "#";

  return (
    <div style={{ position: "relative" }}>
      {err ? <div className="tp-alert-strip">⚠ {err}</div> : null}

      <div style={{ padding: "0 1rem", marginBottom: 8 }}>
        <Link to="/tecnico/ruta" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
          ← Volver a mi ruta
        </Link>
      </div>

      <div style={{ padding: "0 1rem 0.5rem", position: "relative", zIndex: 1 }}>
        <div
          className="card"
          style={{
            margin: 0,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgb(0 0 0 / 0.12)",
          }}
        >
          {focus ? (
            <>
              <div style={{ padding: "0.85rem 1rem 0.25rem" }} className="tp-badge-row">
                <span className="badge badge-vis-enruta">Parada #{stopIndex}</span>
                {focus.priority === "urgente" ? (
                  <span style={{ color: "var(--tp-danger)", fontWeight: 800, fontSize: "0.8rem" }}>
                    Urgente
                  </span>
                ) : null}
                <span className={priorityBadgeClass(focus.priority)}>{focus.priority}</span>
              </div>
              <div style={{ padding: "0 0.25rem 1rem 1rem" }}>
                <h2 style={{ margin: "0.25rem 0", fontSize: "1.15rem" }}>{clientLabel(focus)}</h2>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--tp-muted)" }}>
                  📍 {focus.address}
                </p>
                {focus.access_notes ? (
                  <div
                    style={{
                      marginTop: "0.65rem",
                      padding: "0.65rem",
                      borderRadius: 10,
                      background: "#f8f9fa",
                      border: "1px solid var(--tp-border)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>Observaciones de acceso</strong>
                    <div style={{ marginTop: 6 }}>{focus.access_notes}</div>
                  </div>
                ) : null}
                <p style={{ margin: "0.65rem 0 0", fontSize: "0.8rem", color: "var(--tp-blue)", fontWeight: 700 }}>
                  {inferJobType(focus)} · {statusLabel(focus.status)}
                </p>
              </div>
              <div style={{ padding: "0 1rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--tp-muted)", marginBottom: 6 }}>
                  FOTOS DE REFERENCIA
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 64,
                      borderRadius: 8,
                      background: "linear-gradient(135deg,#e7f1ff,#dee2e6)",
                      border: "1px dashed var(--tp-border)",
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 64,
                      borderRadius: 8,
                      background: "linear-gradient(135deg,#e7f1ff,#dee2e6)",
                      border: "1px dashed var(--tp-border)",
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      width: 72,
                      height: 64,
                      borderRadius: 8,
                      border: "1px dashed var(--tp-blue)",
                      background: "#fff",
                      color: "var(--tp-blue)",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                    }}
                  >
                    Añadir
                  </button>
                </div>
              </div>
              <div style={{ padding: "0.75rem 1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--tp-muted)" }}>
                    INSTRUCCIONES DE RUTA
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--tp-blue)" }}>~4 min</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.85rem", color: "var(--tp-muted)" }}>
                  <li>Siga recto hacia el sector de la parada (450 m)</li>
                  <li>Gire según indicaciones locales hacia el destino (120 m)</li>
                  <li>Coordine con el cliente antes de ingresar</li>
                </ul>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: 8,
                  padding: "0 1rem 1rem",
                }}
              >
                <a
                  className="btn btn-outline"
                  style={{ height: 48, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  href="tel:"
                  aria-label="Llamar"
                >
                  📞
                </a>
                <a className="btn btn-primary" style={{ height: 48 }} href={mapsUrl} target="_blank" rel="noreferrer">
                  ➤ IR
                </a>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 1rem 1rem" }}>
                {focus.status === "pendiente" ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => patchStatus(focus.id, "en_ruta")}
                  >
                    Iniciar desplazamiento
                  </button>
                ) : null}
                {focus.status === "en_ruta" ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => patchStatus(focus.id, "en_servicio")}
                  >
                    Iniciar servicio
                  </button>
                ) : null}
                {focus.status === "en_servicio" ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => patchStatus(focus.id, "completada")}
                  >
                    Finalizar servicio
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div style={{ padding: "1rem" }}>
              <p style={{ margin: 0, color: "var(--tp-muted)", fontSize: "0.9rem" }}>
                Seleccione una parada desde <strong>Mi ruta</strong> o toque un marcador en el mapa.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ margin: "0 1rem", borderRadius: 16, overflow: "hidden", border: "1px solid var(--tp-border)" }}>
        <MapView center={center} zoom={focus ? 14 : 11} markers={markers} className="map-wrap map-compact" />
      </div>

      <div className="card" style={{ margin: "0.75rem 1rem 1rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--tp-muted)", marginBottom: 8 }}>
          PARADAS
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((t) => (
            <li key={t.id} style={{ borderBottom: "1px solid var(--tp-border)" }}>
              <Link
                to={`/tecnico/mapa?parada=${t.id}`}
                style={{
                  display: "block",
                  padding: "0.5rem 0",
                  fontWeight: 600,
                  color: "var(--tp-text)",
                }}
              >
                {clientLabel(t)} — {statusLabel(t.status)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
