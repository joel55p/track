import type { AttendanceRow } from "@/api/types";

function isToday(d: Date) {
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export interface TimerSnapshot {
  activeSeconds: number;
  pauseSeconds: number;
  inPause: boolean;
  finished: boolean;
  hasEntrada: boolean;
}

function walk(
  entradaMs: number,
  events: AttendanceRow[],
  endMs: number,
): { activeSec: number; pauseSec: number; endsInPause: boolean } {
  let active = 0;
  let pause = 0;
  let cursor = entradaMs;
  let mode: "work" | "pause" = "work";

  for (const r of events) {
    const t = new Date(r.at).getTime();
    if (t > endMs) break;
    if (r.kind === "pausa_inicio") {
      if (mode === "work") active += (t - cursor) / 1000;
      mode = "pause";
      cursor = t;
    } else if (r.kind === "pausa_fin") {
      if (mode === "pause") pause += (t - cursor) / 1000;
      mode = "work";
      cursor = t;
    } else if (r.kind === "salida") {
      if (mode === "work") active += (t - cursor) / 1000;
      else pause += (t - cursor) / 1000;
      return { activeSec: active, pauseSec: pause, endsInPause: false };
    }
  }

  if (mode === "work") active += (endMs - cursor) / 1000;
  else pause += (endMs - cursor) / 1000;

  return { activeSec: active, pauseSec: pause, endsInPause: mode === "pause" };
}

export function computeTimer(rows: AttendanceRow[], now = new Date()): TimerSnapshot {
  const today = [...rows]
    .filter((r) => isToday(new Date(r.at)))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const entradaIdx = today.findIndex((r) => r.kind === "entrada");
  if (entradaIdx < 0) {
    return {
      activeSeconds: 0,
      pauseSeconds: 0,
      inPause: false,
      finished: false,
      hasEntrada: false,
    };
  }

  const after = today.slice(entradaIdx);
  const entradaMs = new Date(after[0].at).getTime();
  const inner = after.slice(1);
  const salida = inner.find((r) => r.kind === "salida");

  if (salida) {
    const endMs = new Date(salida.at).getTime();
    const ev = inner.filter((r) => new Date(r.at).getTime() <= endMs);
    const { activeSec, pauseSec } = walk(entradaMs, ev, endMs);
    return {
      activeSeconds: Math.max(0, Math.round(activeSec)),
      pauseSeconds: Math.max(0, Math.round(pauseSec)),
      inPause: false,
      finished: true,
      hasEntrada: true,
    };
  }

  const endMs = now.getTime();
  const { activeSec, pauseSec, endsInPause } = walk(entradaMs, inner, endMs);
  return {
    activeSeconds: Math.max(0, Math.round(activeSec)),
    pauseSeconds: Math.max(0, Math.round(pauseSec)),
    inPause: endsInPause,
    finished: false,
    hasEntrada: true,
  };
}

export function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
