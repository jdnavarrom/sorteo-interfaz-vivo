# Etapa 1: Compilar la aplicación Angular
FROM node:20 as build-stage

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Configurar el servidor Node.js y Apache
FROM node:20

WORKDIR /app

# Copiar archivos compilados
COPY --from=build-stage /app /app

# Instalar Apache
RUN apt-get update && apt-get install -y apache2

# Copiar configuración personalizada de Apache
COPY apache.conf /etc/apache2/sites-available/000-default.conf

# ✅ Habilitar módulos necesarios
RUN a2enmod rewrite headers proxy proxy_http

# Exponer puerto HTTP
EXPOSE 80

# Iniciar Node.js y Apache en paralelo
CMD ["sh", "-c", "node dist/sorteo-interfz-vivo/server/server.mjs & apachectl -D FOREGROUND"]
