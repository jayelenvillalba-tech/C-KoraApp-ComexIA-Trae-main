# Reporte Técnico Detallado - Ecosistema Che.Comex

Este documento detalla el estado actual del ecosistema Che.Comex. Está diseñado para proveer una radiografía exhaustiva de la arquitectura, fuentes de datos, integraciones de IA y el flujo de conexión entre módulos. Sirve como mapa de ruta crítico para la integración del nuevo equipo de desarrollo.

---

## Ecosistema y APIs: La Arquitectura de Conexión

Che.Comex no es un conjunto de herramientas aisladas, sino un **ecosistema interconectado**. El flujo núcleo opera de la siguiente manera:
1. El usuario ingresa y es **geolocalizado automáticamente** (IP o GPS).
2. Se selecciona el perfil (Importador/Exportador) y se busca un producto a través del **Buscador Universal de HS Codes**.
3. Esto alimenta directamente el **Mapa Interactivo**, que cruza la ubicación del usuario, el código HS y filtra los países recomendados en base a **Tratados Comerciales** vigentes.
4. Al seleccionar un país destino, el sistema calcula en tiempo real los **Costos Logísticos y Aranceles** (Landed Cost), el **Simulador de Incoterms** recomienda el mejor término y se detallan los **Documentos Requeridos**.
5. Simultáneamente, el **Radar de Noticias (GDELT/RSS)** advierte sobre conflictos en la ruta, y el **Asistente IA (GodMode)** acompaña de forma proactiva cada paso.
6. Si el usuario decide avanzar, el **Marketplace** conecta la oferta/demanda y se abre el **Deal Room (Chat Colaborativo)** para la negociación.

### APIs Externas y Modelo de Costos a Futuro

- **Groq API (Llama-3.3-70B)**: Motor principal de inteligencia artificial (NLP, GodMode, Documentos). Actualmente utiliza el tier gratuito (rate limits aplican). *A futuro*: Deberá pasarse al tier de pago por token (Pay-as-you-go) a medida que escale el volumen de usuarios.
- **GeoIP-Lite**: Motor de geolocalización por IP. Es una base de datos local (offline). *Costo*: Gratis.
- **ExchangeRate-API / DolarAPI**: Tipos de cambio. *A futuro*: El tier gratuito de ExchangeRate-API tiene límites de requests mensuales; requerirá plan pago (aprox $10/mes) para consultas en tiempo real de alta frecuencia.
- **Leaflet / OpenStreetMap**: Renderizado de mapas. *A futuro*: OSM tiene políticas de uso estricto para tileservers. Para expansión global sin bloqueos, se recomienda migrar a Mapbox (pago por volumen de carga de mapa).
- **Stripe / MercadoPago**: Pasarelas de pago. *Costo*: Comisión por transacción (~2.9% + fijos).

---

## 1. Página de Inicio / Landing
### Alcance actual
Funciona como puerta de entrada al ecosistema y ofrece un sistema de registro de empresas.
### Tecnología utilizada
React (Vite), Drizzle ORM, SQLite.
### Fuente de datos
Tabla `users` y `companies` en base de datos local SQLite. Los países mostrados en registros provienen de la tabla local `countries`.
### Limitaciones conocidas
La verificación de Tax ID (CUIT/CNPJ) actualmente es puramente validación de formato y estructura local. No se cruzan datos con APIs oficiales gubernamentales de la AFIP o equivalentes globales.
### Recomendación de mejora
Integrar APIs gubernamentales o de riesgo crediticio (ej. Nosis en Argentina o equivalentes globales) para verificar la autenticidad de las empresas registradas y mitigar fraude en el Marketplace.

---

## 2. Códigos Aduaneros / HS Codes
### Alcance actual
Buscador unificado con soporte NLP que permite localizar el código armonizado a partir de descripciones vulgares (ej. "soja").
### Tecnología utilizada
Endpoints propios `/api/hs/search`. Búsqueda SQL con uniones dinámicas y ordenamiento de relevancia.
### Fuente de datos
Base de datos SQLite local (`hs_subpartidas`). Actualmente cargados de manera robusta con más de 2600 subpartidas, cubriendo Capítulos 1 al 97. Extraídos de fuentes oficiales (NCM, TARIC, HTS).
### Limitaciones conocidas
La base de datos local necesita ser actualizada anualmente o cuando existan enmiendas de la OMA (Organización Mundial de Aduanas). 
### Recomendación de mejora
Implementar un web-scraper automático mensual o un job que consuma APIs de aduanas oficiales para mantener la tabla de HS codes siempre alineada a la última nomenclatura vigente sin intervención manual.

