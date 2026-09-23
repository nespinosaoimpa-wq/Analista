/**
 * CRIMINT — Motor Analítico y de Inteligencia Criminal
 * Clasificación de temática delictiva, extracción de denunciados/imputados,
 * análisis de coincidencias territoriales y evolución temporal mes a mes y año a año.
 */

// ============================================================
// 1. TAXONOMÍA Y TEMÁTICA DELICTIVA
// ============================================================

export const CRIME_THEMATICS = {
  MICROTRAFICO: {
    id: 'microtrafico',
    nombre: 'Microtráfico y Estupefacientes',
    color: '#10B981', // Esmeralda / Verde
    lesividad: 4,
    icon: '💊'
  },
  ARMAS: {
    id: 'armas',
    nombre: 'Armas y Balaceras',
    color: '#F97316', // Naranja
    lesividad: 8,
    icon: '💥'
  },
  HOMICIDIOS: {
    id: 'homicidios',
    nombre: 'Homicidios y Tentativas',
    color: '#EF4444', // Rojo
    lesividad: 10,
    icon: '🩸'
  },
  USURPACION: {
    id: 'usurpacion',
    nombre: 'Usurpación de Inmuebles',
    color: '#8B5CF6', // Violeta
    lesividad: 5,
    icon: '🏚️'
  },
  ROBOS: {
    id: 'robos',
    nombre: 'Robos y Asaltos',
    color: '#EC4899', // Rosa / Fucsia
    lesividad: 6,
    icon: '🚨'
  },
  VIOLENCIA: {
    id: 'violencia',
    nombre: 'Violencia y Conflictos',
    color: '#F59E0B', // Ámbar
    lesividad: 5,
    icon: '⚠️'
  },
  OTROS: {
    id: 'otros',
    nombre: 'Otras Incidencias',
    color: '#64748B', // Pizarra
    lesividad: 3,
    icon: '📋'
  }
};

const STOP_WORDS = new Set([
  'llamada anonima', 'llamado anonimo', 'los vecinos', 'los mismos', 'los fines',
  'los estupefacientes', 'los dias', 'los domicilios', 'los retire', 'los viste',
  'los gritos', 'los hechos quien', 'descripcion:', 'recurrente', 'sin nombre',
  'santa fe', 'puerta negra', 'puerta blanca', 'porton negro', 'casa amarilla',
  'pasillo', 'reja negra', 'camioneta', 'auto', 'moto', 'motocicleta', 'frente',
  'anonimo', 'tercero', 'femenina', 'masculino', 'denuncia', 'comisaria',
  'personal policial', 'movil policial', 'central de emergencias 911'
]);

/**
 * Clasifica una incidencia en la taxonomía estandarizada
 */
export function classifyCrimeThematic(text = '', folder = '') {
  const combined = `${text} ${folder}`.toLowerCase();

  if (combined.includes('homicid') || combined.includes('matar') || combined.includes('muert') || combined.includes('fallecid')) {
    return CRIME_THEMATICS.HOMICIDIOS;
  }
  if (combined.includes('arma') || combined.includes('disparo') || combined.includes('tiro') || combined.includes('haf') || combined.includes('hab') || combined.includes('balacer') || combined.includes('pistola') || combined.includes('vaina') || combined.includes('escopeta') || combined.includes('calibre')) {
    return CRIME_THEMATICS.ARMAS;
  }
  if (combined.includes('usurp') || combined.includes('desalojo') || combined.includes('toma de') || combined.includes('inmueble tomado')) {
    return CRIME_THEMATICS.USURPACION;
  }
  if (combined.includes('rob') || combined.includes('asalt') || combined.includes('arrebato') || combined.includes('sustra') || combined.includes('motochorro')) {
    return CRIME_THEMATICS.ROBOS;
  }
  if (combined.includes('drog') || combined.includes('cocain') || combined.includes('marihuan') || combined.includes('estupefacient') || combined.includes('microtr') || combined.includes('kios') || combined.includes('bunker') || combined.includes('faso') || combined.includes('vende') || combined.includes('comercializ') || combined.includes('fraccionad') || combined.includes('papelitos') || combined.includes('narco')) {
    return CRIME_THEMATICS.MICROTRAFICO;
  }
  if (combined.includes('amenaz') || combined.includes('golp') || combined.includes('gresca') || combined.includes('agresion') || combined.includes('desorden') || combined.includes('machete') || combined.includes('pelea')) {
    return CRIME_THEMATICS.VIOLENCIA;
  }

  return CRIME_THEMATICS.OTROS;
}

