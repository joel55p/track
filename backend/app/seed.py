"""
Ejecutar una vez con la base de datos levantada:
  cd backend && python -m app.seed
"""

from app.database import SessionLocal, engine, Base
from app.models import (
    Asset,
    AssetStatus,
    AssetType,
    Task,
    TaskPriority,
    TaskStatus,
    User,
    UserRole,
)
from app.security import hash_password


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "supervisor@demo.tp").first():
            print("Seed ya aplicado.")
            return

        tech1 = User(
            email="tecnico@demo.tp",
            hashed_password=hash_password("demo123"),
            full_name="Carlos Técnico",
            role=UserRole.tecnico,
            last_lat=14.47,
            last_lng=-90.44,
        )
        tech2 = User(
            email="tecnico2@demo.tp",
            hashed_password=hash_password("demo123"),
            full_name="Ana Campo",
            role=UserRole.tecnico,
            last_lat=14.46,
            last_lng=-90.43,
        )
        sup = User(
            email="supervisor@demo.tp",
            hashed_password=hash_password("demo123"),
            full_name="Luis Supervisor",
            role=UserRole.supervisor,
        )
        db.add_all([tech1, tech2, sup])
        db.flush()

        tasks = [
            Task(
                title="Instalación fibra — Zona 1",
                description="Nuevo cliente residencial",
                address="Fraijanes, km 18.5, Condominio Los Pinos",
                lat=14.468,
                lng=-90.442,
                priority=TaskPriority.urgente,
                status=TaskStatus.pendiente,
                access_notes="Portón eléctrico, timbre 2B. Perro en patio.",
                scheduled_window="08:00–10:00",
                assigned_user_id=tech1.id,
            ),
            Task(
                title="Reparación señal TV",
                description="Canales pixelados",
                address="Santa Catarina Pinula, Calle Principal 4-12",
                lat=14.493,
                lng=-90.399,
                priority=TaskPriority.media,
                status=TaskStatus.en_servicio,
                access_notes="Coordinar con portero.",
                scheduled_window="10:00–12:00",
                assigned_user_id=tech1.id,
            ),
            Task(
                title="Recuperación equipo",
                description="Retiro de modem y decodificador",
                address="Villa Nueva, Col. El Milagro",
                lat=14.526,
                lng=-90.596,
                priority=TaskPriority.alta,
                status=TaskStatus.retrasada,
                access_notes="Cliente canceló servicio.",
                scheduled_window="Ayer 14:00",
                assigned_user_id=tech2.id,
            ),
            Task(
                title="Mantenimiento nodo",
                description="Revisión preventiva",
                address="Carretera a El Salvador, km 12",
                lat=14.455,
                lng=-90.382,
                priority=TaskPriority.baja,
                status=TaskStatus.completada,
                access_notes=None,
                scheduled_window="07:00–08:00",
                assigned_user_id=tech2.id,
            ),
        ]
        db.add_all(tasks)

        assets = [
            Asset(
                name="Pickup Toyota Hilux",
                kind=AssetType.vehiculo,
                identifier="VEH-001",
                status=AssetStatus.disponible,
            ),
            Asset(
                name="Camioneta Nissan",
                kind=AssetType.vehiculo,
                identifier="VEH-002",
                status=AssetStatus.en_uso,
            ),
            Asset(
                name="Fusionadora de fibra",
                kind=AssetType.herramienta,
                identifier="HF-100",
                status=AssetStatus.disponible,
            ),
            Asset(
                name="OTDR",
                kind=AssetType.herramienta,
                identifier="HF-101",
                status=AssetStatus.disponible,
            ),
            Asset(
                name="Escalera extensible 6m",
                kind=AssetType.herramienta,
                identifier="HF-205",
                status=AssetStatus.disponible,
            ),
            Asset(
                name="Juego herramientas campo",
                kind=AssetType.herramienta,
                identifier="HF-300",
                status=AssetStatus.disponible,
            ),
        ]
        db.add_all(assets)
        db.commit()
        print("Seed OK. Usuarios demo:")
        print("  tecnico@demo.tp / demo123")
        print("  tecnico2@demo.tp / demo123")
        print("  supervisor@demo.tp / demo123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
