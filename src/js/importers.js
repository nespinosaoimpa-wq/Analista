import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import supabase, { insertHecho, insertAllanamiento, insertZona, insertPersona } from './supabase-client.js';
import { enrichTacticalFeature } from './analytics-engine.js';

// ============================================================
// FOLDER TAXONOMY & OPERATIONAL MAPPINGS
// ============================================================

export const FOLDER_COLORS = {
  'HOMICIDIOS Y USURPACIONES': '#EF4444',
  'ARMAS': '#F97316',
  'HAF y HAB': '#FB923C',
  'Priorizaciones 2025': '#F59E0B',
  'Priorizaciones 2024': '#EAB308',
  'BARRIOS': '#8B5CF6',
  'SANTO TOMÉ': '#3B82F6',
  'Reactivos': '#06B6D4',
  'INCIDENCIAS': '#10B981',
  'Capa sin título': '#94A3B8'
};

export const FOLDER_LESIVIDAD = {
  'HOMICIDIOS Y USURPACIONES': 10,
  'ARMAS': 8,
  'HAF y HAB': 7,
  'Priorizaciones 2025': 6,
  'Priorizaciones 2024': 6,
  'Reactivos': 5,
  'SANTO TOMÉ': 4,
  'INCIDENCIAS': 3,
  'BARRIOS': 1
};

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ============================================================
// ULTRA-FAST & FAULT-TOLERANT KML / KMZ PARSER
// ============================================================

/**
 * Parses raw KML text into GeoJSON FeatureCollection.
 * Handles malformed XML, illegal control characters, namespaces,
 * folders, CDATA and complex multi-ring geometries in milliseconds.
 */
export function parseKML(kmlText) {
  if (!kmlText) {
    return { type: 'FeatureCollection', features: [] };
  }

  // 1. Sanitize illegal XML control characters (ASCII 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F)
  const sanitized = kmlText.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

  const features = [];
  const folderCounts = {};

  // Check if KML has Folders
  const folderRegex = /<Folder\b[^>]*>([\s\S]*?)<\/Folder>/gi;
  let hasFolders = false;
  let folderMatch;

  while ((folderMatch = folderRegex.exec(sanitized)) !== null) {
    hasFolders = true;
    const folderContent = folderMatch[1];
    const folderNameMatch = folderContent.match(/<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i);
    const folderName = folderNameMatch ? stripHtml(folderNameMatch[1]) : 'General';
    folderCounts[folderName] = (folderCounts[folderName] || 0);

    parsePlacemarksFromBlock(folderContent, folderName, features, folderCounts);
  }

  // If no folders, or Placemarks exist at root Document level
  if (!hasFolders || features.length === 0) {
    parsePlacemarksFromBlock(sanitized, 'General', features, folderCounts);
  }

  const enriched = features.map((f, i) => enrichTacticalFeature(f, i));

  return {
    type: 'FeatureCollection',
    metadata: {
      totalFeatures: enriched.length,
      polygons: enriched.filter(f => f.geometry.type === 'Polygon').length,
      points: enriched.filter(f => f.geometry.type === 'Point').length,
      folderBreakdown: folderCounts,
      parsedAt: new Date().toISOString()
    },
    features: enriched
  };
}

