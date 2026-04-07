"""Esquema inicial — Teleprogreso S.A.

Crea las tablas tal y como las define app/models.py del compañero,
para que Alembic y el create_all() de main.py queden sincronizados.

Tablas: users, tasks, attendances, assets, asset_usages, incidents

Revision ID: 0001
Revises: —
Create Date: 2026-04-07
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Tipos ENUM (deben crearse antes que las tablas que los usan) ───────
    userrole = sa.Enum(
        "tecnico", "supervisor", "admin", "gerente",
        name="userrole",
    )
    taskpriority = sa.Enum(
        "baja", "media", "alta", "urgente",
        name="taskpriority",
    )
    taskstatus = sa.Enum(
        "pendiente", "en_ruta", "en_servicio", "completada", "retrasada",
        name="taskstatus",
    )
    assettype = sa.Enum(
        "vehiculo", "herramienta",
        name="assettype",
    )
    assetstatus = sa.Enum(
        "disponible", "en_uso", "mantenimiento",
        name="assetstatus",
    )
    attendancetype = sa.Enum(
        "entrada", "salida", "pausa_inicio", "pausa_fin",
        name="attendancetype",
    )

    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",              sa.Integer(),     primary_key=True),
        sa.Column("email",           sa.String(255),   nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255),   nullable=False),
        sa.Column("full_name",       sa.String(255),   nullable=False),
        sa.Column("role",            userrole,          nullable=False, server_default="tecnico"),
        sa.Column("is_active",       sa.Boolean(),     nullable=False, server_default=sa.text("true")),
        sa.Column("last_lat",        sa.Float(),       nullable=True),
        sa.Column("last_lng",        sa.Float(),       nullable=True),
        sa.Column("current_load",    sa.Integer(),     nullable=False, server_default="0"),
    )
    op.create_index("ix_users_id",    "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── tasks ──────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id",               sa.Integer(),     primary_key=True),
        sa.Column("title",            sa.String(255),   nullable=False),
        sa.Column("description",      sa.Text(),        nullable=True),
        sa.Column("address",          sa.String(512),   nullable=False),
        sa.Column("lat",              sa.Float(),       nullable=False),
        sa.Column("lng",              sa.Float(),       nullable=False),
        sa.Column("priority",         taskpriority,     nullable=False, server_default="media"),
        sa.Column("status",           taskstatus,       nullable=False, server_default="pendiente"),
        sa.Column("access_notes",     sa.Text(),        nullable=True),
        sa.Column("scheduled_window", sa.String(128),   nullable=True),
        sa.Column(
            "assigned_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_tasks_id", "tasks", ["id"])

    # ── attendances ────────────────────────────────────────────────────────
    op.create_table(
        "attendances",
        sa.Column("id",      sa.Integer(),  primary_key=True),
        sa.Column("user_id", sa.Integer(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("kind",    attendancetype, nullable=False),
        sa.Column("at",      sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("lat",     sa.Float(),    nullable=True),
        sa.Column("lng",     sa.Float(),    nullable=True),
        sa.Column("note",    sa.String(512), nullable=True),
    )
    op.create_index("ix_attendances_id", "attendances", ["id"])

    # ── assets ─────────────────────────────────────────────────────────────
    op.create_table(
        "assets",
        sa.Column("id",         sa.Integer(),    primary_key=True),
        sa.Column("name",       sa.String(255),  nullable=False),
        sa.Column("kind",       assettype,       nullable=False),
        sa.Column("identifier", sa.String(64),   nullable=False, unique=True),
        sa.Column("status",     assetstatus,     nullable=False, server_default="disponible"),
    )
    op.create_index("ix_assets_id",         "assets", ["id"])
    op.create_index("ix_assets_identifier", "assets", ["identifier"], unique=True)

    # ── asset_usages ───────────────────────────────────────────────────────
    op.create_table(
        "asset_usages",
        sa.Column("id",         sa.Integer(),  primary_key=True),
        sa.Column("user_id",    sa.Integer(),  sa.ForeignKey("users.id"),  nullable=False),
        sa.Column("asset_id",   sa.Integer(),  sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("ended_at",   sa.DateTime(), nullable=True),
    )
    op.create_index("ix_asset_usages_id", "asset_usages", ["id"])

    # ── incidents ──────────────────────────────────────────────────────────
    op.create_table(
        "incidents",
        sa.Column("id",          sa.Integer(),   primary_key=True),
        sa.Column("user_id",     sa.Integer(),   sa.ForeignKey("users.id"),  nullable=False),
        sa.Column("task_id",     sa.Integer(),   sa.ForeignKey("tasks.id"),  nullable=True),
        sa.Column("asset_id",    sa.Integer(),   sa.ForeignKey("assets.id"), nullable=True),
        sa.Column("description", sa.Text(),      nullable=False),
        sa.Column("photo_url",   sa.String(512), nullable=True),
        sa.Column("created_at",  sa.DateTime(),  nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_incidents_id", "incidents", ["id"])


def downgrade() -> None:
    # Orden inverso respetando FK
    op.drop_table("incidents")
    op.drop_table("asset_usages")
    op.drop_table("assets")
    op.drop_table("attendances")
    op.drop_table("tasks")
    op.drop_table("users")

    # Eliminar tipos ENUM de PostgreSQL
    for enum_name in [
        "userrole", "taskpriority", "taskstatus",
        "assettype", "assetstatus", "attendancetype",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
