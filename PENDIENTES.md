# 📋 PENDIENTES - Devocionales 4.0

**Fecha de actualización**: 16 de octubre de 2025
**Estado general del proyecto**: ~65% completo

---

## 🎯 RESUMEN EJECUTIVO

### ✅ Completado (65%)
- ✅ Backend GraphQL completo con Apollo Server
- ✅ Prisma Schema con todas las entidades
- ✅ Sistema de autenticación JWT
- ✅ Wizard de visitas (8 pasos) según VIS-001 a VIS-011
- ✅ Catálogo de Devocionales según DEV-001 a DEV-004
- ✅ Sistema de Metas según META-001 a META-011
- ✅ Reporte de Ciclo con filtros y exportación
- ✅ Catálogo de Miembros completo según MEM-001 a MEM-006
- ✅ Catálogo de Familias completo con FAM-001 a FAM-007
- ✅ Catálogo de Visitas completo con 15 columnas, filtros avanzados y paginación
- ✅ Catálogos de Barrios y Núcleos con edición inline y Tab navigation
- ✅ Sistema de Exportar/Importar con validaciones completas (7 tabs)
- ✅ Migración de datos inicial (comunidades, usuarios, barrios, núcleos)
- ✅ **FRONTEND 100% MIGRADO DE V3.0 A V4.0** 🎉

### 🔄 En Progreso (0%)
- Ninguno actualmente

### ❌ Pendiente (35%)
- Ver detalle completo abajo

---

## 🎯 PRÓXIMOS PASOS - ALTA PRIORIDAD

Ahora que el **Frontend está 100% completo**, las siguientes tareas críticas son:

