# Guía de Deployment - Devocionales 4.0

Esta guía te llevará paso a paso para desplegar la aplicación en Digital Ocean.

## Prerequisitos

- ✅ Droplet de Digital Ocean creado (Ubuntu 24.04, 2GB RAM, $14/mes)
- ✅ Dominio apuntando al IP del droplet (A record)
- ✅ Acceso SSH al droplet
- ✅ Repositorio Git (GitHub/GitLab) con el código

---

## Paso 1: Configurar el Droplet

### 1.1 Conectarse al Droplet

```bash
ssh root@TU_IP_DEL_DROPLET
```

### 1.2 Copiar y ejecutar el script de setup

```bash
# Descargar el script de setup
wget https://raw.githubusercontent.com/TU_USUARIO/devocionales4.0/main/scripts/setup-production.sh

# Darle permisos de ejecución
chmod +x setup-production.sh

# Ejecutar el script
./setup-production.sh
```

**⚠️ IMPORTANTE:** El script generará una contraseña para PostgreSQL. **GUÁRDALA EN UN LUGAR SEGURO**.

---

## Paso 2: Clonar el Repositorio

```bash
# Cambiar al usuario devocionales
sudo su - devocionales

# Ir al directorio de aplicaciones
cd /var/www

# Clonar el repositorio (cambiar URL por tu repositorio)
git clone https://github.com/TU_USUARIO/devocionales4.0.git

cd devocionales4.0
```

---

## Paso 3: Configurar Variables de Entorno

### 3.1 Backend (.env.production)

```bash
cd /var/www/devocionales4.0/packages/backend

# Copiar el ejemplo
cp .env.production.example .env.production

# Editar con nano o vim
nano .env.production
```

**Editar estos valores:**

```bash
# Database - Usar la contraseña generada en el Paso 1
DATABASE_URL=postgresql://devocionales:PASSWORD_GENERADA@localhost:5432/devocionales_prod

# JWT - Generar con: openssl rand -base64 64
JWT_SECRET=TU_SECRET_GENERADO

# CORS - Tu dominio
CORS_ORIGIN=https://tudominio.com
```

**Generar JWT_SECRET:**

```bash
openssl rand -base64 64
```

### 3.2 Frontend (.env.production)

```bash
cd /var/www/devocionales4.0/packages/web

# Copiar el ejemplo
cp .env.production.example .env.production

# Editar
nano .env.production
```

**Cambiar por tu dominio:**

```bash
VITE_API_URL=https://tudominio.com/graphql
VITE_WS_URL=wss://tudominio.com/graphql
```

---

## Paso 4: Instalar Dependencias y Compilar

```bash
# Volver a la raíz del proyecto
cd /var/www/devocionales4.0

# Instalar dependencias
pnpm install

# Backend - Generar Prisma Client
cd packages/backend
pnpm prisma generate

# Ejecutar migraciones
pnpm prisma migrate deploy

# Ejecutar seed (crear usuario inicial)
pnpm prisma db seed

# Build backend
pnpm build

# Frontend - Build
cd ../web
pnpm build
```

---

## Paso 5: Configurar PM2

```bash
# Volver a la raíz
cd /var/www/devocionales4.0

# Iniciar la aplicación con PM2
pm2 start ecosystem.config.js --env production

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para auto-inicio
pm2 startup
# Copiar y ejecutar el comando que PM2 te muestre

# Verificar que esté corriendo
pm2 status
pm2 logs devocionales-api
```

---

## Paso 6: Configurar Nginx

### 6.1 Copiar configuración

```bash
# Salir del usuario devocionales y volver a root
exit

# Copiar configuración de Nginx
sudo cp /var/www/devocionales4.0/scripts/nginx-config.conf /etc/nginx/sites-available/devocionales
```

### 6.2 Editar configuración con tu dominio

```bash
sudo nano /etc/nginx/sites-available/devocionales
```

**Reemplazar `tudominio.com` con tu dominio real en todas las apariciones.**

### 6.3 Activar configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/devocionales /etc/nginx/sites-enabled/

