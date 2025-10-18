# Comandos para Desplegar Cambios en Producción

Este documento describe los comandos utilizados para desplegar cambios en el servidor de producción (64.227.96.34).

## 1. Conectarse al Servidor

```bash
ssh root@64.227.96.34
```

## 2. Configurar Git Safe Directory (solo la primera vez)

```bash
git config --global --add safe.directory /var/www/devocionales4.0
```

## 3. Actualizar Código desde el Repositorio

```bash
cd /var/www/devocionales4.0
git pull
```

## 4. Ejecutar Migraciones de Prisma

```bash
cd /var/www/devocionales4.0/packages/backend
DATABASE_URL="postgresql://devocionales:I2xLLTLI2icagcsXO5JsjW4fLmtOWcJ62e4tpPnaSOM=@localhost:5432/devocionales_prod" pnpm prisma migrate deploy
```

## 5. Reconstruir el Frontend

```bash
cd /var/www/devocionales4.0/packages/web
pnpm vite build
```

## 6. Reiniciar el Backend con PM2

### Opción A: Si PM2 ya está corriendo
```bash
pm2 restart devocionales-api
```

### Opción B: Si PM2 no está corriendo
```bash
cd /var/www/devocionales4.0
pm2 start ecosystem.config.js --env production
pm2 save
```

## 7. Verificar el Estado del Despliegue

### Ver estado de PM2
```bash
pm2 list
```

### Ver logs del backend
```bash
pm2 logs devocionales-api --lines 20
```

### Probar el endpoint GraphQL
```bash
curl -s http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query": "{__typename}"}'
```

## Comandos de Resolución de Problemas

### Si el puerto 4000 está ocupado

```bash
# Ver qué está usando el puerto
lsof -i :4000

# Detener PM2 y limpiar procesos
pm2 delete all
killall -9 node

# Reiniciar PM2
cd /var/www/devocionales4.0
pm2 start ecosystem.config.js --env production
pm2 save
```

### Si PM2 no se inicia automáticamente al reiniciar el servidor

```bash
pm2 startup
pm2 save
```

## Flujo Completo de Despliegue (Desde tu Computadora Local)

```bash
# 1. Hacer commit de cambios localmente
git add .
git commit -m "Descripción de los cambios"
git push

# 2. Conectarse al servidor y desplegar
ssh root@64.227.96.34 'cd /var/www/devocionales4.0 && git pull'

# 3. Ejecutar migraciones si hay cambios en la base de datos
ssh root@64.227.96.34 'cd /var/www/devocionales4.0/packages/backend && DATABASE_URL="postgresql://devocionales:I2xLLTLI2icagcsXO5JsjW4fLmtOWcJ62e4tpPnaSOM=@localhost:5432/devocionales_prod" pnpm prisma migrate deploy'

# 4. Reconstruir frontend
ssh root@64.227.96.34 'cd /var/www/devocionales4.0/packages/web && pnpm vite build'

# 5. Reiniciar backend
ssh root@64.227.96.34 'pm2 restart devocionales-api'

# 6. Verificar estado
ssh root@64.227.96.34 'pm2 list'
```

## Script de Despliegue Automatizado

Puedes crear un archivo `deploy.sh` en la raíz del proyecto:

```bash
#!/bin/bash

echo "🚀 Iniciando despliegue..."

# Variables
SERVER="root@64.227.96.34"
APP_DIR="/var/www/devocionales4.0"
DB_URL="postgresql://devocionales:I2xLLTLI2icagcsXO5JsjW4fLmtOWcJ62e4tpPnaSOM=@localhost:5432/devocionales_prod"

# Pull código
echo "📥 Descargando cambios del repositorio..."
ssh $SERVER "cd $APP_DIR && git pull"

# Migraciones
echo "🗄️  Ejecutando migraciones de base de datos..."
ssh $SERVER "cd $APP_DIR/packages/backend && DATABASE_URL='$DB_URL' pnpm prisma migrate deploy"

# Build frontend
echo "🔨 Construyendo frontend..."
ssh $SERVER "cd $APP_DIR/packages/web && pnpm vite build"

# Restart backend
echo "♻️  Reiniciando backend..."
ssh $SERVER "pm2 restart devocionales-api"

# Verificar
echo "✅ Verificando estado..."
ssh $SERVER "pm2 list"

echo "🎉 Despliegue completado!"
```

## Notas Importantes

1. **Variables de Entorno**: El backend obtiene sus variables de entorno desde `ecosystem.config.js`, no desde archivos `.env`

2. **Permisos**: Asegúrate de tener acceso SSH al servidor con tu clave SSH configurada en 1Password

3. **PM2 Mode**: El backend corre en modo `fork`, no en modo `cluster`

4. **Nginx**: No necesita reinicio para cambios de frontend o backend, solo si cambia la configuración de Nginx

5. **SSL**: Los certificados se renuevan automáticamente con Certbot

## Verificación desde el Exterior

```bash
# Desde tu computadora local
curl -s https://www.registrodevocionales.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{__typename}"}'
```

Debería responder: `{"data":{"__typename":"Query"}}`
