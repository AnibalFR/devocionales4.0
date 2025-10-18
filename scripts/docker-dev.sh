#!/bin/bash

set -e

echo "🐳 Devocionales 4.0 - Docker Development Environment"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Descarga Docker Desktop:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar que Docker esté corriendo
if ! docker info &> /dev/null; then
    echo "❌ Docker no está corriendo. Inicia Docker Desktop."
    exit 1
fi

echo "✅ Docker está corriendo"
echo ""

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.full.yml up -d

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo ""
echo "✅ Entorno de desarrollo listo!"
echo ""
echo "📍 Servicios disponibles:"
echo "   PostgreSQL:       localhost:5432"
echo "   Redis:            localhost:6379"
echo "   MailHog UI:       http://localhost:8025"
echo "   pgAdmin:          http://localhost:5050"
echo ""
echo "📝 Credenciales PostgreSQL:"
echo "   Database:         devocionales_dev"
echo "   User:             devocionales"
echo "   Password:         dev_password"
echo ""
echo "📝 Credenciales pgAdmin:"
echo "   Email:            admin@devocionales.local"
echo "   Password:         admin"
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver logs:         docker-compose -f docker-compose.full.yml logs -f"
echo "   Detener:          docker-compose -f docker-compose.full.yml down"
echo "   Reiniciar:        docker-compose -f docker-compose.full.yml restart"
echo ""
