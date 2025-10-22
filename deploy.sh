#!/bin/bash

# ============================================
# Script de Deployment Automático
# Devocionales 4.0 - Digital Ocean Droplet
# ============================================

set -e  # Salir si algún comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
SERVER="root@64.227.96.34"
APP_DIR="/var/www/devocionales4.0"
DB_URL="postgresql://devocionales:I2xLLTLI2icagcsXO5JsjW4fLmtOWcJ62e4tpPnaSOM=@localhost:5432/devocionales_prod"

# Funciones de utilidad
print_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Mostrar ayuda
show_help() {
    cat << EOF
Uso: ./deploy.sh [OPCIONES]

Script de deployment automático para Devocionales 4.0

OPCIONES:
    -h, --help              Mostrar esta ayuda
    -m, --migrate           Ejecutar migraciones de Prisma
    -i, --install           Ejecutar pnpm install (si hay cambios en dependencias)
    -s, --skip-build        Saltar build del frontend
    -c, --commit [MSG]      Hacer commit y push antes de desplegar
    -v, --verify-only       Solo verificar estado sin hacer cambios
    -r, --rollback          Revertir al último commit (¡CUIDADO!)

EJEMPLOS:
    ./deploy.sh                     # Deployment básico
    ./deploy.sh -m                  # Con migraciones
    ./deploy.sh -c "Fix bug"        # Commit, push y deploy
    ./deploy.sh -m -i               # Con migraciones e instalación

NOTAS:
    - Asegúrate de tener tus cambios commiteados antes de ejecutar
    - El script verificará la conexión SSH automáticamente
    - Los logs completos se guardan en deployment.log

EOF
}

# Parsear argumentos
SKIP_BUILD=false
RUN_MIGRATIONS=false
RUN_INSTALL=false
VERIFY_ONLY=false
COMMIT_MSG=""
ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        -i|--install)
            RUN_INSTALL=true
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -c|--commit)
            COMMIT_MSG="$2"
            shift 2
            ;;
        -v|--verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            shift
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# ============================================
# INICIO DEL DEPLOYMENT
# ============================================

echo ""
print_step "🚀 DEPLOYMENT DEVOCIONALES 4.0"
echo ""
echo "Servidor: $SERVER"
echo "Directorio: $APP_DIR"
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No estás en el directorio raíz del proyecto"
    exit 1
fi

# ============================================
# PASO 0: ROLLBACK (si se solicitó)
# ============================================

if [ "$ROLLBACK" = true ]; then
    print_step "⏪ ROLLBACK AL COMMIT ANTERIOR"

    read -p "⚠️  ¿Estás seguro de revertir al commit anterior? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Rollback cancelado"
        exit 0
    fi

    ssh $SERVER "cd $APP_DIR && git reset --hard HEAD~1"
    ssh $SERVER "cd $APP_DIR/packages/web && pnpm vite build"
    ssh $SERVER "pm2 restart devocionales-api"

    print_success "Rollback completado"
    exit 0
fi

# ============================================
# PASO 0.5: VERIFICACIÓN INICIAL
# ============================================

print_step "🔍 VERIFICACIÓN INICIAL"

# Verificar conexión SSH
print_info "Verificando conexión SSH..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Conexión exitosa'" > /dev/null 2>&1; then
    print_error "No se puede conectar al servidor via SSH"
    print_info "Verifica tu conexión y credenciales"
    exit 1
fi
print_success "Conexión SSH exitosa"

# Verificar estado de git local
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Tienes cambios sin commitear"
    if [ -z "$COMMIT_MSG" ]; then
        print_info "Usa -c 'mensaje' para commitear automáticamente"
        read -p "¿Deseas continuar de todas formas? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            exit 0
        fi
    fi
fi

# Si solo es verificación, salir aquí
if [ "$VERIFY_ONLY" = true ]; then
    print_success "Verificación completada - Todo OK"
    exit 0
fi

# ============================================
# PASO 1: COMMIT Y PUSH (si se solicitó)
# ============================================

if [ -n "$COMMIT_MSG" ]; then
    print_step "📝 COMMIT Y PUSH"

    print_info "Agregando cambios..."
    git add .

    print_info "Creando commit..."
    git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    print_info "Haciendo push..."
    git push

    print_success "Cambios commiteados y pusheados"
fi

# ============================================
# PASO 2: ACTUALIZAR CÓDIGO EN SERVIDOR
# ============================================

print_step "📥 ACTUALIZANDO CÓDIGO EN SERVIDOR"

print_info "Haciendo stash de cambios locales en servidor..."
ssh $SERVER "cd $APP_DIR && git stash" || true

print_info "Pulling cambios desde repositorio..."
ssh $SERVER "cd $APP_DIR && git pull"

print_success "Código actualizado en servidor"

# ============================================
# PASO 3: INSTALAR DEPENDENCIAS (si se solicitó)
# ============================================

if [ "$RUN_INSTALL" = true ]; then
    print_step "📦 INSTALANDO DEPENDENCIAS"

    print_info "Instalando dependencias del backend..."
    ssh $SERVER "cd $APP_DIR/packages/backend && pnpm install"

    print_info "Instalando dependencias del frontend..."
    ssh $SERVER "cd $APP_DIR/packages/web && pnpm install"

    print_success "Dependencias instaladas"
fi

