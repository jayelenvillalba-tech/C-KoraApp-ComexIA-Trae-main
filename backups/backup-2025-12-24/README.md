# Cómo Restaurar desde este Backup

## Fecha del Backup
2025-12-24T18:43:26.598Z

## Contenido
- Base de datos: `database/comexia_v2.db`
- Código completo: `code/repo.bundle`
- Documentación: `documentation/*.md`
- Configuración: `.env.backup`

## Pasos de Restauración

### 1. Restaurar Base de Datos
```bash
cp database/comexia_v2.db /ruta/proyecto/comexia_v2.db
```

### 2. Restaurar Código
```bash
git clone code/repo.bundle restored-comexia
cd restored-comexia
npm install
```

### 3. Restaurar Configuración
```bash
cp .env.backup /ruta/proyecto/.env
# Editar .env con tus credenciales
```

### 4. Verificar
```bash
npm run dev
# Abrir http://localhost:5173
```

## Estadísticas del Backup
- 2,500 códigos HS
- 50 empresas
- 202 empleados
- 101 publicaciones marketplace
- 50 noticias
- 20 verificaciones
- 10 suscripciones

## Contacto
Si tienes problemas restaurando, revisa la documentación completa en `documentation/`