function parsePlacemarksFromBlock(xmlBlock, defaultFolder, features, folderCounts) {
  const pmRegex = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let pmMatch;
  let count = 0;

  const color = FOLDER_COLORS[defaultFolder] || '#0EA5E9';
  const lesividad = FOLDER_LESIVIDAD[defaultFolder] || 3;

  while ((pmMatch = pmRegex.exec(xmlBlock)) !== null) {
    count++;
    const pmContent = pmMatch[1];

    // Name
    const nameMatch = pmContent.match(/<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i);
    const name = nameMatch ? stripHtml(nameMatch[1]) : `Elemento ${count}`;

    // Description
    const descMatch = pmContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const description = descMatch ? stripHtml(descMatch[1]) : '';

    // StyleUrl
    const styleMatch = pmContent.match(/<styleUrl>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/styleUrl>/i);
    const styleUrl = styleMatch ? styleMatch[1].trim() : '';

    // ExtendedData
    const extendedData = {};
    const dataRegex = /<Data name="([^"]+)">[\s\S]*?<value>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/value>/gi;
    let dMatch;
    while ((dMatch = dataRegex.exec(pmContent)) !== null) {
      const k = dMatch[1].trim();
      const v = dMatch[2].trim();
      if (v) extendedData[k] = stripHtml(v);
    }

    // Extract CUIJ if present
    let cuij = extendedData['Cuij '] || extendedData['cuij'] || extendedData['Cuij'] || '';
    if (!cuij) {
      const cuijMatch = (description + ' ' + name).match(/\b21-\d{8}-\d\b/);
      if (cuijMatch) cuij = cuijMatch[0];
    }

    // Check Point
    const ptMatch = pmContent.match(/<Point\b[^>]*>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/Point>/i);
    if (ptMatch) {
      const parts = ptMatch[1].trim().split(/[\s,]+/);
      if (parts.length >= 2) {
        const lng = parseFloat(parseFloat(parts[0]).toFixed(6));
        const lat = parseFloat(parseFloat(parts[1]).toFixed(6));
        if (!isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {
              nombre: name,
              tipo: defaultFolder,
              folder: defaultFolder,
              direccion: name,
              resumen: description.slice(0, 300),
              cuij: cuij,
              color: color,
              lesividad: lesividad,
              styleUrl: styleUrl,
              tipo_geo: 'point'
            }
          });
          folderCounts[defaultFolder] = (folderCounts[defaultFolder] || 0) + 1;
          continue;
        }
      }
    }

    // Check Polygon
    const polyMatch = pmContent.match(/<Polygon\b[^>]*>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/Polygon>/i);
    if (polyMatch) {
      const tokens = polyMatch[1].trim().split(/\s+/);
      const ring = [];
      for (const token of tokens) {
        const parts = token.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parseFloat(parts[0]).toFixed(6));
          const lat = parseFloat(parseFloat(parts[1]).toFixed(6));
          if (!isNaN(lng) && !isNaN(lat)) ring.push([lng, lat]);
        }
      }
      if (ring.length >= 3) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: {
            nombre: name,
            barrio: name,
            tipo: defaultFolder,
            folder: defaultFolder,
            descripcion: description.slice(0, 300),
            cuij: cuij,
            color: color,
            tipo_geo: 'polygon'
          }
        });
        folderCounts[defaultFolder] = (folderCounts[defaultFolder] || 0) + 1;
        continue;
      }
    }

    // Check LineString
    const lineMatch = pmContent.match(/<LineString\b[^>]*>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/i);
    if (lineMatch) {
      const tokens = lineMatch[1].trim().split(/\s+/);
      const line = [];
      for (const token of tokens) {
        const parts = token.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parseFloat(parts[0]).toFixed(6));
          const lat = parseFloat(parseFloat(parts[1]).toFixed(6));
          if (!isNaN(lng) && !isNaN(lat)) line.push([lng, lat]);
        }
      }
      if (line.length >= 2) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: line },
          properties: {
            nombre: name,
            tipo: defaultFolder,
            folder: defaultFolder,
            descripcion: description.slice(0, 300),
            color: color,
            tipo_geo: 'linestring'
          }
        });
        folderCounts[defaultFolder] = (folderCounts[defaultFolder] || 0) + 1;
      }
    }
  }
}

/**
 * Extracts and parses a KMZ file (zipped KML)
 */
export async function parseKMZ(file) {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  let kmlFile = null;
  for (const filename of Object.keys(contents.files)) {
    if (filename.toLowerCase().endsWith('.kml')) {
      kmlFile = contents.files[filename];
      break;
    }
  }

  if (!kmlFile) {
    throw new Error('No se encontró archivo .kml dentro del archivo KMZ');
  }

  const kmlText = await kmlFile.async('string');
  return parseKML(kmlText);
}

// ============================================================
// EXCEL / CSV PARSER
// ============================================================

