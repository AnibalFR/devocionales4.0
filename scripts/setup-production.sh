#!/bin/bash
set -e

echo "🚀 Devocionales 4.0 - Production Setup (Digital Ocean 2GB)"
echo ""
echo "⚠️  Este script instalará servicios NATIVAMENTE (sin Docker)"
echo ""

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt-get update
sudo apt-get upgrade -y

# Instalar dependencias básicas
echo "📦 Instalando dependencias..."
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  ufw \
  fail2ban \
  htop

# Instalar PostgreSQL 15
echo "🗄️  Instalando PostgreSQL 15..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-15 postgresql-contrib-15

# Generar contraseña segura para PostgreSQL
DB_PASSWORD=$(openssl rand -base64 32)
echo "📝 Contraseña de PostgreSQL generada (guárdala):"
echo "   Database: devocionales_prod"
echo "   User: devocionales"
echo "   Password: $DB_PASSWORD"
echo ""

# Configurar PostgreSQL
echo "🔧 Configurando PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER devocionales WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE devocionales_prod OWNER devocionales;
GRANT ALL PRIVILEGES ON DATABASE devocionales_prod TO devocionales;
\q
EOF

# Optimizar PostgreSQL para 2GB RAM
sudo tee -a /etc/postgresql/15/main/postgresql.conf > /dev/null <<EOF

# Optimizaciones para 2GB RAM
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 8MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100
EOF

sudo systemctl restart postgresql

# Instalar Node.js 20
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm y PM2
echo "📦 Instalando pnpm y PM2..."
sudo npm install -g pnpm pm2

# Instalar Nginx
echo "🌐 Instalando Nginx..."
sudo apt-get install -y nginx

# Instalar Certbot para SSL
echo "🔒 Instalando Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Configurar Firewall
echo "🔥 Configurando firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

# Crear usuario de aplicación
echo "👤 Creando usuario devocionales..."
sudo useradd -m -s /bin/bash devocionales || true
sudo mkdir -p /var/www/devocionales4.0
sudo chown -R devocionales:devocionales /var/www/devocionales4.0

# Crear directorio de logs
sudo mkdir -p /var/log/devocionales
sudo chown -R devocionales:devocionales /var/log/devocionales

echo ""
echo "✅ Instalación base completada!"
echo ""
echo "📋 GUARDA ESTA INFORMACIÓN:"
echo "   DATABASE_URL=postgresql://devocionales:$DB_PASSWORD@localhost:5432/devocionales_prod"
echo ""
echo "📋 Próximos pasos manuales:"
echo "  1. Clonar repositorio: cd /var/www && sudo -u devocionales git clone https://github.com/TU_USUARIO/devocionales4.0.git"
echo "  2. Configurar .env.production en packages/backend con DATABASE_URL"
echo "  3. Configurar .env.production en packages/web"
echo "  4. Como usuario devocionales:"
echo "     cd /var/www/devocionales4.0"
echo "     pnpm install"
echo "     cd packages/backend && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build"
echo "     cd ../web && pnpm build"
echo "  5. Iniciar con PM2: pm2 start ecosystem.config.js --env production"
echo "  6. Guardar PM2: pm2 save && pm2 startup"
echo "  7. Configurar Nginx (copiar configuración desde docs)"
echo "  8. Obtener certificado SSL: sudo certbot --nginx -d tudominio.com"
echo ""
echo "📊 Uso de memoria actual:"
free -h
