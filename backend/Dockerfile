FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Limpiar cache de npm y generar package-lock.json
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json

# Instalar dependencias y generar nuevo lock file
RUN npm install --only=production && npm cache clean --force

# Copiar el resto de la aplicación
COPY . .

# Asegurarse de que el directorio migrations existe y se copia
COPY migrations/ ./migrations/

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar propiedad de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