# Eliminar configuración default
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t

# Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

---

## Paso 7: Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Certbot preguntará:
# - Email: Ingresa tu email
# - Términos: Acepta
# - Compartir email: Como prefieras
# - Redirect HTTP to HTTPS: YES (opción 2)

# Verificar auto-renovación
sudo certbot renew --dry-run
```

---

## Paso 8: Verificar Deployment

### 8.1 Verificar servicios

```bash
# Ver status de PM2
pm2 status

# Ver logs
pm2 logs devocionales-api --lines 50

# Ver uso de memoria
free -h

# Ver procesos
htop
```

### 8.2 Probar la aplicación

Abre tu navegador y ve a:
- `https://tudominio.com` - Debería cargar la aplicación
- `https://tudominio.com/graphql` - Debería mostrar el API de GraphQL

### 8.3 Login

Usa las credenciales creadas en el seed:
- **Email:** `nataliaov23@gmail.com`
- **Password:** `QBQ9gUQTF6JhgB`
- **Rol:** CEA (Administrador)

---

## Paso 9: Configurar Backups Automáticos

```bash
# Cambiar al usuario devocionales
sudo su - devocionales

# Crear script de backup
cat > /home/devocionales/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/home/devocionales/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="devocionales_prod"
DB_USER="devocionales"

mkdir -p $BACKUP_DIR
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
echo "Backup completado: db_backup_$DATE.sql.gz"
EOF

# Darle permisos de ejecución
chmod +x /home/devocionales/backup.sh

# Configurar cron (ejecutar diariamente a las 3 AM)
crontab -e
# Agregar esta línea:
# 0 3 * * * /home/devocionales/backup.sh
```

---

## Comandos Útiles de Mantenimiento

### PM2

```bash
# Ver logs en tiempo real
pm2 logs devocionales-api

# Reiniciar aplicación
pm2 restart devocionales-api

# Detener aplicación
pm2 stop devocionales-api

# Ver uso de recursos
pm2 monit
```

### Nginx

```bash
# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/devocionales-error.log
sudo tail -f /var/log/nginx/devocionales-access.log
```

### Base de Datos

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql -d devocionales_prod

# Backup manual
pg_dump -U devocionales devocionales_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Restaurar backup
gunzip < backup_YYYYMMDD.sql.gz | psql -U devocionales devocionales_prod
```

---

## Deployment de Actualizaciones

Cuando hagas cambios en el código:

```bash
# En el droplet, como usuario devocionales
cd /var/www/devocionales4.0

# Pull cambios
git pull origin main

# Backend
cd packages/backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy  # Solo si hay nuevas migraciones
pnpm build

# Frontend
cd ../web
pnpm install --frozen-lockfile
pnpm build

# Reiniciar backend
pm2 restart devocionales-api

# Recargar Nginx
sudo systemctl reload nginx
```

---

## Monitoreo de Recursos

```bash
# Ver uso de memoria
free -h

# Ver procesos que más consumen
ps aux --sort=-%mem | head -n 10

# Monitor en tiempo real
htop

# Ver uso de disco
df -h
```

---

## Troubleshooting

### Backend no inicia

```bash
# Ver logs de PM2
pm2 logs devocionales-api --lines 100

# Verificar que .env.production existe
ls -la /var/www/devocionales4.0/packages/backend/.env.production

# Verificar PostgreSQL
sudo systemctl status postgresql
```

### Frontend muestra página en blanco

```bash
# Verificar que el build existe
ls -la /var/www/devocionales4.0/packages/web/dist

# Ver logs de Nginx
sudo tail -f /var/log/nginx/devocionales-error.log
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión manual
psql -U devocionales -d devocionales_prod -h localhost
```

---

## ¡Listo!

Tu aplicación ya debería estar corriendo en producción. 🎉

Para preguntas o problemas, revisa los logs:
- **Backend:** `pm2 logs devocionales-api`
- **Nginx:** `sudo tail -f /var/log/nginx/devocionales-error.log`
- **PostgreSQL:** `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