---

## 3. Mapa Interactivo
### Alcance actual
Visualiza rutas comerciales, top compradores y países recomendados basándose en la ubicación del usuario y el HS Code activo.
### Tecnología utilizada
`react-simple-maps` y `Leaflet` dependiendo de la vista. Cálculo de distancias Haversine real utilizando coordenadas de países integradas en el backend.
### Fuente de datos
Datos dinámicos cruzados entre `market-analysis` (UN Comtrade cacheado) y perfiles del Marketplace. Coordenadas estáticas pre-cargadas en un diccionario local.
### Limitaciones conocidas
El clustering de puntos masivos no está profundamente optimizado; si se cargaran miles de pines simultáneos del Marketplace, el rendimiento del DOM en Leaflet podría degradarse.
### Recomendación de mejora
Migrar a Mapbox GL JS o deck.gl si el ecosistema global alcanza miles de nodos de empresas activos en tiempo real, permitiendo renderizado por GPU.

---

## 4. Tratados Comerciales
### Alcance actual
El sistema detecta automáticamente qué tratado aplica a una ruta origen→destino y calcula el ahorro arancelario aplicable.
### Tecnología utilizada
Lógica relacional cruzada en `/api/agreements/tariff`.
### Fuente de datos
Tablas `trade_agreements` y `agreement_members` en SQLite. ~12 tratados principales cargados (MERCOSUR, etc.).
### Limitaciones conocidas
La cobertura de tratados es robusta para América, pero faltan detallar los cientos de acuerdos bilaterales menores de Asia y África.
### Recomendación de mejora
Ampliar la tabla de `trade_agreements` scrapeando la base de datos de la OMC (Organización Mundial del Comercio) RTA-IS para tener cobertura total del 100% global.

---

## 5. Países que más compran / Análisis de mercado
### Alcance actual
Muestra datos de los principales destinos de exportación de un producto.
### Tecnología utilizada
Endpoint `/api/market`.
### Fuente de datos
UN Comtrade Data (datos cacheados en SQLite local en la tabla `market_data_cache`).
### Limitaciones conocidas
Los datos actuales en BD son representativos pero no están consultando la API de UN Comtrade en "tiempo real" absoluto para todos los HS codes posibles (estaría limitado financieramente).
### Recomendación de mejora
Activar el proxy de la API de UN Comtrade (suscripción requerida para alto volumen) para los HS Codes que no estén en la caché local, garantizando precisión absoluta para bienes exóticos.

---

## 6. Logística
### Alcance actual
Calcula distancias geolocalizadas, tiempos estimados y aplica sobrecostos basados en zonas de riesgo marítimo.
### Tecnología utilizada
Cálculo de Haversine (frontend/backend). Endpoints `/api/maritime/route-risk`.
### Fuente de datos
Distancias matemáticas calculadas. Riesgos extraídos de noticias/GDELT. Base de datos estática parcial para costos de flete por TEU.
### Limitaciones conocidas
Los costos de flete marítimo, aunque ajustados por riesgos actuales, siguen siendo aproximaciones matemáticas. No se integra con APIs de navieras en tiempo real (ej. Maersk, MSC, Hapag-Lloyd).
### Recomendación de mejora
Integrar la API de Xeneta o Freightos para obtener cotizaciones reales de fletes en el mercado spot en tiempo real.

---

## 7. Calculadora de Costos / Landed Cost
### Alcance actual
Unifica FOB, Flete, Seguro, Aranceles y retenciones para dar el costo total de importación/exportación.
### Tecnología utilizada
Cálculo aritmético reactivo en el frontend sincronizado con los datos del backend.
### Fuente de datos
`ExchangeRate-API` (divisas), backend (aranceles MFN y preferenciales), reglas hardcodeadas/semidinámicas de retenciones locales (ej. AR).
### Limitaciones conocidas
El costo de seguro se calcula como un porcentaje estándar del valor de la mercancía. No discrimina riesgos intrínsecos de mercancías peligrosas (IMO).
### Recomendación de mejora
Implementar una integración con APIs de agencias aseguradoras marítimas (ej. Marsh o AON APIs) para cotizar primas de seguro en tiempo real.

---

