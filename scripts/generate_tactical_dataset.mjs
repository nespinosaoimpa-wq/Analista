import fs from 'fs';
import path from 'path';

const kmlPath = 'C:/Users/Grupo 5/Desktop/Santa Fe (1).kml';
const outputPath = 'c:/Users/Grupo 5/Desktop/Analista/public/data/santa_fe_tactical.json';

const rawText = fs.readFileSync(kmlPath, 'utf-8');
const sanitized = rawText.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

const FOLDER_COLORS = {
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

const FOLDER_LESIVIDAD = {
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

const folderRegex = /<Folder\b[^>]*>([\s\S]*?)<\/Folder>/gi;
const features = [];
let folderMatch;

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

while ((folderMatch = folderRegex.exec(sanitized)) !== null) {
  const folderContent = folderMatch[1];
  const folderNameMatch = folderContent.match(/<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i);
  const folderName = folderNameMatch ? folderNameMatch[1].trim() : 'General';
  const color = FOLDER_COLORS[folderName] || '#0EA5E9';
  const lesividad = FOLDER_LESIVIDAD[folderName] || 3;

  const pmRegex = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let pmMatch;
  let folderCount = 0;

  while ((pmMatch = pmRegex.exec(folderContent)) !== null) {
    folderCount++;
    const pmContent = pmMatch[1];

    const nameMatch = pmContent.match(/<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i);
    const name = nameMatch ? nameMatch[1].trim() : `Elemento ${folderCount}`;

    const descMatch = pmContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const description = descMatch ? stripHtml(descMatch[1]) : '';

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
              tipo: folderName,
              folder: folderName,
              direccion: name,
              resumen: description.slice(0, 300),
              cuij: cuij,
              color: color,
              lesividad: lesividad,
              tipo_geo: 'point'
            }
          });
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
            tipo: folderName,
            folder: folderName,
            descripcion: description.slice(0, 300),
            cuij: cuij,
            color: color,
            tipo_geo: 'polygon'
          }
        });
      }
    }
  }
}

const geojson = {
  type: 'FeatureCollection',
  metadata: {
    title: 'Santa Fe Tactical Intelligence Dataset',
    source: 'Santa Fe (1).kml',
    totalFeatures: features.length,
    polygons: features.filter(f => f.geometry.type === 'Polygon').length,
    points: features.filter(f => f.geometry.type === 'Point').length,
    generatedAt: new Date().toISOString()
  },
  features
};

fs.writeFileSync(outputPath, JSON.stringify(geojson));
console.log(`Generated ${outputPath} with ${features.length} features (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)!`);