### **INMEDIATO - Esta Semana**
1. **Migración Completa de Datos v3.0** (#8)
   - Migrar Familias, Miembros y Visitas desde v3.0
   - Validar integridad de datos
   - Script de rollback en caso de error

2. **Dashboard Principal** (#5)
   - KPIs principales
   - Gráficas de visitas
   - Próximas visitas programadas
   - Lista de seguimientos pendientes

### **SIGUIENTE - Próximas 2 Semanas**
3. **Sistema de Permisos por Rol** (#2)
   - Middleware de permisos en backend
   - Guards en frontend
   - Restricciones según rol (CEA/COLABORADOR/VISITANTE)

4. **Tests Backend** (#10)
   - Tests de autenticación
   - Tests de resolvers
   - Tests de reglas de negocio
   - Coverage mínimo: 70%

5. **Manejo de Errores y Seguridad** (#21, #22)
   - Error handler global
   - Logging estructurado
   - Rate limiting
   - Security headers

---

## 📱 FRONTEND WEB - CATÁLOGOS

### 1. ✅ **Catálogo de Visitas** (COMPLETADO ✅)
**Archivo**: `/packages/web/src/pages/VisitasPage.tsx`

**Completado al 100%**:
- ✅ 15 columnas visibles
  - ✅ Familia
  - ✅ Barrio
  - ✅ Núcleo
  - ✅ Fecha de Visita
  - ✅ Hora
  - ✅ Tipo de Visita
  - ✅ Estatus
  - ✅ Visitadores
  - ✅ Actividades
  - ✅ Material Dejado
  - ✅ Seguimiento
  - ✅ Notas
  - ✅ Fecha de Registro
  - ✅ Registrado Por
  - ✅ Acciones
- ✅ Sistema de filtros avanzados
  - ✅ Por fecha (rango)
  - ✅ Por barrio
  - ✅ Por núcleo
  - ✅ Por tipo de visita
  - ✅ Por estatus
  - ✅ Por visitador
- ✅ Ordenamiento por columnas (click en header)
- ✅ Paginación (10/20/50 por página)
- ✅ Botones de acción por fila:
  - ✅ Ver detalle completo (modal con 8 pasos)
  - ✅ Editar (modal con 8 pasos)
  - ✅ Eliminar (con confirmación)
- ✅ Wizard de creación (8 pasos)
- ✅ Estadísticas en header (total, por tipo, por estatus)

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### 2. **Sistema de Permisos por Rol** (ALTA PRIORIDAD)
**Archivos**:
- `/packages/backend/src/middleware/auth.ts`
- Nuevos archivos de permisos

**Pendientes**:
- [ ] Implementar middleware de permisos por rol
- [ ] CEA: Acceso total (CRUD en todo)
- [ ] COLABORADOR:
  - [ ] Lectura de todo
  - [ ] Crear/editar visitas propias
  - [ ] Ver familias/miembros
  - [ ] NO puede crear/editar usuarios
  - [ ] NO puede modificar metas
- [ ] VISITANTE:
  - [ ] Solo lectura de familias asignadas
  - [ ] Crear visitas a sus familias
  - [ ] Ver sus propias visitas
  - [ ] NO acceso a reportes completos
  - [ ] NO acceso a metas
- [ ] Guards en frontend para ocultar botones según rol
- [ ] Mensajes de error amigables si intenta acción no permitida

### 3. **Recuperación de Contraseña** (MEDIA PRIORIDAD)
**Nuevos archivos necesarios**:
- `/packages/backend/src/services/email.service.ts`
- `/packages/web/src/pages/ForgotPasswordPage.tsx`
- `/packages/web/src/pages/ResetPasswordPage.tsx`

**Pendientes**:
- [ ] Endpoint GraphQL `requestPasswordReset`
- [ ] Endpoint GraphQL `resetPassword`
- [ ] Generar token temporal (expires 1 hora)
- [ ] Enviar email con link de reset
- [ ] Página de "Olvidé mi contraseña"
- [ ] Página de reset con token validation
- [ ] Configurar servicio de email (SendGrid/AWS SES)

### 4. **Cambio de Contraseña** (BAJA PRIORIDAD)
**Archivos**:
- `/packages/web/src/pages/ChangePasswordPage.tsx` (nuevo)
- Agregar mutation en backend

**Pendientes**:
- [ ] Mutation `changePassword(oldPassword, newPassword)`
- [ ] Validar contraseña actual
- [ ] Validar fortaleza de nueva contraseña
- [ ] Página de cambio de contraseña en perfil
- [ ] Notificación por email de cambio exitoso

---

## 📊 REPORTES Y ANALYTICS

### 5. **Dashboard Principal** (ALTA PRIORIDAD)
**Archivo**: `/packages/web/src/pages/DashboardPage.tsx`

**Actualmente**: Prácticamente vacío
**Pendientes**:
- [ ] KPIs principales en cards:
  - [ ] Total de familias activas
  - [ ] Total de visitas este mes
  - [ ] Total de devocionales activos
  - [ ] Progreso de meta actual (%)
- [ ] Gráfica de visitas por mes (últimos 6 meses)
- [ ] Gráfica de tipos de visita (pie chart)
- [ ] Lista de próximas visitas programadas
- [ ] Lista de seguimientos pendientes
- [ ] Filtro por barrio/núcleo
- [ ] Exportar datos a PDF

### 6. **Reporte de Ciclo - Mejoras** (MEDIA PRIORIDAD)
**Archivo**: `/packages/web/src/pages/ReporteCicloPage.tsx`

**Actualmente**: Funcional básico
**Pendientes**:
- [ ] Gráficas visuales (charts)
- [ ] Comparación con ciclo anterior
- [ ] Desglose por barrio
- [ ] Desglose por núcleo
- [ ] Desglose por visitador
- [ ] Exportar a PDF con formato profesional
- [ ] Compartir reporte por email

### 7. **Reportes Adicionales** (BAJA PRIORIDAD)
**Nuevos archivos necesarios**:
- `/packages/web/src/pages/ReporteFamiliasPage.tsx`
- `/packages/web/src/pages/ReporteMiembrosPage.tsx`
- `/packages/web/src/pages/ReporteVisitadoresPage.tsx`

**Pendientes**:
- [ ] Reporte de Familias
  - [ ] Familias activas vs inactivas
  - [ ] Familias por barrio/núcleo
  - [ ] Familias sin visitas recientes
  - [ ] Familias con devocional
- [ ] Reporte de Miembros
  - [ ] Distribución por edad
  - [ ] Miembros con devocional
  - [ ] Roles familiares
- [ ] Reporte de Visitadores
  - [ ] Top visitadores (más visitas)
  - [ ] Visitas por visitador
  - [ ] Promedio de visitas

---

## 🗄️ MIGRACIÓN DE DATOS

### 8. **Migración Completa desde v3.0** (ALTA PRIORIDAD)
**Archivos**:
- `/packages/backend/src/scripts/migrate-from-v3.ts`
- Scripts auxiliares en `/packages/backend/src/scripts/`

**Completado**:
- ✅ Migración de Comunidades
- ✅ Migración de Usuarios
- ✅ Migración de Barrios
- ✅ Migración de Núcleos

**Pendientes**:
- [ ] Migración de Familias
  - [ ] Validar direcciones
  - [ ] Asignar barrioId y nucleoId
  - [ ] Calcular miembroCount
- [ ] Migración de Miembros
  - [ ] Asociar con familias
  - [ ] Migrar edades (fechaNacimiento vs edadAproximada)
  - [ ] Migrar datos de devocionales
  - [ ] Validar roles familiares
- [ ] Migración de Visitas
  - [ ] Mapear campos legacy a nuevos
  - [ ] Convertir visitActivities JSON
  - [ ] Convertir materialDejado JSON
  - [ ] Derivar visitStatus automáticamente
- [ ] Script de validación post-migración
- [ ] Backup de datos v3.0 antes de migrar
- [ ] Rollback plan

### 9. **Importación/Exportación Masiva** (MEDIA PRIORIDAD)
**Nuevos archivos necesarios**:
- `/packages/web/src/components/ImportExportModal.tsx`
- `/packages/backend/src/services/import.service.ts`
- `/packages/backend/src/services/export.service.ts`

**Pendientes**:
- [ ] Exportar familias a Excel
- [ ] Exportar miembros a Excel
- [ ] Exportar visitas a Excel
- [ ] Importar familias desde Excel (template)
- [ ] Importar miembros desde Excel (template)
- [ ] Validación de datos en importación
- [ ] Preview antes de importar
- [ ] Manejo de errores y warnings

---

## 🧪 TESTING

### 10. **Tests Backend** (ALTA PRIORIDAD)
**Directorios**:
- `/packages/backend/src/__tests__/` (crear)

**Pendientes**:
- [ ] Setup de Jest para backend
- [ ] Tests de autenticación
  - [ ] Login exitoso
  - [ ] Login fallido
  - [ ] Token inválido
  - [ ] Token expirado
- [ ] Tests de resolvers
  - [ ] CRUD de cada entidad
  - [ ] Validaciones de negocio
  - [ ] Permisos por rol
- [ ] Tests de reglas de negocio
  - [ ] FAM-001 a FAM-007
  - [ ] VIS-001 a VIS-011
  - [ ] MEM-001 a MEM-006
  - [ ] DEV-001 a DEV-004
  - [ ] META-001 a META-011
- [ ] Tests de migración
- [ ] Coverage mínimo: 70%

### 11. **Tests Frontend** (MEDIA PRIORIDAD)
**Directorios**:
- `/packages/web/src/__tests__/` (crear)

**Pendientes**:
- [ ] Setup de Vitest/Jest para frontend
- [ ] Tests de componentes
  - [ ] Wizard de visitas (8 pasos)
  - [ ] Modales de familias
  - [ ] Formularios
- [ ] Tests de navegación
- [ ] Tests de autenticación
- [ ] Tests E2E con Playwright
  - [ ] Flujo completo de visita
  - [ ] Flujo de creación de familia
  - [ ] Flujo de login/logout
- [ ] Coverage mínimo: 60%

---

## 🚀 DEPLOYMENT Y DEVOPS

### 12. **Configuración de Ambientes** (ALTA PRIORIDAD)
**Archivos**:
- `/.env.development`
- `/.env.staging` (crear)
- `/.env.production` (crear)
- `/docker-compose.yml` (actualizar)
- `/Dockerfile` (crear para backend y web)

**Pendientes**:
- [ ] Configurar ambiente de staging
- [ ] Configurar ambiente de producción
- [ ] Variables de entorno por ambiente
- [ ] Secrets management (AWS Secrets Manager / HashiCorp Vault)
- [ ] Dockerfile multi-stage para optimizar
- [ ] docker-compose para desarrollo local

### 13. **CI/CD Pipeline** (ALTA PRIORIDAD)
**Archivos**:
- `/.github/workflows/ci.yml` (crear)
- `/.github/workflows/deploy-staging.yml` (crear)
- `/.github/workflows/deploy-production.yml` (crear)

**Pendientes**:
- [ ] GitHub Actions workflow para CI
  - [ ] Lint code
  - [ ] Run tests
  - [ ] Build check
  - [ ] Security scan
- [ ] Auto-deploy a staging en push a `develop`
- [ ] Manual deploy a production desde `main`
- [ ] Rollback automático si falla health check
- [ ] Notificaciones a Slack/Discord

### 14. **Hosting e Infraestructura** (ALTA PRIORIDAD)
**Pendientes**:
- [ ] Decisión de plataforma:
  - [ ] Railway (fácil, económico)
  - [ ] AWS (ECS + RDS + S3)
  - [ ] Vercel (frontend) + Railway (backend)
  - [ ] DigitalOcean
- [ ] Setup de base de datos en producción
  - [ ] PostgreSQL managed
  - [ ] Backups automáticos diarios
  - [ ] Retention: 30 días
- [ ] CDN para assets estáticos
- [ ] SSL/TLS certificados
- [ ] Domain setup
- [ ] Monitoreo y alertas (Sentry/DataDog)

---

## 📖 DOCUMENTACIÓN

### 15. **Documentación Técnica** (MEDIA PRIORIDAD)
**Archivos a crear**:
- `/docs/ARCHITECTURE.md`
- `/docs/API.md`
- `/docs/DATABASE.md`
- `/docs/DEPLOYMENT.md`
- `/docs/CONTRIBUTING.md`

**Pendientes**:
- [ ] Diagrama de arquitectura
- [ ] Documentación de GraphQL API
- [ ] Diagramas de base de datos (ERD)
- [ ] Guía de deployment
- [ ] Guía de contribución
- [ ] Changelog
- [ ] Roadmap

### 16. **Documentación de Usuario** (BAJA PRIORIDAD)
**Archivos a crear**:
- `/docs/user/MANUAL_USUARIO.md`
- `/docs/user/FAQ.md`
- `/docs/user/VIDEOS/` (carpeta)

**Pendientes**:
- [ ] Manual de usuario completo
  - [ ] Cómo crear visitas
  - [ ] Cómo gestionar familias
  - [ ] Cómo usar devocionales
  - [ ] Cómo ver reportes
- [ ] FAQ (preguntas frecuentes)
- [ ] Videos tutoriales
- [ ] Tooltips en la aplicación
- [ ] Onboarding para nuevos usuarios

---

## 🎨 UX/UI MEJORAS

### 17. **Diseño Mobile-First** (MEDIA PRIORIDAD)
**Archivos**: Todos los componentes en `/packages/web/src/`

**Pendientes**:
- [ ] Responsive design completo
  - [ ] Navegación móvil (hamburger menu)
  - [ ] Tablas adaptativas (cards en móvil)
  - [ ] Wizard de visitas optimizado para móvil
  - [ ] Modales adaptados a móvil
- [ ] PWA (Progressive Web App)
  - [ ] Service worker
  - [ ] Manifest.json
  - [ ] Offline support
  - [ ] Instalable en home screen
- [ ] Touch-friendly (botones grandes, swipe)

### 18. **Accesibilidad (a11y)** (BAJA PRIORIDAD)
**Pendientes**:
- [ ] ARIA labels en todos los elementos interactivos
- [ ] Navegación por teclado completa
- [ ] Contraste de colores (WCAG AA)
- [ ] Screen reader support
- [ ] Focus visible en navegación con Tab
- [ ] Alt text en imágenes

### 19. **Mejoras de UX** (MEDIA PRIORIDAD)
**Pendientes**:
- [ ] Loading states en todas las operaciones
- [ ] Toasts de confirmación (éxito/error)
- [ ] Confirmaciones antes de eliminar
- [ ] Deshacer acciones críticas
- [ ] Búsqueda global (Cmd+K / Ctrl+K)
- [ ] Atajos de teclado
- [ ] Drag & drop para reordenar
- [ ] Modo oscuro (dark mode)

---

## 🔧 MEJORAS TÉCNICAS

### 20. **Optimización de Performance** (MEDIA PRIORIDAD)
**Backend**:
- [ ] Implementar DataLoader para evitar N+1 queries
- [ ] Caché con Redis
  - [ ] Caché de queries frecuentes
  - [ ] TTL configurable
  - [ ] Invalidación automática
- [ ] Paginación cursor-based en lugar de offset
- [ ] Query optimization (índices en DB)
- [ ] Compression de responses (gzip)

**Frontend**:
- [ ] Code splitting por ruta
- [ ] Lazy loading de componentes pesados
- [ ] Optimistic UI updates
- [ ] Virtual scrolling en tablas largas
- [ ] Debounce en búsquedas
- [ ] Memoization de cálculos pesados
- [ ] Image optimization (WebP, lazy load)

### 21. **Manejo de Errores** (ALTA PRIORIDAD)
**Backend**:
- [ ] Error handler global
- [ ] Logging estructurado (Winston/Pino)
- [ ] Error tracking (Sentry)
- [ ] Rate limiting
- [ ] Request validation mejorada

**Frontend**:
- [ ] Error boundaries en React
- [ ] Manejo de errores de red
- [ ] Retry automático en fallos temporales
- [ ] Modo offline con queue
- [ ] Mensajes de error amigables

### 22. **Seguridad** (ALTA PRIORIDAD)
**Pendientes**:
- [ ] CORS configurado correctamente
- [ ] Helmet.js para headers de seguridad
- [ ] Rate limiting por IP
- [ ] SQL injection prevention (Prisma lo maneja)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Input sanitization
- [ ] Secrets rotation
- [ ] Security audit
- [ ] Penetration testing

---

## 📱 FUNCIONALIDADES NUEVAS (OPCIONAL - FUTURO)

### 23. **Sistema de Notificaciones** (FUTURO)
**Pendientes**:
- [ ] Notificaciones push en web
- [ ] Notificaciones por email
  - [ ] Visita próxima (recordatorio)
  - [ ] Seguimiento pendiente
  - [ ] Meta próxima a vencer
- [ ] Centro de notificaciones en app
- [ ] Preferencias de notificaciones por usuario

### 24. **Calendario Integrado** (FUTURO)
**Pendientes**:
- [ ] Vista de calendario de visitas
- [ ] Programar visitas desde calendario
- [ ] Sincronización con Google Calendar
- [ ] Recordatorios automáticos
- [ ] Disponibilidad de visitadores

### 25. **Chat/Mensajería Interna** (FUTURO)
**Pendientes**:
- [ ] Chat entre usuarios
- [ ] Comentarios en visitas
- [ ] Menciones (@usuario)
- [ ] Notificaciones de mensajes
- [ ] Chat de grupo por núcleo/barrio

### 26. **Mobile App Nativa** (FUTURO)
**Pendientes**:
- [ ] React Native app
- [ ] Misma API GraphQL
- [ ] Sincronización offline
- [ ] Notificaciones push nativas
- [ ] Geolocalización de visitas
- [ ] Cámara para fotos en visitas

---

## 🗓️ CRONOGRAMA SUGERIDO

### **Fase 1: MVP Completo** (4 semanas)
**Prioridad**: ALTA
**Objetivo**: Sistema funcional para uso interno

- ✅ Semana 1: Backend + Auth + Catálogos básicos (COMPLETADO)
- ✅ Semana 2: Wizard Visitas + Devocionales + Metas (COMPLETADO)
- ✅ Semana 3: Familias + Barrios + Núcleos (COMPLETADO)
- ✅ **Semana 4: COMPLETADO** ✅
  - ✅ Catálogo de Visitas completo con todas las funcionalidades
  - ✅ Sistema de Exportar/Importar con validaciones
  - ✅ Todos los catálogos frontend al 100%

**🎉 FASE 1 COMPLETADA AL 100% 🎉**

### **Fase 2: Production Ready** (3 semanas)
**Prioridad**: ALTA
**Objetivo**: Desplegar a producción

- Semana 5:
  - [ ] Permisos por rol
  - [ ] Manejo de errores completo
  - [ ] Tests backend (70% coverage)
- Semana 6:
  - [ ] CI/CD pipeline
  - [ ] Setup de producción
  - [ ] Optimización de performance
- Semana 7:
  - [ ] Security audit
  - [ ] Documentación técnica
  - [ ] Deploy a staging
  - [ ] Testing de usuario

### **Fase 3: Mejoras y Optimización** (2 semanas)
**Prioridad**: MEDIA
**Objetivo**: Pulir experiencia de usuario

- Semana 8:
  - [ ] Reportes avanzados
  - [ ] Dashboard completo
  - [ ] Responsive design
- Semana 9:
  - [ ] UX improvements
  - [ ] Documentación de usuario
  - [ ] Deploy a producción

### **Fase 4: Features Adicionales** (4 semanas)
**Prioridad**: BAJA
**Objetivo**: Funcionalidades avanzadas

- Semanas 10-13:
  - [ ] Notificaciones
  - [ ] Calendario
  - [ ] Importación/Exportación masiva
  - [ ] PWA
  - [ ] Modo offline

---

## 📊 MÉTRICAS DE ÉXITO

### **Técnicas**
- [ ] Uptime > 99.9%
- [ ] Response time API < 200ms (p95)
- [ ] Frontend load time < 2s
- [ ] Test coverage > 70%
- [ ] Zero critical security issues

### **Negocio**
- [ ] 100% de usuarios migrados de v3.0
- [ ] < 5% de errores reportados por usuarios
- [ ] Tiempo de creación de visita < 2 min
- [ ] Adopción de reportes > 80%
- [ ] Satisfacción de usuario > 4.5/5

---

## 📞 CONTACTO Y RECURSOS

**Documentos de Referencia**:
- `/REGLAS_NEGOCIO.md` - Todas las reglas de negocio
- `/ANALISIS_MIGRACION.md` - Plan de migración desde v3.0
- `/prisma/schema.prisma` - Schema de base de datos
- `/packages/backend/src/schema.ts` - Schema GraphQL

**Estado Actual**:
- Backend: 90% completo
- **Frontend: 100% completo** ✅
- Testing: 5% completo
- Deployment: 0% completo
- Documentación: 30% completa

**Última actualización**: 16 de octubre de 2025


Implementación Completada

  Backend (packages/backend/):

  1. Schema GraphQL (src/schema.ts):
    - ✅ Nuevo tipo CreateUsuarioFromMiembroResult con usuario y password temporal
    - ✅ Input CreateUsuarioFromMiembroInput (miembroId + rol)
    - ✅ Mutation createUsuarioFromMiembro
  2. Resolver de Usuarios (src/resolvers/usuario.resolvers.ts):
    - ✅ Función generarPasswordSegura() - genera contraseñas de 14 caracteres
    - ✅ Mutation createUsuarioFromMiembro:
        - Verifica que el usuario actual sea CEA o COLABORADOR
      - Valida que el miembro tenga email
      - Verifica que el email no esté en uso
      - Genera contraseña temporal segura
      - Crea el usuario y lo vincula al miembro
      - Retorna usuario y contraseña temporal
  3. Miembro Resolver (src/resolvers/miembro.resolvers.ts):
    - ✅ Protección contra eliminación de miembros vinculados a usuarios CEA
  4. Index de Resolvers (src/resolvers/index.ts):
    - ✅ Agregado usuarioResolvers.Mutation al objeto de mutations

  Frontend (packages/web/):

  1. Query de Miembros (src/pages/MiembrosPage.tsx):
    - ✅ Agregado campo usuario { id email rol activo } al query
  2. Mutation y Estado:
    - ✅ Mutation CREATE_USUARIO_FROM_MIEMBRO
    - ✅ Estados del modal de invitación
    - ✅ Hook useAuth() para obtener rol del usuario actual
  3. Columna "Estado de Cuenta":
    - ✅ Muestra ✅ {rol} si tiene cuenta
    - ✅ Muestra 🔒 Sin acceso si no tiene cuenta
  4. Botón de Invitar:
    - ✅ Solo visible para CEA y COLABORADOR
    - ✅ Solo aparece si el miembro no tiene usuario vinculado
    - ✅ Valida que el miembro tenga email antes de abrir modal
  5. Modal de Invitación (dos vistas):
    - Vista 1 - Selección de Rol:
        - Muestra información del miembro
      - Selector de rol (CEA, COLABORADOR, VISITANTE)
      - Descripción de permisos por rol
      - Botones Cancelar / Crear Usuario
    - Vista 2 - Credenciales Generadas:
        - ✅ Checkmark verde
      - Email, contraseña temporal y rol
      - Advertencia para guardar las credenciales
      - Instrucciones para próximos pasos
      - Botón Cerrar

  🎯 Cómo funciona:

  1. Usuario CEA/COLABORADOR va al catálogo de Miembros
  2. Ve la columna "Estado de Cuenta" que muestra si el miembro tiene acceso
  3. Click en "📧 Invitar" en un miembro sin acceso
  4. Selecciona el rol (CEA/COLABORADOR/VISITANTE)
  5. Click en "Crear Usuario"
  6. El sistema genera una contraseña segura de 14 caracteres
  7. Se muestra el modal con las credenciales generadas
  8. El administrador copia y envía las credenciales al usuario de forma segura

  📝 Próximos pasos sugeridos (no implementados):

  - Envío automático de emails con las credenciales
  - Función para que el usuario cambie su contraseña en el primer login
  - Opción para revocar acceso (desactivar usuario)