/**
 * ═══════════════════════════════════════════════════════════
 * MI FINANZAS - Google Apps Script Backend
 * ═══════════════════════════════════════════════════════════
 * 
 * SETUP:
 * 1. Subí el archivo backend_finanzas.xlsx a Google Drive
 * 2. Abrilo con Google Sheets (se convierte automáticamente)
 * 3. Extensiones > Apps Script
 * 4. Borrá todo y pegá este código
 * 5. Guardá (Ctrl+S)
 * 6. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copiá la URL y pegala en la PWA (Configuración)
 */

// ============================================================
// CONFIGURACIÓN - Ajustar si cambiaste nombres de hojas
// ============================================================
const SHEETS = {
  MOVIMIENTOS: 'Movimientos',
  TARJETAS: 'Tarjetas',
  PATRIMONIO: 'Patrimonio',
  AHORRO: 'Ahorro e Inversiones',
  CONFIG: 'Configuración',
  RESUMEN: 'Resumen Mensual',
  CUOTAS: 'Cuotas Expandidas'
};

// ============================================================
// WEB APP ENDPOINTS
// ============================================================
function doGet(e) {
  const action = e?.parameter?.action || 'test';
  
  try {
    switch(action) {
      case 'test': return jsonResponse({ success: true, message: 'Mi Finanzas API v1.0' });
      case 'getData': return jsonResponse({ success: true, data: getAllData() });
      default: return jsonResponse({ success: false, error: 'Acción no válida' });
    }
  } catch(err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'sync';
    
    switch(action) {
      case 'sync': return jsonResponse(syncAll(payload.data));
      case 'addMovimiento': return jsonResponse(addMovimiento(payload.item));
      case 'addTarjeta': return jsonResponse(addTarjeta(payload.item));
      default: return jsonResponse({ success: false, error: 'Acción no válida' });
    }
  } catch(err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// DATA READING
// ============================================================
function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  return {
    movimientos: readMovimientos(ss),
    tarjetas: readTarjetas(ss),
    patrimonio: readPatrimonio(ss),
    metas: readMetas(ss),
    inversiones: readInversiones(ss),
  };
}

function readMovimientos(ss) {
  const sheet = ss.getSheetByName(SHEETS.MOVIMIENTOS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  return data.slice(1).filter(r => r[0]).map(r => ({
    id: String(r[0]),
    fecha: formatDate(r[1]),
    tipo: r[2],
    categoria: r[3],
    descripcion: r[4],
    monto: Number(r[5]),
    medioPago: r[6],
    moneda: r[7] || 'ARS',
    notas: r[8] || ''
  }));
}

function readTarjetas(ss) {
  const sheet = ss.getSheetByName(SHEETS.TARJETAS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  return data.slice(1).filter(r => r[0]).map(r => ({
    id: String(r[0]),
    fechaCompra: formatDate(r[1]),
    tarjeta: r[2],
    descripcion: r[3],
    montoTotal: Number(r[4]),
    cuotasTotales: Number(r[5]),
    cuotaActual: Number(r[6]),
    montoCuota: Number(r[7]),
    fechaCierre: formatDate(r[8]),
    fechaVto: formatDate(r[9]),
    estado: r[10],
    idGrupo: String(r[11]),
    mesImputacion: r[12]
  }));
}

function readPatrimonio(ss) {
  const sheet = ss.getSheetByName(SHEETS.PATRIMONIO);
  if (!sheet) return { ars: [], usd: [] };
  const data = sheet.getDataRange().getValues();
  
  const result = { ars: [], usd: [] };
  let section = 'ars';
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).includes('USD') || String(row[0]).includes('Dólares')) {
      section = 'usd';
      continue;
    }
    if (String(row[0]).includes('TOTAL') || !row[0] || String(row[0]).includes('Cuenta') || String(row[0]).includes('PATRIMONIO')) continue;
    if (row[0] && row[2] !== undefined && typeof row[2] === 'number') {
      result[section].push({
        id: section + '-' + (result[section].length + 1),
        nombre: String(row[0]),
        tipo: String(row[1]),
        saldo: Number(row[2])
      });
    }
  }
  
  return result;
}

function readMetas(ss) {
  const sheet = ss.getSheetByName(SHEETS.AHORRO);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  
  const metas = [];
  let inMetas = false;
  
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).includes('METAS')) { inMetas = true; continue; }
    if (String(data[i][0]).includes('INVERSIONES')) break;
    if (inMetas && data[i][0] && !['Meta','Objetivo'].includes(String(data[i][0]))) {
      metas.push({
        id: 'meta-' + (metas.length + 1),
        nombre: String(data[i][0]),
        objetivo: Number(data[i][1]) || 0,
        ahorrado: Number(data[i][2]) || 0,
        fechaLimite: formatDate(data[i][4]),
        estado: String(data[i][5]) || 'Activa'
      });
    }
  }
  
  return metas;
}

function readInversiones(ss) {
  const sheet = ss.getSheetByName(SHEETS.AHORRO);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  
  const inversiones = [];
  let inInv = false;
  
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).includes('INVERSIONES')) { inInv = true; continue; }
    if (String(data[i][0]).includes('TOTAL')) break;
    if (inInv && data[i][0] && !['Instrumento','Tipo'].includes(String(data[i][0]))) {
      inversiones.push({
        id: 'inv-' + (inversiones.length + 1),
        nombre: String(data[i][0]),
        tipo: String(data[i][1]),
        capital: Number(data[i][2]) || 0,
        moneda: String(data[i][3]) || 'ARS',
        tasa: String(data[i][4]).replace('%','') || '0',
        fechaInicio: formatDate(data[i][5]),
        fechaVto: formatDate(data[i][6]),
        valorActual: Number(data[i][7]) || 0
      });
    }
  }
  
  return inversiones;
}

