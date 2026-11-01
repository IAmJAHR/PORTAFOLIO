# =========================================================================
# Dockerfile para Portafolio Web - Juan Abel Huaman
# Servidor web ultra-ligero de alto rendimiento con Nginx Alpine
# =========================================================================

FROM nginx:alpine

# Metadata
LABEL maintainer="Juan Abel Huaman <juandavidhr11@gmail.com>"
LABEL description="Portafolio Web y Simulador Mototaxi 3D"

# Eliminar configuración por defecto de Nginx
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copiar configuración personalizada optimizada con MIME types y Gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar todos los archivos web al directorio de Nginx
COPY index.html /usr/share/nginx/html/
COPY game.html /usr/share/nginx/html/
COPY mototaxi.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY dist/ /usr/share/nginx/html/dist/
COPY image/ /usr/share/nginx/html/image/
COPY modelos/ /usr/share/nginx/html/modelos/

# Puerto estándar HTTP
EXPOSE 80

# Iniciar servidor Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
