from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Task, TaskStatus, User, UserRole
from app.schemas import TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _can_supervise(user: User) -> bool:
    return user.role in (UserRole.supervisor, UserRole.admin, UserRole.gerente)


@router.get("", response_model=list[TaskOut])
def list_tasks(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    q = db.query(Task)
    if user.role == UserRole.tecnico:
        q = q.filter(Task.assigned_user_id == user.id)
    return [TaskOut.model_validate(t) for t in q.order_by(Task.id).all()]


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    body: TaskUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if user.role == UserRole.tecnico:
        if task.assigned_user_id != user.id:
            raise HTTPException(status_code=403, detail="No asignada a usted")
        if body.assigned_user_id is not None:
            raise HTTPException(status_code=403, detail="No puede reasignar")

    if body.status is not None:
        task.status = TaskStatus(body.status.value)
        if body.status.value in ("en_ruta", "en_servicio"):
            user.last_lat = task.lat
            user.last_lng = task.lng
            db.add(user)

    if body.assigned_user_id is not None:
        if not _can_supervise(user):
            raise HTTPException(status_code=403, detail="Solo supervisor")
        other = db.query(User).filter(User.id == body.assigned_user_id).first()
        if not other or other.role != UserRole.tecnico:
            raise HTTPException(status_code=400, detail="Técnico inválido")
        task.assigned_user_id = body.assigned_user_id

    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)
