import mapboxgl from 'mapbox-gl';
import { CONFIG, getLesividadColor, formatDateTime, formatDate } from './config.js';
import { getHechosGeoJSON, getZonas, getAllanamientos, parseGeom, parsePolygonGeom } from './supabase-client.js';
import { enrichTacticalFeature, filterFeatures, CRIME_THEMATICS } from './analytics-engine.js';

let map = null;
let popup = null;
let allMasterFeatures = []; // Master cache of all points
let activeMapFeatures = [];   // Currently visible/filtered points
let masterPolygons = [];      // Polygons (barrios / zonas)
let currentFilterCriteria = {};

export function getAllMasterFeatures() {
  return allMasterFeatures;
}

export function getActiveMapFeatures() {
  return activeMapFeatures;
}

export function setActiveMapFeatures(features) {
  activeMapFeatures = features || [];
  window.dispatchEvent(new CustomEvent('crimint:data-loaded'));
}

export function initMap() {
  const token = CONFIG.mapbox.token;
  if (token) {
    mapboxgl.accessToken = token;
  }

  // Use Mapbox vector style if token exists, otherwise use CartoDB dark matter tiles
  const mapStyle = token ? CONFIG.mapbox.style : CONFIG.mapbox.fallbackStyle;

  try {
    map = new mapboxgl.Map({
      container: 'map-container',
      style: mapStyle,
      center: CONFIG.mapbox.center,
      zoom: CONFIG.mapbox.zoom,
      attributionControl: false,
      pitch: 0,
      bearing: 0,
    });

    map.on('error', (e) => {
      console.warn('Mapbox map error:', e);
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'metric' }), 'bottom-left');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    popup = new mapboxgl.Popup({ closeOnClick: true, maxWidth: '320px' });

    map.on('load', async () => {
      setupSources();
      setupLayers();
      setupInteractions();
      await autoLoadTacticalData();
      if (allMasterFeatures.length === 0) {
        await loadMapData();
      }
    });

    return map;
  } catch (err) {
    console.error('Error inicializando Mapbox:', err);
    return null;
  }
}

function setupSources() {
  // Hechos delictivos
  map.addSource('hechos', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 50,
    clusterProperties: {
      sum_lesividad: ['+', ['get', 'lesividad']],
      max_lesividad: ['max', ['get', 'lesividad']],
    }
  });

  // Source for heatmap (unclustered)
  map.addSource('hechos-heat', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Zonas/Territorios
  map.addSource('zonas', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Allanamientos
  map.addSource('allanamientos', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
}

function setupLayers() {
  // --- Heatmap Layer ---
  map.addLayer({
    id: 'hechos-heatmap',
    type: 'heatmap',
    source: 'hechos-heat',
    maxzoom: 16,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'lesividad'], 1, 0.1, 5, 0.5, 10, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 2],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.1, 'rgba(14,165,233,0.3)',
        0.3, 'rgba(34,197,94,0.5)',
        0.5, 'rgba(245,158,11,0.6)',
        0.7, 'rgba(239,68,68,0.7)',
        1, 'rgba(239,68,68,0.9)',
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 20, 15, 40],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.8, 16, 0.3],
    },
  });

  // --- Zonas Layer (polygons) ---
  map.addLayer({
    id: 'zonas-fill',
    type: 'fill',
    source: 'zonas',
    layout: { visibility: 'visible' },
    paint: {
      'fill-color': ['coalesce', ['get', 'color'], '#8B5CF6'],
      'fill-opacity': 0.22,
    },
  });

  map.addLayer({
    id: 'zonas-border',
    type: 'line',
    source: 'zonas',
    layout: { visibility: 'visible' },
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#8B5CF6'],
      'line-width': 2,
      'line-opacity': 0.85,
    },
  });

  map.addLayer({
    id: 'zonas-label',
    type: 'symbol',
    source: 'zonas',
    layout: {
      visibility: 'visible',
      'text-field': ['get', 'nombre'],
      'text-size': 11,
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-anchor': 'center',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#E2E8F0',
      'text-halo-color': 'rgba(0,0,0,0.85)',
      'text-halo-width': 1.5,
    },
  });

  // --- Clusters Layer ---
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'hechos',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        '#0EA5E9', 10,
        '#F59E0B', 30,
        '#EF4444'
      ],
      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 32],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.15)',
      'circle-opacity': 0.85,
    },
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'hechos',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: { 'text-color': '#ffffff' },
  });

  // --- Unclustered Points ---
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'hechos',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'coalesce',
        ['get', 'color'],
        '#0EA5E9'
      ],
      'circle-radius': ['interpolate', ['linear'], ['get', 'lesividad'], 1, 5, 10, 11],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(255,255,255,0.4)',
      'circle-opacity': 0.9,
    },
  });

  // --- Allanamientos Layer ---
  map.addLayer({
    id: 'allanamientos-points',
    type: 'circle',
    source: 'allanamientos',
    layout: { visibility: 'none' },
    paint: {
      'circle-color': '#22C55E',
      'circle-radius': 8,
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(34,197,94,0.3)',
      'circle-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'allanamientos-label',
    type: 'symbol',
    source: 'allanamientos',
    layout: {
      visibility: 'none',
      'text-field': '⊕',
      'text-size': 14,
      'text-anchor': 'center',
      'text-allow-overlap': true,
    },
    paint: { 'text-color': '#ffffff' },
  });
}