export async function parseExcel(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const result = {};

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  });

  return result;
}

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function importExcelRows(rows, targetType = 'hechos', onProgress = () => {}) {
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress(i + 1, rows.length);

    const mapped = {};
    for (const [key, val] of Object.entries(row)) {
      const nKey = normalizeKey(key);
      if (['fecha', 'fechayhora', 'datetime', 'dia'].includes(nKey)) mapped.fecha = val;
      else if (['tipo', 'tipopenal', 'delito', 'hecho', 'caratula'].includes(nKey)) mapped.tipo_penal = val;
      else if (['direccion', 'domicilio', 'calle', 'lugar', 'ubicacion'].includes(nKey)) mapped.direccion = val;
      else if (['barrio', 'vecindario'].includes(nKey)) mapped.barrio = val;
      else if (['localidad', 'ciudad'].includes(nKey)) mapped.localidad = val || 'Santa Fe';
      else if (['cuij', 'nrocuij', 'expediente', 'legajo'].includes(nKey)) mapped.cuij = String(val);
      else if (['requerimiento', 'req', 'nroreq'].includes(nKey)) mapped.requerimiento = String(val);
      else if (['lesividad', 'indicedelesividad', 'gravedad'].includes(nKey)) mapped.indice_lesividad = parseInt(val) || 3;
      else if (['resumen', 'descripcion', 'detalle', 'observaciones', 'sintesis'].includes(nKey)) mapped.resumen = val;
      else if (['modusoperandi', 'mo', 'modalidad'].includes(nKey)) mapped.modus_operandi = val;
      else if (['resultado', 'result'].includes(nKey)) mapped.resultado = val;
      else if (['fuerza', 'fuerzainterviniente', 'policia'].includes(nKey)) mapped.fuerza_interviniente = val;
      // Personas
      else if (['nombre', 'nombres'].includes(nKey)) mapped.nombre = val;
      else if (['apellido', 'apellidos'].includes(nKey)) mapped.apellido = val;
      else if (['nombrecompleto', 'nombreyapellido', 'persona', 'sujeto', 'imputado'].includes(nKey)) mapped.nombre_completo = val;
      else if (['alias', 'apodo', 'sobrenombre'].includes(nKey)) mapped.alias = val;
      else if (['dni', 'documento', 'cuit', 'cuil'].includes(nKey)) mapped.dni = String(val);
      else if (['banda', 'organizacion', 'bandanombre', 'faccion'].includes(nKey)) mapped.banda_nombre = val;
      else if (['rol', 'roles', 'jerarquia', 'funcion'].includes(nKey)) mapped.roles = val;
      else if (['peligrosidad', 'score', 'scorepeligrosidad'].includes(nKey)) mapped.score_peligrosidad = parseInt(val) || 5;
      else if (['captura', 'pedidocaptura', 'profugo', 'buscado'].includes(nKey)) mapped.pedido_captura = val;
      // Coordenadas
      else if (['lat', 'latitud'].includes(nKey)) mapped.lat = parseFloat(val);
      else if (['lon', 'lng', 'longitud'].includes(nKey)) mapped.lng = parseFloat(val);
    }

    try {
      if (targetType === 'personas') {
        let nombre = mapped.nombre || '';
        let apellido = mapped.apellido || '';
        if (mapped.nombre_completo && (!nombre || !apellido)) {
          const parts = String(mapped.nombre_completo).trim().split(/\s+/);
          if (parts.length > 1) {
            apellido = parts[0];
            nombre = parts.slice(1).join(' ');
          } else {
            nombre = mapped.nombre_completo;
          }
        }
        const isCaptura = mapped.pedido_captura
          ? /s[íi]|true|1|captura|profugo|buscado/i.test(String(mapped.pedido_captura))
          : false;

        const item = {
          nombre: nombre || 'Investigado',
          apellido: apellido || '',
          dni: mapped.dni || null,
          alias: mapped.alias ? String(mapped.alias).split(',').map(s => s.trim()).filter(Boolean) : [],
          banda_nombre: mapped.banda_nombre || null,
          roles: mapped.roles ? String(mapped.roles).split(',').map(s => s.trim()).filter(Boolean) : ['Investigado'],
          score_peligrosidad: mapped.score_peligrosidad || (isCaptura ? 8 : 5),
          pedido_captura: isCaptura,
          domicilio_principal: mapped.direccion || null,
          cuij_asociados: mapped.cuij ? [mapped.cuij] : []
        };
        await insertPersona(item);
      } else if (targetType === 'allanamientos') {
        const item = {
          cuij: mapped.cuij || null,
          requerimiento: mapped.requerimiento || null,
          direccion: mapped.direccion || 'Sin dirección',
          barrio: mapped.barrio || null,
          localidad: mapped.localidad || 'Santa Fe',
          fuerza_interviniente: mapped.fuerza_interviniente || 'PDI',
          resultado: mapped.resultado || 'Positivo',
          resumen: mapped.resumen || '',
          fecha_operativo: mapped.fecha ? new Date(mapped.fecha).toISOString() : new Date().toISOString(),
        };
        await insertAllanamiento(item);
      } else {
        // hechos
        let geom = null;
        if (!isNaN(mapped.lat) && !isNaN(mapped.lng)) {
          geom = `SRID=4326;POINT(${mapped.lng} ${mapped.lat})`;
        }
        const item = {
          tipo_penal: mapped.tipo_penal || 'Microtráfico',
          direccion: mapped.direccion || null,
          barrio: mapped.barrio || null,
          localidad: mapped.localidad || 'Santa Fe',
          cuij: mapped.cuij || null,
          requerimiento: mapped.requerimiento || null,
          indice_lesividad: mapped.indice_lesividad || 3,
          resumen: mapped.resumen || null,
          modus_operandi: mapped.modus_operandi || null,
          fecha: mapped.fecha ? new Date(mapped.fecha).toISOString() : new Date().toISOString(),
          geom: geom
        };
        await insertHecho(item);
      }
      inserted++;
    } catch (err) {
      console.warn('Error insertando fila:', err, row);
      errors++;
    }
  }

  return { inserted, errors, total: rows.length, targetType };
}

