import mapboxgl from 'mapbox-gl';
import { CONFIG, getLesividadColor, formatDateTime } from './config.js';
import { getHechosGeoJSON, getZonas, getAllanamientos, parseGeom, parsePolygonGeom } from './supabase-client.js';

let map = null;
let hechosSource = null;
let zonasSource = null;
let allanamientosSource = null;
let popup = null;

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

    map.on('load', () => {
      setupSources();
      setupLayers();
      setupInteractions();
      loadMapData();
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
        'interpolate', ['linear'], ['get', 'lesividad'],
        1, '#22C55E',
        4, '#F59E0B',
        7, '#EF4444',
        10, '#DC2626',
      ],
      'circle-radius': ['interpolate', ['linear'], ['get', 'lesividad'], 1, 5, 10, 12],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.2)',
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
    const html = `
      <div style="min-width: 220px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="background:${lesividadColor};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">L${props.lesividad}</span>
          <strong style="font-size:13px">${props.tipo || 'Sin tipo'}</strong>
        </div>
        ${props.fecha ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">📅 ${formatDateTime(props.fecha)}</div>` : ''}
        ${props.direccion ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">📍 ${props.direccion}</div>` : ''}
        ${props.barrio ? `<div style="font-size:11px;color:#8896AB;margin-bottom:4px">🏘️ ${props.barrio}</div>` : ''}
        ${props.cuij ? `<div style="font-size:11px;color:#F59E0B;font-family:monospace;margin-bottom:4px">CUIJ: ${props.cuij}</div>` : ''}
        ${props.resumen ? `<div style="font-size:11px;color:#8896AB;margin-top:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px">${props.resumen.substring(0, 200)}${props.resumen.length > 200 ? '...' : ''}</div>` : ''}
      </div>
    `;

    popup.setLngLat(coords).setHTML(html).addTo(map);
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
      </div>
    `;
    popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
  });

  // Cursor styles
  ['unclustered-point', 'clusters', 'allanamientos-points', 'zonas-fill'].forEach(layer => {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  });
}

// ============================================================
// DATA LOADING
// ============================================================
export async function loadMapData(filters = {}) {
  try {
    const geojson = await getHechosGeoJSON(filters);

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
    console.error('Error loading map data:', e);
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

  (geoJSON.features || []).forEach((f, idx) => {
    if (f.geometry?.type === 'Point') {
      const [lng, lat] = f.geometry.coordinates;
      if (!isNaN(lng) && !isNaN(lat)) {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        points.push({
          type: 'Feature',
          geometry: f.geometry,
          properties: {
            id: f.properties.id || `tactical-pt-${idx}`,
            tipo: f.properties.tipo || f.properties.folder || 'Incidencia',
            folder: f.properties.folder || 'General',
            direccion: f.properties.direccion || f.properties.nombre || 'Santa Fe',
            resumen: f.properties.resumen || f.properties.descripcion || '',
            cuij: f.properties.cuij || '',
            lesividad: f.properties.lesividad || 4,
            color: f.properties.color || '#F59E0B',
            fecha: f.properties.fecha || new Date().toISOString()
          }
        });
      }
    } else if (f.geometry?.type === 'Polygon') {
      const ring = f.geometry.coordinates[0] || [];
      ring.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
      polys.push({
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          id: f.properties.id || `tactical-poly-${idx}`,
          nombre: f.properties.nombre || f.properties.barrio || 'Zona Táctica',
          barrio: f.properties.barrio || f.properties.nombre || 'Santa Fe',
          tipo: f.properties.tipo || f.properties.folder || 'BARRIOS',
          folder: f.properties.folder || 'BARRIOS',
          color: f.properties.color || '#8B5CF6',
          descripcion: f.properties.descripcion || f.properties.resumen || ''
        }
      });
    }
  });

  // Update points source
  const pointsGeoJSON = { type: 'FeatureCollection', features: points };
  map.getSource('hechos')?.setData(pointsGeoJSON);
  map.getSource('hechos-heat')?.setData(pointsGeoJSON);

  // Update polygons source
  const polysGeoJSON = { type: 'FeatureCollection', features: polys };
  map.getSource('zonas')?.setData(polysGeoJSON);

  // Ensure polygon layers are visible
  try {
    map.setLayoutProperty('zonas-fill', 'visibility', 'visible');
    map.setLayoutProperty('zonas-border', 'visibility', 'visible');
    map.setLayoutProperty('zonas-label', 'visibility', 'visible');
    const zonasCheckbox = document.getElementById('layer-zonas');
    if (zonasCheckbox) zonasCheckbox.checked = true;
  } catch {}

  // Smart bounds calculation (filter out extreme continental outliers like Mexico point)
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

  // Dispatch custom event for app stats
  window.dispatchEvent(new CustomEvent('crimint:tactical-loaded', {
    detail: {
      total: points.length + polys.length,
      points: points.length,
      polygons: polys.length
    }
  }));
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
