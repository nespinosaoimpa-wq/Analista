import mapboxgl from 'mapbox-gl';
import { CONFIG, getLesividadColor, formatDateTime, formatDate } from './config.js';
import { getHechosGeoJSON, getZonas, getAllanamientos, parseGeom, parsePolygonGeom, getPersonasGeoJSON, getBandas, getPersonas } from './supabase-client.js';
import { enrichTacticalFeature, filterFeatures, CRIME_THEMATICS, createGeoJSONCircle } from './analytics-engine.js';
import { searchEngine } from './search-engine.js';

let map = null;
let popup = null;
let allMasterFeatures = []; // Master cache of all points
let activeMapFeatures = [];   // Currently visible/filtered points
let masterPolygons = [];      // Polygons (barrios / zonas)
let currentFilterCriteria = {};
let activeInspection = null;  // Estado de la inspección de ubicación actual

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
      preserveDrawingBuffer: true,
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
      await loadPersonasMapData();
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

  // Fuentes de Inspección de Ubicación y Cruce Espacial
  map.addSource('inspection-radius', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource('inspection-center', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource('inspection-links', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource('inspection-endpoints', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Integrantes de Bandas / Domicilios de Imputados
  map.addSource('personas-bandas', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 35,
    clusterProperties: {
      max_peligrosidad: ['max', ['get', 'score_peligrosidad']],
      has_captura: ['any', ['get', 'pedido_captura']]
    }
  });

  // Fuente para destacado de búsqueda y beacon de localización
  map.addSource('search-target', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Fuentes para el trazado táctico de bandas (direcciones, delitos y vínculos territoriales)
  map.addSource('banda-tracing-links', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource('banda-tracing-nodes', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
}

/**
 * Genera el icono de silueta de integrante con contraste y badge de captura opcional.
 * Diseñado en alta resolución (64x64 @2x) para nitidez Retina en Mapbox.
 */
function createPersonaIconImage(isCaptura = false) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  // Sombra de contraste para destacar sobre cualquier color de banda o mapa base
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = '#FFFFFF';

  // Cabeza / Rostro
  ctx.beginPath();
  ctx.arc(32, 21, 9.5, 0, Math.PI * 2);
  ctx.fill();

  // Torso / Hombros estilizados
  ctx.beginPath();
  ctx.moveTo(13, 53);
  ctx.quadraticCurveTo(14, 37, 24, 34);
  ctx.quadraticCurveTo(32, 38, 40, 34);
  ctx.quadraticCurveTo(50, 37, 51, 53);
  ctx.closePath();
  ctx.fill();

  // Si tiene Pedido de Captura Activo: insignia de alerta roja en esquina superior derecha
  if (isCaptura) {
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';

    // Círculo rojo de alerta
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(49, 15, 10, 0, Math.PI * 2);
    ctx.fill();

    // Borde blanco del badge
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Signo de exclamación blanco
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 49, 15);
  }

  return ctx.getImageData(0, 0, size, size);
}

function registerPersonaIcons(mapInstance) {
  if (!mapInstance) return;
  try {
    if (!mapInstance.hasImage('icon-persona-default')) {
      mapInstance.addImage('icon-persona-default', createPersonaIconImage(false), { pixelRatio: 2 });
    }
    if (!mapInstance.hasImage('icon-persona-captura')) {
      mapInstance.addImage('icon-persona-captura', createPersonaIconImage(true), { pixelRatio: 2 });
    }
  } catch (e) {
    console.warn('Error registrando iconos en Mapbox:', e);
  }
}

function setupLayers() {
  registerPersonaIcons(map);

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

  // --- Unclustered Points (Delitos con Estilo Táctico Diferenciado) ---
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
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, ['interpolate', ['linear'], ['coalesce', ['get', 'lesividad'], 3], 1, 4.5, 5, 6, 10, 8.5],
        14, ['interpolate', ['linear'], ['coalesce', ['get', 'lesividad'], 3], 1, 6.5, 5, 8.5, 10, 12],
        17, ['interpolate', ['linear'], ['coalesce', ['get', 'lesividad'], 3], 1, 9, 5, 12, 10, 16]
      ],
      'circle-stroke-width': [
        'interpolate', ['linear'], ['coalesce', ['get', 'lesividad'], 3],
        1, 1.5,
        6, 2.2,
        8, 3.2,
        10, 4
      ],
      'circle-stroke-color': [
        'case',
        ['>=', ['coalesce', ['get', 'lesividad'], 1], 8], '#FFFFFF',
        'rgba(255,255,255,0.65)'
      ],
      'circle-opacity': 0.94,
    },
  });

  // Ícono temático del delito dentro del punto (Zoom >= 13.5)
  map.addLayer({
    id: 'hechos-icon',
    type: 'symbol',
    source: 'hechos',
    filter: ['!', ['has', 'point_count']],
    minzoom: 13.5,
    layout: {
      'text-field': ['coalesce', ['get', 'tematica_icon'], '📌'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        13.5, 9,
        15, 11.5,
        17, 14
      ],
      'text-anchor': 'center',
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    }
  });

  // Rótulo textual del hecho (Zoom >= 14.5)
  map.addLayer({
    id: 'hechos-labels',
    type: 'symbol',
    source: 'hechos',
    filter: ['!', ['has', 'point_count']],
    minzoom: 14.5,
    layout: {
      'text-field': [
        'case',
        ['!=', ['coalesce', ['get', 'direccion'], ''], ''],
        ['concat', ['coalesce', ['get', 'tematica_nombre'], ['get', 'tipo_penal'], 'Incidencia'], ' — ', ['get', 'direccion']],
        ['concat', ['coalesce', ['get', 'tematica_nombre'], ['get', 'tipo_penal'], 'Incidencia'], ' — ', ['coalesce', ['get', 'barrio'], 'Santa Fe']]
      ],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 10.5,
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-max-width': 12,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': 'rgba(15, 23, 42, 0.95)',
      'text-halo-width': 1.8,
    }
  });

  // --- Allanamientos Layer (Tactical Raid Points) ---
  map.addLayer({
    id: 'allanamientos-points',
    type: 'circle',
    source: 'allanamientos',
    layout: { visibility: 'visible' },
    paint: {
      'circle-color': '#10B981',
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 7,
        14, 10,
        17, 14
      ],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'allanamientos-label',
    type: 'symbol',
    source: 'allanamientos',
    layout: {
      visibility: 'visible',
      'text-field': '🛡️',
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        10, 10,
        14, 13,
        17, 16
      ],
      'text-anchor': 'center',
      'text-allow-overlap': true,
    },
  });

  map.addLayer({
    id: 'allanamientos-text',
    type: 'symbol',
    source: 'allanamientos',
    minzoom: 14,
    layout: {
      visibility: 'visible',
      'text-field': ['concat', '🛡️ Allanamiento: ', ['coalesce', ['get', 'direccion'], ['get', 'cuij'], 'Operativo']],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 10.5,
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-max-width': 12,
    },
    paint: {
      'text-color': '#4ADE80',
      'text-halo-color': 'rgba(15, 23, 42, 0.95)',
      'text-halo-width': 1.8,
    }
  });

  // --- Capas de Inspección de Entorno y Vínculos Espaciales ---
  map.addLayer({
    id: 'inspection-radius-fill',
    type: 'fill',
    source: 'inspection-radius',
    paint: {
      'fill-color': '#0EA5E9',
      'fill-opacity': 0.12,
    },
  });

  map.addLayer({
    id: 'inspection-radius-line',
    type: 'line',
    source: 'inspection-radius',
    paint: {
      'line-color': '#0EA5E9',
      'line-width': 2,
      'line-dasharray': [3, 2],
      'line-opacity': 0.85,
    },
  });

  map.addLayer({
    id: 'inspection-links-line',
    type: 'line',
    source: 'inspection-links',
    paint: {
      'line-color': '#F59E0B',
      'line-width': 2.5,
      'line-dasharray': [4, 3],
      'line-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'inspection-endpoints-circle',
    type: 'circle',
    source: 'inspection-endpoints',
    paint: {
      'circle-radius': 7,
      'circle-color': '#F59E0B',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'inspection-endpoints-label',
    type: 'symbol',
    source: 'inspection-endpoints',
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#FDE68A',
      'text-halo-color': 'rgba(0,0,0,0.85)',
      'text-halo-width': 1.5,
    },
  });

  map.addLayer({
    id: 'inspection-center-point',
    type: 'circle',
    source: 'inspection-center',
    paint: {
      'circle-radius': 8,
      'circle-color': '#EF4444',
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': 0.95,
    },
  });

  // --- Capas de Integrantes de Bandas (Domicilios) ---
  map.addLayer({
    id: 'personas-bandas-clusters',
    type: 'circle',
    source: 'personas-bandas',
    filter: ['has', 'point_count'],
    layout: { visibility: 'visible' },
    paint: {
      'circle-color': [
        'case',
        ['get', 'has_captura'], '#EF4444',
        ['step', ['get', 'max_peligrosidad'], '#0EA5E9', 7, '#F59E0B', 9, '#EF4444']
      ],
      'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 15, 28],
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'personas-bandas-cluster-count',
    type: 'symbol',
    source: 'personas-bandas',
    filter: ['has', 'point_count'],
    layout: {
      visibility: 'visible',
      'text-field': '{point_count}',
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: { 'text-color': '#FFFFFF' },
  });

  // Halo visual de alerta pulsante para integrantes con Pedido de Captura Activo
  map.addLayer({
    id: 'personas-bandas-captura-halo',
    type: 'circle',
    source: 'personas-bandas',
    filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'pedido_captura'], true]],
    layout: { visibility: 'visible' },
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 14,
        14, 19,
        17, 28
      ],
      'circle-color': 'rgba(239, 68, 68, 0.28)',
      'circle-stroke-color': '#EF4444',
      'circle-stroke-width': 2,
      'circle-stroke-opacity': 0.85,
    },
  });

  map.addLayer({
    id: 'personas-bandas-points',
    type: 'circle',
    source: 'personas-bandas',
    filter: ['!', ['has', 'point_count']],
    layout: { visibility: 'visible' },
    paint: {
      'circle-color': ['coalesce', ['get', 'banda_color'], '#0EA5E9'],
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, ['interpolate', ['linear'], ['coalesce', ['get', 'score_peligrosidad'], 5], 1, 9, 5, 11, 10, 14],
        15, ['interpolate', ['linear'], ['coalesce', ['get', 'score_peligrosidad'], 5], 1, 12, 5, 15, 10, 19]
      ],
      'circle-stroke-width': [
        'case',
        ['get', 'pedido_captura'], 3.2,
        2.2
      ],
      'circle-stroke-color': [
        'case',
        ['get', 'pedido_captura'], '#EF4444',
        '#FFFFFF'
      ],
      'circle-opacity': 0.98,
    },
  });

  // Capa con icono de silueta para identificar integrantes de bandas a primera vista
  map.addLayer({
    id: 'personas-bandas-icon',
    type: 'symbol',
    source: 'personas-bandas',
    filter: ['!', ['has', 'point_count']],
    layout: {
      visibility: 'visible',
      'icon-image': [
        'case',
        ['==', ['get', 'pedido_captura'], true], 'icon-persona-captura',
        'icon-persona-default'
      ],
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        10, 0.65,
        14, 0.85,
        17, 1.15
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-anchor': 'center',
    },
  });

  map.addLayer({
    id: 'personas-bandas-label',
    type: 'symbol',
    source: 'personas-bandas',
    filter: ['!', ['has', 'point_count']],
    minzoom: 13.5,
    layout: {
      visibility: 'visible',
      'text-field': [
        'case',
        ['!=', ['get', 'alias_texto'], ''],
        ['concat', '👤 ', ['get', 'nombre_completo'], ' (', ['get', 'alias_texto'], ')'],
        ['concat', '👤 ', ['get', 'nombre_completo']]
      ],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 11,
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': 'rgba(15, 23, 42, 0.95)',
      'text-halo-width': 2,
    },
  });

  // --- Capas de Destacado de Búsqueda y Beacon de Localización ---
  map.addLayer({
    id: 'search-target-pulse',
    type: 'circle',
    source: 'search-target',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 20,
        14, 30,
        17, 44
      ],
      'circle-color': 'rgba(245, 158, 11, 0.25)',
      'circle-stroke-color': '#F59E0B',
      'circle-stroke-width': 3,
      'circle-stroke-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'search-target-pin',
    type: 'circle',
    source: 'search-target',
    paint: {
      'circle-radius': 7.5,
      'circle-color': '#EF4444',
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 2.5,
      'circle-opacity': 1,
    },
  });

  map.addLayer({
    id: 'search-target-label',
    type: 'symbol',
    source: 'search-target',
    layout: {
      'text-field': ['concat', '🎯 ', ['coalesce', ['get', 'label'], 'Resultado Seleccionado']],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-offset': [0, -1.8],
      'text-anchor': 'bottom',
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#FDE68A',
      'text-halo-color': '#0F172A',
      'text-halo-width': 2.2,
    },
  });

  // --- Trazado Táctico de Banda: Líneas de Enlace y Operaciones ---
  map.addLayer({
    id: 'banda-tracing-links-glow',
    type: 'line',
    source: 'banda-tracing-links',
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#0EA5E9'],
      'line-width': ['case', ['==', ['get', 'type'], 'DELITO'], 7, 5],
      'line-opacity': 0.35,
      'line-blur': 3.5,
    },
  });

  map.addLayer({
    id: 'banda-tracing-links-line',
    type: 'line',
    source: 'banda-tracing-links',
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#0EA5E9'],
      'line-width': ['case', ['==', ['get', 'type'], 'DELITO'], 3, 2.2],
      'line-dasharray': ['case', ['==', ['get', 'type'], 'DELITO'], ['literal', [4, 3]], ['literal', [6, 2]]],
      'line-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'banda-tracing-links-labels',
    type: 'symbol',
    source: 'banda-tracing-links',
    minzoom: 13,
    layout: {
      'text-field': ['get', 'label'],
      'symbol-placement': 'center',
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 10,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': 'rgba(15, 23, 42, 0.95)',
      'text-halo-width': 1.8,
    },
  });

  map.addLayer({
    id: 'banda-tracing-nodes-circle',
    type: 'circle',
    source: 'banda-tracing-nodes',
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'node_type'], 'BASE'], 13,
        ['==', ['get', 'node_type'], 'DELITO'], 9,
        8
      ],
      'circle-color': ['coalesce', ['get', 'color'], '#0EA5E9'],
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'banda-tracing-nodes-symbol',
    type: 'symbol',
    source: 'banda-tracing-nodes',
    layout: {
      'text-field': ['get', 'icon'],
      'text-size': 12,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': '#FFFFFF' }
  });

  map.addLayer({
    id: 'banda-tracing-nodes-label',
    type: 'symbol',
    source: 'banda-tracing-nodes',
    minzoom: 13.5,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 10.5,
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#F8FAFC',
      'text-halo-color': 'rgba(15, 23, 42, 0.95)',
      'text-halo-width': 1.8,
    }
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
        
        <!-- CUIJ / Causa Penal -->
        ${props.cuij ? `<div style="font-size:11px;color:#F59E0B;font-family:monospace;margin-bottom:4px;font-weight:600">⚖️ CUIJ: ${props.cuij}</div>` : ''}
        
        <!-- Resumen -->
        ${props.resumen ? `<div style="font-size:11px;color:#8896AB;line-height:1.35;margin-top:6px;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;max-height:90px;overflow-y:auto">${props.resumen}</div>` : ''}
        
        <!-- Acciones de Análisis Profesional -->
        <div style="display:flex;gap:6px;margin-top:8px;flex-direction:column">
          <button class="btn btn-primary btn-sm btn-inspect-this-point" data-lng="${coords[0]}" data-lat="${coords[1]}" data-label="${(props.direccion || props.nombre || 'Ubicación seleccionada').replace(/"/g, '&quot;')}" style="width:100%;font-size:11px;padding:5px 8px;display:flex;align-items:center;justify-content:center;gap:4px">
            📍 Analizar Entorno de esta Ubicación
          </button>
          ${denunciadosList.length > 0 ? `
            <button class="btn btn-secondary btn-sm btn-cross-this-person" data-name="${denunciadosList[0]}" data-lng="${coords[0]}" data-lat="${coords[1]}" style="width:100%;font-size:11px;padding:5px 8px;display:flex;align-items:center;justify-content:center;gap:4px">
              🔗 Cruce Domiciliario de ${denunciadosList[0]}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    popup.setLngLat(coords).setHTML(html).addTo(map);

    // Event listeners dentro del popup
    setTimeout(() => {
      document.querySelector('.btn-inspect-this-point')?.addEventListener('click', (ev) => {
        const btn = ev.currentTarget;
        const lng = parseFloat(btn.dataset.lng);
        const lat = parseFloat(btn.dataset.lat);
        const label = btn.dataset.label;
        if (!isNaN(lng) && !isNaN(lat)) {
          window.dispatchEvent(new CustomEvent('crimint:request-inspection', {
            detail: { coords: [lng, lat], label }
          }));
        }
      });

      document.querySelector('.btn-cross-this-person')?.addEventListener('click', (ev) => {
        const btn = ev.currentTarget;
        const name = btn.dataset.name;
        const lng = parseFloat(btn.dataset.lng);
        const lat = parseFloat(btn.dataset.lat);
        if (name && !isNaN(lng) && !isNaN(lat)) {
          window.dispatchEvent(new CustomEvent('crimint:request-cross-reference', {
            detail: { personName: name, coords: [lng, lat] }
          }));
        }
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

  // Click on integrante de banda (domicilio o icono)
  const handlePersonaPointClick = (e) => {
    const props = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates.slice();
    const isCaptura = props.pedido_captura === true || props.pedido_captura === 'true';
    const bandaColor = props.banda_color || '#0EA5E9';
    const tipoDomLabel = props.tipo_domicilio ? ` (${props.tipo_domicilio})` : '';

    const html = `
      <div style="min-width: 270px; max-width: 340px; font-family: var(--font-sans, sans-serif);">
        <!-- Header con Banda y Peligrosidad -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
          <span style="display:inline-flex;align-items:center;gap:4px;background:${bandaColor}22;border:1px solid ${bandaColor}66;color:${bandaColor};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:800">
            🏴 ${props.banda_nombre || 'Individual'}
          </span>
          <span style="background:${props.score_peligrosidad >= 8 ? '#EF4444' : '#F59E0B'};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">P${props.score_peligrosidad || 5}/10</span>
        </div>

        ${isCaptura ? `
          <div style="background:rgba(239,68,68,0.2);border:1px solid #EF4444;border-radius:6px;padding:4px 8px;color:#FCA5A5;font-size:10px;font-weight:800;margin-bottom:6px;display:flex;align-items:center;gap:4px">
            🚨 REQUERIMIENTO DE CAPTURA ACTIVA
          </div>
        ` : ''}

        <strong style="font-size:14px;color:#fff;display:block;margin-bottom:2px">
          ${props.nombre_completo || 'Integrante'}
        </strong>
        ${props.alias_texto ? `<div style="font-size:11px;color:#FDE68A;font-weight:600;margin-bottom:6px">Alias: "${props.alias_texto}"</div>` : ''}

        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:6px 8px;margin-bottom:8px;font-size:11px">
          ${props.dni ? `<div style="color:#cbd5e1;margin-bottom:2px"><strong>DNI:</strong> ${props.dni} ${props.cuit ? `| <strong>CUIT:</strong> ${props.cuit}` : ''}</div>` : ''}
          ${props.fecha_nacimiento ? `<div style="color:#8896AB;margin-bottom:2px">🎂 <strong>Nacimiento:</strong> ${props.fecha_nacimiento}</div>` : ''}
          ${props.domicilio_principal ? `<div style="color:#cbd5e1;margin-bottom:2px">📍 <strong>Domicilio${tipoDomLabel}:</strong> ${props.domicilio_principal}</div>` : ''}
          ${props.roles ? `<div style="color:#8896AB">⚔️ <strong>Rol:</strong> ${Array.isArray(props.roles) ? props.roles.join(', ') : props.roles}</div>` : ''}
        </div>

        <!-- Botón Destacado: Abrir Dossier Digital Centralizado -->
        <button class="btn btn-primary btn-sm btn-open-dossier-direct" data-id="${props.id}" style="width:100%;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;margin-bottom:6px;background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);border:1px solid #38bdf8;border-radius:6px;color:#fff;box-shadow:0 3px 10px rgba(2,132,199,0.35);cursor:pointer">
          📋 ABRIR DOSSIER DIGITAL
        </button>

        <!-- Acciones Rápidas -->
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-xs btn-inspect-this-point" data-lng="${coords[0]}" data-lat="${coords[1]}" data-label="${(props.domicilio_principal || props.nombre_completo).replace(/"/g, '&quot;')}" style="flex:1;font-size:10px;padding:4px">
            📍 Analizar Entorno
          </button>
          <button class="btn btn-outline btn-xs btn-edit-persona-direct" data-id="${props.id}" style="flex:1;font-size:10px;padding:4px">
            ✏️ Editar Perfil
          </button>
        </div>
      </div>
    `;

    popup.setLngLat(coords).setHTML(html).addTo(map);

    setTimeout(() => {
      document.querySelector('.btn-open-dossier-direct')?.addEventListener('click', (ev) => {
        const id = ev.currentTarget.dataset.id;
        if (id && window.abrirDossierDigital) window.abrirDossierDigital(id);
      });

      document.querySelector('.btn-inspect-this-point')?.addEventListener('click', (ev) => {
        const btn = ev.currentTarget;
        const lng = parseFloat(btn.dataset.lng);
        const lat = parseFloat(btn.dataset.lat);
        const label = btn.dataset.label;
        if (!isNaN(lng) && !isNaN(lat)) {
          window.dispatchEvent(new CustomEvent('crimint:request-inspection', { detail: { coords: [lng, lat], label } }));
        }
      });

      document.querySelector('.btn-edit-persona-direct')?.addEventListener('click', (ev) => {
        const id = ev.currentTarget.dataset.id;
        if (id && window.abrirEdicionPersona) window.abrirEdicionPersona(id);
      });
    }, 50);
  };

  map.on('click', 'personas-bandas-points', handlePersonaPointClick);
  map.on('click', 'personas-bandas-icon', handlePersonaPointClick);

  // Click on persona banda cluster → zoom in
  map.on('click', 'personas-bandas-clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['personas-bandas-clusters'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('personas-bandas').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1 });
    });
  });

  // Click on polygon zone
  map.on('click', 'zonas-fill', (e) => {
    const props = e.features[0].properties;
    const html = `
      <div style="min-width: 220px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="background:rgba(139,92,246,0.2);color:#A78BFA;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">TERRITORIO / BARRIO</span>
        </div>
        <strong style="font-size:14px;color:#fff;display:block;margin-bottom:6px">${props.nombre || props.barrio || 'Zona Operativa'}</strong>
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

  // --- Micro-Tooltip Flotante Instantáneo al Pasar el Mouse (Hover Card) ---
  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'crimint-hover-popup',
    offset: 12
  });

  // 1. Hover sobre Hecho / Delito
  map.on('mouseenter', 'unclustered-point', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (!e.features?.length) return;
    const p = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates.slice();
    const icon = p.tematica_icon || '📌';
    const name = p.tematica_nombre || p.tipo_penal || 'Hecho Delictivo';
    const color = p.color || '#0EA5E9';
    let denunciadosList = [];
    if (p.denunciados) {
      try { denunciadosList = typeof p.denunciados === 'string' ? JSON.parse(p.denunciados) : p.denunciados; } catch { denunciadosList = [p.denunciados]; }
    }

    const html = `
      <div class="hover-tip-card" style="border-left: 3px solid ${color}">
        <div class="hover-tip-header">
          <span class="hover-badge" style="background:${color}25;color:${color};border:1px solid ${color}55">${icon} ${name}</span>
          <span class="hover-chip" style="background:${getLesividadColor(p.lesividad)}">L${p.lesividad || 3}</span>
        </div>
        <div class="hover-tip-title">${p.direccion || p.barrio || 'Santa Fe Capital'}</div>
        ${denunciadosList.length ? `<div class="hover-tip-sub" style="color:#FCA5A5">👤 Denunciado: <strong>${denunciadosList[0]}</strong></div>` : ''}
        ${p.fecha ? `<div class="hover-tip-sub" style="color:#94A3B8">📅 ${formatDateTime(p.fecha)}</div>` : ''}
        ${p.cuij ? `<div class="hover-tip-sub" style="color:#FDE68A;font-family:monospace">⚖️ CUIJ: ${p.cuij}</div>` : ''}
      </div>
    `;
    hoverPopup.setLngLat(coords).setHTML(html).addTo(map);
  });
  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
  });

  // 2. Hover sobre Integrante de Banda / Imputado
  const handlePersonaHover = (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (!e.features?.length) return;
    const p = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates.slice();
    const bandaColor = p.banda_color || '#0EA5E9';
    const isCaptura = p.pedido_captura === true || p.pedido_captura === 'true';

    const html = `
      <div class="hover-tip-card" style="border-left: 3px solid ${bandaColor}">
        <div class="hover-tip-header">
          <span class="hover-badge" style="background:${bandaColor}25;color:${bandaColor};border:1px solid ${bandaColor}55">👤 ${p.banda_nombre || 'Individual'}</span>
          ${isCaptura ? `<span class="hover-chip" style="background:#EF4444;font-weight:900">🚨 CAPTURA</span>` : `<span class="hover-chip" style="background:${p.score_peligrosidad >= 8 ? '#EF4444' : '#F59E0B'}">P${p.score_peligrosidad || 5}/10</span>`}
        </div>
        <div class="hover-tip-title">${p.nombre_completo || 'Imputado'} ${p.alias_texto ? `("${p.alias_texto}")` : ''}</div>
        ${p.domicilio_principal ? `<div class="hover-tip-sub" style="color:#CBD5E1">🏠 ${p.domicilio_principal}</div>` : ''}
        ${p.dni ? `<div class="hover-tip-sub" style="color:#94A3B8">🆔 DNI: ${p.dni}</div>` : ''}
      </div>
    `;
    hoverPopup.setLngLat(coords).setHTML(html).addTo(map);
  };

  map.on('mouseenter', 'personas-bandas-points', handlePersonaHover);
  map.on('mouseenter', 'personas-bandas-icon', handlePersonaHover);
  map.on('mouseleave', 'personas-bandas-points', () => { map.getCanvas().style.cursor = ''; hoverPopup.remove(); });
  map.on('mouseleave', 'personas-bandas-icon', () => { map.getCanvas().style.cursor = ''; hoverPopup.remove(); });

  // 3. Hover sobre Allanamiento
  map.on('mouseenter', 'allanamientos-points', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (!e.features?.length) return;
    const p = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates.slice();

    const html = `
      <div class="hover-tip-card" style="border-left: 3px solid #10B981">
        <div class="hover-tip-header">
          <span class="hover-badge" style="background:rgba(16,185,129,0.2);color:#34D399;border:1px solid rgba(16,185,129,0.5)">🛡️ ALLANAMIENTO JUDICIAL</span>
        </div>
        <div class="hover-tip-title">${p.direccion || 'Objetivo Judicial'}</div>
        ${p.cuij ? `<div class="hover-tip-sub" style="color:#FDE68A;font-family:monospace">⚖️ CUIJ: ${p.cuij}</div>` : ''}
        ${p.resultado ? `<div class="hover-tip-sub" style="color:#86EFAC">Resultado: ${p.resultado}</div>` : ''}
        ${p.fecha ? `<div class="hover-tip-sub" style="color:#94A3B8">📅 ${formatDateTime(p.fecha)}</div>` : ''}
      </div>
    `;
    hoverPopup.setLngLat(coords).setHTML(html).addTo(map);
  });
  map.on('mouseleave', 'allanamientos-points', () => {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
  });

  // Cursor styles
  ['unclustered-point', 'clusters', 'allanamientos-points', 'zonas-fill', 'personas-bandas-points', 'personas-bandas-icon', 'personas-bandas-clusters'].forEach(layer => {
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

  // Indexar puntos georreferenciados en el motor de búsqueda centralizado
  try {
    if (searchEngine && typeof searchEngine.indexTacticalPoints === 'function') {
      searchEngine.indexTacticalPoints(points);
    }
  } catch (err) {
    console.warn('Error indexando puntos tácticos en searchEngine:', err);
  }

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
      if (map.getLayer('hechos-icon')) map.setLayoutProperty('hechos-icon', 'visibility', vis);
      if (map.getLayer('hechos-labels')) map.setLayoutProperty('hechos-labels', 'visibility', vis);
      break;
    case 'zonas':
      map.setLayoutProperty('zonas-fill', 'visibility', vis);
      map.setLayoutProperty('zonas-border', 'visibility', vis);
      map.setLayoutProperty('zonas-label', 'visibility', vis);
      break;
    case 'allanamientos':
      map.setLayoutProperty('allanamientos-points', 'visibility', vis);
      map.setLayoutProperty('allanamientos-label', 'visibility', vis);
      if (map.getLayer('allanamientos-text')) map.setLayoutProperty('allanamientos-text', 'visibility', vis);
      break;
    case 'personas-bandas':
      map.setLayoutProperty('personas-bandas-captura-halo', 'visibility', vis);
      map.setLayoutProperty('personas-bandas-points', 'visibility', vis);
      map.setLayoutProperty('personas-bandas-icon', 'visibility', vis);
      map.setLayoutProperty('personas-bandas-clusters', 'visibility', vis);
      map.setLayoutProperty('personas-bandas-cluster-count', 'visibility', vis);
      map.setLayoutProperty('personas-bandas-label', 'visibility', vis);
      break;
  }
}

