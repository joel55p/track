from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class UserRoleOut(str, Enum):
    tecnico = "tecnico"
    supervisor = "supervisor"
    admin = "admin"
    gerente = "gerente"


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRoleOut

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class LoginBody(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str


class TaskPriorityOut(str, Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    urgente = "urgente"


class TaskStatusOut(str, Enum):
    pendiente = "pendiente"
    en_ruta = "en_ruta"
    en_servicio = "en_servicio"
    completada = "completada"
    retrasada = "retrasada"


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None
    address: str
    lat: float
    lng: float
    priority: TaskPriorityOut
    status: TaskStatusOut
    access_notes: str | None
    scheduled_window: str | None
    assigned_user_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    status: TaskStatusOut | None = None
    assigned_user_id: int | None = None


class AttendanceTypeOut(str, Enum):
    entrada = "entrada"
    salida = "salida"
    pausa_inicio = "pausa_inicio"
    pausa_fin = "pausa_fin"


class AttendanceCreate(BaseModel):
    kind: AttendanceTypeOut
    lat: float | None = None
    lng: float | None = None
    note: str | None = None


class AttendanceOut(BaseModel):
    id: int
    user_id: int
    kind: AttendanceTypeOut
    at: datetime
    lat: float | None
    lng: float | None
    note: str | None

    model_config = {"from_attributes": True}


class AssetTypeOut(str, Enum):
    vehiculo = "vehiculo"
    herramienta = "herramienta"


class AssetStatusOut(str, Enum):
    disponible = "disponible"
    en_uso = "en_uso"
    mantenimiento = "mantenimiento"


class AssetOut(BaseModel):
    id: int
    name: str
    kind: AssetTypeOut
    identifier: str
    status: AssetStatusOut

    model_config = {"from_attributes": True}


class CheckoutBody(BaseModel):
    asset_ids: list[int] = Field(default_factory=list)


class IncidentCreate(BaseModel):
    task_id: int | None = None
    asset_id: int | None = None
    description: str
    photo_url: str | None = None


class IncidentOut(BaseModel):
    id: int
    user_id: int
    task_id: int | None
    asset_id: int | None
    description: str
    photo_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TechnicianMapPoint(BaseModel):
    user_id: int
    full_name: str
    role: UserRoleOut
    lat: float
    lng: float
    status_label: str
    active_tasks: int


class DashboardStats(BaseModel):
    tecnicos_activos: int
    tareas_completadas_hoy: int
    tareas_pendientes: int
    alertas_abiertas: int


class AlertItem(BaseModel):
    task_id: int
    title: str
    technician_name: str | None
    reason: str
    priority: TaskPriorityOut
