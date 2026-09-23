import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';
import {
  INITIAL_HECHOS,
  INITIAL_ZONAS,
  INITIAL_PERSONAS,
  INITIAL_BANDAS,
  INITIAL_ALLANAMIENTOS,
  INITIAL_VINCULOS
} from './initial-data.js';

let supabase = null;
try {
  const url = CONFIG.supabase.url;
  const key = CONFIG.supabase.anonKey;
  if (url && key) {
    supabase = createClient(url, key);
  }
} catch (e) {
  console.warn('Supabase client init fallback:', e);
}

// Hydrate from localStorage for offline/client-side persistence of new investigations
function hydrateCustomStore(key, targetList) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`crimint_custom_${key}`) : null;
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        items.forEach(it => {
          if (!targetList.some(x => x.id === it.id)) {
            targetList.unshift(it);
          }
        });
      }
    }
  } catch (e) { }
}

function persistCustomItem(key, item) {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(`crimint_custom_${key}`);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(item);
    localStorage.setItem(`crimint_custom_${key}`, JSON.stringify(list));
  } catch (e) { }
}

hydrateCustomStore('personas', INITIAL_PERSONAS);
hydrateCustomStore('bandas', INITIAL_BANDAS);
hydrateCustomStore('vinculos', INITIAL_VINCULOS);
hydrateCustomStore('allanamientos', INITIAL_ALLANAMIENTOS);
hydrateCustomStore('hechos', INITIAL_HECHOS);

export default supabase;

// ============================================================
// HECHOS DELICTIVOS
// ============================================================
export async function getHechos({ desde, hasta, lesividadMin, tipo, limit = 500 } = {}) {
  try {
    if (supabase) {
      let query = supabase.from('hechos_delictivos').select('*').order('fecha', { ascending: false });
      if (desde) query = query.gte('fecha', desde);
      if (hasta) query = query.lte('fecha', hasta);
      if (lesividadMin) query = query.gte('indice_lesividad', lesividadMin);
      if (tipo && tipo !== 'Todos') query = query.eq('tipo_penal', tipo);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('Supabase hechos no disponibles, usando datos tácticos:', err?.message);
  }

  // Filter fallback data
  let filtered = [...INITIAL_HECHOS];
  if (desde) filtered = filtered.filter(h => h.fecha >= desde);
  if (hasta) filtered = filtered.filter(h => h.fecha <= hasta);
  if (lesividadMin) filtered = filtered.filter(h => h.indice_lesividad >= lesividadMin);
  if (tipo && tipo !== 'Todos') filtered = filtered.filter(h => h.tipo_penal === tipo);
  return filtered.slice(0, limit);
}

export async function insertHecho(hecho) {
  if (hecho.direccion && !hecho.geom) {
    const coords = await geocodeAddress(hecho.direccion, hecho.barrio, hecho.localidad);
    if (coords) {
      hecho.geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
      hecho.precision_geo = coords.precision;
      hecho.estado_georref = coords.confidence > 0.7 ? 'CONFIRMADA' : 'REVISION_MANUAL';
    }
  }

  try {
    if (supabase) {
      const { data, error } = await supabase.from('hechos_delictivos').insert(hecho).select();
      if (!error && data?.[0]) return data[0];
    }
  } catch (e) {
    console.warn('Inserción en Supabase falló, guardando en memoria local:', e);
  }

  // Local fallback insert
  const item = { ...hecho, id: `local-hecho-${Date.now()}` };
  INITIAL_HECHOS.unshift(item);
  persistCustomItem('hechos', item);
  return item;
}

export async function getHechosGeoJSON({ desde, hasta, lesividadMin, tipo } = {}) {
  const hechos = await getHechos({ desde, hasta, lesividadMin, tipo, limit: 5000 });
  return {
    type: 'FeatureCollection',
    features: hechos.map(h => {
      const coords = parseGeom(h.geom);
      if (!coords) return null;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] },
        properties: {
          id: h.id,
          tipo: h.tipo_penal,
          fecha: h.fecha,
          barrio: h.barrio,
          direccion: h.direccion,
          lesividad: h.indice_lesividad,
          cuij: h.cuij,
          resumen: h.resumen,
        }
      };
    }).filter(Boolean)
  };
}