function setupInteractions() {
  // Click on unclustered point
  map.on('click', 'unclustered-point', (e) => {
    const props = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates.slice();

    const lesividadColor = getLesividadColor(props.lesividad);
    const thematicIcon = props.tematica_icon || '📌';
    const thematicName = props.tematica_nombre || props.tipo || 'Incidencia';
    const thematicColor = props.color || '#0EA5E9';

    // Parse denunciados if string or array
    let denunciadosList = [];
    if (props.denunciados) {
      if (typeof props.denunciados === 'string') {
        try { denunciadosList = JSON.parse(props.denunciados); } catch { denunciadosList = [props.denunciados]; }
      } else if (Array.isArray(props.denunciados)) {
        denunciadosList = props.denunciados;
      }
    }

    const html = `
      <div style="min-width: 240px; max-width: 320px; font-family: var(--font-sans, sans-serif);">
        <!-- Header con Temática y Lesividad -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
          <span style="display:inline-flex;align-items:center;gap:4px;background:${thematicColor}22;border:1px solid ${thematicColor}66;color:${thematicColor};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700">
            ${thematicIcon} ${thematicName}
          </span>
          <span style="background:${lesividadColor};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">L${props.lesividad}</span>
        </div>

        <!-- Coincidencias de Denunciados / Imputados -->
        ${denunciadosList.length > 0 ? `
          <div style="margin:6px 0 8px;padding:6px 8px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:6px">
            <div style="font-size:10px;font-weight:700;color:#F87171;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">
              👤 Denunciado / Imputado:
            </div>
            <div style="font-size:12px;font-weight:600;color:#fff">
              ${denunciadosList.map(d => `<span class="denunciado-badge" style="display:inline-block;background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px;margin:2px 2px 2px 0">${d}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Fecha y Período -->
        ${props.fecha ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">📅 <strong>Fecha:</strong> ${formatDateTime(props.fecha)} ${props.anio ? `(${props.anio})` : ''}</div>` : ''}
        
        <!-- Ubicación y Barrio -->
        ${props.direccion ? `<div style="font-size:11px;color:#cbd5e1;margin-bottom:3px">📍 <strong>Ubicación:</strong> ${props.direccion}</div>` : ''}
        ${props.barrio ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">🏘️ <strong>Barrio:</strong> ${props.barrio}</div>` : ''}
        
        <!-- CUIJ Judicial -->
        ${props.cuij ? `<div style="font-size:11px;color:#F59E0B;font-family:monospace;margin-bottom:4px;font-weight:600">⚖️ CUIJ: ${props.cuij}</div>` : ''}
        
        <!-- Resumen -->
        ${props.resumen ? `<div style="font-size:11px;color:#8896AB;line-height:1.35;margin-top:6px;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;max-height:90px;overflow-y:auto">${props.resumen}</div>` : ''}
        
        <!-- Acciones Tácticas -->
        ${denunciadosList.length > 0 ? `
          <button class="btn btn-primary btn-sm btn-focus-denunciado" data-name="${denunciadosList[0]}" style="margin-top:8px;width:100%;font-size:11px;padding:4px 8px">
            🎯 Ver Todas las Incidencias de ${denunciadosList[0]}
          </button>
        ` : ''}
      </div>
    `;

    popup.setLngLat(coords).setHTML(html).addTo(map);

    // Event listener para el botón dentro del popup
    setTimeout(() => {
      const btn = document.querySelector('.btn-focus-denunciado');
      btn?.addEventListener('click', (ev) => {
        const name = ev.currentTarget.dataset.name;
        if (name) focusOnDenunciado(name);
      });
    }, 50);
  });

  // Click on cluster → zoom in
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('hechos').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1 });
    });
  });

  // Click on allanamiento
  map.on('click', 'allanamientos-points', (e) => {
    const props = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates.slice();

    const html = `
      <div style="min-width: 200px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="background:rgba(34,197,94,0.2);color:#22C55E;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">OPERATIVO</span>
          <span style="font-size:11px;color:#8896AB">${props.resultado || ''}</span>
        </div>
        ${props.direccion ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">📍 ${props.direccion}</div>` : ''}
        ${props.cuij ? `<div style="font-size:11px;color:#F59E0B;font-family:monospace">CUIJ: ${props.cuij}</div>` : ''}
        ${props.fecha ? `<div style="font-size:11px;color:#8896AB;margin-top:4px">📅 ${formatDateTime(props.fecha)}</div>` : ''}
      </div>
    `;
    popup.setLngLat(coords).setHTML(html).addTo(map);
  });

  // Click on polygon zone
  map.on('click', 'zonas-fill', (e) => {
    const props = e.features[0].properties;
    const html = `
      <div style="min-width: 220px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="background:rgba(139,92,246,0.2);color:#A78BFA;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">TERRITORIO / BARRIO</span>
        </div>
        <strong style="font-size:14px;color:#fff;display:block;margin-bottom:6px">${props.nombre || props.barrio || 'Zona Táctica'}</strong>
        ${props.tipo ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">Capa: <strong>${props.tipo}</strong></div>` : ''}
        ${props.descripcion ? `<div style="font-size:11px;color:#cbd5e1;line-height:1.4;margin-top:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px">${props.descripcion}</div>` : ''}
        <button class="btn btn-secondary btn-sm btn-filter-barrio" data-barrio="${props.nombre || props.barrio}" style="margin-top:8px;width:100%;font-size:11px">
          🔍 Filtrar Incidencias en este Barrio
        </button>
      </div>
    `;
    popup.setLngLat(e.lngLat).setHTML(html).addTo(map);

    setTimeout(() => {
      document.querySelector('.btn-filter-barrio')?.addEventListener('click', (ev) => {
        const b = ev.currentTarget.dataset.barrio;
        if (b) applyMapFilters({ territorio: b });
      });
    }, 50);
  });

  // Cursor styles
  ['unclustered-point', 'clusters', 'allanamientos-points', 'zonas-fill'].forEach(layer => {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  });
}

// ============================================================
// DATA LOADING & DUAL SYNC (LOCAL MEMORY + SUPABASE)
// ============================================================
export async function loadMapData(filters = {}) {
  // If master tactical dataset is loaded in memory, filter in memory!
  if (allMasterFeatures && allMasterFeatures.length > 0) {
    applyMapFilters(filters);
    return;
  }

  // Otherwise, fallback to Supabase
  try {
    const geojson = await getHechosGeoJSON(filters);
    activeMapFeatures = geojson.features || [];
    allMasterFeatures = activeMapFeatures;

    map.getSource('hechos')?.setData(geojson);
    map.getSource('hechos-heat')?.setData(geojson);

    // Load zonas
    const zonas = await getZonas();
    if (zonas.length > 0) {
      const zonasGeoJSON = {
        type: 'FeatureCollection',
        features: zonas.map(z => {
          try {
            const geom = parsePolygonGeom(z.geom);
            if (!geom) return null;
            return {
              type: 'Feature',
              geometry: geom,
              properties: { nombre: z.nombre, tipo: z.tipo, color: z.color_hex, id: z.id },
            };
          } catch { return null; }
        }).filter(Boolean),
      };
      masterPolygons = zonasGeoJSON.features;
      map.getSource('zonas')?.setData(zonasGeoJSON);
    }

    // Load allanamientos
    const alls = await getAllanamientos({ limit: 500 });
    const allsGeoJSON = {
      type: 'FeatureCollection',
      features: alls.filter(a => a.geom).map(a => {
        const coords = parseGeom(a.geom);
        if (!coords) return null;
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] },
          properties: {
            id: a.id,
            direccion: a.direccion,
            cuij: a.cuij,
            resultado: a.resultado,
            fecha: a.fecha_operativo,
          },
        };
      }).filter(Boolean),
    };
    map.getSource('allanamientos')?.setData(allsGeoJSON);
    window.dispatchEvent(new CustomEvent('crimint:data-loaded'));

  } catch (e) {
    console.error('Error loading map data from Supabase:', e);
  }
}

// ============================================================
// DIRECT TACTICAL GEOJSON INGESTION / VISUALIZATION
// ============================================================

export function loadTacticalGeoJSON(geoJSON, { fitBounds = true } = {}) {
  if (!map) return;

  const points = [];
  const polys = [];

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  (geoJSON.features || []).forEach((rawFeature, idx) => {
    // Enrich with criminal intelligence metadata
    const f = enrichTacticalFeature(rawFeature, idx);

    if (f.geometry?.type === 'Point') {
      const [lng, lat] = f.geometry.coordinates;
      if (!isNaN(lng) && !isNaN(lat)) {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        points.push(f);
      }
    } else if (f.geometry?.type === 'Polygon') {
      const ring = f.geometry.coordinates[0] || [];
      ring.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
      polys.push(f);
    }
  });

  // Store master list in memory
  allMasterFeatures = points;
  masterPolygons = polys;
  activeMapFeatures = points;

  // Render to map
  const pointsGeoJSON = { type: 'FeatureCollection', features: points };
  map.getSource('hechos')?.setData(pointsGeoJSON);
  map.getSource('hechos-heat')?.setData(pointsGeoJSON);

  // Update polygons source
  const polysGeoJSON = { type: 'FeatureCollection', features: polys };
  map.getSource('zonas')?.setData(polysGeoJSON);
  window.dispatchEvent(new CustomEvent('crimint:data-loaded'));

  // Ensure polygon layers are visible
  try {
    map.setLayoutProperty('zonas-fill', 'visibility', 'visible');
    map.setLayoutProperty('zonas-border', 'visibility', 'visible');
    map.setLayoutProperty('zonas-label', 'visibility', 'visible');
    const zonasCheckbox = document.getElementById('layer-zonas');
    if (zonasCheckbox) zonasCheckbox.checked = true;
  } catch {}

  // Smart bounds calculation
  if (fitBounds) {
    const regionalPoints = points.filter(p => {
      const [lng, lat] = p.geometry.coordinates;
      return lng >= -61.5 && lng <= -60.0 && lat >= -32.2 && lat <= -31.2;
    });

    if (regionalPoints.length > 0) {
      let rMinLng = Infinity, rMinLat = Infinity, rMaxLng = -Infinity, rMaxLat = -Infinity;
      regionalPoints.forEach(p => {
        const [lng, lat] = p.geometry.coordinates;
        rMinLng = Math.min(rMinLng, lng);
        rMaxLng = Math.max(rMaxLng, lng);
        rMinLat = Math.min(rMinLat, lat);
        rMaxLat = Math.max(rMaxLat, lat);
      });
      map.fitBounds([[rMinLng, rMinLat], [rMaxLng, rMaxLat]], {
        padding: 50,
        maxZoom: 13.8,
        duration: 1200
      });
    } else {
      map.flyTo({ center: [-60.7005, -31.6333], zoom: 12.8, duration: 1200 });
    }
  }

  // Dispatch custom event for app stats & analytics HUD
  window.dispatchEvent(new CustomEvent('crimint:tactical-loaded', {
    detail: {
      total: points.length + polys.length,
      points: points.length,
      polygons: polys.length
    }
  }));
}

// ============================================================
// IN-MEMORY MULTI-CRITERIA MAP FILTERING
// ============================================================

export function applyMapFilters(filters = {}) {
  if (!map) return;

  currentFilterCriteria = { ...currentFilterCriteria, ...filters };

  // Remove empty keys
  Object.keys(currentFilterCriteria).forEach(k => {
    if (currentFilterCriteria[k] === '' || currentFilterCriteria[k] === 'todos' || currentFilterCriteria[k] === undefined) {
      delete currentFilterCriteria[k];
    }
  });

  const filtered = filterFeatures(allMasterFeatures, currentFilterCriteria);
  activeMapFeatures = filtered;

  const pointsGeoJSON = { type: 'FeatureCollection', features: filtered };
  map.getSource('hechos')?.setData(pointsGeoJSON);
  map.getSource('hechos-heat')?.setData(pointsGeoJSON);

  window.dispatchEvent(new CustomEvent('crimint:data-loaded'));
  window.dispatchEvent(new CustomEvent('crimint:filters-applied', { detail: currentFilterCriteria }));
}

export function resetMapFilters() {
  currentFilterCriteria = {};
  activeMapFeatures = allMasterFeatures;
  const pointsGeoJSON = { type: 'FeatureCollection', features: allMasterFeatures };
  map.getSource('hechos')?.setData(pointsGeoJSON);
  map.getSource('hechos-heat')?.setData(pointsGeoJSON);
  window.dispatchEvent(new CustomEvent('crimint:data-loaded'));
  window.dispatchEvent(new CustomEvent('crimint:filters-applied', { detail: {} }));
}

export function getCurrentFilterCriteria() {
  return currentFilterCriteria;
}

// ============================================================
// TACTICAL FOCUS FUNCTIONS (HOTSPOTS & DENUNCIADOS)
// ============================================================

export function focusOnHotspot(coords, ubicacion) {
  if (!map) return;
  map.flyTo({ center: coords, zoom: 15.5, duration: 1200 });
  if (ubicacion) {
    applyMapFilters({ territorio: ubicacion });
  }
}

export function focusOnDenunciado(nombre) {
  if (!map || !nombre) return;
  applyMapFilters({ denunciado: nombre });

  // Compute bounds around suspect's incidents
  const suspectPoints = activeMapFeatures.filter(f => {
    const p = f.properties || {};
    return (p.denunciados || []).some(d => d.toLowerCase().includes(nombre.toLowerCase())) ||
           (p.nombre || '').toLowerCase().includes(nombre.toLowerCase()) ||
           (p.resumen || '').toLowerCase().includes(nombre.toLowerCase());
  });

  if (suspectPoints.length > 0) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    suspectPoints.forEach(p => {
      const [lng, lat] = p.geometry.coordinates;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    if (suspectPoints.length === 1 || (minLng === maxLng && minLat === maxLat)) {
      map.flyTo({ center: suspectPoints[0].geometry.coordinates, zoom: 16, duration: 1200 });
    } else {
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 15.5, duration: 1200 });
    }
  }
}

export async function autoLoadTacticalData() {
  if (allMasterFeatures.length > 0) return;
  try {
    const res = await fetch('/data/santa_fe_tactical.json');
    if (!res.ok) return;
    const data = await res.json();
    loadTacticalGeoJSON(data, { fitBounds: false });
  } catch (err) {
    console.warn('Auto-load tactical dataset failed:', err);
  }
}

// ============================================================
// LAYER TOGGLES
// ============================================================
export function toggleLayer(layerId, visible) {
  const vis = visible ? 'visible' : 'none';
  switch (layerId) {
    case 'heatmap':
      map.setLayoutProperty('hechos-heatmap', 'visibility', vis);
      break;
    case 'clusters':
      map.setLayoutProperty('clusters', 'visibility', vis);
      map.setLayoutProperty('cluster-count', 'visibility', vis);
      map.setLayoutProperty('unclustered-point', 'visibility', vis);
      break;
    case 'zonas':
      map.setLayoutProperty('zonas-fill', 'visibility', vis);
      map.setLayoutProperty('zonas-border', 'visibility', vis);
      map.setLayoutProperty('zonas-label', 'visibility', vis);
      break;
    case 'allanamientos':
      map.setLayoutProperty('allanamientos-points', 'visibility', vis);
      map.setLayoutProperty('allanamientos-label', 'visibility', vis);
      break;
  }
}

export function flyTo(lng, lat, zoom = 16) {
  if (map) {
    map.flyTo({ center: [lng, lat], zoom, essential: true, duration: 1500 });
  }
}

export function getMapInstance() {
  return map;
}
