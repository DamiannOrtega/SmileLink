# ==============================================================================
# Dockerfile - SmileLink Frontend (React + Vite + TypeScript)
# Multi-stage build para producción
# ==============================================================================

# Etapa 1: Compilación de la aplicación
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero NGINX para servir los archivos compilados
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
