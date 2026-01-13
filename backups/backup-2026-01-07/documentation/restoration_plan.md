# Plan de Restauración Completa - Proyecto ComexIA

## 🎯 Objetivo
Restaurar el proyecto ComexIA a su estado funcional completo con TODAS las características que tenías funcionando antes.

## 📋 Estado Actual vs. Objetivo

### HS Codes
- ✅ **Actual**: 1,552 códigos HS
- ❌ **Objetivo**: 2,500 códigos HS
- 🔧 **Acción**: Agregar ~948 códigos HS faltantes

### Marketplace & Perfiles
- ❌ **Actual**: 2 empresas, 1 publicación
- ✅ **Objetivo**: Perfiles completos de empresas Y empleados
- 🔧 **Acción**: 
  - Crear seeds con 50+ empresas demo
  - Crear perfiles de empleados (contactos clave)
  - Poblar marketplace con 100+ publicaciones

### Sistema Premium & Suscripciones
- ❌ **Actual**: 0 suscripciones, sistema NO funcional
- ✅ **Objetivo**: Chat premium, verificaciones, planes activos
- 🔧 **Acción**:
  - Implementar tabla `verifications` (falta en DB)
  - Crear sistema de suscripciones funcional
  - Integrar Stripe/MercadoPago para pagos
  - Implementar restricciones premium en chat

### Admin Dashboard
- ⚠️ **Actual**: UI existe pero sin datos
- ✅ **Objetivo**: Dashboard funcional como "DIOSA"
- 🔧 **Acción**:
  - Crear tabla `verifications`
  - Poblar con datos de prueba
  - Implementar aprobación/rechazo de verificaciones
  - Panel de gestión de suscripciones

### Canal de Noticias
- ⚠️ **Actual**: UI existe pero vacío
- ✅ **Objetivo**: Noticias regulatorias reales
- 🔧 **Acción**:
  - Crear tabla `news` o seed con noticias
  - Integrar fuentes oficiales (SENASA, AFIP, etc.)
  - Sistema de categorización

### Documentación Regulatoria
- ⚠️ **Actual**: 193 países con requisitos base
- ✅ **Objetivo**: Documentación COMPLETA por país/producto
- 🔧 **Acción**:
  - Expandir `country_requirements`
  - Agregar documentos específicos por HS Code
  - Integrar con regulatory engine

---

## 🚀 Plan de Implementación

### Fase 1: Completar Base de Datos (Prioridad ALTA)

#### 1.1 Agregar HS Codes Faltantes (~948 códigos)
```bash
# Crear seed con códigos faltantes de capítulos 96-99
database/seeds/seed-missing-hs-codes.ts
```

**Capítulos a completar**:
- Cap 96: Manufacturas diversas (50 códigos)
- Cap 97: Objetos de arte (20 códigos)
- Cap 98: Proyectos especiales (10 códigos)
- Cap 99: Reservas (5 códigos)
- **Expandir capítulos existentes** con subpartidas de 6 y 8 dígitos (863 códigos)

#### 1.2 Crear Tabla `verifications`
```sql
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'company' | 'employee'
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  verification_type TEXT,
  documents TEXT, -- JSON array
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  reviewed_by TEXT
);
```