// ============================================================
// DATA WRITING / SYNC
// ============================================================
function syncAll(clientData) {
  if (!clientData) return { success: false, error: 'No data provided' };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = {};
  
  if (clientData.movimientos) results.movimientos = syncMovimientos(ss, clientData.movimientos);
  if (clientData.tarjetas) results.tarjetas = syncTarjetas(ss, clientData.tarjetas);
  if (clientData.patrimonio) results.patrimonio = syncPatrimonio(ss, clientData.patrimonio);
  if (clientData.metas) results.metas = syncMetas(ss, clientData.metas);
  if (clientData.inversiones) results.inversiones = syncInversiones(ss, clientData.inversiones);
  
  return { success: true, results };
}

function syncMovimientos(ss, items) {
  const sheet = ss.getSheetByName(SHEETS.MOVIMIENTOS);
  if (!sheet) return { error: 'Sheet not found' };
  
  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 9).clearContent();
  
  // Write all items
  items.forEach((m, idx) => {
    const row = idx + 2;
    sheet.getRange(row, 1, 1, 9).setValues([[
      m.id, m.fecha, m.tipo, m.categoria, m.descripcion,
      m.monto, m.medioPago, m.moneda || 'ARS', m.notas || ''
    ]]);
  });
  
  return { synced: items.length };
}

function syncTarjetas(ss, items) {
  const sheet = ss.getSheetByName(SHEETS.TARJETAS);
  if (!sheet) return { error: 'Sheet not found' };
  
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 13).clearContent();
  
  items.forEach((t, idx) => {
    const row = idx + 2;
    sheet.getRange(row, 1, 1, 7).setValues([[
      t.id, t.fechaCompra, t.tarjeta, t.descripcion,
      t.montoTotal, t.cuotasTotales, t.categoria || ''
    ]]);
  });
  
  return { synced: items.length };
}

function syncPatrimonio(ss, patrimonio) {
  const sheet = ss.getSheetByName(SHEETS.PATRIMONIO);
  if (!sheet) return { error: 'Sheet not found' };
  
  // Update ARS accounts (rows 5+)
  patrimonio.ars.forEach((acc, idx) => {
    const row = 5 + idx;
    sheet.getRange(row, 1).setValue(acc.nombre);
    sheet.getRange(row, 2).setValue(acc.tipo);
    sheet.getRange(row, 3).setValue(acc.saldo);
    sheet.getRange(row, 4).setValue(new Date());
  });
  
  // Find USD section start and update
  const data = sheet.getDataRange().getValues();
  let usdStart = -1;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).includes('Cuentas en USD')) { usdStart = i + 2; break; }
  }
  
  if (usdStart > 0) {
    patrimonio.usd.forEach((acc, idx) => {
      const row = usdStart + 1 + idx;
      sheet.getRange(row, 1).setValue(acc.nombre);
      sheet.getRange(row, 2).setValue(acc.tipo);
      sheet.getRange(row, 3).setValue(acc.saldo);
      sheet.getRange(row, 4).setValue(new Date());
    });
  }
  
  return { synced: true };
}

function syncMetas(ss, metas) {
  const sheet = ss.getSheetByName(SHEETS.AHORRO);
  if (!sheet) return { error: 'Sheet not found' };
  
  metas.forEach((m, idx) => {
    const row = 3 + idx;
    sheet.getRange(row, 1, 1, 7).setValues([[
      m.nombre, m.objetivo, m.ahorrado, '', m.fechaLimite || '', m.estado || 'Activa', ''
    ]]);
  });
  
  return { synced: metas.length };
}

function syncInversiones(ss, inversiones) {
  const sheet = ss.getSheetByName(SHEETS.AHORRO);
  if (!sheet) return { error: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  let invStart = -1;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).includes('INVERSIONES')) { invStart = i + 2; break; }
  }
  
  if (invStart > 0) {
    inversiones.forEach((inv, idx) => {
      const row = invStart + 1 + idx;
      sheet.getRange(row, 1, 1, 8).setValues([[
        inv.nombre, inv.tipo, inv.capital, inv.moneda,
        inv.tasa + '%', inv.fechaInicio || '', inv.fechaVto || '', inv.valorActual || inv.capital
      ]]);
    });
  }
  
  return { synced: inversiones.length };
}

function addMovimiento(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.MOVIMIENTOS);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  
  const nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, 9).setValues([[
    item.id, item.fecha, item.tipo, item.categoria, item.descripcion,
    item.monto, item.medioPago, item.moneda || 'ARS', item.notas || ''
  ]]);
  
  return { success: true, row: nextRow };
}

function addTarjeta(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TARJETAS);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  
  const nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, 7).setValues([[
    item.id, item.fechaCompra, item.tarjeta, item.descripcion,
    item.montoTotal, item.cuotasTotales, item.categoria || ''
  ]]);
  
  return { success: true, row: nextRow };
}

// ============================================================
// UTILITIES
// ============================================================
function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
  }
  return String(val);
}

// ============================================================
// TEST
// ============================================================
function testGetAll() {
  const result = getAllData();
  Logger.log(JSON.stringify(result, null, 2));
}