// ============================================================
// 2. EXTRACCIÓN DE DENUNCIADOS / IMPUTADOS / APODOS
// ============================================================

export function extractDenunciados(props = {}) {
  const names = new Set();
  const text = `${props.nombre || ''} ${props.resumen || ''} ${props.descripcion || ''}`;

  // 1. Apodos o nombres entre comillas en el título o descripción
  const quotes = text.match(/"([^"]+)"/g) || [];
  quotes.forEach(q => {
    let clean = q.replace(/"/g, '').trim();
    if (clean.length >= 3 && clean.length <= 40 && !clean.toLowerCase().startsWith('cuij') && !clean.toLowerCase().startsWith('sf:')) {
      const lower = clean.toLowerCase();
      if (!STOP_WORDS.has(lower) && !lower.includes('puerta') && !lower.includes('color') && !lower.includes('descripcion')) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        names.add(clean);
      }
    }
  });

  // 2. Patrones explícitos: 'familia XYZ', 'apodo XYZ', 'alias XYZ', 'imputado XYZ'
  const explicitMatches = text.match(/\b(?:familia|flia\.?|banda de|alias|apodo|imputado|imputada)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/gi) || [];
  explicitMatches.forEach(m => {
    let clean = m.trim().replace(/\s+/g, ' ');
    if (clean.length >= 5 && clean.length <= 35) {
      const lower = clean.toLowerCase();
      if (!STOP_WORDS.has(lower) && !lower.includes('estupefaciente')) {
        names.add(clean);
      }
    }
  });

  // 3. Imputados judiciales directos si vienen en los datos
  if (props.imputados) {
    const imps = String(props.imputados).split(/\/\/|,|;/);
    imps.forEach(imp => {
      const cleaned = imp.replace(/\[(CON_IMP|SIN_IMP)\]/g, '').replace(/\(DNI[^\)]*\)/g, '').replace(/\(NO_INFORMA[^\)]*\)/g, '').trim();
      if (cleaned.length >= 4 && cleaned.toUpperCase() !== 'NN') {
        names.add(cleaned);
      }
    });
  }

  return Array.from(names);
}

// ============================================================
// 3. ANÁLISIS TEMPORAL (FECHAS, MESES, AÑOS)
// ============================================================

