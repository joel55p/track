from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user, require_roles
from app.models import Task, TaskStatus, User, UserRole
from app.schemas import (
    AlertItem,
    DashboardStats,
    TaskOut,
    TaskPriorityOut,
    TechnicianMapPoint,
    UserPublic,
)

router = APIRouter(prefix="/supervision", tags=["supervision"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.supervisor, UserRole.admin, UserRole.gerente))],
):
    tecnicos = (
        db.query(User).filter(User.role == UserRole.tecnico, User.is_active.is_(True)).all()
    )
    activos = sum(
        1
        for t in tecnicos
        if t.last_lat is not None
        and db.query(Task)
        .filter(
            Task.assigned_user_id == t.id,
            Task.status.in_([TaskStatus.en_ruta, TaskStatus.en_servicio]),
        )
        .count()
        > 0
    )
    completadas = db.query(Task).filter(Task.status == TaskStatus.completada).count()
    pendientes = db.query(Task).filter(Task.status == TaskStatus.pendiente).count()
    alertas = db.query(Task).filter(Task.status == TaskStatus.retrasada).count()
    return DashboardStats(
        tecnicos_activos=activos or len(tecnicos),
        tareas_completadas_hoy=completadas,
        tareas_pendientes=pendientes,
        alertas_abiertas=alertas,
    )


@router.get("/map", response_model=list[TechnicianMapPoint])
def map_points(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.supervisor, UserRole.admin, UserRole.gerente))],
):
    techs = db.query(User).filter(User.role == UserRole.tecnico).all()
    points: list[TechnicianMapPoint] = []
    fraijanes_lat, fraijanes_lng = 14.4653, -90.4418
    for t in techs:
        lat = t.last_lat if t.last_lat is not None else fraijanes_lat + (t.id % 5) * 0.01
        lng = t.last_lng if t.last_lng is not None else fraijanes_lng + (t.id % 3) * 0.01
        active = (
            db.query(Task)
            .filter(
                Task.assigned_user_id == t.id,
                Task.status.in_([TaskStatus.en_ruta, TaskStatus.en_servicio]),
            )
            .count()
        )
        pending = (
            db.query(Task)
            .filter(
                Task.assigned_user_id == t.id,
                Task.status == TaskStatus.pendiente,
            )
            .count()
        )
        if active > 0:
            label = "En servicio"
        elif pending > 0:
            label = "En ruta / pendiente"
        else:
            label = "Disponible"
        points.append(
            TechnicianMapPoint(
                user_id=t.id,
                full_name=t.full_name,
                role=UserPublic.model_validate(t).role,
                lat=lat,
                lng=lng,
                status_label=label,
                active_tasks=active + pending,
            )
        )
    return points


@router.get("/alerts", response_model=list[AlertItem])
def alerts(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.supervisor, UserRole.admin, UserRole.gerente))],
):
    delayed = (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.status == TaskStatus.retrasada)
        .all()
    )
    items: list[AlertItem] = []
    for task in delayed:
        tech_name = None
        if task.assignee:
            tech_name = task.assignee.full_name
        items.append(
            AlertItem(
                task_id=task.id,
                title=task.title,
                technician_name=tech_name,
                reason="Servicio marcado como retrasado o fuera de ventana",
                priority=TaskPriorityOut(task.priority.value),
            )
        )
    return items


@router.get("/technicians-for-assign", response_model=list[UserPublic])
def technicians_for_assign(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.supervisor, UserRole.admin, UserRole.gerente))],
):
    techs = db.query(User).filter(User.role == UserRole.tecnico, User.is_active.is_(True)).all()
    loads = []
    for t in techs:
        n = (
            db.query(func.count(Task.id))
            .filter(
                Task.assigned_user_id == t.id,
                Task.status.notin_([TaskStatus.completada]),
            )
            .scalar()
        )
        loads.append((t, int(n or 0)))
    loads.sort(key=lambda x: x[1])
    return [UserPublic.model_validate(u) for u, _ in loads]


@router.get("/tasks-all", response_model=list[TaskOut])
def all_tasks(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.supervisor, UserRole.admin, UserRole.gerente))],
):
    tasks = db.query(Task).order_by(Task.priority.desc(), Task.id).all()
    return [TaskOut.model_validate(t) for t in tasks]
