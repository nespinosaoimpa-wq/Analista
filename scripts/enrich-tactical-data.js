import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import {
  classifyCrimeThematic,
  extractDenunciados,
  extractTemporalInfo,
  extractTerritoryKey,
  enrichTacticalFeature
} from '../src/js/analytics-engine.js';

const tacticalPath = 'public/data/santa_fe_tactical.json';
const baseIncidencias = '001 - Microtrafico - Incidencias-20260917T160119Z-1-001/001 - Microtrafico - Incidencias';

console.log('🔄 Leyendo dataset táctico base:', tacticalPath);
const rawData = JSON.parse(fs.readFileSync(tacticalPath, 'utf-8'));
const features = rawData.features || [];

console.log(`Puntos/Zonas originales: ${features.length}`);

// 1. Enriquecer cada feature existente
const enrichedFeatures = features.map((f, i) => enrichTacticalFeature(f, i));

// 2. Extraer datos adicionales de 'insumo para informe.xlsx' y fusionar/geolocalizar
const insumoPath = path.join(baseIncidencias, 'insumo para informe.xlsx');
if (fs.existsSync(insumoPath)) {
  console.log('📊 Procesando e integrando:', insumoPath);
  const wb = XLSX.readFile(insumoPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  // Centro de Santa Fe para dispersión aproximada de causas sin coordenadas exactas
  const SF_LAT = -31.6333;
  const SF_LNG = -60.7005;

  let addedExcel = 0;
  rows.forEach((r, idx) => {
    if (!r.cuij && !r.domicilios) return;

    // Verificar si ya existe por CUIJ
    const cuijStr = r.cuij ? String(r.cuij) : '';
    const exists = cuijStr && enrichedFeatures.some(f => f.properties?.cuij === cuijStr);
    if (exists) return;

    // Generar coordenadas en Santa Fe
    const offsetLat = ((idx % 30) - 15) * 0.0035;
    const offsetLng = (((idx * 7) % 30) - 15) * 0.0035;
    const lat = parseFloat((SF_LAT + offsetLat).toFixed(6));
    const lng = parseFloat((SF_LNG + offsetLng).toFixed(6));

    // Determinar año y mes
    let anio = '2024';
    let mes = 6;
    if (r.Año) anio = String(r.Año);
    if (r.Mes) {
      const mNum = parseInt(r.Mes);
      if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) mes = mNum;
    }

    const thematic = classifyCrimeThematic(`${r.calificaciones || ''} ${r.valoraciones || ''}`, 'Microtráfico');
    const imputadosList = extractDenunciados({ imputados: r.imputados, nombre: r.imputados || '' });

    enrichedFeatures.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        id: `excel-insumo-${idx}`,
        nombre: `${r.domicilios || 'Santa Fe'} — ${r.imputados || 'Investigación'}`,
        tipo: 'Causa Judicial',
        folder: 'Causas Judiciales',
        direccion: r.domicilios || 'Santa Fe',
        resumen: `CUIJ: ${cuijStr} | Fiscal: ${r.fiscales || 'MPA'} | Imputados: ${r.imputados || 'N/A'} | Calificación: ${r.calificaciones || ''}`,
        cuij: cuijStr,
        color: thematic.color,
        lesividad: 5,
        tipo_geo: 'point',
        tematica_id: thematic.id,
        tematica_nombre: thematic.nombre,
        tematica_icon: thematic.icon,
        denunciados: imputadosList,
        fecha: `${anio}-${String(mes).padStart(2, '0')}-10T12:00:00.000Z`,
        anio: anio,
        mes: mes,
        mes_nombre: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][mes - 1],
        territory_key: extractTerritoryKey({ direccion: r.domicilios, nombre: r.domicilios }),
        barrio: r.localidad || 'Santa Fe'
      }
    });
    addedExcel++;
  });
  console.log(`✓ Añadidas ${addedExcel} causas judiciales enriquecidas.`);
}

// 3. Generar nuevo GeoJSON
const outputGeoJSON = {
  type: 'FeatureCollection',
  metadata: {
    title: 'Dataset Táctico Enriquecido Santa Fe',
    totalFeatures: enrichedFeatures.length,
    points: enrichedFeatures.filter(f => f.geometry.type === 'Point').length,
    polygons: enrichedFeatures.filter(f => f.geometry.type === 'Polygon').length,
    updatedAt: new Date().toISOString()
  },
  features: enrichedFeatures
};

fs.writeFileSync(tacticalPath, JSON.stringify(outputGeoJSON));
console.log(`✅ Guardado con éxito en ${tacticalPath}!`);
console.log(`Total features: ${enrichedFeatures.length} (${(fs.statSync(tacticalPath).size / 1024 / 1024).toFixed(2)} MB)`);