export function flyTo(lng, lat, zoom = 16, pitch = 0) {
  if (map) {
    map.flyTo({ center: [lng, lat], zoom, pitch, essential: true, duration: 1500 });
  }
}

/**
 * Resalta y enfoca un punto georreferenciado exacto con beacon pulsante y popup de detalle
 */
export function highlightMapPoint({ lng, lat, title, subtitle, type, data = {} }) {
  if (!map || isNaN(lng) || isNaN(lat)) return;

  // 1. Asegurar visibilidad de la capa según el tipo
  if (type === 'persona') {
    const cb = document.getElementById('layer-personas-bandas');
    if (cb && !cb.checked) { cb.checked = true; toggleLayer('personas-bandas', true); }
  } else if (type === 'allanamiento') {
    const cb = document.getElementById('layer-allanamientos');
    if (cb && !cb.checked) { cb.checked = true; toggleLayer('allanamientos', true); }
  } else {
    const cb = document.getElementById('layer-clusters');
    if (cb && !cb.checked) { cb.checked = true; toggleLayer('clusters', true); }
  }

  // 2. Establecer el beacon de destacado de búsqueda
  const targetGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { label: title || 'Resultado Seleccionado', type }
      }
    ]
  };
  map.getSource('search-target')?.setData(targetGeoJSON);

  // 3. Vuelo suave y preciso al objetivo
  map.flyTo({
    center: [lng, lat],
    zoom: 16.8,
    pitch: 0,
    essential: true,
    duration: 1300
  });

  // 4. Apertura del Popup Táctico Detallado
  let popupHtml = '';
  if (type === 'persona') {
    const bandaColor = data.banda_color || '#0EA5E9';
    const isCaptura = data.pedido_captura === true || data.pedido_captura === 'true';
    popupHtml = `
      <div style="min-width: 270px; max-width: 340px; font-family: var(--font-sans, sans-serif);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
          <span style="background:${bandaColor}22;border:1px solid ${bandaColor}66;color:${bandaColor};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:800">
            👤 ${data.banda_nombre || 'Individual'}
          </span>
          <span style="background:${data.score_peligrosidad >= 8 ? '#EF4444' : '#F59E0B'};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">P${data.score_peligrosidad || 5}/10</span>
        </div>
        ${isCaptura ? `
          <div style="background:rgba(239,68,68,0.2);border:1px solid #EF4444;border-radius:6px;padding:4px 8px;color:#FCA5A5;font-size:10px;font-weight:800;margin-bottom:6px">
            🚨 REQUERIMIENTO DE CAPTURA ACTIVA
          </div>
        ` : ''}
        <strong style="font-size:14px;color:#fff;display:block;margin-bottom:2px">
          ${title || data.nombre_completo || 'Imputado'}
        </strong>
        ${data.alias_texto ? `<div style="font-size:11px;color:#FDE68A;font-weight:600;margin-bottom:6px">Alias: "${data.alias_texto}"</div>` : ''}
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:6px 8px;margin-bottom:8px;font-size:11px">
          ${data.domicilio_principal ? `<div style="color:#cbd5e1;margin-bottom:2px">📍 <strong>Domicilio:</strong> ${data.domicilio_principal}</div>` : ''}
          ${data.dni ? `<div style="color:#cbd5e1;margin-bottom:2px">🆔 <strong>DNI:</strong> ${data.dni}</div>` : ''}
        </div>
        <button class="btn btn-primary btn-sm btn-open-dossier-direct" data-id="${data.id}" style="width:100%;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;margin-bottom:6px;background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);border:1px solid #38bdf8;border-radius:6px;color:#fff;cursor:pointer">
          📋 ABRIR DOSSIER DIGITAL
        </button>
        <button class="btn btn-secondary btn-xs btn-inspect-this-point" data-lng="${lng}" data-lat="${lat}" data-label="${(title || 'Punto de Interés').replace(/"/g, '&quot;')}" style="width:100%;font-size:10px;padding:5px">
          📍 Analizar Entorno (300m)
        </button>
      </div>
    `;
  } else if (type === 'allanamiento') {
    popupHtml = `
      <div style="min-width: 240px; font-family: var(--font-sans, sans-serif);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="background:rgba(16,185,129,0.2);color:#34D399;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:800">🛡️ ALLANAMIENTO JUDICIAL</span>
        </div>
        <strong style="font-size:13px;color:#fff;display:block;margin-bottom:4px">${title || data.direccion || 'Operativo'}</strong>
        ${data.cuij ? `<div style="font-size:11px;color:#FDE68A;font-family:monospace;margin-bottom:4px">⚖️ CUIJ: ${data.cuij}</div>` : ''}
        ${data.resultado ? `<div style="font-size:11px;color:#86EFAC;margin-bottom:4px">Resultado: ${data.resultado}</div>` : ''}
        ${data.fecha ? `<div style="font-size:11px;color:#94A3B8;margin-bottom:8px">📅 ${formatDateTime(data.fecha)}</div>` : ''}
        <button class="btn btn-secondary btn-xs btn-inspect-this-point" data-lng="${lng}" data-lat="${lat}" data-label="${(data.direccion || 'Allanamiento').replace(/"/g, '&quot;')}" style="width:100%;font-size:10px;padding:5px">
          📍 Analizar Entorno (300m)
        </button>
      </div>
    `;
  } else {
    const icon = data.tematica_icon || '📌';
    const name = data.tematica_nombre || title || 'Hecho Delictivo';
    const color = data.color || '#0EA5E9';
    let denunciadosList = [];
    if (data.denunciados) {
      try { denunciadosList = typeof data.denunciados === 'string' ? JSON.parse(data.denunciados) : data.denunciados; } catch { denunciadosList = [data.denunciados]; }
    }
    popupHtml = `
      <div style="min-width: 250px; max-width: 320px; font-family: var(--font-sans, sans-serif);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
          <span style="background:${color}22;border:1px solid ${color}66;color:${color};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700">
            ${icon} ${name}
          </span>
          <span style="background:${getLesividadColor(data.lesividad || 3)};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">L${data.lesividad || 3}</span>
        </div>
        ${denunciadosList.length > 0 ? `
          <div style="margin:4px 0 6px;padding:4px 8px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:6px;font-size:11px;color:#FCA5A5">
            👤 Denunciado: <strong>${denunciadosList[0]}</strong>
          </div>
        ` : ''}
        ${data.direccion ? `<div style="font-size:11px;color:#cbd5e1;margin-bottom:3px">📍 <strong>Ubicación:</strong> ${data.direccion}</div>` : ''}
        ${data.barrio ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:3px">🏘️ <strong>Barrio:</strong> ${data.barrio}</div>` : ''}
        ${data.cuij ? `<div style="font-size:11px;color:#FDE68A;font-family:monospace;margin-bottom:3px">⚖️ CUIJ: ${data.cuij}</div>` : ''}
        ${data.resumen ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:4px;max-height:80px;overflow-y:auto">${data.resumen}</div>` : ''}
        <button class="btn btn-primary btn-sm btn-inspect-this-point" data-lng="${lng}" data-lat="${lat}" data-label="${(data.direccion || data.nombre || 'Ubicación seleccionada').replace(/"/g, '&quot;')}" style="width:100%;margin-top:8px;font-size:10px;padding:6px">
          📍 Analizar Entorno de esta Ubicación
        </button>
      </div>
    `;
  }

  popup.setLngLat([lng, lat]).setHTML(popupHtml).addTo(map);

  setTimeout(() => {
    document.querySelector('.btn-open-dossier-direct')?.addEventListener('click', (ev) => {
      const id = ev.currentTarget.dataset.id;
      if (id && window.abrirDossierDigital) window.abrirDossierDigital(id);
    });
    document.querySelector('.btn-inspect-this-point')?.addEventListener('click', (ev) => {
      const btn = ev.currentTarget;
      const l = parseFloat(btn.dataset.lng);
      const lt = parseFloat(btn.dataset.lat);
      const lbl = btn.dataset.label;
      if (!isNaN(l) && !isNaN(lt)) {
        window.dispatchEvent(new CustomEvent('crimint:request-inspection', { detail: { coords: [l, lt], label: lbl } }));
      }
    });
  }, 50);
}

export function clearHighlightMapPoint() {
  if (!map) return;
  map.getSource('search-target')?.setData({ type: 'FeatureCollection', features: [] });
  const banner = document.getElementById('map-search-banner');
  if (banner) banner.classList.add('hidden');
}

export function filterMapBySearchQuery(query) {
  if (!map) return 0;
  if (!query || query.trim().length < 2) {
    resetMapFilters();
    clearHighlightMapPoint();
    return allMasterFeatures.length;
  }

  const qNorm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const matched = allMasterFeatures.filter(f => {
    const p = f.properties || {};
    const text = [
      p.nombre, p.resumen, p.descripcion, p.direccion, p.barrio, p.cuij,
      p.tematica_nombre, p.tipo, p.tipo_penal,
      ...(Array.isArray(p.denunciados) ? p.denunciados : [])
    ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return text.includes(qNorm);
  });

  activeMapFeatures = matched;
  const fc = { type: 'FeatureCollection', features: matched };
  map.getSource('hechos')?.setData(fc);
  map.getSource('hechos-heat')?.setData(fc);

  if (matched.length > 0) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    matched.forEach(p => {
      const [lng, lat] = p.geometry.coordinates;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    if (matched.length === 1 || (minLng === maxLng && minLat === maxLat)) {
      highlightMapPoint({
        lng: minLng,
        lat: minLat,
        title: matched[0].properties.nombre || 'Coincidencia',
        type: 'hecho',
        data: matched[0].properties
      });
    } else {
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 15.5, duration: 1200 });
    }
  }

  const banner = document.getElementById('map-search-banner');
  const bannerText = document.getElementById('map-search-banner-text');
  if (banner && bannerText) {
    bannerText.innerHTML = `🔍 Coincidencias para <strong>"${query}"</strong>: <strong>${matched.length}</strong> puntos`;
    banner.classList.remove('hidden');
  }

  window.dispatchEvent(new CustomEvent('crimint:data-loaded'));
  return matched.length;
}

export function filterMapByPointType(category) {
  if (!map) return;
  if (!category || category === 'todos') {
    resetMapFilters();
    ['clusters', 'allanamientos', 'personas-bandas'].forEach(l => toggleLayer(l, true));
    const cbAll = document.getElementById('layer-allanamientos');
    const cbPer = document.getElementById('layer-personas-bandas');
    const cbClu = document.getElementById('layer-clusters');
    if (cbAll) cbAll.checked = true;
    if (cbPer) cbPer.checked = true;
    if (cbClu) cbClu.checked = true;
    return;
  }

  if (category === 'persona') {
    toggleLayer('clusters', false);
    toggleLayer('allanamientos', false);
    toggleLayer('personas-bandas', true);
    const cbPer = document.getElementById('layer-personas-bandas');
    if (cbPer) cbPer.checked = true;
    const cbClu = document.getElementById('layer-clusters');
    if (cbClu) cbClu.checked = false;
  } else if (category === 'allanamiento') {
    toggleLayer('clusters', false);
    toggleLayer('personas-bandas', false);
    toggleLayer('allanamientos', true);
    const cbAll = document.getElementById('layer-allanamientos');
    if (cbAll) cbAll.checked = true;
    const cbClu = document.getElementById('layer-clusters');
    if (cbClu) cbClu.checked = false;
  } else {
    // Delito temático
    toggleLayer('personas-bandas', false);
    toggleLayer('allanamientos', false);
    toggleLayer('clusters', true);
    const cbClu = document.getElementById('layer-clusters');
    if (cbClu) cbClu.checked = true;
    applyMapFilters({ tematica: category });
  }
}

export function getMapInstance() {
  return map;
}

// ============================================================
// INSPECCIÓN DE UBICACIÓN Y CRUCE RELACIONAL ESPACIAL
// ============================================================

/**
 * Establece la inspección perimetral de una coordenada en el mapa.
 * Dibuja el radio de cobertura, sitúa el marcador central y opcionalmente
 * proyecta los enlaces a domicilios legales o causas remotas.
 */
export function inspectLocation({
  coords, // [lng, lat]
  label = 'Ubicación bajo análisis',
  radiusMeters = 300,
  crossLinks = [] // Array de { coords: [lng, lat], label: string, distanceKm: string }
}) {
  if (!map || !coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

  const [lng, lat] = coords;

  activeInspection = {
    coords: [lng, lat],
    label,
    radiusMeters,
    crossLinks
  };

  // 1. Generar y cargar el círculo de radio perimetral
  const circleFeature = createGeoJSONCircle([lng, lat], radiusMeters);
  const radiusGeoJSON = {
    type: 'FeatureCollection',
    features: circleFeature ? [circleFeature] : []
  };
  map.getSource('inspection-radius')?.setData(radiusGeoJSON);

  // 2. Marcador del punto central
  const centerGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { label }
      }
    ]
  };
  map.getSource('inspection-center')?.setData(centerGeoJSON);

  // 3. Proyectar líneas de conexión espacial (Vínculos Hecho ↔ Domicilio)
  const lineFeatures = [];
  const endpointFeatures = [];

  crossLinks.forEach(link => {
    if (link.coords && !isNaN(link.coords[0]) && !isNaN(link.coords[1])) {
      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[lng, lat], link.coords]
        },
        properties: {
          label: link.label || 'Vínculo Domiciliario',
          distanceKm: link.distanceKm || ''
        }
      });

      endpointFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: link.coords },
        properties: {
          label: link.label || 'Domicilio Legal'
        }
      });
    }
  });

  map.getSource('inspection-links')?.setData({
    type: 'FeatureCollection',
    features: lineFeatures
  });

  map.getSource('inspection-endpoints')?.setData({
    type: 'FeatureCollection',
    features: endpointFeatures
  });

  // 4. Ajuste de cámara inteligente
  if (crossLinks.length > 0 && crossLinks[0].coords) {
    // Si hay cruce con domicilio distante, encuadrar ambos puntos
    const allLngs = [lng, ...crossLinks.map(l => l.coords[0])];
    const allLats = [lat, ...crossLinks.map(l => l.coords[1])];
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);

    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: { top: 90, bottom: 90, left: 100, right: 380 },
      maxZoom: 15,
      duration: 1400
    });
  } else {
    // Zoom enfocado en el radio de cobertura
    const zoomLevel = radiusMeters <= 150 ? 16.5 : radiusMeters <= 400 ? 15.5 : radiusMeters <= 800 ? 14.5 : 13.8;
    map.flyTo({
      center: [lng, lat],
      zoom: zoomLevel,
      duration: 1200
    });
  }

  return activeInspection;
}

/**
 * Actualiza dinámicamente el radio de cobertura de la inspección activa.
 */
export function updateInspectionRadius(newRadiusMeters) {
  if (!activeInspection || !map) return;
  activeInspection.radiusMeters = newRadiusMeters;

  const circleFeature = createGeoJSONCircle(activeInspection.coords, newRadiusMeters);
  map.getSource('inspection-radius')?.setData({
    type: 'FeatureCollection',
    features: circleFeature ? [circleFeature] : []
  });

  // Ajustar nivel de zoom acorde al nuevo radio
  const zoomLevel = newRadiusMeters <= 150 ? 16.5 : newRadiusMeters <= 400 ? 15.5 : newRadiusMeters <= 800 ? 14.5 : 13.8;
  map.easeTo({ zoom: zoomLevel, duration: 800 });
}

/**
 * Limpia y retira la inspección activa del mapa.
 */
export function clearInspection() {
  if (!map) return;
  activeInspection = null;

  const emptyFC = { type: 'FeatureCollection', features: [] };
  map.getSource('inspection-radius')?.setData(emptyFC);
  map.getSource('inspection-center')?.setData(emptyFC);
  map.getSource('inspection-links')?.setData(emptyFC);
  map.getSource('inspection-endpoints')?.setData(emptyFC);
}

/**
 * Devuelve la inspección activa en memoria.
 */
export function getActiveInspection() {
  return activeInspection;
}

/**
 * Carga o refresca la capa de integrantes de bandas y sus domicilios en el mapa.
 */
export async function loadPersonasMapData() {
  if (!map) return;
  try {
    const geojson = await getPersonasGeoJSON();
    map.getSource('personas-bandas')?.setData(geojson);
  } catch (e) {
    console.warn('Error cargando integrantes de bandas en el mapa:', e);
  }
}

// ============================================================
// MAPBOX ADVANCED CAPABILITIES (3D, SATELLITE, HIGH-RES EXPORT)
// ============================================================

let is3DActive = false;
let currentBaseStyle = 'dark'; // 'dark' | 'satellite'

/**
 * Alterna entre perspectiva 2D ortogonal y vista 3D inclinada a 50° para relieve y contexto urbano.
 */
export function toggle3DMode() {
  if (!map) return false;
  is3DActive = !is3DActive;
  map.easeTo({
    pitch: is3DActive ? 52 : 0,
    bearing: is3DActive ? -18 : 0,
    duration: 1200
  });
  window.dispatchEvent(new CustomEvent('crimint:3d-toggled', { detail: { is3D: is3DActive } }));
  return is3DActive;
}

export function is3DEnabled() {
  return is3DActive;
}

/**
 * Alterna entre el mapa base oscuro institucional y la fotografía satelital de alta resolución Mapbox.
 */
export async function toggleSatelliteMode() {
  if (!map) return 'dark';
  const token = CONFIG.mapbox.token;
  if (!token) {
    console.warn('Mapbox token no configurado para satélite.');
    return currentBaseStyle;
  }

  currentBaseStyle = currentBaseStyle === 'dark' ? 'satellite' : 'dark';
  const newStyle = currentBaseStyle === 'satellite'
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : CONFIG.mapbox.style;

  map.setStyle(newStyle);

  map.once('style.load', async () => {
    setupSources();
    setupLayers();
    setupInteractions();

    if (activeMapFeatures && activeMapFeatures.length > 0) {
      const fc = { type: 'FeatureCollection', features: activeMapFeatures };
      map.getSource('hechos')?.setData(fc);
      map.getSource('hechos-heat')?.setData(fc);
    }
    if (masterPolygons && masterPolygons.length > 0) {
      map.getSource('zonas')?.setData({ type: 'FeatureCollection', features: masterPolygons });
    }
    await loadPersonasMapData();

    // Reaplicar capas activas
    ['heatmap', 'clusters', 'zonas', 'allanamientos', 'personas-bandas'].forEach(id => {
      const el = document.getElementById(`layer-${id}`);
      if (el) toggleLayer(id, el.checked);
    });

    window.dispatchEvent(new CustomEvent('crimint:basemap-changed', { detail: { style: currentBaseStyle } }));
  });

  return currentBaseStyle;
}

export function isSatelliteMode() {
  return currentBaseStyle === 'satellite';
}

/**
 * Exporta el lienzo WebGL de Mapbox en formato PNG de alta resolución para adjuntar en informes periciales o expedientes.
 */
export function exportMapSnapshot(customFilename = null) {
  if (!map) return false;
  try {
    const canvas = map.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    const today = new Date().toISOString().slice(0, 10);
    const filename = customFilename || `CRIMINT_Anexo_Cartografico_${today}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Error exportando mapa para informe:', err);
    return false;
  }
}