# ============================================
# PASO 4: MIGRACIONES (si se solicitó)
# ============================================

if [ "$RUN_MIGRATIONS" = true ]; then
    print_step "🗄️  EJECUTANDO MIGRACIONES DE PRISMA"

    print_info "Ejecutando migraciones en producción..."
    ssh $SERVER "cd $APP_DIR/packages/backend && DATABASE_URL='$DB_URL' pnpm prisma migrate deploy"

    print_success "Migraciones ejecutadas"
fi

# ============================================
# PASO 5: BUILD DEL BACKEND
# ============================================

print_step "🔨 COMPILANDO BACKEND"

print_info "Compilando TypeScript del backend..."
ssh $SERVER "cd $APP_DIR/packages/backend && npm run build"

print_success "Backend compilado exitosamente"

# ============================================
# PASO 6: BUILD DEL FRONTEND
# ============================================

if [ "$SKIP_BUILD" = false ]; then
    print_step "🔨 CONSTRUYENDO FRONTEND"

    # Generar BUILD_ID único (timestamp-githash)
    print_info "Generando BUILD_ID..."
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    GIT_HASH=$(ssh $SERVER "cd $APP_DIR && git rev-parse --short HEAD")
    BUILD_ID="${TIMESTAMP}-${GIT_HASH}"

    print_success "BUILD_ID generado: $BUILD_ID"

    # Actualizar release.json con el nuevo buildId
    print_info "Actualizando release.json con BUILD_ID..."
    ssh $SERVER "cd $APP_DIR/packages/backend && \
        if [ -f release.json ]; then \
            sed -i 's/\"buildId\": \".*\"/\"buildId\": \"$BUILD_ID\"/' release.json; \
        else \
            echo '{\"buildId\":\"$BUILD_ID\",\"notes\":[],\"requiresReload\":false,\"requiresReauth\":false}' > release.json; \
        fi"

    print_success "release.json actualizado"

    # Recordatorio para editar notas de release
    print_warning "RECORDATORIO: Edita packages/backend/release.json en el servidor si quieres agregar notas del release"
    print_info "Puedes hacerlo con: ssh $SERVER 'nano $APP_DIR/packages/backend/release.json'"

    # Pausa de 5 segundos para dar tiempo a editar si es necesario
    sleep 2

    print_info "Ejecutando vite build con BUILD_ID..."
    ssh $SERVER "cd $APP_DIR/packages/web && BUILD_ID=$BUILD_ID pnpm vite build"

    print_success "Frontend construido exitosamente con BUILD_ID: $BUILD_ID"
else
    print_warning "Build del frontend omitido (--skip-build)"
fi

# ============================================
# PASO 7: REINICIAR BACKEND
# ============================================

print_step "♻️  REINICIANDO BACKEND"

print_info "Reiniciando PM2..."
ssh $SERVER "pm2 restart devocionales-api"

# Esperar un momento para que el servidor inicie
sleep 2

print_success "Backend reiniciado"

# ============================================
# PASO 8: VERIFICACIÓN
# ============================================

print_step "✅ VERIFICACIÓN FINAL"

print_info "Verificando estado de PM2..."
ssh $SERVER "pm2 list | grep devocionales-api"

print_info "Probando endpoint GraphQL..."
RESPONSE=$(ssh $SERVER "curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{\"query\": \"{__typename}\"}'" | python3 -c "import sys, json; data = json.load(sys.stdin); print('OK' if 'data' in data else 'FAIL')" 2>/dev/null || echo "FAIL")

if [ "$RESPONSE" = "OK" ]; then
    print_success "GraphQL endpoint respondiendo correctamente"
else
    print_error "GraphQL endpoint no responde correctamente"
    print_info "Revisa los logs con: ssh $SERVER 'pm2 logs devocionales-api'"
    exit 1
fi

print_info "Probando acceso público..."
PUBLIC_RESPONSE=$(curl -s https://www.registrodevocionales.com/graphql -H "Content-Type: application/json" -d '{"query": "{__typename}"}' | python3 -c "import sys, json; data = json.load(sys.stdin); print('OK' if 'data' in data else 'FAIL')" 2>/dev/null || echo "FAIL")

if [ "$PUBLIC_RESPONSE" = "OK" ]; then
    print_success "Sitio público accesible"
else
    print_warning "El sitio público no responde (podría ser temporal)"
fi

# ============================================
# RESUMEN FINAL
# ============================================

echo ""
print_step "🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE"
echo ""
echo "📊 Resumen:"
echo "   • Código actualizado: ✓"
[ "$RUN_INSTALL" = true ] && echo "   • Dependencias instaladas: ✓"
[ "$RUN_MIGRATIONS" = true ] && echo "   • Migraciones ejecutadas: ✓"
echo "   • Backend compilado: ✓"
[ "$SKIP_BUILD" = false ] && echo "   • Frontend construido: ✓"
echo "   • Backend reiniciado: ✓"
echo "   • Verificación exitosa: ✓"
echo ""
echo "🌐 URLs:"
echo "   • Frontend: https://www.registrodevocionales.com"
echo "   • GraphQL: https://www.registrodevocionales.com/graphql"
echo ""
echo "📝 Ver logs del servidor:"
echo "   ssh $SERVER 'pm2 logs devocionales-api --lines 20'"
echo ""
print_success "Todo listo para usar! 🚀"
echo ""