const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function extractTemporalInfo(props = {}) {
  let year = null;
  let month = null; // 1-12
  let day = null;
  let isoDate = null;

  // 1. Si ya tiene propiedad fecha válida
  if (props.fecha && typeof props.fecha === 'string' && props.fecha.length >= 10) {
    const d = new Date(props.fecha);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
      isoDate = props.fecha;
    }
  }

  // 2. Si no tiene fecha, buscar patrones en el texto (ej: 27/12/2023, 27/01/24, etc.)
  if (!year || year < 2020 || year > 2028) {
    const text = `${props.nombre || ''} ${props.resumen || ''} ${props.descripcion || ''} ${props.folder || ''}`;
    const dateMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (dateMatch) {
      day = parseInt(dateMatch[1]);
      month = parseInt(dateMatch[2]);
      let yStr = dateMatch[3];
      if (yStr.length === 2) yStr = '20' + yStr;
      year = parseInt(yStr);

      if (month >= 1 && month <= 12 && year >= 2020 && year <= 2028) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`;
        isoDate = `${dStr}T12:00:00.000Z`;
      }
    }
  }

  // 3. Inferir por carpeta de priorización si está disponible
  if (!year || year < 2020 || year > 2028) {
    if (props.folder === 'Priorizaciones 2024') {
      year = 2024;
      month = month || 6;
    } else if (props.folder === 'Priorizaciones 2025') {
      year = 2025;
      month = month || 6;
    } else {
      // Fallback a año base 2024-2026 derivado pseudo-aleatorio estable según ID
      const hash = (props.id || props.nombre || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      year = 2024 + (hash % 3); // 2024, 2025 o 2026
      month = (hash % 12) + 1;
      isoDate = `${year}-${String(month).padStart(2, '0')}-15T12:00:00.000Z`;
    }
  }

  return {
    year: String(year),
    month: month || 1,
    monthName: MESES_NOMBRES[(month || 1) - 1],
    isoDate: isoDate || `${year}-${String(month || 1).padStart(2, '0')}-01T12:00:00.000Z`
  };
}

// ============================================================
// 4. NORMALIZACIÓN DE TERRITORIO (HOTSPOTS & BARRIOS)
// ============================================================

export function extractTerritoryKey(props = {}) {
  const rawDir = (props.direccion || props.nombre || '').split(/"|—|–|\(|CUIJ/i)[0].trim();
  if (rawDir.length >= 4) {
    return rawDir.toLowerCase()
      .replace(/^(en|de|frente a|cerca de|esquina)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return props.barrio || 'Santa Fe Capital';
}

// ============================================================
// 5. ENRIQUECIMIENTO EN VIVO DE FEATURES
// ============================================================

export function enrichTacticalFeature(feature, index = 0) {
  if (!feature || !feature.properties) return feature;
  const p = feature.properties;

  // Temática
  const thematic = classifyCrimeThematic(
    `${p.nombre || ''} ${p.resumen || ''} ${p.descripcion || ''}`,
    p.folder || p.tipo || ''
  );

  // Denunciados
  const denunciados = extractDenunciados(p);

  // Temporal
  const temp = extractTemporalInfo(p);

  // Territorio
  const territoryKey = extractTerritoryKey(p);

  // Lesividad
  const lesividad = p.lesividad || thematic.lesividad || 3;

  return {
    ...feature,
    properties: {
      ...p,
      id: p.id || `tactical-${index}`,
      tematica_id: thematic.id,
      tematica_nombre: thematic.nombre,
      tematica_icon: thematic.icon,
      color: thematic.color,
      lesividad,
      denunciados,
      fecha: temp.isoDate,
      anio: temp.year,
      mes: temp.month,
      mes_nombre: temp.monthName,
      territory_key: territoryKey,
      barrio: p.barrio || p.nombre || 'Santa Fe'
    }
  };
}

// ============================================================
// 6. MOTOR DE AGREGACIÓN & ESTADÍSTICAS INTELIGENTES
// ============================================================

export function analyzeIncidents(features = []) {
  const points = features.filter(f => f.geometry?.type === 'Point');

  // A. Conteo por Temática
  const byThematic = {};
  Object.values(CRIME_THEMATICS).forEach(t => {
    byThematic[t.id] = { ...t, count: 0, percentage: 0 };
  });

  // B. Coincidencias de Denunciados
  const denunciadosMap = new Map();

  // C. Coincidencias de Territorio (Hotspots)
  const territoryMap = new Map();
  const barrioMap = new Map();

  // D. Evolución Temporal Mes a Mes y Año a Año
  const monthByYearMatrix = {
    '2024': Array(12).fill(0),
    '2025': Array(12).fill(0),
    '2026': Array(12).fill(0)
  };
  const yearCounts = { '2024': 0, '2025': 0, '2026': 0 };

  points.forEach((f) => {
    const p = f.properties || {};

    // Temática
    const tId = p.tematica_id || 'otros';
    if (byThematic[tId]) {
      byThematic[tId].count++;
    } else if (byThematic['otros']) {
      byThematic['otros'].count++;
    }

    // Denunciados
    (p.denunciados || []).forEach(name => {
      const list = denunciadosMap.get(name) || [];
      list.push(f);
      denunciadosMap.set(name, list);
    });

    // Territorio / Hotspots
    const tKey = p.territory_key || 'Santa Fe';
    const tList = territoryMap.get(tKey) || [];
    tList.push(f);
    territoryMap.set(tKey, tList);

    // Barrio
    const barrio = p.barrio || 'Santa Fe';
    barrioMap.set(barrio, (barrioMap.get(barrio) || 0) + 1);

    // Temporal
    const y = p.anio || '2024';
    const m = (p.mes || 1) - 1; // 0-11
    if (monthByYearMatrix[y]) {
      monthByYearMatrix[y][m]++;
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }
  });

  // Porcentajes de temáticas
  const totalPoints = points.length || 1;
  Object.keys(byThematic).forEach(k => {
    byThematic[k].percentage = Math.round((byThematic[k].count / totalPoints) * 100);
  });

  // Top Denunciados Recurrentes (al menos 2 incidencias)
  const topDenunciados = Array.from(denunciadosMap.entries())
    .map(([nombre, list]) => ({
      nombre,
      incidencias: list.length,
      delitos: Array.from(new Set(list.map(f => f.properties?.tematica_nombre || 'Incidencia'))),
      ubicaciones: Array.from(new Set(list.map(f => f.properties?.direccion || f.properties?.barrio).filter(Boolean))),
      features: list
    }))
    .filter(d => d.incidencias >= 2)
    .sort((a, b) => b.incidencias - a.incidencias)
    .slice(0, 30);

  // Top Hotspots / Puntos Territoriales Recurrentes
  const topHotspots = Array.from(territoryMap.entries())
    .map(([ubicacion, list]) => ({
      ubicacion: ubicacion.charAt(0).toUpperCase() + ubicacion.slice(1),
      incidencias: list.length,
      coordenadas: list[0]?.geometry?.coordinates || [-60.7005, -31.6333],
      delitos: Array.from(new Set(list.map(f => f.properties?.tematica_nombre || 'Incidencia'))),
      features: list
    }))
    .filter(h => h.incidencias >= 3)
    .sort((a, b) => b.incidencias - a.incidencias)
    .slice(0, 25);

  // Top Barrios
  const topBarrios = Array.from(barrioMap.entries())
    .map(([barrio, count]) => ({ barrio, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    totalIncidencias: points.length,
    byThematic,
    topDenunciados,
    topHotspots,
    topBarrios,
    temporal: {
      matrix: monthByYearMatrix,
      yearCounts,
      mesesNombres: MESES_NOMBRES
    }
  };
}

// ============================================================
// 7. FILTRADO MULTI-CRITERIO EN MEMORIA
// ============================================================

export function filterFeatures(features = [], filters = {}) {
  return features.filter(f => {
    if (f.geometry?.type !== 'Point') return true; // Keep polygons visible
    const p = f.properties || {};

    // 1. Temática
    if (filters.tematica && filters.tematica !== 'todos' && filters.tematica !== '') {
      if (p.tematica_id !== filters.tematica && p.tematica_nombre !== filters.tematica) {
        return false;
      }
    }

    // 2. Año
    if (filters.anio && filters.anio !== 'todos') {
      if (String(p.anio) !== String(filters.anio)) {
        return false;
      }
    }

    // 3. Mes (1-12)
    if (filters.mes && filters.mes !== 'todos') {
      if (parseInt(p.mes) !== parseInt(filters.mes)) {
        return false;
      }
    }

    // 4. Lesividad mínima
    if (filters.lesividadMin && p.lesividad < filters.lesividadMin) {
      return false;
    }

    // 5. Denunciado específico
    if (filters.denunciado) {
      const q = filters.denunciado.toLowerCase();
      const match = (p.denunciados || []).some(d => d.toLowerCase().includes(q)) ||
                    (p.nombre || '').toLowerCase().includes(q) ||
                    (p.resumen || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // 6. Territorio / Hotspot específico
    if (filters.territorio) {
      const t = (p.territory_key || '').toLowerCase();
      const b = (p.barrio || '').toLowerCase();
      const d = (p.direccion || '').toLowerCase();
      const q = filters.territorio.toLowerCase();
      if (!t.includes(q) && !b.includes(q) && !d.includes(q)) return false;
    }

    // 7. Rango de fechas
    if (filters.desde && p.fecha && p.fecha.split('T')[0] < filters.desde) {
      return false;
    }
    if (filters.hasta && p.fecha && p.fecha.split('T')[0] > filters.hasta) {
      return false;
    }

    return true;
  });
}
