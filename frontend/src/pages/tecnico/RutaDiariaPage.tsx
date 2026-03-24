import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import client from "@/api/client";
import type { Task } from "@/api/types";
import { priorityBadgeClass } from "@/lib/badges";
import { clientLabel, etaForStop, inferJobType } from "@/lib/taskUi";

const prioOrder: Task["priority"][] = ["urgente", "alta", "media", "baja"];

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    const pa = prioOrder.indexOf(a.priority);
    const pb = prioOrder.indexOf(b.priority);
    if (pa !== pb) return pa - pb;
    return a.id - b.id;
  });
}

function visStatus(t: Task) {
  if (t.status === "completada") return { cls: "badge badge-vis-completado", label: "Completado" };
  if (t.status === "retrasada") return { cls: "badge badge-status-retrasada", label: "Retrasada" };
  if (t.status === "en_ruta" || t.status === "en_servicio")
    return { cls: "badge badge-vis-enruta", label: t.status === "en_servicio" ? "En servicio" : "En Ruta" };
  return { cls: "badge badge-vis-pendiente", label: "Pendiente" };
}

export default function RutaDiariaPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const { data } = await client.get<Task[]>("/api/tasks");
    setTasks(sortTasks(data));
  }, []);

  useEffect(() => {
    load().catch(() => setErr("No se pudieron cargar las paradas del día."));
  }, [load]);

  const ordered = useMemo(() => sortTasks(tasks), [tasks]);

  const activeId = useMemo(() => {
    const cur = ordered.find((t) => t.status !== "completada");
    return cur?.id;
  }, [ordered]);

  const todayLabel = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const updatedAt = new Date().toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const estHours = Math.min(8, Math.max(4, ordered.length * 0.75 + 1));
  const estKm = Math.round(ordered.length * 5.2 + 12);

  return (
    <>
      <div className="tp-greeting">
        <h2>Hola, {user?.full_name ?? "…"}</h2>
        <div className="tp-sub">
          <span>Hoy, {todayLabel}</span>
          <button type="button" className="tp-icon-btn" aria-label="Calendario">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 3v4M16 3v4M3 11h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="tp-metrics-3">
        <div className="tp-metric-pill">
          <div className="val">{ordered.length}</div>
          <div className="lbl">Paradas</div>
        </div>
        <div className="tp-metric-pill">
          <div className="val">{estHours.toFixed(1)}h</div>
          <div className="lbl">Est.</div>
        </div>
        <div className="tp-metric-pill">
          <div className="val">{estKm}km</div>
          <div className="lbl">Ruta</div>
        </div>
      </div>

      {err ? <div className="tp-alert-strip">⚠ {err}</div> : null}

      <div className="tp-section-head">
        <span>Cronograma del día</span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>Actualizado: {updatedAt}</span>
      </div>

      {ordered.length === 0 && !err ? (
        <p className="tp-end-stops">No hay paradas programadas.</p>
      ) : null}

      {ordered.map((t, idx) => {
        const st = visStatus(t);
        const eta = etaForStop(idx, t);
        const active = t.id === activeId;
        return (
          <article key={t.id} className={`tp-schedule-card${active ? " tp-active" : ""}`}>
            <div className="tp-schedule-inner">
              <div className="tp-schedule-eta">{eta}</div>
              <div className="tp-schedule-body">
                <div className="tp-badge-row">
                  <span className={st.cls}>{st.label}</span>
                  {t.priority === "urgente" ? (
                    <span className={priorityBadgeClass("urgente")}>Urgente</span>
                  ) : null}
                </div>
                <h3>{clientLabel(t)}</h3>
                <p className="addr">
                  <span aria-hidden>📍</span>
                  <span>{t.address}</span>
                </p>
                <div className="tp-job-type">{inferJobType(t)}</div>
              </div>
              <button
                type="button"
                className="tp-icon-btn"
                aria-label="Detalle"
                onClick={() => nav(`/tecnico/mapa?parada=${t.id}`)}
              >
                ›
              </button>
            </div>
            <button
              type="button"
              className="tp-order-footer"
              onClick={() => nav(`/tecnico/mapa?parada=${t.id}`)}
            >
              <span aria-hidden>➤</span> Ver detalles de la orden
            </button>
          </article>
        );
      })}

      {ordered.length > 0 ? (
        <p className="tp-end-stops">No hay más paradas programadas</p>
      ) : null}
    </>
  );
}