export async function getHechoById(id) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('hechos_delictivos').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
  } catch (e) { }

  return INITIAL_HECHOS.find(h => h.id === id) || null;
}

// ============================================================
// PERSONAS
// ============================================================
export async function getPersonas({ search, limit = 200 } = {}) {
  try {
    if (supabase) {
      let query = supabase.from('personas').select('*').eq('activo', true).order('fecha_creacion', { ascending: false });
      if (search) {
        query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,dni.eq.${search}`);
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('Supabase personas fallback:', e?.message);
  }

  let list = [...INITIAL_PERSONAS];
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      p.nombre?.toLowerCase().includes(s) ||
      p.apellido?.toLowerCase().includes(s) ||
      p.dni?.includes(s) ||
      p.alias?.some(a => a.toLowerCase().includes(s))
    );
  }
  return list.slice(0, limit);
}

export async function insertPersona(persona) {
  if (typeof persona.alias === 'string') {
    persona.alias = persona.alias.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (typeof persona.roles === 'string') {
    persona.roles = persona.roles.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (persona.domicilio_principal && !persona.domicilio_principal_geom) {
    const coords = await geocodeAddress(persona.domicilio_principal);
    if (coords) {
      persona.domicilio_principal_geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
    }
  }

  try {
    if (supabase) {
      const { data, error } = await supabase.from('personas').insert(persona).select();
      if (!error && data?.[0]) return data[0];
    }
  } catch (e) {
    console.warn('Insert persona fallback local:', e);
  }

  const p = { ...persona, id: `local-persona-${Date.now()}` };
  INITIAL_PERSONAS.unshift(p);
  persistCustomItem('personas', p);
  return p;
}

export async function updatePersona(id, updates = {}) {
  if (typeof updates.alias === 'string') {
    updates.alias = updates.alias.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (typeof updates.roles === 'string') {
    updates.roles = updates.roles.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (updates.domicilio_principal && !updates.domicilio_principal_geom) {
    const coords = await geocodeAddress(updates.domicilio_principal);
    if (coords) {
      updates.domicilio_principal_geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
    }
  }

  // Si tiene banda, asignar el color distintivo
  if (updates.banda_id || updates.banda_nombre) {
    const b = INITIAL_BANDAS.find(x => x.id === updates.banda_id || x.nombre.toLowerCase() === (updates.banda_nombre || '').toLowerCase());
    if (b && b.color_hex) updates.banda_color = b.color_hex;
  }

  try {
    if (supabase) {
      const { data, error } = await supabase.from('personas').update(updates).eq('id', id).select();
      if (!error && data?.[0]) {
        const idx = INITIAL_PERSONAS.findIndex(p => p.id === id);
        if (idx !== -1) INITIAL_PERSONAS[idx] = { ...INITIAL_PERSONAS[idx], ...data[0] };
        return data[0];
      }
    }
  } catch (e) {
    console.warn('Update persona fallback local:', e);
  }

  // Actualización local
  const idx = INITIAL_PERSONAS.findIndex(p => p.id === id);
  if (idx !== -1) {
    INITIAL_PERSONAS[idx] = { ...INITIAL_PERSONAS[idx], ...updates };
    persistCustomItem('personas', INITIAL_PERSONAS[idx]);
    return INITIAL_PERSONAS[idx];
  }
  return null;
}

export async function getPersonasGeoJSON() {
  const personas = await getPersonas({ limit: 1000 });
  const bandas = await getBandas();
  const bandaColorMap = {};
  bandas.forEach(b => {
    bandaColorMap[b.id] = b.color_hex || '#0EA5E9';
    bandaColorMap[b.nombre.toLowerCase()] = b.color_hex || '#0EA5E9';
  });

  const features = personas.map(p => {
    const coords = parseGeom(p.domicilio_principal_geom);
    if (!coords || isNaN(coords.lng) || isNaN(coords.lat)) return null;

    const bColor = p.banda_color || bandaColorMap[p.banda_id] || bandaColorMap[(p.banda_nombre || '').toLowerCase()] || '#0EA5E9';
    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat]
      },
      properties: {
        id: p.id,
        nombre: p.nombre || '',
        apellido: p.apellido || '',
        nombre_completo: nombreCompleto,
        alias: Array.isArray(p.alias) ? p.alias : (p.alias ? [p.alias] : []),
        alias_texto: Array.isArray(p.alias) ? p.alias.join(', ') : (p.alias || ''),
        dni: p.dni || '',
        cuit: p.cuit || '',
        fecha_nacimiento: p.fecha_nacimiento || '',
        roles: Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []),
        score_peligrosidad: parseInt(p.score_peligrosidad) || 5,
        pedido_captura: Boolean(p.pedido_captura),
        estado_judicial: p.estado_judicial || 'IDENTIFICADO',
        banda_id: p.banda_id || '',
        banda_nombre: p.banda_nombre || 'Individual',
        banda_color: bColor,
        domicilio_principal: p.domicilio_principal || '',
        link_dossier: p.link_dossier || '',
        cuij_asociados: p.cuij_asociados || [],
        delitos_asociados: p.delitos_asociados || [],
        antecedentes_texto: p.antecedentes_texto || ''
      }
    };
  }).filter(Boolean);

  return {
    type: 'FeatureCollection',
    features
  };
}

export async function getPersonaById(id) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('personas').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
  } catch (e) { }

  return INITIAL_PERSONAS.find(p => p.id === id) || null;
}

export async function buscarPersonaFuzzy(termino) {
  return getPersonas({ search: termino, limit: 20 });
}

// ============================================================
// BANDAS
// ============================================================
export async function getBandas({ search, limit = 100 } = {}) {
  try {
    if (supabase) {
      let query = supabase.from('bandas').select('*').order('fecha_creacion', { ascending: false });
      if (search) query = query.ilike('nombre', `%${search}%`);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('Supabase bandas fallback:', e?.message);
  }

  let list = [...INITIAL_BANDAS];
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(b => b.nombre.toLowerCase().includes(s) || b.barrio_base?.toLowerCase().includes(s));
  }
  return list.slice(0, limit);
}

export async function insertBanda(banda) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('bandas').insert(banda).select();
      if (!error && data?.[0]) return data[0];
    }
  } catch (e) { }

  const b = { ...banda, id: `local-banda-${Date.now()}` };
  INITIAL_BANDAS.unshift(b);
  persistCustomItem('bandas', b);
  return b;
}

export async function getBandaById(id) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('bandas').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
  } catch (e) { }

  return INITIAL_BANDAS.find(b => b.id === id) || null;
}

// ============================================================
// VÍNCULOS (GRAFO)
// ============================================================
export async function getGrafoPersona(personaId) {
  try {
    if (supabase) {
      const { data, error } = await supabase.rpc('grafo_persona', { p_persona_id: personaId });
      if (!error && data && data.length > 0) return data;

      const { data: vinculos, error: e2 } = await supabase.from('vinculos')
        .select('*')
        .or(`persona_origen_id.eq.${personaId},persona_destino_id.eq.${personaId}`);
      if (!e2 && vinculos && vinculos.length > 0) return vinculos;
    }
  } catch (e) { }

  return INITIAL_VINCULOS.filter(v =>
    v.persona_origen_id === personaId || v.persona_destino_id === personaId || !personaId
  );
}

export async function insertVinculo(vinculo) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('vinculos').insert(vinculo).select();
      if (!error && data?.[0]) return data[0];
    }
  } catch (e) { }

  const v = { ...vinculo, id: `local-vinculo-${Date.now()}` };
  INITIAL_VINCULOS.unshift(v);
  persistCustomItem('vinculos', v);
  return v;
}

export async function getAllVinculos() {
  return [...INITIAL_VINCULOS];
}

// ============================================================
// ALLANAMIENTOS
// ============================================================
export async function getAllanamientos({ search, limit = 100 } = {}) {
  try {
    if (supabase) {
      let query = supabase.from('allanamientos').select('*').order('fecha_operativo', { ascending: false });
      if (search) query = query.or(`cuij.ilike.%${search}%,direccion.ilike.%${search}%`);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
  } catch (e) { }

  let list = [...INITIAL_ALLANAMIENTOS];
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(a => a.cuij?.toLowerCase().includes(s) || a.direccion?.toLowerCase().includes(s));
  }
  return list.slice(0, limit);
}

export async function insertAllanamiento(all) {
  if (all.direccion && !all.geom) {
    const coords = await geocodeAddress(all.direccion, all.barrio, all.localidad);
    if (coords) {
      all.geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
    }
  }

  try {
    if (supabase) {
      const { data, error } = await supabase.from('allanamientos').insert(all).select();
      if (!error && data?.[0]) return data[0];
    }
  } catch (e) { }

  const item = { ...all, id: `local-allanamiento-${Date.now()}` };
  INITIAL_ALLANAMIENTOS.unshift(item);
  persistCustomItem('allanamientos', item);
  return item;
}

export async function getAllanamientoById(id) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('allanamientos').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
  } catch (e) { }

  return INITIAL_ALLANAMIENTOS.find(a => a.id === id) || null;
}

// ============================================================
// ZONAS GEOGRÁFICAS
// ============================================================
export async function getZonas() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('zonas_geograficas').select('*');
      if (!error && data && data.length > 0) return data;
    }
  } catch (e) { }

  return INITIAL_ZONAS;
}

export async function insertZona(zona) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('zonas_geograficas').insert(zona).select();
      if (!error && data?.[0]) return data[0];
    }
  } catch (e) { }

  const z = { ...zona, id: `local-zona-${Date.now()}` };
  INITIAL_ZONAS.unshift(z);
  return z;
}

// ============================================================
// DASHBOARD
// ============================================================
export async function getDashboardStats(desde, hasta) {
  try {
    if (supabase) {
      const { data, error } = await supabase.rpc('dashboard_stats', {
        fecha_desde: desde || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_hasta: hasta || new Date().toISOString(),
      });
      if (!error && data && data.total_hechos > 0) return data;
    }
  } catch (e) { }

  // Compute from initial data
  const hechos = await getHechos({ desde, hasta, limit: 1000 });
  const personas = await getPersonas({ limit: 1000 });
  const bandas = await getBandas({ limit: 1000 });
  const allanamientos = await getAllanamientos({ limit: 1000 });

  const porTipo = {};
  const porBarrio = {};
  const porLesividad = {};
  const porDia = {};

  hechos.forEach(h => {
    porTipo[h.tipo_penal] = (porTipo[h.tipo_penal] || 0) + 1;
    if (h.barrio) porBarrio[h.barrio] = (porBarrio[h.barrio] || 0) + 1;
    porLesividad[h.indice_lesividad] = (porLesividad[h.indice_lesividad] || 0) + 1;
    const dia = h.fecha ? h.fecha.split('T')[0] : 'sin_fecha';
    porDia[dia] = (porDia[dia] || 0) + 1;
  });

  return {
    total_hechos: hechos.length,
    total_personas: personas.length,
    total_bandas: bandas.length,
    total_allanamientos: allanamientos.length,
    por_tipo: Object.entries(porTipo).map(([tipo, cantidad]) => ({ tipo, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
    por_barrio: Object.entries(porBarrio).map(([barrio, cantidad]) => ({ barrio, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 15),
    por_lesividad: Object.entries(porLesividad).map(([nivel, cantidad]) => ({ nivel: parseInt(nivel), cantidad })).sort((a, b) => a.nivel - b.nivel),
    tendencia_diaria: Object.entries(porDia).map(([fecha, cantidad]) => ({ fecha, cantidad })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

// ============================================================
// AUDIT LOG
// ============================================================
export async function logAction(accion, tabla, registroId, detalle = {}) {
  try {
    if (supabase) {
      await supabase.from('audit_log').insert({
        usuario: 'analista',
        rol: 'admin',
        accion,
        tabla,
        registro_id: registroId,
        detalle,
      });
    }
  } catch (e) { }
}

// ============================================================
// BÚSQUEDA GLOBAL
// ============================================================
export async function globalSearch(term) {
  if (!term || term.length < 2) return [];
  const results = [];
  const t = term.toLowerCase();

  try {
    const personas = await getPersonas({ search: term, limit: 5 });
    personas.forEach(p => results.push({
      type: 'persona',
      id: p.id,
      title: `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre',
      subtitle: p.alias?.length ? `Alias: ${p.alias.join(', ')}` : (p.dni ? `DNI: ${p.dni}` : p.domicilio_principal || ''),
      coords: parseGeom(p.domicilio_principal_geom),
    }));

    const hechos = await getHechos({ limit: 500 });
    hechos.filter(h =>
      h.cuij?.toLowerCase().includes(t) ||
      h.direccion?.toLowerCase().includes(t) ||
      h.barrio?.toLowerCase().includes(t) ||
      h.tipo_penal?.toLowerCase().includes(t) ||
      h.resumen?.toLowerCase().includes(t)
    ).slice(0, 5).forEach(h => results.push({
      type: 'hecho',
      id: h.id,
      title: h.tipo_penal || 'Hecho',
      subtitle: `${h.direccion || h.barrio || ''} ${h.cuij ? `(CUIJ: ${h.cuij})` : ''}`,
      coords: parseGeom(h.geom),
    }));

    const allanamientos = await getAllanamientos({ search: term, limit: 5 });
    allanamientos.forEach(a => results.push({
      type: 'allanamiento',
      id: a.id,
      title: `Allanamiento: ${a.cuij || a.direccion}`,
      subtitle: `${a.direccion || ''} ${a.barrio ? `(${a.barrio})` : ''}`,
      coords: parseGeom(a.geom),
    }));

    const bandas = await getBandas({ search: term, limit: 5 });
    bandas.forEach(b => results.push({
      type: 'banda',
      id: b.id,
      title: `Banda: ${b.nombre}`,
      subtitle: b.barrio_base ? `Base: ${b.barrio_base}` : '',
    }));
  } catch (e) {
    console.error('Global search error:', e);
  }

  return results;
}

