# ── Teleprogreso S.A. — Backend (FastAPI + SQLAlchemy sync) ──────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias del sistema para psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# El comando final lo define docker-compose (incluye alembic upgrade head)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