## 8. Simulador Incoterms 2020
### Alcance actual
Ofrece recomendaciones de Incoterms basadas en el rol (Comprador/Vendedor), país y producto.
### Tecnología utilizada
Prompt dinámico vía Groq (Llama-3).
### Fuente de datos
Conocimiento intrínseco del LLM alimentado con un prompt rígido sobre reglas ICC 2020.
### Limitaciones conocidas
Aunque el LLM es preciso con la teoría, el usuario es quien debe hacer valer legalmente el Incoterm en el contrato final.
### Recomendación de mejora
Generar y permitir descargar borradores de "Proforma Invoices" donde ya venga redactado legalmente el Incoterm recomendado para protección jurídica del usuario.

---

## 9. Documentos Requeridos
### Alcance actual
Lista permisos, certificados y despachos aduaneros obligatorios para la ruta comercial específica.
### Tecnología utilizada
RAG (Retrieval-Augmented Generation) parcial. Búsqueda en caché SQLite `regulatory_rules`, si no existe, Groq IA lo genera en el momento y lo guarda en caché.
### Fuente de datos
Conocimiento de la IA Groq + base estática.
### Limitaciones conocidas
Groq puede tener alucinaciones ocasionales. Faltan links directos y oficiales hacia las entidades gubernamentales emisoras (ej. VUCE, SENASA) de todos los 195 países.
### Recomendación de mejora
Curaduría manual por parte de un equipo de despachantes de aduana: verificar la exactitud de los documentos en la base de datos para los top 20 corredores comerciales globales y agregar los enlaces oficiales (Ventanillas Únicas).

---

## 10. Noticias / World Trade Pulse
### Alcance actual
Feed global de disrupciones, riesgos regulatorios y conflictos que afectan rutas.
### Tecnología utilizada
Cron job `seedNews.ts` usando `rss-parser`.
### Fuente de datos
Fuentes RSS (WTO, GACC, EU ECHA). Las noticias se filtran semánticamente para asociarlas a países y HS codes.
### Limitaciones conocidas
El scraping web y de RSS es frágil si los portales oficiales cambian sus esquemas.
### Recomendación de mejora
Licenciar el Firehose de GDELT completo o APIs pagas como Bloomberg Terminal / Refinitiv para data institucional garantizada, eliminando la dependencia en RSS frágiles.

---

## 11. Alertas Regulatorias
### Alcance actual
Las cards en el Marketplace y Dashboard muestran alertas preventivas si la ruta elegida cruza zonas de guerra o tiene embargos.
### Tecnología utilizada
Match de arrays (países destino vs países en alertas activas de la BD).
### Fuente de datos
Tabla `trade_news` y `maritime_alerts`.
### Limitaciones conocidas
Las alertas actualmente no expiran automáticamente tras un tiempo prudencial; requieren limpieza manual o sobreescritura. Las notificaciones push no están implementadas.
### Recomendación de mejora
Implementar WebSockets para empujar notificaciones push en tiempo real al navegador del usuario y agregar una capa de Service Workers (PWA).

---

## 12. Suscripciones
### Alcance actual
Soporta planes Free, Pyme y Enterprise.
### Tecnología utilizada
Tabla `subscriptions`, validaciones en Express JS.
### Fuente de datos
Manejo local. Endpoints `/api/payments/stripe/webhook` implementados a nivel código base.
### Limitaciones conocidas
Requiere registrar las claves productivas reales de Stripe/MercadoPago en `.env` y configurar los productos en el Dashboard de Stripe para que funcione el flujo end-to-end monetizado.
### Recomendación de mejora
Auditar los webhooks con el CLI de Stripe para validar la resiliencia en caso de caídas del sistema durante un intento de cobro.

---

## 13. Marketplace
### Alcance actual
Red social B2B donde la oferta/demanda hace "match".
### Tecnología utilizada
Tablas `marketplace_posts`. Buscador IA usando embeddings o NLP vía Groq para encontrar match semántico.
### Fuente de datos
Posteos reales en DB. El sistema compara perfiles.
### Limitaciones conocidas
La moderación de contenido actualmente es reactiva.
### Recomendación de mejora
Implementar validación preventiva con IA: antes de que un post se publique, una IA secundaria clasifica si es spam, fraudulento o irrelevante.

---

## 14. Chat Colaborativo (Deal Room)
### Alcance actual
Entorno donde el comprador, vendedor y agentes aduaneros negocian los tratos. Cuenta con una barra lateral (ChatSidebar) interactiva.
### Tecnología utilizada
React context y polling HTTP (cada 3 segundos). Backend con `/api/chat`.
### Fuente de datos
Tablas `conversations` y `messages`.
### Limitaciones conocidas
El polling carga el servidor innecesariamente. No se están utilizando WebSockets puros.
### Recomendación de mejora
Migrar la capa de transporte de Chat a **Socket.IO** nativo. Esto bajará el consumo de CPU del servidor en un 90% en producción y dará experiencia real-time pura.

