import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    tecnico = "tecnico"
    supervisor = "supervisor"
    admin = "admin"
    gerente = "gerente"


class TaskPriority(str, enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    urgente = "urgente"


class TaskStatus(str, enum.Enum):
    pendiente = "pendiente"
    en_ruta = "en_ruta"
    en_servicio = "en_servicio"
    completada = "completada"
    retrasada = "retrasada"


class AssetType(str, enum.Enum):
    vehiculo = "vehiculo"
    herramienta = "herramienta"


class AssetStatus(str, enum.Enum):
    disponible = "disponible"
    en_uso = "en_uso"
    mantenimiento = "mantenimiento"


class AttendanceType(str, enum.Enum):
    entrada = "entrada"
    salida = "salida"
    pausa_inicio = "pausa_inicio"
    pausa_fin = "pausa_fin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.tecnico)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_load: Mapped[int] = mapped_column(Integer, default=0)

    tasks: Mapped[list["Task"]] = relationship(back_populates="assignee")
    attendances: Mapped[list["Attendance"]] = relationship(back_populates="user")
    asset_usages: Mapped[list["AssetUsage"]] = relationship(back_populates="user")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str] = mapped_column(String(512))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.media
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.pendiente
    )
    access_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_window: Mapped[str | None] = mapped_column(String(128), nullable=True)
    assigned_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    assignee: Mapped["User | None"] = relationship(back_populates="tasks")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="task")


class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[AttendanceType] = mapped_column(Enum(AttendanceType))
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(String(512), nullable=True)

    user: Mapped["User"] = relationship(back_populates="attendances")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    kind: Mapped[AssetType] = mapped_column(Enum(AssetType))
    identifier: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus), default=AssetStatus.disponible
    )

    usages: Mapped[list["AssetUsage"]] = relationship(back_populates="asset")


class AssetUsage(Base):
    __tablename__ = "asset_usages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="asset_usages")
    asset: Mapped["Asset"] = relationship(back_populates="usages")


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"), nullable=True)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task | None"] = relationship(back_populates="incidents")