#### 1.3 Crear Tabla `news`
```sql
CREATE TABLE news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  category TEXT, -- 'regulacion' | 'logistica' | 'mercado'
  source TEXT,
  image_url TEXT,
  date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.4 Poblar Empresas y Empleados
```typescript
// seed-companies-employees.ts
- 50 empresas verificadas (frigoríficos, exportadoras, importadoras)
- 200 empleados (4 por empresa promedio)
- Roles: CEO, Sales Manager, Logistics Manager, Quality Manager
```

#### 1.5 Poblar Marketplace
```typescript
// seed-marketplace-full.ts
- 100 publicaciones activas
- Mix de ofertas y demandas
- Productos variados (carne, soja, maquinaria, etc.)
```

---

### Fase 2: Implementar Sistema Premium

#### 2.1 Migrar Schema para Suscripciones
```typescript
// Actualizar schema-sqlite.ts
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  company_id: text('company_id').notNull(),
  plan: text('plan').notNull(), // 'pyme' | 'corporate'
  status: text('status').default('active'),
  employees: integer('employees').default(1),
  max_employees: integer('max_employees'),
  monthly_revenue: integer('monthly_revenue'),
  start_date: integer('start_date', { mode: 'timestamp' }),
  next_billing_date: integer('next_billing_date', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
});
```

#### 2.2 Implementar Restricciones Premium en Chat
```typescript
// backend/routes/chat.ts
- Verificar suscripción antes de permitir contacto
- Limitar mensajes para usuarios free
- Desbloquear contactos directos para premium
```

#### 2.3 Integrar Pagos (Stripe o MercadoPago)
```typescript
// backend/routes/billing.ts
- POST /api/billing/checkout
- POST /api/billing/webhook
- GET /api/billing/subscription
```

---

### Fase 3: Completar Funcionalidades

#### 3.1 Admin Dashboard Funcional
- ✅ Aprobar/Rechazar verificaciones
- ✅ Gestionar suscripciones
- ✅ Ver estadísticas en tiempo real
- ✅ Moderar publicaciones del marketplace

#### 3.2 Canal de Noticias
- Seed con 50+ noticias regulatorias
- Categorización automática
- Búsqueda y filtros
- Fuentes oficiales (SENASA, AFIP, INDEC, etc.)

#### 3.3 Documentación Regulatoria Completa
- Expandir `country_requirements` a 500+ entradas
- Documentos específicos por HS Code
- Guías paso a paso para exportación

---

### Fase 4: Testing y Verificación Local

#### 4.1 Verificar Localmente
```bash
npm run dev
# Abrir http://localhost:5173
# Probar TODAS las funcionalidades:
- Búsqueda de 2500 HS codes
- Perfiles de empresas y empleados
- Marketplace con 100+ publicaciones
- Chat premium (restricciones)
- Admin dashboard (aprobar verificaciones)
- Noticias (50+ artículos)
```

#### 4.2 Seed Completo
```bash
# Crear script maestro
npm run seed:all
```

---

### Fase 5: Deployment a Vercel (DESPUÉS de verificar local)

#### 5.1 Subir a Turso
```bash
npx tsx upload-to-turso.ts
```

#### 5.2 Configurar Vercel
- Variables de entorno (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)
- Ignorar errores TS (ya configurado)

#### 5.3 Deploy
```bash
git add .
git commit -m "feat: restore complete project with 2500 HS codes, premium features, admin dashboard"
git push
```

---

## 📦 Archivos a Crear

### Seeds
1. `database/seeds/seed-missing-hs-codes.ts` - 948 códigos faltantes
2. `database/seeds/seed-companies-employees.ts` - 50 empresas + 200 empleados
3. `database/seeds/seed-marketplace-full.ts` - 100 publicaciones
4. `database/seeds/seed-news.ts` - 50 noticias
5. `database/seeds/seed-verifications.ts` - 20 verificaciones pendientes
6. `database/seeds/seed-subscriptions.ts` - 10 suscripciones activas
7. `database/seeds/seed-regulatory-docs-complete.ts` - 500+ requisitos

### Migraciones
1. `database/migrations/add-verifications-table.ts`
2. `database/migrations/add-news-table.ts`

### Backend
1. `backend/routes/billing.ts` - Sistema de pagos
2. `backend/middleware/premium-check.ts` - Verificar suscripción

---

## ⏱️ Estimación de Tiempo

- **Fase 1**: 3-4 horas (seeds y migraciones)
- **Fase 2**: 2-3 horas (sistema premium)
- **Fase 3**: 2 horas (completar funcionalidades)
- **Fase 4**: 1 hora (testing)
- **Fase 5**: 30 min (deployment)

**TOTAL**: ~9 horas de trabajo

---

## ✅ Checklist de Verificación Final

Antes de deployar a Vercel, verificar que TODO funcione localmente:

- [ ] 2,500 códigos HS en base de datos
- [ ] 50+ empresas con perfiles completos
- [ ] 200+ empleados (contactos clave)
- [ ] 100+ publicaciones en marketplace
- [ ] Chat premium con restricciones
- [ ] Admin dashboard funcional
  - [ ] Aprobar/rechazar verificaciones
  - [ ] Gestionar suscripciones
  - [ ] Ver estadísticas
- [ ] 50+ noticias en canal
- [ ] 500+ requisitos regulatorios
- [ ] Sistema de pagos integrado
- [ ] Perfiles de empleados accesibles

---

## 🎯 Próximo Paso

**¿Quieres que comience con la Fase 1 (completar base de datos) o prefieres que primero creemos un backup completo del estado actual?**
