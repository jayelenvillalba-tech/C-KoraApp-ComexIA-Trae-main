# Restauración Completa del Proyecto ComexIA

## ✅ Auditoría Completa FINALIZADA
## 🚨 Resolución de Regresiones (Prioridad Inmediata)
- [x] Restaurar funcionalidad de Login/Registro (Soporte legacy password)
- [x] Corregir duplicidad en Buscador HS Code (Refactor HsCodeSearch)
- [x] Corregir superposición visual en resultados de búsqueda (UI Overlay Fix)
- [x] Corregir mensaje confuso en Modal de Auth ("Acceso restringido hardcoded")
- [x] Corregir estado visual de login (Eliminar falso avatar 'U')
- [x] Corregir Fallo de Registro (Field Mismatch: userName -> name)
- [x] Implementar Autenticación Real (JWT Token + Endpoint /me)
- [x] Conectar Feed de Marketplace a API Real (Reemplazo de Mocks)
- [x] Restaurar datos de prueba (Seeding)
- [x] Resolver conflicto de dependencias 'Doppelganger' (backend/node_modules)
- [x] Restaurar servicio Frontend (Levantar servidor Vite)
- [x] Auditar backend routes (50+ endpoints encontrados)
- [x] Auditar frontend components (20 páginas, 30+ componentes)
- [x] Documentar código existente
- [x] Verificar sistema de chat (12 componentes, audio, transferencias, AI)
- [x] Verificar suscripciones (billing.ts completo)
- [x] Verificar verificaciones (modal + backend completo)
- [x] Verificar marketplace (estilo LinkedIn completo)

## Fase 1: Completar Base de Datos ✅ COMPLETA
- [x] Crear tabla `verifications`
- [x] Crear tabla `news`
- [x] Agregar 948 códigos HS faltantes (llegar a 2500) ✅ 2,500 EXACTOS
- [x] Poblar 50 empresas demo
- [x] Poblar 200 empleados (contactos clave)
- [x] Poblar 100 publicaciones marketplace
- [x] Poblar 50 noticias
- [x] Poblar 20 verificaciones pendientes
- [x] Poblar 10 suscripciones activas

## Fase 2: Verificar Integraciones Existentes
- [ ] Probar flujo completo de registro + suscripción
- [ ] Probar chat con audio (WebRTC)
- [ ] Probar transferencias de chat
- [ ] Probar chatbot AI
- [ ] Probar marketplace con búsqueda
- [ ] Probar calculadora de costos
- [ ] Probar verificaciones admin

## Fase 3: Completar Integraciones Faltantes (5%)
- [ ] Transcripción de llamadas (Whisper API)
- [ ] Almacenamiento temporal con autoborrado
- [ ] API keys de Stripe/MercadoPago
- [ ] Búsqueda inteligente avanzada (opcional)
- [ ] Comparación requisitos vs documentación

## Fase 4: Testing Local Completo
- [ ] Test registro empresa → suscripción → verificación
- [ ] Test publicar marketplace → contactar → chat
- [ ] Test llamada audio → transcripción
- [ ] Test transferir chat a tercero
- [ ] Test chatbot respuestas
- [ ] Test calculadora costos

## Fase 5: Deployment a Vercel
- [ ] Subir datos a Turso
- [ ] Configurar variables de entorno
- [ ] Deploy y verificación final

## Fase 6: Backup Completo 🛡️ (DESPUÉS de todo funcionar)
- [ ] Ejecutar script de backup automático
- [ ] Crear Git tag v1.0.0-stable
- [ ] Push a GitHub + crear Release
- [ ] Crear branch de backup (nunca tocar)
- [ ] Subir backup a Google Drive
- [ ] Subir backup a Dropbox
- [ ] Crear espejos en GitLab y Bitbucket
- [ ] Verificar restauración desde backup
- [ ] Documentar proceso de restauración
