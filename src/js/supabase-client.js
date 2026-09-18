import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

export default supabase;

// ============================================================
// HECHOS DELICTIVOS
// ============================================================
export async function getHechos({ desde, hasta, lesividadMin, tipo, limit = 500 } = {}) {
  let query = supabase.from('hechos_delictivos').select('*').order('fecha', { ascending: false });
  if (desde) query = query.gte('fecha', desde);
  if (hasta) query = query.lte('fecha', hasta);
  if (lesividadMin) query = query.gte('indice_lesividad', lesividadMin);
  if (tipo) query = query.eq('tipo_penal', tipo);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function insertHecho(hecho) {
  // Geocode the address if no geom
  if (hecho.direccion && !hecho.geom) {
    const coords = await geocodeAddress(hecho.direccion, hecho.barrio, hecho.localidad);
    if (coords) {
      hecho.geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
      hecho.precision_geo = coords.precision;
      hecho.estado_georref = coords.confidence > 0.7 ? 'CONFIRMADA' : 'REVISION_MANUAL';
    }
  }
  const { data, error } = await supabase.from('hechos_delictivos').insert(hecho).select();
  if (error) throw error;
  return data[0];
}

export async function getHechosGeoJSON({ desde, hasta, lesividadMin, tipo } = {}) {
  const hechos = await getHechos({ desde, hasta, lesividadMin, tipo, limit: 5000 });
  return {
    type: 'FeatureCollection',
    features: hechos.filter(h => h.geom).map(h => {
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

// ============================================================
// PERSONAS
// ============================================================
export async function getPersonas({ search, limit = 200 } = {}) {
  let query = supabase.from('personas').select('*').eq('activo', true).order('fecha_creacion', { ascending: false });
  if (search) {
    query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,dni.eq.${search}`);
  }
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function insertPersona(persona) {
  // Process arrays from comma-separated strings
  if (typeof persona.alias === 'string') {
    persona.alias = persona.alias.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (typeof persona.roles === 'string') {
    persona.roles = persona.roles.split(',').map(s => s.trim()).filter(Boolean);
  }
  // Geocode domicilio
  if (persona.domicilio_principal && !persona.domicilio_principal_geom) {
    const coords = await geocodeAddress(persona.domicilio_principal);
    if (coords) {
      persona.domicilio_principal_geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
    }
  }
  const { data, error } = await supabase.from('personas').insert(persona).select();
  if (error) throw error;
  return data[0];
}

export async function getPersonaById(id) {
  const { data, error } = await supabase.from('personas').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function buscarPersonaFuzzy(termino) {
  const { data, error } = await supabase.rpc('buscar_persona_fuzzy', { termino });
  if (error) {
    // Fallback to ilike search if RPC not available
    return getPersonas({ search: termino, limit: 20 });
  }
  return data || [];
}

// ============================================================
// BANDAS
// ============================================================
export async function getBandas({ search, limit = 100 } = {}) {
  let query = supabase.from('bandas').select('*, personas!bandas_lider_id_fkey(nombre, apellido, alias)').order('fecha_creacion', { ascending: false });
  if (search) {
    query = query.ilike('nombre', `%${search}%`);
  }
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    // Retry without join
    const { data: d2, error: e2 } = await supabase.from('bandas').select('*').order('fecha_creacion', { ascending: false }).limit(limit);
    if (e2) throw e2;
    return d2 || [];
  }
  return data || [];
}

export async function insertBanda(banda) {
  const { data, error } = await supabase.from('bandas').insert(banda).select();
  if (error) throw error;
  return data[0];
}

// ============================================================
// VÍNCULOS (GRAFO)
// ============================================================
export async function getGrafoPersona(personaId) {
  const { data, error } = await supabase.rpc('grafo_persona', { p_persona_id: personaId });
  if (error) {
    // Fallback: manual query
    const { data: vinculos, error: e2 } = await supabase.from('vinculos')
      .select('*, persona_origen:personas!vinculos_persona_origen_id_fkey(id, nombre, apellido, alias, score_peligrosidad), persona_destino:personas!vinculos_persona_destino_id_fkey(id, nombre, apellido, alias, score_peligrosidad)')
      .or(`persona_origen_id.eq.${personaId},persona_destino_id.eq.${personaId}`)
      .eq('activo', true);
    if (e2) throw e2;
    return vinculos || [];
  }
  return data || [];
}

export async function insertVinculo(vinculo) {
  const { data, error } = await supabase.from('vinculos').insert(vinculo).select();
  if (error) throw error;
  return data[0];
}

// ============================================================
// ALLANAMIENTOS
// ============================================================
export async function getAllanamientos({ search, limit = 100 } = {}) {
  let query = supabase.from('allanamientos').select('*').order('fecha_operativo', { ascending: false });
  if (search) {
    query = query.or(`cuij.ilike.%${search}%,direccion.ilike.%${search}%`);
  }
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function insertAllanamiento(all) {
  if (all.direccion && !all.geom) {
    const coords = await geocodeAddress(all.direccion, all.barrio, all.localidad);
    if (coords) {
      all.geom = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
    }
  }
  const { data, error } = await supabase.from('allanamientos').insert(all).select();
  if (error) throw error;
  return data[0];
}

// ============================================================
// ZONAS GEOGRÁFICAS
// ============================================================
export async function getZonas() {
  const { data, error } = await supabase.from('zonas_geograficas').select('*').eq('visible', true);
  if (error) throw error;
  return data || [];
}

export async function insertZona(zona) {
  const { data, error } = await supabase.from('zonas_geograficas').insert(zona).select();
  if (error) throw error;
  return data[0];
}

// ============================================================
// DASHBOARD
// ============================================================
export async function getDashboardStats(desde, hasta) {
  const { data, error } = await supabase.rpc('dashboard_stats', {
    fecha_desde: desde || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_hasta: hasta || new Date().toISOString(),
  });
  if (error) {
    // Fallback: compute manually
    return computeStatsFallback(desde, hasta);
  }
  return data;
}

async function computeStatsFallback(desde, hasta) {
  const d = desde || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const h = hasta || new Date().toISOString();

  const [hechos, personas, bandas, allanamientos] = await Promise.all([
    supabase.from('hechos_delictivos').select('tipo_penal, barrio, indice_lesividad, fecha').gte('fecha', d).lte('fecha', h),
    supabase.from('personas').select('id', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('bandas').select('id', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('allanamientos').select('id', { count: 'exact', head: true }).gte('fecha_operativo', d).lte('fecha_operativo', h),
  ]);

  const hechosData = hechos.data || [];
  const porTipo = {};
  const porBarrio = {};
  const porLesividad = {};
  const porDia = {};

  hechosData.forEach(h => {
    porTipo[h.tipo_penal] = (porTipo[h.tipo_penal] || 0) + 1;
    if (h.barrio) porBarrio[h.barrio] = (porBarrio[h.barrio] || 0) + 1;
    porLesividad[h.indice_lesividad] = (porLesividad[h.indice_lesividad] || 0) + 1;
    const dia = h.fecha ? h.fecha.split('T')[0] : 'sin_fecha';
    porDia[dia] = (porDia[dia] || 0) + 1;
  });

  return {
    total_hechos: hechosData.length,
    total_personas: personas.count || 0,
    total_bandas: bandas.count || 0,
    total_allanamientos: allanamientos.count || 0,
    por_tipo: Object.entries(porTipo).map(([tipo, cantidad]) => ({ tipo, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
    por_barrio: Object.entries(porBarrio).map(([barrio, cantidad]) => ({ barrio, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 15),
    por_lesividad: Object.entries(porLesividad).map(([nivel, cantidad]) => ({ nivel: parseInt(nivel), cantidad })).sort((a, b) => a.nivel - b.nivel),
    tendencia_diaria: Object.entries(porDia).map(([fecha, cantidad]) => ({ fecha, cantidad })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

// ============================================================
// DOCUMENTOS FUENTE
// ============================================================
export async function insertDocumentoFuente(doc) {
  const { data, error } = await supabase.from('documentos_fuente').insert(doc).select();
  if (error) throw error;
  return data[0];
}

// ============================================================
// VEHÍCULOS Y ARMAS
// ============================================================
export async function insertVehiculo(v) {
  const { data, error } = await supabase.from('vehiculos').insert(v).select();
  if (error) throw error;
  return data[0];
}

export async function insertArma(a) {
  const { data, error } = await supabase.from('armas').insert(a).select();
  if (error) throw error;
  return data[0];
}

// ============================================================
// AUDIT LOG
// ============================================================
export async function logAction(accion, tabla, registroId, detalle = {}) {
  try {
    await supabase.from('audit_log').insert({
      usuario: 'analista',
      rol: 'admin',
      accion,
      tabla,
      registro_id: registroId,
      detalle,
    });
  } catch (e) {
    console.warn('Audit log failed:', e);
  }
}

// ============================================================
// BÚSQUEDA GLOBAL
// ============================================================
export async function globalSearch(term) {
  if (!term || term.length < 2) return [];

  const results = [];

  try {
    // Search personas
    const { data: personas } = await supabase.from('personas')
      .select('id, nombre, apellido, alias, dni')
      .or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%,dni.ilike.%${term}%`)
      .limit(5);

    if (personas) {
      personas.forEach(p => results.push({
        type: 'persona',
        id: p.id,
        title: `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre',
        subtitle: p.alias?.length ? `Alias: ${p.alias.join(', ')}` : (p.dni || ''),
      }));
    }

    // Search hechos
    const { data: hechos } = await supabase.from('hechos_delictivos')
      .select('id, tipo_penal, direccion, barrio, cuij, fecha')
      .or(`cuij.ilike.%${term}%,direccion.ilike.%${term}%,barrio.ilike.%${term}%,requerimiento.ilike.%${term}%`)
      .limit(5);

    if (hechos) {
      hechos.forEach(h => results.push({
        type: 'hecho',
        id: h.id,
        title: h.tipo_penal || 'Hecho',
        subtitle: h.direccion || h.barrio || h.cuij || '',
      }));
    }

    // Search bandas
    const { data: bandas } = await supabase.from('bandas')
      .select('id, nombre, barrio_base')
      .ilike('nombre', `%${term}%`)
      .limit(5);

    if (bandas) {
      bandas.forEach(b => results.push({
        type: 'banda',
        id: b.id,
        title: b.nombre,
        subtitle: b.barrio_base || '',
      }));
    }
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

  const query = [address, barrio, localidad || 'Santa Fe', 'Argentina'].filter(Boolean).join(', ');
  const url = `${CONFIG.geocoding.baseUrl}/${encodeURIComponent(query)}.json?access_token=${CONFIG.mapbox.token}&country=${CONFIG.geocoding.country}&proximity=${CONFIG.geocoding.proximity}&bbox=${CONFIG.geocoding.bbox}&limit=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const feat = data.features[0];
      const [lng, lat] = feat.center;
      const relevance = feat.relevance || 0;

      // Determine precision
      let precision = 'APROXIMADA';
      if (feat.place_type?.includes('address')) precision = 'EXACTA_ALTURA';
      else if (feat.place_type?.includes('poi')) precision = 'INTERSECCION';
      else if (feat.place_type?.includes('neighborhood')) precision = 'BARRIO_CENTROIDE';

      return { lat, lng, precision, confidence: relevance };
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
}

// ============================================================
// HELPERS
// ============================================================
function parseGeom(geomStr) {
  if (!geomStr) return null;
  // Handle WKT/EWKT: SRID=4326;POINT(-60.123 -31.456) or POINT(-60.123 -31.456)
  const match = geomStr.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  }
  // Handle GeoJSON-style { type: "Point", coordinates: [lng, lat] }
  if (typeof geomStr === 'object' && geomStr.coordinates) {
    return { lng: geomStr.coordinates[0], lat: geomStr.coordinates[1] };
  }
  return null;
}

export { parseGeom };
