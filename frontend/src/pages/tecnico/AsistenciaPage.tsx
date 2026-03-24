import { useCallback, useEffect, useMemo, useState } from "react";
import client from "@/api/client";
import type { AttendanceRow } from "@/api/types";
import { computeTimer, formatHMS } from "@/lib/attendanceTimer";

type Kind = AttendanceRow["kind"];

const labels: Record<Kind, string> = {
  entrada: "Entrada",
  salida: "Salida",
  pausa_inicio: "Inicio de pausa",
  pausa_fin: "Fin de pausa",
};

export default function AsistenciaPage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [tick, setTick] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await client.get<AttendanceRow[]>("/api/attendance/me");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch(() => setErr("No se pudo cargar el historial."));
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const snap = useMemo(() => computeTimer(rows, new Date()), [rows, tick]);

  async function register(kind: Kind) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      await new Promise<void>((resolve) => {
        if (!navigator.geolocation) {
          resolve();
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 8000 },
        );
      });
      await client.post("/api/attendance", { kind, lat, lng });
      setMsg(`Registrado: ${labels[kind]}`);
      await load();
    } catch {
      setErr("No se pudo registrar. Intente de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function onPauseTap() {
    if (snap.inPause) await register("pausa_fin");
    else await register("pausa_inicio");
  }

  const todayStr = new Date().toLocaleDateString("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayRows = rows.filter((r) => {
    const d = new Date(r.at);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });

  return (
    <>
      <div className="timer-hero">
        <span className="tag">Jornada de hoy: {todayStr}</span>
        <div className="timer-ring">
          <span className="lbl">TIEMPO ACTIVO</span>
          <span className="time">{formatHMS(snap.activeSeconds)}</span>
        </div>
        <p style={{ margin: "0 1.5rem", fontSize: "0.85rem", color: "var(--tp-muted)" }}>
          Registra tus pausas obligatorias para cumplir con la normativa operativa de Teleprogreso.
        </p>
        <button
          type="button"
          className="tp-pause-fab"
          disabled={busy || snap.finished || !snap.hasEntrada}
          onClick={() => onPauseTap()}
        >
          <span aria-hidden>☕</span>
          {snap.inPause ? "REANUDAR" : "PAUSAR"}
        </button>
      </div>

      <div className="tp-mini-cards">
        <div className="tp-mini-card">
          <div className="ic">⚡</div>
          <div className="lbl">PRODUCTIVIDAD</div>
          <div className="val">{snap.hasEntrada ? "92%" : "—"}</div>
        </div>
        <div className="tp-mini-card">
          <div className="ic">⏱</div>
          <div className="lbl">EN PAUSA</div>
          <div className="val">{formatHMS(snap.pauseSeconds)}</div>
        </div>
      </div>

      {!snap.hasEntrada ? (
        <div style={{ padding: "0 1rem" }}>
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => register("entrada")}>
            Iniciar jornada (entrada)
          </button>
        </div>
      ) : null}

      <div className="tp-history-head">
        <span>Historial de hoy</span>
        <a href="#" onClick={(e) => e.preventDefault()}>
          Ver todo
        </a>
      </div>
      <div className="card" style={{ margin: "0 1rem 0.75rem" }}>
        {todayRows.length === 0 ? (
          <p style={{ color: "var(--tp-muted)", margin: 0, fontSize: "0.9rem" }}>Sin eventos aún hoy.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem" }}>
            {todayRows.map((r) => (
              <li
                key={r.id}
                style={{
                  padding: "0.55rem 0",
                  borderBottom: "1px solid var(--tp-border)",
                }}
              >
                <strong>{labels[r.kind]}</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--tp-muted)" }}>
                  {new Date(r.at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </div>
              </li>
            ))}
          </ul>
        )}
        {msg ? <p style={{ color: "var(--tp-success)", marginTop: "0.65rem", fontSize: "0.85rem" }}>{msg}</p> : null}
        {err ? <p className="error">{err}</p> : null}
      </div>

      <div style={{ padding: "0 1rem 1rem" }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={busy || !snap.hasEntrada || snap.finished}
          onClick={() => register("salida")}
        >
          ✓ Guardar y finalizar jornada
        </button>
        <p style={{ fontSize: "0.7rem", color: "var(--tp-muted)", textAlign: "center", marginTop: "0.5rem" }}>
          Al finalizar, tu ubicación y estado se actualizarán en el panel de supervisión.
        </p>
      </div>
    </>
  );
}
