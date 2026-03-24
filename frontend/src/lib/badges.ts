import type { Task } from "@/api/types";

export function priorityBadgeClass(p: Task["priority"]) {
  switch (p) {
    case "urgente":
      return "badge badge-urgente";
    case "alta":
      return "badge badge-alta";
    case "media":
      return "badge badge-media";
    default:
      return "badge badge-baja";
  }
}

export function statusBadgeClass(s: Task["status"]) {
  return `badge badge-status-${s}`;
}

export function statusLabel(s: Task["status"]) {
  const m: Record<Task["status"], string> = {
    pendiente: "Pendiente",
    en_ruta: "En ruta",
    en_servicio: "En servicio",
    completada: "Completada",
    retrasada: "Retrasada",
  };
  return m[s];
}
