# Plan de Implementación: Marketplace B2B Estilo LinkedIn

## Objetivo
Transformar el Marketplace B2B actual en una red social profesional similar a LinkedIn, pero enfocada en comercio internacional, con perfiles corporativos, feed de oportunidades comerciales, y verificación blockchain.

---

## 1. Cambios en la Base de Datos

### Nuevas Tablas

#### `company_profiles` (Perfiles Corporativos Mejorados)
```sql
- id
- name
- logo_url
- cover_image_url
- description (texto largo)
- industry
- company_size (PYME, Grande)
- headquarters_country
- headquarters_city
- founded_year
- website
- verified (boolean)
- blockchain_verified (boolean)
- employee_count
- products_offered (JSON array de códigos HS)
- products_seeking (JSON array de códigos HS)
- trade_treaties (JSON array)
- created_at
- updated_at
```

#### `company_employees` (Empleados de Empresas)
```sql
- id
- company_id (FK)
- user_id (FK)
- role (gerente_exportaciones, agente_aduanal, etc.)
- is_admin (boolean)
- permissions (JSON)
- created_at
```

#### `marketplace_posts` (Posts Estilo LinkedIn)
```sql
- id
- company_id (FK)
- author_user_id (FK)
- content (texto del post)
- hs_codes (JSON array)
- operation_type (oferta, demanda, consulta)
- required_documents (JSON array)
- contact_method (mensaje_directo, email, telefono)
- contact_info (JSON)
- blockchain_doc_hash (opcional)
- likes_count
- comments_count
- views_count
- is_featured
- expires_at
- created_at
- updated_at
```

#### `post_interactions` (Likes, Comentarios)
```sql
- id
- post_id (FK)
- user_id (FK)
- type (like, comment, share)
- comment_text (si es comentario)
- created_at
```

#### `company_connections` (Conexiones entre Empresas)
```sql
- id
- company_id_1 (FK)
- company_id_2 (FK)
- status (pending, accepted, rejected)
- created_at
- updated_at
```

#### `trade_opportunities` (Oportunidades Destacadas)
```sql
- id
- post_id (FK)
- relevance_score
- target_countries (JSON array)
- estimated_value
- urgency (baja, media, alta)
```

---

## 2. Estructura de la Interfaz

### Layout de 3 Columnas (Estilo LinkedIn)

#### **Columna Izquierda (Sidebar - Perfil)**
- Logo y nombre de la empresa
- Descripción breve
- Ubicación y tamaño
- Número de empleados
- Códigos HS principales
- Botón "Ver Perfil Completo"
- **Sección "Sugerencias de Conexión"**
  - Empresas similares
  - Potenciales socios comerciales
- **Feed de Noticias Rápidas**
  - Últimas regulaciones aduaneras
  - Cambios en tratados comerciales

#### **Columna Central (Feed Principal)**
- **Barra de Creación de Post**
  - "¿Qué oportunidad comercial querés compartir?"
  - Botones: Agregar HS Code, Documentos, Contacto
- **Feed de Posts**
  - Posts de empresas conectadas
  - Oportunidades relevantes según perfil
  - Cada post muestra:
    - Logo y nombre de empresa
    - Contenido del post
    - Códigos HS mencionados (badges)
    - Documentos requeridos (con ícono blockchain si aplica)
    - Botón de contacto prominente
    - Likes, comentarios, compartir

#### **Columna Derecha (Widgets)**
- **World Trade Pulse**
  - Noticias globales de comercio
  - Alertas de sanciones
- **Eventos de Comercio Global**
  - Ferias, webinars, conferencias
- **Anuncios Relevantes**
  - Servicios de logística
  - Verificación de documentos
- **Grupos Sugeridos**
  - "Exportadores de Soya LATAM"
  - "Importadores UE"

---

## 3. Barra de Navegación Superior

### Elementos (de izquierda a derecha):
1. **Logo Che.Comex** (link a home)
2. **Barra de Búsqueda Global**
   - Placeholder: "Buscar empresas, productos, códigos HS..."
   - Búsqueda inteligente con IA
   - Filtros avanzados al hacer clic
3. **Menú de Navegación**
   - Home (feed)
   - Mi Red (conexiones)
   - Oportunidades (filtradas)
   - Mensajes
   - Notificaciones
4. **Íconos de Usuario**
   - Notificaciones (campana)
   - Mensajes (chat)
   - Perfil de Empresa (dropdown)

---

## 4. Búsqueda Inteligente

### Capacidades:
- Buscar por nombre de empresa
- Buscar por código HS (con autocompletado)
- Buscar por producto (texto libre, IA lo convierte a HS)
- Buscar por país de origen/destino
- Buscar por tipo de operación (importación/exportación)

### Filtros Avanzados:
- Industria
- Tamaño de empresa (PYME / Grande)
- Ubicación geográfica
- Verificación blockchain (sí/no)
- Tratados comerciales aplicables
- Rango de fechas de publicación

### Sugerencias Predictivas con IA:
- Basadas en el perfil de la empresa
- Historial de búsquedas
- Conexiones existentes
- Códigos HS relevantes

