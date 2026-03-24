export type UserRole = "tecnico" | "supervisor" | "admin" | "gerente";

export interface UserPublic {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  priority: "baja" | "media" | "alta" | "urgente";
  status: "pendiente" | "en_ruta" | "en_servicio" | "completada" | "retrasada";
  access_notes: string | null;
  scheduled_window: string | null;
  assigned_user_id: number | null;
  created_at: string;
}

export interface AttendanceRow {
  id: number;
  user_id: number;
  kind: "entrada" | "salida" | "pausa_inicio" | "pausa_fin";
  at: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
}

export interface Asset {
  id: number;
  name: string;
  kind: "vehiculo" | "herramienta";
  identifier: string;
  status: "disponible" | "en_uso" | "mantenimiento";
}

export interface DashboardStats {
  tecnicos_activos: number;
  tareas_completadas_hoy: number;
  tareas_pendientes: number;
  alertas_abiertas: number;
}

export interface MapPoint {
  user_id: number;
  full_name: string;
  role: UserRole;
  lat: number;
  lng: number;
  status_label: string;
  active_tasks: number;
}

export interface AlertItem {
  task_id: number;
  title: string;
  technician_name: string | null;
  reason: string;
  priority: Task["priority"];
}
