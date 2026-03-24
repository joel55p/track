import type { Task } from "@/api/types";

const types = ["Reparación", "Instalación", "Mantenimiento"] as const;

export function inferJobType(task: Task): (typeof types)[number] {
  const t = `${task.title} ${task.description ?? ""}`.toLowerCase();
  if (t.includes("instal")) return "Instalación";
  if (t.includes("manten") || t.includes("nodo") || t.includes("prevent")) return "Mantenimiento";
  if (t.includes("repar") || t.includes("falla") || t.includes("señal")) return "Reparación";
  const h = task.id % 3;
  return types[h];
}

export function etaForStop(index: number, task: Task): string {
  if (task.scheduled_window && /^\d{1,2}:\d{2}/.test(task.scheduled_window.trim())) {
    const m = task.scheduled_window.match(/(\d{1,2}:\d{2})/);
    if (m) return m[1].padStart(5, "0");
  }
  const base = 8 * 60 + 30 + index * 75;
  const h = Math.floor(base / 60);
  const m = base % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function clientLabel(task: Task): string {
  const t = task.title.replace(/^.+—\s*/, "").replace(/^.+-\s*/, "");
  if (t.length > 2) return t;
  return task.title;
}
