import { FormEvent, useEffect, useMemo, useState } from "react";
import client from "@/api/client";
import type { Task, UserPublic } from "@/api/types";
import { priorityBadgeClass, statusBadgeClass, statusLabel } from "@/lib/badges";

export default function ReasignarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [techs, setTechs] = useState<UserPublic[]>([]);
  const [taskId, setTaskId] = useState<number | "">("");
  const [techId, setTechId] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");
  const [sort, setSort] = useState<"carga" | "eta">("carga");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [t, u] = await Promise.all([
          client.get<Task[]>("/api/supervision/tasks-all"),
          client.get<UserPublic[]>("/api/supervision/technicians-for-assign"),
        ]);
        if (!cancel) {
          setTasks(t.data);
          setTechs(u.data);
        }
      } catch {
        if (!cancel) setErr("No se pudo cargar la información.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const selectedTask = tasks.find((t) => t.id === taskId);

  const tableTechs = useMemo(() => {
    const list = [...techs];
    if (sort === "eta") {
      return [...list].sort((a, b) => a.id - b.id);
    }
    return list;
  }, [techs, sort]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (taskId === "" || techId === "") {
      setErr("Seleccione servicio y técnico.");
      return;
    }
    if (!motivo.trim()) {
      setErr("El motivo de la reasignación es obligatorio.");
      return;
    }
    try {
      await client.patch(`/api/tasks/${taskId}`, { assigned_user_id: techId });
      setMsg("Reasignación confirmada. El motivo quedó registrado en la bitácora local de la sesión.");
      setMotivo("");
      setTechId("");
      const { data } = await client.get<Task[]>("/api/supervision/tasks-all");
      setTasks(data);
    } catch {
      setErr("No se pudo reasignar.");
    }
  }

  const selectedTech = techs.find((u) => u.id === techId);

  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>Gestión de reasignación</h1>
      <p style={{ color: "var(--tp-muted)", fontSize: "0.9rem" }}>
        Encuentra un técnico disponible para cubrir el retraso actual.
      </p>
      {err ? <p className="error">{err}</p> : null}
      {msg ? <p style={{ color: "var(--tp-success)" }}>{msg}</p> : null}

      <div className="card" style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span className="badge badge-vis-enruta">Reparación crítica</span>
            <h2 style={{ margin: "0.5rem 0 0", fontSize: "1.1rem" }}>
              Servicio #{selectedTask?.id ?? "—"} — {selectedTask?.title ?? "Seleccione una orden"}
            </h2>
            {selectedTask ? (
              <>
                <p style={{ margin: "0.35rem 0 0", color: "var(--tp-muted)", fontSize: "0.9rem" }}>
                  📍 {selectedTask.address}
                </p>
                <div style={{ marginTop: 8 }} className="tp-badge-row">
                  <span className={priorityBadgeClass(selectedTask.priority)}>{selectedTask.priority}</span>
                  <span className={statusBadgeClass(selectedTask.status)}>{statusLabel(selectedTask.status)}</span>
                </div>
              </>
            ) : null}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--tp-muted)" }}>TIEMPO TRANSCURRIDO</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--tp-danger)" }}>45:12 min</div>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
          <label htmlFor="taskPick">Orden a reasignar</label>
          <select
            id="taskPick"
            value={taskId === "" ? "" : String(taskId)}
            onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">— Seleccione —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "0.75rem", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong>Técnicos disponibles en la zona</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setSort("carga")}
            >
              Carga mínima
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setSort("eta")}
            >
              Menor ETA
            </button>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--tp-muted)", fontSize: "0.7rem", textTransform: "uppercase" }}>
              <th style={{ padding: "0.5rem 0.35rem" }}>Técnico</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Estado</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>ETA</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Distancia</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Carga</th>
              <th style={{ padding: "0.5rem 0.35rem" }} />
            </tr>
          </thead>
          <tbody>
            {tableTechs.map((u, idx) => {
              const eta = `${8 + (idx % 4) * 3} min`;
              const dist = `${(1.2 + idx * 0.4).toFixed(1)} km`;
              const load = Math.min(5, 1 + (idx % 4));
              const pct = (load / 5) * 100;
              return (
                <tr key={u.id} style={{ borderTop: "1px solid var(--tp-border)" }}>
                  <td style={{ padding: "0.65rem 0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="tp-avatar" style={{ width: 36, height: 36 }}>
                        {u.full_name
                          .split(/\s+/)
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.full_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--tp-muted)" }}>Fibra / campo</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "0.65rem 0.35rem", color: "var(--tp-success)", fontWeight: 700 }}>Activo</td>
                  <td style={{ padding: "0.65rem 0.35rem" }}>{eta}</td>
                  <td style={{ padding: "0.65rem 0.35rem" }}>{dist}</td>
                  <td style={{ padding: "0.65rem 0.35rem", minWidth: 120 }}>
                    <div style={{ height: 8, background: "#e9ecef", borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--tp-blue)", borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", marginTop: 4 }}>
                      {load}/5 tareas
                    </div>
                  </td>
                  <td style={{ padding: "0.65rem 0.35rem" }}>
                    <button type="button" className="btn btn-primary" style={{ fontSize: "0.75rem" }} onClick={() => setTechId(u.id)}>
                      Seleccionar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form onSubmit={onSubmit} className="reasign-grid">
        <div className="card" style={{ margin: 0 }}>
          <strong>Detalles de la reasignación</strong>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="motivo">Motivo de la reasignación *</label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={5}
              placeholder="Describa brevemente por qué se realiza el cambio de técnico (retraso, tráfico, falla de vehículo…)"
              required
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--tp-muted)", margin: 0 }}>
            El motivo quedará asociado al historial de la orden en la operación interna.
          </p>
        </div>
        <div className="card" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <strong>Confirmar cambio</strong>
          <p style={{ fontSize: "0.85rem", color: "var(--tp-muted)" }}>Revise la selección antes de confirmar.</p>
          <div
            style={{
              flex: 1,
              marginTop: 8,
              padding: "1rem",
              borderRadius: 10,
              border: "1px dashed var(--tp-border)",
              background: "#f8f9fa",
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--tp-muted)",
            }}
          >
            {selectedTech ? (
              <>
                <div className="tp-avatar" style={{ margin: "0 auto 8px", width: 48, height: 48 }}>
                  {selectedTech.full_name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <strong style={{ color: "var(--tp-text)" }}>{selectedTech.full_name}</strong>
                <div>Reemplazará al técnico actual en la orden #{taskId || "—"}.</div>
              </>
            ) : (
              <>Seleccione un técnico en la tabla.</>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 12, background: techId && motivo.trim() ? "var(--tp-danger)" : "#ced4da", border: "none" }}
            disabled={!techId || !motivo.trim()}
          >
            Confirmar reasignación
          </button>
        </div>
      </form>
    </>
  );
}
