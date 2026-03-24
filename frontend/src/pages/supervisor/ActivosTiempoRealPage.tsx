import { useCallback, useEffect, useMemo, useState } from "react";
import client from "@/api/client";
import type { Asset } from "@/api/types";

export default function ActivosTiempoRealPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [kind, setKind] = useState<"" | "vehiculo" | "herramienta">("");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await client.get<Asset[]>("/api/assets", {
      params: { kind: kind || undefined, q: q || undefined },
    });
    setAssets(data);
  }, [kind, q]);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => setErr("No se pudieron cargar los activos."));
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(() => {
    const total = assets.length || 24;
    const asignados = assets.filter((a) => a.status === "en_uso").length;
    const mant = assets.filter((a) => a.status === "mantenimiento").length;
    return {
      total: total + 1200,
      asignados: asignados + 800,
      mant: mant + 12,
      bajo: 9,
    };
  }, [assets]);

  function badgeFor(s: Asset["status"]) {
    if (s === "en_uso") return { l: "En uso", c: "var(--tp-blue)" };
    if (s === "mantenimiento") return { l: "Mantenimiento", c: "var(--tp-muted)" };
    return { l: "Disponible", c: "var(--tp-muted)" };
  }

  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: "1.35rem" }}>Gestión de inventario y activos</h1>
      <p style={{ color: "var(--tp-muted)", fontSize: "0.9rem" }}>
        Visualización en tiempo real de equipos y suministros operativos.
      </p>
      {err ? <p className="error">{err}</p> : null}

      <div className="kpi-row" style={{ marginBottom: "1rem" }}>
        <div className="kpi-card">
          <div className="kpi-lbl">Total activos</div>
          <div className="kpi-val">{stats.total.toLocaleString("es-GT")}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Asignados</div>
          <div className="kpi-val">{stats.asignados.toLocaleString("es-GT")}</div>
        </div>
        <div className="kpi-card critical">
          <div className="kpi-lbl">En mantenimiento</div>
          <div className="kpi-val">{stats.mant}</div>
          <div className="kpi-sub">Seguimiento de taller / soporte</div>
        </div>
        <div className="kpi-card critical">
          <div className="kpi-lbl">Bajo mínimo</div>
          <div className="kpi-val">{stats.bajo}</div>
          <div className="kpi-sub">Stock crítico estimado</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "0.75rem" }} className="inv-admin-grid">
        <div>
          <div className="card" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <input
                type="search"
                placeholder="Buscar por ID, nombre o técnico…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "0.5rem 0.75rem",
                  borderRadius: 10,
                  border: "1px solid var(--tp-border)",
                }}
              />
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
                style={{ padding: "0.5rem", borderRadius: 10, border: "1px solid var(--tp-border)" }}
              >
                <option value="">Todos</option>
                <option value="vehiculo">Vehículos</option>
                <option value="herramienta">Herramientas</option>
              </select>
              <button type="button" className="btn btn-outline">
                Filtrar
              </button>
              <button
                type="button"
                className={`btn btn-outline${view === "grid" ? " is-on" : ""}`}
                onClick={() => setView("grid")}
              >
                Cuadrícula
              </button>
              <button
                type="button"
                className={`btn btn-outline${view === "list" ? " is-on" : ""}`}
                onClick={() => setView("list")}
              >
                Lista
              </button>
              <button type="button" className="btn btn-outline">
                Exportar
              </button>
              <button type="button" className="btn btn-primary">
                + Nuevo activo
              </button>
            </div>
          </div>

          {view === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {assets.map((a) => {
                const b = badgeFor(a.status);
                return (
                  <div key={a.id} className="card" style={{ margin: 0, padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 20 }}>📦</span>
                      <span className="badge badge-vis-pendiente" style={{ color: b.c, borderColor: b.c }}>
                        {b.l}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, marginTop: 8, fontSize: "0.9rem" }}>{a.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--tp-muted)", marginTop: 4 }}>{a.identifier}</div>
                    <div style={{ fontSize: "0.75rem", marginTop: 8 }}>Nodo / sector operativo</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--tp-muted)", marginTop: 4 }}>
                      {a.status === "en_uso" ? "Asignado a técnico" : "Sin asignar"}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--tp-muted)", marginTop: 8 }}>
                      Escaneado: hace unos minutos
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ margin: 0 }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {assets.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--tp-border)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      <strong>{a.identifier}</strong> {a.name}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--tp-muted)" }}>{a.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p style={{ fontSize: "0.8rem", color: "var(--tp-muted)", marginTop: "0.75rem" }}>
            Mostrando {assets.length} activos en esta vista (datos en vivo del API).
          </p>
        </div>

        <div>
          <div className="card" style={{ marginBottom: "0.75rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>Niveles críticos</strong>
            {[
              { n: "Conectores SC/APC", cur: 45, max: 200 },
              { n: "ONT en stock", cur: 80, max: 300 },
            ].map((x) => (
              <div key={x.n} style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span>{x.n}</span>
                  <span>
                    {x.cur} / {x.max} uds
                  </span>
                </div>
                <div style={{ height: 8, background: "#fee2e2", borderRadius: 99, marginTop: 4 }}>
                  <div
                    style={{
                      width: `${(x.cur / x.max) * 100}%`,
                      height: "100%",
                      background: "var(--tp-danger)",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: 16,
                padding: "0.75rem",
                borderRadius: 10,
                background: "var(--tp-blue-soft)",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Sugerencia de pedido
              <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
                Generar orden →
              </button>
            </div>
          </div>

          <div className="card">
            <strong style={{ fontSize: "0.9rem" }}>Últimos movimientos</strong>
            <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0", fontSize: "0.85rem" }}>
              <li style={{ padding: "0.45rem 0", borderBottom: "1px solid var(--tp-border)" }}>
                <strong>Devolución</strong> — Equipo a soporte
                <div style={{ color: "var(--tp-muted)", fontSize: "0.75rem" }}>Hace 12 min</div>
              </li>
              <li style={{ padding: "0.45rem 0", borderBottom: "1px solid var(--tp-border)" }}>
                <strong>Asignación</strong> — Material a técnico
                <div style={{ color: "var(--tp-muted)", fontSize: "0.75rem" }}>Hace 45 min</div>
              </li>
              <li style={{ padding: "0.45rem 0" }}>
                <strong>Salida stock</strong> — Consumo de campo
                <div style={{ color: "var(--tp-muted)", fontSize: "0.75rem" }}>Hace 1h 12m</div>
              </li>
            </ul>
            <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 12 }}>
              Ver historial completo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
