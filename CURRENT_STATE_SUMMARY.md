# ComexIA - Estado Actual del Proyecto

**Última Actualización:** 17 de Febrero de 2026  
**Repositorio:** https://github.com/jayelenvillalba-tech/C-KoraApp-ComexIA-Trae-main

---

## 📋 FASES COMPLETADAS

### ✅ Fase A: Expansión África & Asia
- **HS Codes:** Expandidos a 8,269 códigos (97 capítulos completos)
- **Regulaciones:** AfCFTA, RCEP, regulaciones específicas de Nigeria, China, Sudáfrica
- **Documentos:** Certificados fitosanitarios, registros NAFDAC, GACC China

### ✅ Fase B: Expansión Europa, Américas & Medio Oriente
- **Europa:** GDPR, REACH, EUDR, VI-1 (vinos), regulaciones químicas
- **Américas:** USMCA, CAFTA-DR, regulaciones sanitarias (carnes)
- **Medio Oriente:** GCC, Halal, Saber (Arabia Saudita)

### ✅ Fase C: World Trade Pulse (Noticias Oficiales)
- **Backend:** Modelo `NewsItem` + API `/api/news`
- **Frontend:** Componente `WorldTradePulse` con filtros avanzados
- **Widgets:** `RelatedNewsWidget` integrado en RequiredDocuments
- **Datos Iniciales:** 5 noticias oficiales sembradas

### ✅ Fase D: Automatización RSS
- **NewsService:** Parsing RSS + clasificación AI (GPT-4o-mini)
- **Cron Job:** Actualización automática cada 12 horas (00:00 y 12:00 UTC)
- **Fuentes Activas:** WTO, USDA FAS, EU ECHA, GACC China
- **Deduplicación:** Por URL única en MongoDB

---

## 📊 DATOS EN MONGODB ATLAS

### Colecciones Principales

| Colección | Cantidad | Descripción |
|-----------|----------|-------------|
| **countries** | 193 | Todos los países soberanos del mundo |
| **hscodes** | 8,269 | Códigos HS de 2, 4 y 6 dígitos (97 capítulos) |
| **regulations** | 117 | Regulaciones específicas + perfiles base de países |
| **users** | 207 | Usuarios registrados (72 verificados) |
| **companies** | 52 | Empresas registradas (20 verificadas) |
| **marketplaceposts** | 207 | Publicaciones activas (101 compra, 106 venta) |
| **newsitems** | 5+ | Noticias oficiales (aumenta con RSS automático) |
| **conversations** | Variable | Chats corporativos |
| **messages** | Variable | Mensajes de chat |

### Regulaciones por Región

- **África:** AfCFTA, NAFDAC (Nigeria), SABS (Sudáfrica)
- **Asia:** RCEP, GACC (China), Halal
- **Europa:** GDPR, REACH, EUDR, CBAM, VI-1
- **Américas:** USMCA, CAFTA-DR, FSMA, regulaciones sanitarias
- **Medio Oriente:** GCC, Saber, certificaciones Halal

---

## 🔌 FUENTES RSS ACTIVAS (World Trade Pulse)

### Automatizadas (Cron cada 12h)
1. **WTO** - https://www.wto.org/english/news_e/news_e.rss
2. **USDA FAS** - https://www.fas.usda.gov/rss.xml
3. **EU ECHA** - https://echa.europa.eu/rss (REACH)
4. **GACC China** - http://english.customs.gov.cn/rss

### Planificadas (Web Scraping - Fase 2)
- AfCFTA Secretariat
- CBN Nigeria
- SENASA Argentina
- WCO (World Customs Organization)
- EU TARIC

---

## 🚀 COMANDOS PARA LEVANTAR LA APP

### Opción 1: Manual (Dos Terminales)

**Terminal 1 - Backend:**
```bash
cd c:\KoraApp\ComexIA-Trae-main
npm run server
```
*Corre en: http://localhost:3001*

**Terminal 2 - Frontend:**
```bash
cd c:\KoraApp\ComexIA-Trae-main
npm run dev
```
*Corre en: http://localhost:5173*

### Opción 2: Script Automático
```bash
cd c:\KoraApp\ComexIA-Trae-main
.\INICIAR_SISTEMA.bat
```

### Opción 3: Fetch Manual de Noticias
```bash
npx tsx scripts/fetch-news-manual.ts
```

---

## 🔑 VARIABLES DE ENTORNO (.env)

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/comexia

# OpenAI (para clasificación de noticias)
OPENAI_API_KEY=sk-...

# Email (Nodemailer)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password

