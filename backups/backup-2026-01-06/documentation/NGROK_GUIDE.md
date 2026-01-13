# 🌐 Compartir ComexIA Localmente con ngrok

## ¿Qué es ngrok?
Es una herramienta que crea un túnel seguro desde tu computadora a internet, dándote una URL pública temporal (ej: `https://abc123.ngrok.io`) sin necesidad de deployment.

---

## 📦 Instalación Rápida

### Opción 1: Con npm (Recomendado)
```bash
npm install -g ngrok
```

### Opción 2: Descargar ejecutable
1. Ve a https://ngrok.com/download
2. Descarga la versión para Windows
3. Descomprime el archivo
4. Opcional: Agrega ngrok a tu PATH

---

## 🚀 Uso Básico

### Paso 1: Iniciar tu aplicación
Abre **DOS terminales**:

**Terminal 1 - Backend:**
```bash
npm run server
```
(Corre en http://localhost:3000)

**Terminal 2 - Frontend:**
```bash
npm run dev
```
(Corre en http://localhost:5173)

### Paso 2: Exponer con ngrok

**Terminal 3 - ngrok para Frontend:**
```bash
ngrok http 5173
```

Esto te dará una URL como:
```
https://abc123.ngrok.io
```

**¡Esa es tu URL pública!** Cualquiera puede acceder a tu app desde esa URL.

---

## 🔧 Configuración Avanzada (Opcional)

### Si querés una URL personalizada:
1. Crea cuenta gratis en https://ngrok.com
2. Obtené tu authtoken
3. Configura:
```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

### Para tener URLs estables:
Con cuenta gratuita, cada vez que reinicies ngrok, la URL cambia. Con cuenta paga ($8/mes) podés tener URLs fijas.

---

## ⚠️ Importante

- **La URL es temporal:** Se pierde cuando cerrás ngrok
- **Límite gratuito:** 40 conexiones/minuto
- **Seguridad:** No compartas URLs con datos sensibles

---

## 🎯 Uso Recomendado para Vos

1. **Desarrollo diario:** Usá `localhost:5173` normalmente
2. **Mostrar a clientes/testers:** Iniciá ngrok y compartí la URL
3. **Cuando termines de mostrar:** Cerrá ngrok (Ctrl+C)

---

## 📝 Comando Todo-en-Uno

Si querés automatizar el inicio, podés crear un script:

**start-public.bat:**
```batch
@echo off
start cmd /k "npm run server"
timeout /t 3
start cmd /k "npm run dev"
timeout /t 5
start cmd /k "ngrok http 5173"
```

Ejecutá `start-public.bat` y todo arranca automáticamente.

---

## ✅ Verificación

1. Iniciá ngrok: `ngrok http 5173`
2. Copiá la URL que te da (ej: `https://abc123.ngrok.io`)
3. Abrila en tu navegador
4. Compartila con quien quieras

¡Listo! Tu app está online sin deployment.
