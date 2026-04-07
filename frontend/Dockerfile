# ── Teleprogreso S.A. — Frontend (React + Vite + PWA) ────────────────────

# ── Etapa: Desarrollo ─────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# BACKEND_URL se inyecta desde docker-compose para el proxy de Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ── Etapa: Build de producción ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ── Etapa: Producción (Nginx + proxy a backend) ───────────────────────────
FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx proxea /api al contenedor backend en la misma red Docker
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
