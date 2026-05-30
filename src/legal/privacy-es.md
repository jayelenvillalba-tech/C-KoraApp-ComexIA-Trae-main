# Política de Privacidad
**Che.Comex — ComexIA**
Versión 1.2 | Vigente desde: 1 de junio de 2026
Última actualización: Mayo 2026

Esta Política cumple con:
- **Ley 25.326** de Protección de Datos Personales (Argentina) — AAIP
- **RGPD / GDPR** — Reglamento General de Protección de Datos (Unión Europea)
- **LGPD** — Lei Geral de Proteção de Dados (Brasil)
- Disposiciones aplicables de **CCPA** (California, EE.UU.)

---

## 1. Responsable del Tratamiento

**Empresa:** ComexIA (Che.Comex)
**Domicilio:** San Lorenzo, Santa Fe, Argentina
**Email de privacidad:** privacidad@checomex.com
**Responsable de Protección de Datos (DPO):** Jezabel Ayelén Villalba
**Autoridad de control (AR):** AAIP — aaip.gob.ar

---

## 2. Datos que Recopilamos

### 2.1 Datos que el Usuario nos proporciona directamente

- Nombre completo y datos de contacto (email, teléfono)
- Datos de la empresa (Razón Social, CUIT / CNPJ / Tax ID, domicilio fiscal, país)
- Documentos de verificación (habilitaciones, certificaciones de exportación)
- Contenido de publicaciones en el Marketplace (productos, precios, condiciones)
- Mensajes en el Chat colaborativo entre empresas
- Datos de facturación (procesados por Stripe/MercadoPago — no por nosotros)

### 2.2 Datos que recopilamos automáticamente

- Dirección IP y geolocalización aproximada (país/ciudad)
- Tipo de dispositivo, sistema operativo y navegador
- Páginas visitadas, tiempo de sesión y acciones realizadas en la Plataforma
- Datos de uso de la IA (consultas realizadas, sin contenido identificable)
- Cookies técnicas y de análisis (ver sección 8)

### 2.3 Datos que NO recopilamos

- Números de tarjetas de crédito (procesados directamente por Stripe/MercadoPago)
- Contraseñas en texto plano (almacenadas con hash bcrypt + salt)
- Datos biométricos
- Datos de menores de 18 años (la Plataforma está dirigida a empresas)

---

## 3. Finalidad del Tratamiento

| Dato | Finalidad | Base legal |
|------|-----------|------------|
| Datos de empresa | Verificación de identidad y compliance | Ejecución del contrato |
| Email | Comunicaciones del servicio y alertas | Ejecución del contrato |
| Datos de uso | Mejora del servicio y UX | Interés legítimo |
| Cookies analíticas | Estadísticas de uso anonimizadas | Consentimiento |
| Datos de deals | Historial de operaciones y auditoría | Ejecución del contrato |
| Datos agregados anonimizados | Entrenamiento de modelos de IA | Interés legítimo |
| IP + geolocalización | Seguridad y detección de fraude | Interés legítimo |
| Datos de pago (referencia) | Gestión de suscripciones | Ejecución del contrato |

---

## 4. Derechos del Usuario

De acuerdo con la legislación aplicable, el Usuario tiene derecho a:

**Acceso:** solicitar qué datos tenemos sobre su empresa y persona.

**Rectificación:** corregir datos inexactos o desactualizados.

**Supresión (Derecho al olvido):** solicitar el borrado completo de cuenta y datos. Disponible en **Configuración → Eliminar cuenta** o enviando email a privacidad@checomex.com. Nota: algunos datos pueden conservarse por obligaciones legales (ver sección 6).

**Portabilidad:** recibir sus datos en formato estructurado (JSON/CSV) para transferir a otro servicio.

**Oposición:** oponerse al tratamiento para fines de marketing o comunicaciones no esenciales.

**Limitación:** solicitar que limitemos el tratamiento mientras se resuelve una disputa.

**Plazo de respuesta:** 30 días hábiles (GDPR) / 15 días hábiles (Ley 25.326 AR)
**Contacto:** privacidad@checomex.com

---

## 5. Transferencias Internacionales de Datos

Che.Comex utiliza los siguientes servicios que pueden implicar transferencia internacional de datos:

| Proveedor | País | Finalidad | Garantías |
|-----------|------|-----------|-----------|
| Groq Inc. | Estados Unidos | Procesamiento de IA (consultas) | SCCs UE + DPA |
| Railway | Estados Unidos | Hosting del backend API | SCCs UE |
| Vercel Inc. | Estados Unidos | Hosting del frontend | SCCs UE |
| Stripe Inc. | Estados Unidos | Procesamiento de pagos (suscripciones) | SCCs UE + PCI-DSS |
| MercadoPago | Argentina | Procesamiento de pagos LATAM | Ley 25.326 AR |
| Ably | Reino Unido | Chat en tiempo real | GDPR compliant |

Todas las transferencias a EE.UU. se realizan bajo **Cláusulas Contractuales Estándar (SCCs)** aprobadas por la Comisión Europea.

---

## 6. Retención de Datos

| Tipo de dato | Período de retención |
|-------------|---------------------|
| Datos de cuenta activa | Mientras dure la relación contractual |
| Datos de cuenta cancelada | 5 años (obligación fiscal argentina) |
| Logs de seguridad y acceso | 12 meses |
| Mensajes de chat | 3 años o hasta eliminación de cuenta |
| Datos de deals y transacciones | 10 años (obligación aduanera argentina) |
| Cookies analíticas | 13 meses desde la última actividad |
| Registros de compliance (sanciones) | 7 años |

---

## 7. Seguridad

Che.Comex implementa las siguientes medidas técnicas y organizativas:

**Técnicas:**
- Cifrado en tránsito: TLS 1.3 para todas las conexiones
- Cifrado de contraseñas: bcrypt con salt único por usuario
- Base de datos SQLite con acceso restringido por credenciales
- Backups automáticos cifrados con retención de 30 días
- Rate limiting y protección contra ataques de fuerza bruta

**Organizativas:**
- Acceso a datos de producción limitado al equipo técnico esencial
- Revisión de dependencias de seguridad mediante npm audit
- Política de incidentes: notificación a usuarios afectados en 72 hs (GDPR)

---

## 8. Cookies

Che.Comex utiliza los siguientes tipos de cookies:

**Cookies esenciales** (no requieren consentimiento):
- `auth_token` / `token` — sesión de usuario autenticado
- `cookie_consent` — registro de tu decisión sobre cookies

**Cookies de análisis** (requieren consentimiento):
- Métricas de uso anonimizadas para mejorar la plataforma

Podés gestionar tus preferencias de cookies en cualquier momento desde el banner de cookies en el pie de la página o a través de la configuración de tu navegador.

---

## 9. Menores de Edad

La Plataforma está diseñada para empresas y personas mayores de 18 años. No recopilamos conscientemente datos de menores. Si detectamos que un menor ha creado una cuenta, la eliminaremos de inmediato.

---

## 10. Contacto y Reclamaciones

**Email:** privacidad@checomex.com
**Autoridad de control Argentina:** AAIP — [aaip.gob.ar](https://aaip.gob.ar)
**Autoridad de control UE:** La autoridad de protección de datos del país de residencia del Usuario
**Autoridad de control Brasil:** ANPD — [gov.br/anpd](https://www.gov.br/anpd)
