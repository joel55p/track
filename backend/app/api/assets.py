from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Asset, AssetStatus, AssetUsage, Incident, User, UserRole
from app.schemas import AssetOut, CheckoutBody, IncidentCreate, IncidentOut

router = APIRouter(tags=["assets"])


@router.get("/assets", response_model=list[AssetOut])
def list_assets(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    kind: str | None = None,
    q: str | None = None,
):
    query = db.query(Asset)
    if kind in ("vehiculo", "herramienta"):
        from app.models import AssetType

        query = query.filter(Asset.kind == AssetType(kind))
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Asset.name.ilike(like)) | (Asset.identifier.ilike(like))
        )
    return [AssetOut.model_validate(a) for a in query.order_by(Asset.kind, Asset.name).all()]


@router.post("/assets/checkout", response_model=list[AssetOut])
def checkout_assets(
    body: CheckoutBody,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    if user.role != UserRole.tecnico:
        raise HTTPException(status_code=403, detail="Solo técnicos registran salida de activos")
    out: list[Asset] = []
    for aid in body.asset_ids:
        asset = db.query(Asset).filter(Asset.id == aid).first()
        if not asset:
            continue
        if asset.status != AssetStatus.disponible:
            continue
        asset.status = AssetStatus.en_uso
        db.add(
            AssetUsage(user_id=user.id, asset_id=asset.id, ended_at=None)
        )
        db.add(asset)
        out.append(asset)
    db.commit()
    for a in out:
        db.refresh(a)
    return [AssetOut.model_validate(a) for a in out]


@router.post("/incidents", response_model=IncidentOut)
def create_incident(
    body: IncidentCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    inc = Incident(
        user_id=user.id,
        task_id=body.task_id,
        asset_id=body.asset_id,
        description=body.description,
        photo_url=body.photo_url,
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return IncidentOut.model_validate(inc)