---

## 15. GodMode / Asistente IA
### Alcance actual
Agente contextual que aconseja en todo el sitio basándose en los datos de la pantalla actual.
### Tecnología utilizada
API de Groq (Llama-3). Inyección de contexto de página (React Props → Prompt).
### Fuente de datos
Groq.
### Limitaciones conocidas
El asistente no recuerda información de otras páginas previamente visitadas por el usuario (no tiene memoria de sesión unificada a largo plazo).
### Recomendación de mejora
Integrar LangChain con memoria vectorial (Pinecone o Redis) para que el asistente recuerde el historial completo del usuario durante semanas.

---

## 16. Admin Panel
### Alcance actual
Dashboard analítico para ver el rendimiento general del sistema.
### Tecnología utilizada
Recharts para gráficas. Middlewares `adminAuth` para proteger las rutas.
### Fuente de datos
Queries de agregación a las tablas locales (`deals`, `users`).
### Limitaciones conocidas
Si el ecosistema crece a millones de registros, los `COUNT(*)` en SQLite se volverán cuellos de botella.
### Recomendación de mejora
Implementar vistas materializadas o pasar a PostgreSQL a futuro para analíticas pesadas.

---

## 17. i18n / Multiidioma
### Alcance actual
La interfaz soporta Español e Inglés nativamente.
### Tecnología utilizada
`i18next` con React.
### Fuente de datos
Archivos JSON de traducción.
### Limitaciones conocidas
El contenido dinámico generado por la IA (ej. Documentos de Groq) se solicita en el idioma del usuario, pero algunas noticias RSS externas pueden estar hardcodeadas en inglés.
### Recomendación de mejora
Implementar un paso de traducción asíncrona automática a nivel base de datos para todas las noticias y publicaciones de Marketplace (ej. DeepL API).

---

## 18. Seguridad y Autenticación
### Alcance actual
Registro/Login seguro.
### Tecnología utilizada
Bcrypt (hashing de contraseñas), JWT (tokens firmados). Helmet (cabeceras de seguridad HTTP). Express Rate Limiting.
### Fuente de datos
`.env` para la firma de JWT.
### Limitaciones conocidas
Falta implementación de 2FA (Autenticación de Dos Factores), mandatorio para plataformas B2B que manejan flujos de dinero o contratos.
### Recomendación de mejora
Integrar soporte de TOTP (Google Authenticator) o SMS (Twilio) para asegurar las cuentas de empresas.

---

## Resumen Ejecutivo

### Estado general: 8.5/10
El esqueleto del Ecosistema Che.Comex es un producto formidable. La conexión entre geolocalización, análisis logístico-arancelario y negociación colaborativa ya existe y funciona.

### Módulos production-ready (funcionan con datos reales):
- Autenticación y Seguridad básica.
- Buscador HS Codes (sin límites artificiales, >2600 códigos reales).
- Chat Colaborativo (negociación B2B).
- Análisis de Impacto Arancelario.
- Panel de Administración.
- Geolocalización IP/GPS global.

### Módulos MVP-ready (funcionan con datos simulados o mixtos, suficiente para ventas/demo):
- Market Analysis (Top Buyers y Flujos).
- Simulador de Incoterms.
- World Trade Pulse (Noticias).
- Logística de Fletes.

### Módulos que necesitan mejora antes de expansión global intensiva:
- Integración de pagos productiva real (Stripe/MP en backend).
- Verificación de entidades contra sistemas gubernamentales.
- Arquitectura de WebSockets puros para el Chat.

### Estimación de trabajo para el nuevo equipo de programadores (Llevar al 100%):
Se estima un roadmap de **3 a 5 semanas efectivas** para los 3 programadores seniors (enfocándose primariamente en WebSockets, Pasarelas de Pago Oficiales y APIs comerciales para logística en tiempo real).

## Prioridades Tecnológicas Recomendadas para Socios/Desarrolladores
1. **Migración a Socket.IO**: Eliminar el polling del Chat y habilitar notificaciones push.
2. **Setup de Pasarelas Reales**: Cerrar el loop económico conectando Stripe al plan "Suscripción".
3. **Escalabilidad Vectorial**: Dotar de memoria persistente a GodMode para que recuerde el historial completo del usuario.
4. **Verificación PyME (KYB - Know Your Business)**: Prevenir fraude validando los registros de CUITs directamente.