// ============================================================
// GEOCODING (Mapbox)
// ============================================================
export async function geocodeAddress(address, barrio, localidad) {
  if (!address) return null;
  const token = CONFIG.mapbox.token;
  if (!token) return null;

  const query = [address, barrio, localidad || 'Santa Fe', 'Argentina'].filter(Boolean).join(', ');
  const url = `${CONFIG.geocoding.baseUrl}/${encodeURIComponent(query)}.json?access_token=${token}&country=${CONFIG.geocoding.country}&proximity=${CONFIG.geocoding.proximity}&bbox=${CONFIG.geocoding.bbox}&limit=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const feat = data.features[0];
      const [lng, lat] = feat.center;
      let precision = 'APROXIMADA';
      if (feat.place_type?.includes('address')) precision = 'EXACTA_ALTURA';
      else if (feat.place_type?.includes('poi')) precision = 'INTERSECCION';
      else if (feat.place_type?.includes('neighborhood')) precision = 'BARRIO_CENTROIDE';
      return { lat, lng, precision, confidence: feat.relevance || 0 };
    }
  } catch (e) { }
  return null;
}

// ============================================================
// GEOMETRY PARSERS
// ============================================================
export function parseGeom(geomStr) {
  if (!geomStr) return null;
  if (typeof geomStr === 'object' && geomStr.coordinates) {
    return { lng: geomStr.coordinates[0], lat: geomStr.coordinates[1] };
  }
  if (typeof geomStr === 'string') {
    const match = geomStr.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
  }
  return null;
}

export function parsePolygonGeom(geom) {
  if (!geom) return null;
  if (typeof geom === 'object' && geom.type === 'Polygon' && geom.coordinates) {
    return geom;
  }
  if (typeof geom === 'string') {
    if (geom.trim().startsWith('{')) {
      try { return JSON.parse(geom); } catch (e) { }
    }
    // Handle WKT: POLYGON((lng lat, lng lat, ...)) or SRID=4326;POLYGON((lng lat, ...))
    const match = geom.match(/POLYGON\s*\(\(\s*([^)]+)\s*\)\)/i);
    if (match) {
      const coordPairs = match[1].split(',').map(pair => {
        const parts = pair.trim().split(/\s+/);
        return [parseFloat(parts[0]), parseFloat(parts[1])];
      });
      return {
        type: 'Polygon',
        coordinates: [coordPairs]
      };
    }
  }
  return null;
}
