# Mi Finanzas 💖 - Setup

## Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | La PWA completa (frontend) |
| `manifest.json` | Configuración PWA para instalación |
| `sw.js` | Service Worker para funcionar offline |
| `icon-192.png` / `icon-512.png` | Íconos de la app |
| `backend_finanzas.xlsx` | Spreadsheet backend optimizado |
| `GOOGLE_APPS_SCRIPT.js` | Código para sincronizar con Google Sheets |

## Configuración paso a paso

### 1. Backend (Google Sheets)

1. Subí `backend_finanzas.xlsx` a tu Google Drive
2. Abrilo con Google Sheets (se convierte automáticamente)
3. Menú: **Extensiones > Apps Script**
4. Borrá todo el código y pegá el contenido de `GOOGLE_APPS_SCRIPT.js`
5. Guardá (Ctrl+S)
6. **Deploy > New deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copiá la URL generada

### 2. Frontend (PWA)

**Opción A - GitHub Pages (gratis):**
1. Creá un repo en GitHub
2. Subí todos los archivos (index.html, manifest.json, sw.js, icons)
3. Settings > Pages > Source: main branch
4. Tu app estará en `https://tu-usuario.github.io/nombre-repo/`

**Opción B - Netlify/Vercel (gratis):**
1. Arrastrá la carpeta con todos los archivos a netlify.com/drop

### 3. Conectar PWA con Google Sheets

1. Abrí la PWA en el iPhone
2. Tocá ⚙️ (Configuración)
3. Pegá la URL del Apps Script en "URL Google Apps Script"
4. Guardá

### 4. Instalar como App en iPhone

1. Abrí la URL de la PWA en Safari
2. Tocá el botón de compartir (cuadrado con flecha)
3. Seleccioná "Agregar a pantalla de inicio"
4. ¡Listo! Se instala como una app nativa

## Features

- **Resumen**: Balance mensual, ingresos vs gastos, accesos rápidos
- **Movimientos**: Registro completo con filtros por tipo y mes
- **Tarjetas**: Visa y MasterCard con cuotas expandidas automáticamente
- **Ahorro**: Metas de ahorro con progreso + Inversiones + Patrimonio
- **Sincronización**: Backup a Google Sheets
- **Export/Import**: Backup JSON local
- **Offline**: Funciona sin conexión gracias al Service Worker
- **Diseño**: Rosa pastel, liquid glass, estilo iOS 26