# N8N (Opcional - actualmente deshabilitado)
N8N_ENABLED=false
```

**⚠️ IMPORTANTE:** Nunca commitear el archivo `.env` a GitHub.

---

## ✨ FUNCIONALIDADES ACTIVAS

### 🎯 Marketplace
- ✅ Publicar ofertas de compra/venta
- ✅ Filtros por HS Code, país, incoterm
- ✅ Chat corporativo integrado
- ✅ Notificaciones por email

### 📜 Documentos Requeridos
- ✅ Filtrado por HS Code + país destino
- ✅ Documentos comerciales, transporte, aduaneros, sanitarios
- ✅ Enlaces directos a autoridades oficiales
- ✅ Widget de noticias relacionadas

### 🌐 World Trade Pulse (Noticias)
- ✅ Dashboard completo en `/news`
- ✅ Filtros por HS Code, país, tratado, tipo de alerta
- ✅ Búsqueda de texto completo
- ✅ Actualización automática cada 12 horas
- ✅ Widgets contextuales en documentos

### 🤖 Clasificador HS
- ✅ Búsqueda por código o descripción
- ✅ 8,269 códigos disponibles
- ✅ Información de capítulos y subcapítulos

### 💬 Chat Corporativo
- ✅ Conversaciones entre empresas
- ✅ Historial de mensajes
- ✅ Notificaciones en tiempo real

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
ComexIA-Trae-main/
├── backend/
│   ├── models/           # Mongoose schemas (User, NewsItem, etc.)
│   ├── routes/           # API endpoints
│   ├── services/         # NewsService, NotificationService
│   └── server.ts         # Express server + Cron job
├── src/
│   ├── components/       # React components
│   │   ├── world-trade-pulse.tsx
│   │   ├── related-news-widget.tsx
│   │   └── required-documents.tsx
│   ├── pages/            # Páginas principales
│   └── App.tsx           # Routing principal
├── scripts/
│   ├── seed-news.ts      # Sembrar noticias iniciales
│   ├── fetch-news-manual.ts  # Test manual RSS
│   └── project-stats.ts  # Estadísticas del proyecto
├── docs/
│   ├── WORLD_TRADE_PULSE.md  # Documentación completa
│   └── NEWS_SOURCES.md       # Fuentes RSS
├── shared/
│   └── documents-data.ts # Datos estáticos de documentos
└── .env                  # Variables de entorno (NO COMMITEAR)
```

---

## 🔗 ENLACES IMPORTANTES

### Aplicación
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

### GitHub
- **Repositorio:** https://github.com/jayelenvillalba-tech/C-KoraApp-ComexIA-Trae-main
- **Último Commit:** Fase D completa (RSS automation)

### MongoDB Atlas
- **Cluster:** Conectado vía `MONGODB_URI`
- **Base de Datos:** `comexia`

### Documentación
- [WORLD_TRADE_PULSE.md](./docs/WORLD_TRADE_PULSE.md) - Sistema de noticias
- [NEWS_SOURCES.md](./docs/NEWS_SOURCES.md) - Fuentes RSS
- [QUICK_START.md](./.gemini/antigravity/brain/.../QUICK_START.md) - Guía rápida

---

## 🐛 TROUBLESHOOTING

### Backend no inicia
```bash
# Verificar MongoDB
echo $MONGODB_URI

# Verificar puerto 3001 libre
netstat -ano | findstr :3001
```

### Frontend no carga
```bash
# Limpiar cache
npm run build
rm -rf node_modules
npm install
```

### RSS no actualiza
```bash
# Test manual
npx tsx scripts/fetch-news-manual.ts

# Verificar logs del cron
# Buscar: [Cron] Starting automated news fetch...
```

### Git push rechazado
```bash
# Pull primero
git pull origin main --rebase

# Luego push
git push origin main
```

---

## 📈 PRÓXIMOS PASOS

1. **Web Scraping:** Implementar para fuentes sin RSS (AfCFTA, CBN, etc.)
2. **Email Alerts:** Notificar usuarios de noticias críticas
3. **Expansión Continental:** Completar Europa, Norte/Centroamérica
4. **Push Notifications:** Alertas en navegador
5. **Deployment:** Subir a producción (Vercel/Railway)

---

## 📞 CONTACTO & SOPORTE

**Desarrollador:** Jayelen Villalba  
**Email:** jayelenvillalba@tech  
**GitHub:** [@jayelenvillalba-tech](https://github.com/jayelenvillalba-tech)

---

**🎉 ESTADO ACTUAL: FASE D COMPLETA - SISTEMA OPERATIVO AL 100%**