/**
 * Traza en el mapa la red espacial de una organización criminal:
 * Conecta la base/líder con los domicilios de todos sus integrantes,
 * y desde allí traza los vectores hacia los hechos delictivos y causas vinculadas.
 */
export async function trazarBandaEnMapa(bandaId) {
  if (!map) return null;
  try {
    const [bandas, personas] = await Promise.all([
      getBandas({ limit: 100 }),
      getPersonas({ limit: 1000 })
    ]);

    const banda = bandas.find(b => b.id === bandaId || b.nombre.toLowerCase().includes(bandaId.toLowerCase()));
    if (!banda) {
      console.warn('Banda no encontrada para trazado:', bandaId);
      return null;
    }

    const bColor = banda.color_hex || '#0EA5E9';
    const miembros = personas.filter(p => p.banda_id === banda.id || (p.banda_nombre && p.banda_nombre.toLowerCase() === banda.nombre.toLowerCase()));

    // 1. Identificar nodo central o líder
    const leader = miembros.find(p => p.roles?.some(r => /l[íi]der|cabecilla|jefe|conducci[óo]n/i.test(r))) || miembros[0];
    let baseCoords = null;
    if (leader) {
      baseCoords = parseGeom(leader.domicilio_principal_geom) || (leader.domicilios?.[0] ? parseGeom(leader.domicilios[0].geom) : null);
    }
    if (!baseCoords && banda.geom) {
      baseCoords = parseGeom(banda.geom);
    }
    if (!baseCoords) {
      // Coordenadas base Santa Fe
      baseCoords = { lng: -60.7182, lat: -31.6051 };
    }

    const lineFeatures = [];
    const nodeFeatures = [];
    const allCoords = [];

    // Agregar nodo base / líder
    allCoords.push([baseCoords.lng, baseCoords.lat]);
    nodeFeatures.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [baseCoords.lng, baseCoords.lat] },
      properties: {
        node_type: 'BASE',
        icon: '👑',
        label: `BASE / MANDO: ${banda.nombre}`,
        color: bColor
      }
    });

    // 2. Domicilios de los miembros
    const memberDomCoords = new Map();
    miembros.forEach(m => {
      const name = `${m.nombre || ''} ${m.apellido || ''}`.trim() || 'Integrante';
      const doms = (m.domicilios && m.domicilios.length > 0)
        ? m.domicilios
        : (m.domicilio_principal ? [{ direccion: m.domicilio_principal, geom: m.domicilio_principal_geom, tipo: 'PRINCIPAL' }] : []);

      doms.forEach(dom => {
        const coords = parseGeom(dom.geom);
        if (coords && coords.lng && coords.lat) {
          allCoords.push([coords.lng, coords.lat]);
          memberDomCoords.set(m.id, [coords.lng, coords.lat]);

          // Nodo domicilio
          nodeFeatures.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] },
            properties: {
              node_type: 'DOMICILIO',
              icon: dom.tipo === 'TEMPLO' ? '⛪' : (dom.tipo === 'DISTRIBUCION' ? '💊' : '🏠'),
              label: `🏠 ${name}: ${dom.direccion || dom.barrio || 'Domicilio'}`,
              color: bColor
            }
          });

          // Línea desde Base -> Domicilio
          lineFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[baseCoords.lng, baseCoords.lat], [coords.lng, coords.lat]]
            },
            properties: {
              type: 'DOMICILIO',
              color: bColor,
              label: `🏠 Residencia: ${m.alias?.[0] || m.apellido || 'Miembro'}`
            }
          });
        }
      });
    });

    // 3. Delitos y Causas vinculadas
    const cuijsSet = new Set();
    miembros.forEach(m => {
      m.causas?.forEach(c => {
        if (c.cuij) cuijsSet.add(c.cuij.trim());
      });
    });

    const linkedCrimes = [];
    if (activeMapFeatures && activeMapFeatures.length > 0) {
      activeMapFeatures.forEach(f => {
        const props = f.properties || {};
        const fCuij = (props.cuij || '').trim();
        const fDenunciados = (props.denunciados || '').toLowerCase();
        const fBarrio = (props.barrio || '').toLowerCase();

        let isLinked = false;
        let linkedMemberId = null;

        if (fCuij && cuijsSet.has(fCuij)) {
          isLinked = true;
        } else if (fDenunciados) {
          for (const m of miembros) {
            const mName = `${m.nombre || ''} ${m.apellido || ''}`.trim().toLowerCase();
            const mAlias = m.alias?.[0]?.toLowerCase();
            if ((mName && fDenunciados.includes(mName)) || (mAlias && fDenunciados.includes(mAlias))) {
              isLinked = true;
              linkedMemberId = m.id;
              break;
            }
          }
        } else if (banda.zonas_operacion?.some(z => fBarrio.includes(z.toLowerCase())) && (props.lesividad >= 7 || props.tematica_key === 'armas' || props.tematica_key === 'homicidios')) {
          if (linkedCrimes.length < 8) isLinked = true;
        }

        if (isLinked && f.geometry?.coordinates) {
          linkedCrimes.push({ feature: f, memberId: linkedMemberId });
        }
      });
    }

    linkedCrimes.slice(0, 16).forEach(({ feature, memberId }) => {
      const cCoords = feature.geometry.coordinates;
      allCoords.push(cCoords);
      const cProps = feature.properties || {};

      // Nodo de delito
      nodeFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: cCoords },
        properties: {
          node_type: 'DELITO',
          icon: cProps.tematica_key === 'homicidios' ? '🩸' : (cProps.tematica_key === 'armas' ? '💥' : '⚖️'),
          label: `💥 ${cProps.tipo_penal || 'Hecho'}: ${cProps.direccion || cProps.barrio || ''}`,
          color: '#EF4444'
        }
      });

      // Línea desde Domicilio del Miembro (o Base) -> Lugar del Delito
      const originCoord = (memberId && memberDomCoords.get(memberId)) || [baseCoords.lng, baseCoords.lat];
      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [originCoord, cCoords]
        },
        properties: {
          type: 'DELITO',
          color: '#EF4444',
          label: `💥 Delito: ${cProps.tipo_penal || 'Hecho Delictivo'}`
        }
      });
    });

    // Actualizar fuentes de Mapbox
    map.getSource('banda-tracing-links')?.setData({
      type: 'FeatureCollection',
      features: lineFeatures
    });

    map.getSource('banda-tracing-nodes')?.setData({
      type: 'FeatureCollection',
      features: nodeFeatures
    });

    // Asegurar visibilidad de capas
    ['layer-personas-bandas', 'layer-allanamientos'].forEach(id => {
      const chk = document.getElementById(id);
      if (chk && !chk.checked) {
        chk.checked = true;
        toggleLayer(id.replace('layer-', ''), true);
      }
    });

    // Mostrar banner táctico de trazado en el mapa
    const banner = document.getElementById('map-banda-trace-banner');
    if (banner) {
      banner.classList.remove('hidden');
      const textEl = document.getElementById('map-banda-trace-text');
      if (textEl) {
        textEl.innerHTML = `<strong>🏴 Trazado Táctico: ${banda.nombre}</strong> — 👤 ${miembros.length} integrantes • 🏠 ${memberDomCoords.size} domicilios • 💥 ${linkedCrimes.length} delitos vinculados`;
      }
    }

    // Encuadrar cámara
    if (allCoords.length > 0) {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      allCoords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      });

      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: { top: 120, bottom: 60, left: 60, right: 60 },
        duration: 1400,
        maxZoom: 16
      });
    }

    return {
      banda,
      miembrosCount: miembros.length,
      domiciliosCount: memberDomCoords.size,
      delitosCount: linkedCrimes.length
    };
  } catch (err) {
    console.error('Error al trazar banda en el mapa:', err);
    return null;
  }
}

export function limpiarTrazadoBandaEnMapa() {
  if (!map) return;
  map.getSource('banda-tracing-links')?.setData({ type: 'FeatureCollection', features: [] });
  map.getSource('banda-tracing-nodes')?.setData({ type: 'FeatureCollection', features: [] });
  const banner = document.getElementById('map-banda-trace-banner');
  if (banner) banner.classList.add('hidden');
}