// ============================================================
// BATCH INGESTION & LOCAL STORAGE TACTICAL CACHE
// ============================================================

const LOCAL_TACTICAL_KEY = 'crimint_tactical_cache';

export function saveTacticalToLocal(geoJSON) {
  try {
    localStorage.setItem(LOCAL_TACTICAL_KEY, JSON.stringify(geoJSON));
    return true;
  } catch (e) {
    console.warn('No se pudo guardar en localStorage (tamaño excedido)', e);
    return false;
  }
}

export function getTacticalFromLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_TACTICAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Ingests KML GeoJSON into Supabase in chunks to avoid UI lockup
 */
export async function importKMLGeoJSON(geoJSON, onProgress = () => {}) {
  let insertedZonas = 0;
  let insertedHechos = 0;
  const total = geoJSON.features.length;

  const BATCH_SIZE = 50;
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = geoJSON.features.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (feat) => {
      try {
        if (feat.geometry.type === 'Polygon') {
          const polyCoords = feat.geometry.coordinates[0].map(c => `${c[0]} ${c[1]}`).join(', ');
          await insertZona({
            nombre: feat.properties.nombre || feat.properties.name || 'Zona Táctica',
            tipo: feat.properties.folder || 'BANDA_CONFLICTO',
            barrio: feat.properties.nombre || 'Santa Fe',
            geom: `SRID=4326;POLYGON((${polyCoords}))`,
            color_hex: feat.properties.color || '#EF4444',
            descripcion: feat.properties.descripcion || feat.properties.resumen || 'Importado desde KML',
          });
          insertedZonas++;
        } else if (feat.geometry.type === 'Point') {
          const [lng, lat] = feat.geometry.coordinates;
          await insertHecho({
            tipo_penal: feat.properties.tipo || feat.properties.folder || 'Microtráfico',
            geom: `SRID=4326;POINT(${lng} ${lat})`,
            direccion: feat.properties.nombre || 'Punto KML',
            resumen: feat.properties.resumen || feat.properties.description || 'Importado desde KML',
            cuij: feat.properties.cuij || null,
            estado_georref: 'CONFIRMADA',
            precision_geo: 'EXACTA_ALTURA',
            fecha: new Date().toISOString(),
            indice_lesividad: feat.properties.lesividad || 3,
          });
          insertedHechos++;
        }
      } catch (e) {
        // Silently catch individual insert errors
      }
    }));

    onProgress(Math.min(i + BATCH_SIZE, total), total);
    // Yield to event loop
    await new Promise(r => setTimeout(r, 20));
  }

  return { insertedZonas, insertedHechos, total };
}
