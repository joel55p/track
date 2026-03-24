from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Attendance, AttendanceType, User, UserRole
from app.schemas import AttendanceCreate, AttendanceOut

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("", response_model=AttendanceOut)
def register_attendance(
    body: AttendanceCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    if user.role != UserRole.tecnico:
        pass
    row = Attendance(
        user_id=user.id,
        kind=AttendanceType(body.kind.value),
        lat=body.lat,
        lng=body.lng,
        note=body.note,
    )
    if body.lat is not None and body.lng is not None:
        user.last_lat = body.lat
        user.last_lng = body.lng
        db.add(user)
    db.add(row)
    db.commit()
    db.refresh(row)
    return AttendanceOut.model_validate(row)


@router.get("/me", response_model=list[AttendanceOut])
def my_history(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    limit: int = 50,
):
    rows = (
        db.query(Attendance)
        .filter(Attendance.user_id == user.id)
        .order_by(Attendance.at.desc())
        .limit(limit)
        .all()
    )
    return [AttendanceOut.model_validate(r) for r in rows]
