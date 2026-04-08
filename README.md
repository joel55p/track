# Teleprogreso Track

Aplicación web (PWA) para **supervisión de personal y gestión de activos** de **Teleprogreso S.A.**, alineada al **Corte 3** del curso (requisitos funcionales, roles técnico / supervisor) y a las tecnologías definidas en la presentación del proyecto: **FastAPI**, **React**, **PostgreSQL** (opcional) y **PWA**.

Las **8 pantallas** del flujo (4 técnico + 4 supervisor) corresponden a las rutas de la app; el diseño visual detallado está en [Visily](https://app.visily.ai/projects/1d2ca634-3e11-485e-90ce-153cfd9e3cbe/boards/2526019).

---

## Qué necesita cada persona (requisitos)

| Herramienta | Para qué | Notas |
|-------------|----------|--------|
| **Git** | Clonar el repositorio | Cualquier versión reciente. |
| **Python 3.11+** | Backend (FastAPI) | En Windows suele usarse `py -3` o `python`. |
| **Node.js 20+ y npm** | Frontend (React + Vite) | Si `npm` no se reconoce, instalar Node LTS desde [nodejs.org](https://nodejs.org) y **reabrir** la terminal. |
| **Docker Desktop** (opcional) | Solo si quieren **PostgreSQL** en lugar de SQLite | No es obligatorio para probar el proyecto. |

**No hace falta** instalar PostgreSQL a mano si usan la opción por defecto (**SQLite**): se crea el archivo `backend/teleprogreso.db` al correr el seed.

---

## Si compartes el repo: qué deben hacer (paso a paso)

Necesitan **dos terminales** abiertas a la vez: una para el **backend** y otra para el **frontend**.

### 1) Clonar e ir al proyecto

```bash
git clone <url-de-tu-repo>.git
cd track
```

### 2) Backend (terminal 1)

**Windows (PowerShell o CMD):**

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
py -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Dejan esta terminal **abierta** mientras prueban la app.
- La API queda en **http://127.0.0.1:8000** (documentación: **http://127.0.0.1:8000/docs**).

**Nota Windows:** si `Activate.ps1` abre el Bloc de notas, usen **`activate.bat`** como arriba.

### 3) Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

- Abrir en el navegador: **http://localhost:5173**
- El frontend envía `/api` al backend por el proxy de Vite → **el backend debe estar corriendo** en el puerto 8000.

### 4) Entrar a la aplicación

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Técnico | `tecnico@demo.tp` | `demo123` |
| Técnico 2 | `tecnico2@demo.tp` | `demo123` |
| Supervisor | `supervisor@demo.tp` | `demo123` |

---

## Base de datos: SQLite (por defecto) vs PostgreSQL

- **Por defecto** (`backend/.env` copiado de `.env.example`): **SQLite** → archivo `backend/teleprogreso.db`. No requiere Docker.
- **PostgreSQL:** `docker compose up -d` en la raíz del repo, y en `backend/.env` usar la línea comentada de `DATABASE_URL` con Postgres (ver `.env.example`).

---

## Estructura del repo

- `backend/` — API REST (FastAPI).
- `frontend/` — React + TypeScript + Vite + PWA.
- `docker-compose.yml` — PostgreSQL 16 (opcional).

## Pantallas

**Técnico:** Mi ruta · Mapa / Navegación · Pausas / Asistencia · Equipo / Activos.  
**Supervisor:** Dashboard · Alertas · Reasignar · Inventario.  
**Login** común con redirección por rol.

## Producción

- Definir `SECRET_KEY` y CORS en el backend.
- `npm run build` en `frontend/` y servir `dist/` detrás de HTTPS para PWA y geolocalización fiable.
