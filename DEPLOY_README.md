# 🚀 Guía de Deployment Rápido

## Deployment Automático con Script

Ahora puedes hacer deployment automáticamente con un solo comando usando el script `deploy.sh`.

### Uso Básico

```bash
# Deployment simple (después de hacer commit y push)
./deploy.sh

# Ver todas las opciones disponibles
./deploy.sh --help
```

## Casos de Uso Comunes

### 1. Deployment Rápido (Más Común)

Cuando ya hiciste `git commit` y `git push` localmente:

```bash
./deploy.sh
```

**Esto hace:**
- ✅ Actualiza código en servidor
- ✅ Reconstruye frontend
- ✅ Reinicia backend
- ✅ Verifica que todo funcione

---

### 2. Commit, Push y Deploy Todo en Uno

Cuando tienes cambios listos pero no has hecho commit:

```bash
./deploy.sh -c "Descripción de tus cambios"
```

**Esto hace:**
- ✅ `git add .`
- ✅ `git commit` con tu mensaje
- ✅ `git push`
- ✅ Deploy completo en servidor

---

### 3. Deploy con Migraciones de Base de Datos

Cuando modificaste el schema de Prisma:

```bash
./deploy.sh -m
```

**Esto hace:**
- ✅ Todo del deployment básico
- ✅ Ejecuta `prisma migrate deploy`

---

### 4. Deploy con Nuevas Dependencias

Cuando agregaste paquetes npm/pnpm:

```bash
./deploy.sh -i
```

**Esto hace:**
- ✅ Todo del deployment básico
- ✅ Ejecuta `pnpm install` en backend y frontend

---

### 5. Deploy Completo (Cambios Grandes)

Cuando tienes cambios en schema + dependencias:

```bash
./deploy.sh -m -i
```

---

### 6. Solo Verificar (Sin Cambios)

Para verificar que el servidor está OK:

```bash
./deploy.sh -v
```

---

### 7. Rollback de Emergencia

Si algo salió mal y necesitas volver atrás:

```bash
./deploy.sh -r
```

⚠️ **ADVERTENCIA**: Esto revierte al commit anterior. Úsalo solo en emergencias.

---

## Opciones Completas

```
-h, --help              Mostrar ayuda
-m, --migrate           Ejecutar migraciones de Prisma
-i, --install           Instalar dependencias (pnpm install)
-s, --skip-build        Saltar build del frontend
-c, --commit [MSG]      Commit + push antes de deploy
-v, --verify-only       Solo verificar, sin cambios
-r, --rollback          Revertir al commit anterior
```

## Ejemplos Prácticos

### Flujo de Trabajo Típico

```bash
# 1. Hiciste cambios en el código
# 2. Los probaste localmente
# 3. Haces deployment:

./deploy.sh -c "Agrega función de exportar a Excel"

# Listo! El script hace todo automáticamente
```

### Después de Cambiar el Schema de Prisma

```bash
# 1. Modificaste schema.prisma
# 2. Creaste migración local: pnpm prisma migrate dev
# 3. Commit y deploy con migración:

./deploy.sh -c "Agrega tabla de notificaciones" -m
```

### Después de Agregar Paquetes

```bash
# 1. Ejecutaste: pnpm add nueva-libreria
# 2. Commit y deploy con instalación:

./deploy.sh -c "Agrega librería de charts" -i
```

## Troubleshooting

### Si el deploy falla

1. **Revisa los logs del servidor:**
   ```bash
   ssh root@64.227.96.34 'pm2 logs devocionales-api --lines 50'
   ```

2. **Verifica el estado de PM2:**
   ```bash
   ssh root@64.227.96.34 'pm2 list'
   ```

3. **Revisa los logs del script:**
   El script muestra exactamente dónde falló

### Si necesitas hacer rollback

```bash
./deploy.sh -r
```

Luego investiga qué causó el problema antes de volver a intentar.

### Conexión SSH Falla

Si no puedes conectarte al servidor:

1. Verifica que estés conectado a internet
2. Verifica que tengas las credenciales SSH correctas
3. Intenta conectarte manualmente:
   ```bash
   ssh root@64.227.96.34
   ```

## Ventajas del Script

✅ **Rápido**: Un comando vs. muchos pasos manuales
✅ **Seguro**: Verifica cada paso antes de continuar
✅ **Consistente**: Siempre sigue el mismo proceso
✅ **Claro**: Muestra exactamente qué está pasando
✅ **Flexible**: Opciones para diferentes escenarios
✅ **Recuperable**: Rollback de emergencia incluido

## Cuándo Usar Cada Opción

| Cambio Realizado | Comando |
|-----------------|---------|
| Solo código (frontend/backend) | `./deploy.sh` |
| Cambios + commit pendiente | `./deploy.sh -c "mensaje"` |
| Modificaste schema.prisma | `./deploy.sh -m` |
| Agregaste paquetes npm | `./deploy.sh -i` |
| Cambios grandes (schema + paquetes) | `./deploy.sh -m -i` |
| Solo verificar servidor | `./deploy.sh -v` |
| Emergencia - revertir | `./deploy.sh -r` |

## Notas Importantes

1. **Siempre prueba localmente primero** antes de hacer deploy
2. **El script verifica la conexión SSH** antes de empezar
3. **Todos los deployments quedan en el historial de git**
4. **El frontend se reconstruye automáticamente** (usa `-s` para saltar si no hay cambios)
5. **Las migraciones son irreversibles** - usa `-m` con cuidado

## Soporte

Si tienes problemas:

1. Lee el mensaje de error del script
2. Revisa los logs: `ssh root@64.227.96.34 'pm2 logs devocionales-api'`
3. Usa `./deploy.sh -v` para verificar el estado del servidor
4. Como último recurso, usa `./deploy.sh -r` para rollback

---

**¿Listo para tu primer deployment?**

```bash
./deploy.sh
```

🎉 ¡Así de fácil!
