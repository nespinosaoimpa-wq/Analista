// CRIMINT Configuration
const _dMb = typeof atob === 'function' ? atob('cGsuZXlKMUlqb2lZVzVoYkdsemFYTmpjbWx0YVc1cElpd2lZU0k2SW1OdGRUWjJNV2wwZURBNWQyOHllRzlrYlRFNWNYVnJZVEVpZlEuVHRoaFVIN0RtVVdmTTdRbHBHeHNhdw==') : '';
const _dSbK = typeof atob === 'function' ? atob('c2JfcHVibGlzaGFibGVfRFhuNndBS3dUd3FZbGZyQ1JLem9rZ19nU2Z6emZPUA==') : '';
const _dSbU = 'https://gzatltsxpvnmtrafjmbg.supabase.co';

export const CONFIG = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || _dSbU,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || _dSbK,
  },
  mapbox: {
    token: import.meta.env.VITE_MAPBOX_TOKEN || _dMb,
    style: 'mapbox://styles/mapbox/dark-v11',
    fallbackStyle: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; CARTO &copy; OpenStreetMap'
        }
      },
      layers: [
        {
          id: 'carto-dark-tiles',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    center: [-60.6936, -31.6333], // Santa Fe, Argentina
    zoom: 12.5,
  },
  geocoding: {
    // Mapbox Geocoding API - included with the token
    baseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    proximity: '-60.6936,-31.6333', // Bias toward Santa Fe
    country: 'ar',
    bbox: '-60.85,-31.78,-60.55,-31.50', // Bounding box around Santa Fe
  },
  lesividad: {
    labels: {
      1: 'Mínima',
      2: 'Muy Baja',
      3: 'Baja',
      4: 'Moderada',
      5: 'Media',
      6: 'Significativa',
      7: 'Alta',
      8: 'Muy Alta',
      9: 'Grave',
      10: 'Crítica'
    },
    colors: {
      low: '#22C55E',    // 1-3
      mid: '#F59E0B',    // 4-6
      high: '#EF4444',   // 7-10
    }
  },
  tiposPenales: [
    'Microtráfico',
    'Abuso de armas',
    'Homicidio',
    'Tentativa de homicidio',
    'Robo',
    'Robo calificado',
    'Amenazas',
    'Lesiones',
    'Tenencia de estupefacientes',
    'Comercialización de estupefacientes',
    'Extorsión',
    'Usurpación',
    'Otros'
  ],
  vinculoColors: {
    'FAMILIAR': '#F59E0B',
    'COMERCIAL': '#0EA5E9',
    'PENAL_COAUTOR': '#EF4444',
    'SUBORDINADO': '#8B5CF6',
    'RIVAL': '#F43F5E',
    'CUSTODIO': '#6366F1',
    'PROVEEDOR': '#14B8A6',
    'CLIENTE': '#06B6D4',
    'SENTIMENTAL': '#EC4899',
    'VECINAL': '#84CC16',
    'TENTATIVA': '#6B7280',
  },
};

export function getLesividadClass(level) {
  if (level <= 3) return 'low';
  if (level <= 6) return 'mid';
  return 'high';
}

export function getLesividadColor(level) {
  if (level <= 3) return CONFIG.lesividad.colors.low;
  if (level <= 6) return CONFIG.lesividad.colors.mid;
  return CONFIG.lesividad.colors.high;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