---

## 5. Sistema de Registro e Inscripción

### Flujo de Registro:
1. **Registro de Empresa (Obligatorio)**
   - Nombre comercial
   - RUC/CUIT/Tax ID
   - País y ciudad
   - Tamaño (PYME / Grande)
   - Industria principal
   - Logo (opcional)
2. **Creación de Usuario Administrador**
   - Nombre y apellido
   - Email corporativo
   - Rol en la empresa
   - Contraseña
3. **Verificación**
   - Email de confirmación
   - Opcional: Verificación de documentos (blockchain)

### Gestión de Empleados:
- El admin de la empresa puede invitar empleados
- Empleados se listan en "Equipo" del perfil corporativo
- No tienen perfil independiente
- Acceden con credenciales corporativas
- Permisos configurables (publicar, editar perfil, gestionar conexiones)

---

## 6. Publicaciones (Posts)

### Estructura Obligatoria de un Post:
1. **Contenido Principal** (texto libre)
2. **Códigos HS** (al menos uno)
3. **Documentos Requeridos**
   - Lista de documentos necesarios
   - Opción de marcar como "Verificado con Blockchain"
4. **Método de Contacto**
   - Mensaje directo (botón)
   - Email
   - Teléfono
   - WhatsApp

### Ejemplos de Posts:
```
[Logo Empresa] AgroExport S.A. • Hace 2 horas
🌾 Buscamos proveedores de soya (HS 1201) en Brasil

Requerimos:
- 500 toneladas mensuales
- Certificado de origen ✓ Blockchain
- Análisis fitosanitario
- Factura comercial

📞 Contacto: Mensaje directo o email@empresa.com
🔗 Simulación de costos disponible

[❤️ 24] [💬 8] [🔄 3]
```

---

## 7. Tema Visual

### Paleta de Colores (Dark Theme):
- **Primario:** Azul marino oscuro (#0A1929)
- **Secundario:** Azul cyan (#00D4FF)
- **Fondo:** Negro suave (#0D1117)
- **Texto:** Blanco (#FFFFFF) y gris claro (#B0B8C1)
- **Acentos:** Verde para verificación (#00C853)

### Tipografía:
- **Headings:** Inter Bold
- **Body:** Inter Regular
- **Monospace:** JetBrains Mono (para códigos HS)

---

## 8. Integraciones Especiales

### Blockchain para Verificación:
- Badge verde "✓ Blockchain" en documentos verificados
- Hash visible al hacer hover
- Link a explorador de blockchain (opcional)

### World Trade Pulse:
- Widget en sidebar derecha
- Actualización en tiempo real
- Filtrado por región/industria

### Simulador de Costos:
- Botón en cada post relevante
- Abre modal con calculadora
- Pre-llena datos del post

---

## 9. Responsive Design

### Breakpoints:
- **Desktop:** 3 columnas (sidebar + feed + widgets)
- **Tablet:** 2 columnas (feed + sidebar colapsable)
- **Mobile:** 1 columna (feed principal, sidebars en menú hamburguesa)

---

## 10. Orden de Implementación

### Fase 1: Backend y Base de Datos
1. Crear nuevas tablas en schema
2. Migrar datos existentes
3. Crear endpoints API para posts, conexiones, búsqueda

### Fase 2: Componentes UI
4. Crear layout de 3 columnas
5. Barra de navegación superior
6. Sidebar izquierda (perfil corporativo)
7. Sidebar derecha (widgets)

### Fase 3: Feed y Posts
8. Componente de creación de post
9. Card de post individual
10. Sistema de likes/comentarios

### Fase 4: Búsqueda y Filtros
11. Barra de búsqueda inteligente
12. Página de resultados
13. Filtros avanzados

### Fase 5: Perfiles y Conexiones
14. Página de perfil corporativo completo
15. Sistema de conexiones entre empresas
16. Gestión de empleados

### Fase 6: Integraciones
17. World Trade Pulse widget
18. Blockchain verification badges
19. Simulador de costos integrado

---

## User Review Required

> [!IMPORTANT]
> **Cambios Mayores en la Arquitectura**
> 
> Este rediseño implica cambios significativos:
> - Nueva estructura de base de datos (6 tablas nuevas)
> - Cambio completo del flujo de usuario (de marketplace simple a red social)
> - Sistema de perfiles corporativos vs. individuales
> - Feed dinámico en lugar de listado estático
> 
> **Impacto:**
> - Tiempo estimado: 2-3 semanas de desarrollo
> - Requiere migración de datos existentes
> - Cambio en el modelo de negocio (enfoque en conexiones vs. transacciones)
> 
> **¿Procedemos con este plan o querés ajustar algo antes de empezar?**

---

## Verificación

### Tests Necesarios:
- Registro de empresa y empleados
- Creación y visualización de posts
- Sistema de búsqueda inteligente
- Conexiones entre empresas
- Responsive en mobile/tablet/desktop
- Performance del feed con 1000+ posts
