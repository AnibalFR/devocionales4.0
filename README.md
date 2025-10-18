# Devocionales 4.0

Sistema de registro de visitas y devocionales con autenticación multi-factor (MFA).

## Características

- ✅ Autenticación con MFA obligatorio (Google/Microsoft Authenticator)
- ✅ Sistema de invitaciones por email
- ✅ 3 roles: CEA (Admin), COLABORADOR, VISITANTE
- ✅ App web desktop (React + Vite)
- ✅ App móvil nativa (React Native + Expo)
- ✅ API GraphQL (Apollo Server + Prisma)
- ✅ Base de datos PostgreSQL
- ✅ Real-time con subscriptions

## Requisitos

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker Desktop

## Desarrollo Local

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Iniciar servicios Docker

```bash
pnpm docker:dev
```

Esto iniciará:
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)
- MailHog UI (puerto 8025) - para testing de emails
- pgAdmin (puerto 5050) - opcional

### 3. Iniciar backend

```bash
cd packages/backend
pnpm dev
```

Backend disponible en: http://localhost:4000/graphql

### 4. Iniciar frontend web

```bash
cd packages/web
pnpm dev
```

Frontend disponible en: http://localhost:5173

### 5. Iniciar app móvil

```bash
cd packages/mobile
pnpm start
```

## Scripts Útiles

```bash
# Detener servicios Docker
pnpm docker:down

# Limpiar volúmenes Docker (elimina datos)
pnpm docker:clean
```

## Estructura del Proyecto

```
devocionales4.0/
├── packages/
│   ├── backend/        # API GraphQL + Prisma
│   ├── web/            # React + Vite
│   └── mobile/         # React Native + Expo
├── scripts/
│   └── docker-dev.sh   # Script para Docker
├── docker-compose.full.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Documentación

Ver documentación completa de arquitectura en: `/docs/Devocionales4.0_Arquitectura.md`

## Roles y Permisos

| Rol | App Móvil | Web Desktop | Puede Invitar A |
|-----|-----------|-------------|-----------------|
| **CEA** (Admin) | ✅ | ✅ | CEA, COLABORADOR, VISITANTE |
| **COLABORADOR** | ✅ | ✅ | VISITANTE |
| **VISITANTE** | ✅ | ❌ | Nadie |

## Licencia

MIT
