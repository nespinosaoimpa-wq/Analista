import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import supabase, { insertHecho, insertAllanamiento, insertZona, geocodeAddress } from './supabase-client.js';
import { showToast } from './app.js';

// ============================================================
// KML / KMZ PARSER
// ============================================================

/**
 * Parses raw KML text into GeoJSON FeatureCollection
 */
export function parseKML(kmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, 'text/xml');
  const placemarks = xml.querySelectorAll('Placemark');
  const features = [];

  placemarks.forEach((pm, idx) => {
    const name = pm.querySelector('name')?.textContent?.trim() || `Elemento ${idx + 1}`;
    const description = pm.querySelector('description')?.textContent?.trim() || '';

    // Check Point
    const point = pm.querySelector('Point coordinates');
    if (point) {
      const parts = point.textContent.trim().split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lng) && !isNaN(lat)) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { name, description, type: 'point' }
          });
          return;
        }
      }
    }

    // Check Polygon
    const polygonCoords = pm.querySelector('Polygon coordinates') || pm.querySelector('outerBoundaryIs coordinates');
    if (polygonCoords) {
      const coordPairs = polygonCoords.textContent.trim().split(/\s+/);
      const ring = [];
      coordPairs.forEach(p => {
        const parts = p.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lng) && !isNaN(lat)) ring.push([lng, lat]);
        }
      });
      if (ring.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: { name, description, type: 'polygon' }
        });
      }
    }

    // Check LineString
    const lineCoords = pm.querySelector('LineString coordinates');
    if (lineCoords) {
      const coordPairs = lineCoords.textContent.trim().split(/\s+/);
      const line = [];
      coordPairs.forEach(p => {
        const parts = p.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lng) && !isNaN(lat)) line.push([lng, lat]);
        }
      });
      if (line.length >= 2) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: line },
          properties: { name, description, type: 'linestring' }
        });
      }
    }
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Extracts and parses a KMZ file (zipped KML)
 */
export async function parseKMZ(file) {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  // Find .kml file inside
  let kmlFile = null;
  for (const filename of Object.keys(contents.files)) {
    if (filename.toLowerCase().endsWith('.kml')) {
      kmlFile = contents.files[filename];
      break;
    }
  }

  if (!kmlFile) {
    throw new Error('No se encontró archivo .kml dentro del KMZ');
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

// ============================================================
// INTELLIGENT DATA MAPPING & INGESTION
// ============================================================

/**
 * Normalizes keys to lowercase and removes accents for column matching
 */
function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Ingests rows into hechos_delictivos or allanamientos
 */
export async function importExcelRows(rows, targetType = 'hechos', onProgress = () => {}) {
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress(i + 1, rows.length);

    // Map fields
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
    }

    try {
      if (targetType === 'allanamientos') {
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
        };
        await insertHecho(item);
      }
      inserted++;
    } catch (err) {
      console.warn('Error insertando fila:', err, row);
      errors++;
    }
  }

  return { inserted, errors, total: rows.length };
}

/**
 * Ingests KML GeoJSON into Supabase (Zonas or Hechos)
 */
export async function importKMLGeoJSON(geoJSON, onProgress = () => {}) {
  let insertedZonas = 0;
  let insertedHechos = 0;
  const total = geoJSON.features.length;

  for (let i = 0; i < total; i++) {
    const feat = geoJSON.features[i];
    onProgress(i + 1, total);

    try {
      if (feat.geometry.type === 'Polygon') {
        const polyCoords = feat.geometry.coordinates[0].map(c => `${c[0]} ${c[1]}`).join(', ');
        await insertZona({
          nombre: feat.properties.name || 'Zona Importada',
          tipo: 'BANDA_CONFLICTO',
          barrio: feat.properties.name || 'Santa Fe',
          geom: `SRID=4326;POLYGON((${polyCoords}))`,
          color_hex: '#EF4444',
          descripcion: feat.properties.description || 'Importado desde KML',
        });
        insertedZonas++;
      } else if (feat.geometry.type === 'Point') {
        const [lng, lat] = feat.geometry.coordinates;
        await insertHecho({
          tipo_penal: 'Microtráfico',
          geom: `SRID=4326;POINT(${lng} ${lat})`,
          direccion: feat.properties.name || 'Punto KML',
          resumen: feat.properties.description || 'Importado desde KML',
          estado_georref: 'CONFIRMADA',
          precision_geo: 'EXACTA_ALTURA',
          fecha: new Date().toISOString(),
          indice_lesividad: 3,
        });
        insertedHechos++;
      }
    } catch (e) {
      console.warn('Error importando feature KML:', e);
    }
  }

  return { insertedZonas, insertedHechos, total };
}
