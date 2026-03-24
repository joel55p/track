# Teleprogreso Track

Aplicación web (PWA) para **supervisión de personal y gestión de activos** de **Teleprogreso S.A.**, alineada al **Corte 3** del curso (requisitos funcionales, roles técnico / supervisor) y a las tecnologías definidas en la presentación del proyecto: **FastAPI**, **React**, **PostgreSQL** y **PWA**.

Las **8 pantallas** del flujo (4 técnico + 4 supervisor) corresponden a las rutas de la app; el diseño visual detallado está en [Visily](https://app.visily.ai/projects/1d2ca634-3e11-485e-90ce-153cfd9e3cbe/boards/2526019) — aquí se implementan los mismos flujos y prioridades de UX descritas en el informe (prioridades de tarea, checklist de activos, métricas en dashboard, mapa con identificación de técnicos, reasignación por carga, etc.).

## Estructura

- `backend/` — API REST con FastAPI (auth JWT, tareas, asistencia, activos, supervisión).
- `frontend/` — React + TypeScript + Vite + `vite-plugin-pwa`.
- `docker-compose.yml` — PostgreSQL 16 para desarrollo.

## Requisitos

- Python 3.11+ (probado con 3.13).
- Node.js 20+ y npm (para el frontend).
- Docker (opcional, recomendado para PostgreSQL).

## Base de datos

```bash
docker compose up -d
```

Copie `backend/.env.example` a `backend/.env` y ajuste `DATABASE_URL` si es necesario. Por defecto apunta a `localhost:5432` con usuario/clave `teleprogreso`.

## Backend

```bash
cd backend
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
py -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Documentación interactiva: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173). Las peticiones a `/api` se reenvían al backend por el proxy de Vite.

## Usuarios de demostración

| Rol        | Correo               | Contraseña |
|-----------|----------------------|------------|
| Técnico   | `tecnico@demo.tp`    | `demo123`  |
| Técnico 2 | `tecnico2@demo.tp`   | `demo123`  |
| Supervisor| `supervisor@demo.tp` | `demo123`  |

## Pantallas implementadas

**Técnico:** Mi ruta diaria · Mapa de ruta · Pausas y asistencia · Inventario y vehículo (checklist + incidencias).

**Supervisor:** Dashboard (métricas + mapa) · Alertas y retrasos · Reasignar servicios · Activos en tiempo real (filtros y bloques por tipo).

**Login:** pantalla de acceso común con redirección según rol.

## Producción

- Configurar `SECRET_KEY` y CORS en el backend.
- `npm run build` en `frontend/` y servir `dist/` detrás de HTTPS para habilitar PWA y geolocalización de forma fiable.
