import { useCallback, useEffect, useRef, useState } from "react";
import client from "@/api/client";
import type { Asset, Task } from "@/api/types";

function stockLabel(a: Asset) {
  if (a.kind === "vehiculo") return "1 ud.";
  const n = (a.id % 5) + 3;
  return `${n} uds.`;
}

function condLabel(a: Asset) {
  if (a.identifier.includes("101") || a.name.toLowerCase().includes("fusion")) return "desgastado";
  return "perfecto";
}

export default function ActivosPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const invRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const [a, t] = await Promise.all([
      client.get<Asset[]>("/api/assets", { params: { q: search || undefined } }),
      client.get<Task[]>("/api/tasks"),
    ]);
    setAssets(a.data);
    setTasks(t.data);
  }, [search]);

  useEffect(() => {
    const id = setTimeout(() => {
      load().catch(() => setErr("No se pudieron cargar los activos."));
    }, 200);
    return () => clearTimeout(id);
  }, [load]);

  const vehicles = assets.filter((x) => x.kind === "vehiculo");
  const tools = assets.filter((x) => x.kind === "herramienta");
  const primaryVeh = vehicles.find((v) => v.status === "en_uso") ?? vehicles[0];

  function toggle(id: number) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function checkout() {
    setErr(null);
    setMsg(null);
    const asset_ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    if (asset_ids.length === 0) {
      setErr("Seleccione al menos un activo disponible.");
      return;
    }
    try {
      await client.post("/api/assets/checkout", { asset_ids });
      setMsg("Check-in de equipo registrado.");
      setSelected({});
      await load();
    } catch {
      setErr("No se pudo completar el registro.");
    }
  }

  async function reportIncident(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const description = String(fd.get("description") || "").trim();
    const task_id = fd.get("task_id") ? Number(fd.get("task_id")) : undefined;
    const asset_id = fd.get("asset_id") ? Number(fd.get("asset_id")) : undefined;
    if (!description) return;
    setErr(null);
    setMsg(null);
    try {
      await client.post("/api/incidents", { description, task_id, asset_id });
      setMsg("Incidencia enviada.");
      e.currentTarget.reset();
    } catch {
      setErr("No se pudo enviar la incidencia.");
    }
  }

  const toolCount = tools.filter((t) => t.status === "en_uso").length || tools.length;

  return (
    <>
      <div className="veh-card">
        <div className="row-top">
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--tp-muted)" }}>VEHÍCULO ACTUAL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 22 }}>🚐</span>
              <div>
                <div className="name">{primaryVeh?.name ?? "Sin unidad asignada"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--tp-muted)" }}>
                  Placa: {primaryVeh?.identifier ?? "—"}
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button
              type="button"
              style={{
                border: "none",
                background: "none",
                color: "var(--tp-blue)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
              onClick={() => invRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Cambiar unidad
            </button>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-vis-enruta">{primaryVeh ? "Asignado" : "Pendiente"}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <div style={{ padding: "0.5rem", background: "#f8f9fa", borderRadius: 10, fontSize: "0.8rem" }}>
            <div style={{ fontWeight: 800, color: "var(--tp-muted)" }}>Kilometraje</div>
            <div style={{ fontWeight: 800 }}>45,230 km</div>
          </div>
          <div style={{ padding: "0.5rem", background: "#f8f9fa", borderRadius: 10, fontSize: "0.8rem" }}>
            <div style={{ fontWeight: 800, color: "var(--tp-muted)" }}>Combustible</div>
            <div style={{ height: 8, background: "#e9ecef", borderRadius: 99, marginTop: 6 }}>
              <div style={{ width: "75%", height: "100%", background: "var(--tp-blue)", borderRadius: 99 }} />
            </div>
            <div style={{ fontWeight: 800, marginTop: 4 }}>75%</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--tp-muted)", textTransform: "uppercase" }}>
          Inventario y herramientas
        </div>
        <span className="badge badge-vis-pendiente">{toolCount} activos</span>
      </div>

      <div className="inv-grid" ref={invRef}>
        {tools.slice(0, 4).map((a) => {
          const c = condLabel(a);
          return (
            <div key={a.id} className="inv-tile">
              <div className="ph" />
              <div className="bd">
                <div className={`st ${c === "perfecto" ? "st-ok" : "st-warn"}`}>{c}</div>
                <div style={{ fontWeight: 800, fontSize: "0.85rem", marginTop: 4 }}>{a.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--tp-muted)" }}>Stock: {stockLabel(a)}</div>
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 8, fontSize: "0.75rem", padding: "0.35rem" }}
                  onClick={() => toggle(a.id)}
                >
                  {selected[a.id] ? "✓ Listo" : "+ Registrar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "0 1rem" }}>
        <button type="button" className="btn btn-primary btn-block" onClick={checkout}>
          Confirmar salida de inventario seleccionado
        </button>
        {msg ? <p style={{ color: "var(--tp-success)", marginTop: "0.65rem", fontSize: "0.85rem" }}>{msg}</p> : null}
        {err ? <p className="error">{err}</p> : null}
      </div>

      <div style={{ padding: "0.75rem 1rem 0.25rem", fontWeight: 800, fontSize: "0.85rem" }}>Historial reciente</div>
      <div className="card" style={{ margin: "0 1rem 0.75rem" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem" }}>
          <li style={{ display: "flex", gap: 10, padding: "0.45rem 0", borderBottom: "1px solid var(--tp-border)" }}>
            <span>📦</span>
            <div>
              <strong>Consumo: checklist de campo</strong>
              <div style={{ fontSize: "0.8rem", color: "var(--tp-muted)" }}>Instalación / mantenimiento</div>
              <div style={{ fontSize: "0.75rem", color: "var(--tp-muted)" }}>10:15 AM</div>
            </div>
          </li>
          <li style={{ display: "flex", gap: 10, padding: "0.45rem 0" }}>
            <span>🚐</span>
            <div>
              <strong>Check-in vehículo</strong>
              <div style={{ fontSize: "0.8rem", color: "var(--tp-muted)" }}>
                Unidad {primaryVeh?.identifier ?? "—"} — OK
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--tp-muted)" }}>08:30 AM</div>
            </div>
          </li>
        </ul>
      </div>

      <div className="card" style={{ margin: "0 1rem 1rem" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Reportar incidencia</div>
        <form onSubmit={reportIncident}>
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={3} required />
          </div>
          <div className="field">
            <label htmlFor="task_id">Servicio (opcional)</label>
            <select id="task_id" name="task_id" defaultValue="">
              <option value="">—</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="asset_id">Activo (opcional)</label>
            <select id="asset_id" name="asset_id" defaultValue="">
              <option value="">—</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.identifier} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-outline btn-block">
            Enviar reporte
          </button>
        </form>
      </div>
    </>
  );
}
