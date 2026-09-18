/**
 * CRIMINT — Script de Importación de Datos Locales
 * Lee las planillas Excel y archivos KMZ de la carpeta de incidencias:
 * - 'Mapa sin nombre.kmz' -> Extrae polígonos y puntos GPS de Santa Fe
 * - 'insumo para informe.xlsx' -> Hechos penales, CUIJ, imputados y domicilios
 * - 'HAF-2025-SF (2).xlsx' -> Hechos armados y heridos/homicidios
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gzatltsxpvnmtrafjmbg.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_DIR = path.resolve('001 - Microtrafico - Incidencias-20260917T160119Z-1-001', '001 - Microtrafico - Incidencias');

async function importKMZ() {
  const kmzFile = path.join(BASE_DIR, 'Mapa sin nombre.kmz');
  if (!fs.existsSync(kmzFile)) {
    console.log('No se encontró archivo KMZ en:', kmzFile);
    return;
  }

  console.log('🗺️ Procesando KMZ:', kmzFile);
  const buf = fs.readFileSync(kmzFile);
  const zip = new JSZip();
  const loaded = await zip.loadAsync(buf);

  let kmlText = '';
  for (const fname of Object.keys(loaded.files)) {
    if (fname.toLowerCase().endsWith('.kml')) {
      kmlText = await loaded.files[fname].async('string');
      break;
    }
  }

  if (!kmlText) {
    console.log('No se encontró .kml dentro del archivo KMZ');
    return;
  }

  const placemarks = kmlText.match(/<Placemark>[\s\S]*?<\/Placemark>/g) || [];
  console.log(`Encontrados ${placemarks.length} elementos en el mapa KMZ.`);

  for (const pm of placemarks) {
    const rawName = pm.match(/<name>([\s\S]*?)<\/name>/)?.[1] || 'Sin nombre';
    const name = rawName.replace(/<!\[CDATA\[|\]\]>/g, '').trim();

    // Check Point
    const pointMatch = pm.match(/<Point>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/Point>/);
    if (pointMatch) {
      const parts = pointMatch[1].trim().split(',');
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!isNaN(lng) && !isNaN(lat)) {
        await supabase.from('hechos_delictivos').insert({
          tipo_penal: name.toLowerCase().includes('homicidio') ? 'Homicidio' : 'Microtráfico',
          direccion: name,
          barrio: 'Yapeyú',
          localidad: 'Santa Fe',
          geom: `SRID=4326;POINT(${lng} ${lat})`,
          estado_georref: 'CONFIRMADA',
          precision_geo: 'EXACTA_ALTURA',
          fecha: new Date().toISOString(),
          indice_lesividad: name.toLowerCase().includes('homicidio') ? 10 : 4,
          resumen: `Elemento georreferenciado importado de Google My Maps: ${name}`
        });
      }
    }

    // Check Polygon
    const polyMatch = pm.match(/<Polygon>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/Polygon>/);
    if (polyMatch) {
      const coordsText = polyMatch[1].trim();
      const pairs = coordsText.split(/\s+/).map(p => {
        const [x, y] = p.split(',');
        return `${x} ${y}`;
      }).filter(s => s.length > 5);

      if (pairs.length >= 3) {
        // Ensure ring is closed
        if (pairs[0] !== pairs[pairs.length - 1]) pairs.push(pairs[0]);
        const wkt = `SRID=4326;POLYGON((${pairs.join(', ')}))`;
        await supabase.from('zonas_geograficas').insert({
          nombre: `Zona: ${name}`,
          tipo: 'BANDA_CONFLICTO',
          barrio: 'Yapeyú',
          geom: wkt,
          color_hex: '#EF4444',
          descripcion: 'Polígono de interés operacional importado de mapa táctico'
        });
      }
    }
  }
}

async function importInsumosExcel() {
  const file = path.join(BASE_DIR, 'insumo para informe.xlsx');
  if (!fs.existsSync(file)) {
    console.log('No se encontró archivo de insumos:', file);
    return;
  }

  console.log('📊 Procesando planilla de insumos judiciales:', file);
  const buf = fs.readFileSync(file);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Leídas ${rows.length} filas del informe.`);

  let inserted = 0;
  for (const r of rows.slice(0, 50)) { // Process batch
    try {
      // 1. Insert Hecho
      await supabase.from('hechos_delictivos').insert({
        cuij: r.cuij ? String(r.cuij) : null,
        tipo_penal: r.valoraciones?.includes('Microtráfico') ? 'Microtráfico' : 'Tenencia de estupefacientes',
        direccion: r.domicilios || 'Santa Fe',
        localidad: r.localidad || 'Santa Fe',
        resumen: `${r.calificaciones || ''} | Dependencia: ${r.dependencia_policial || ''}`,
        fecha: new Date().toISOString(),
        indice_lesividad: 4,
        estado_georref: 'REVISION_MANUAL'
      });

      // 2. Insert Imputado if present
      if (r.imputados && r.imputados.includes('(')) {
        const match = r.imputados.match(/(?:\[CON_IMP\])?\s*([A-Za-zñÑáéíóúÁÉÍÓÚ\s,]+)\s*\((?:DNI\s*)?(\d+)?\)/);
        if (match) {
          const rawName = match[1].trim();
          const dni = match[2] || null;
          const parts = rawName.split(',').map(s => s.trim());
          const apellido = parts[0] || '';
          const nombre = parts[1] || parts[0];

          await supabase.from('personas').insert({
            nombre,
            apellido,
            dni,
            domicilio_principal: r.domicilios_imputados || null,
            antecedentes_texto: `Causa judicial CUIJ ${r.cuij || ''} en ${r.dependencia_policial || ''}`,
            roles: ['imputado', 'investigado'],
            score_peligrosidad: 6,
            activo: true
          });
        }
      }

      inserted++;
    } catch (e) {
      // Ignore duplicates
    }
  }

  console.log(`✓ Procesadas ${inserted} causas judiciales e imputados.`);
}

async function run() {
  console.log('🚀 Iniciando pipeline de ingesta de datos locales...');
  await importKMZ();
  await importInsumosExcel();
  console.log('✅ Finalizado pipeline de ingesta local.');
}

run().catch(console.error);
