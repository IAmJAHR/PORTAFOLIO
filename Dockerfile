# =========================================================================
# Dockerfile para Portafolio Web & API de Base de Datos - Juan Abel Huaman
# Node.js 20 Alpine + Express + PostgreSQL Client (pg)
# =========================================================================

FROM node:20-alpine

WORKDIR /app

# Copiar e instalar dependencias de producción
COPY package.json ./
RUN npm install --production

# Copiar todo el código y assets estáticos
COPY server.js ./
COPY index.html ./
COPY game.html ./
COPY mototaxi.html ./
COPY chat.html ./
COPY michi.html ./
COPY michi/ ./michi/
COPY routes/ ./routes/
COPY css/ ./css/
COPY dist/ ./dist/
COPY image/ ./image/
COPY modelos/ ./modelos/

# Puerto estándar HTTP
EXPOSE 80

ENV NODE_ENV=production
ENV PORT=80

# Iniciar servidor Node.js
CMD ["node", "server.js"]
