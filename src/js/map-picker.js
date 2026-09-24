// ============================================================
// CRIMINT - Selector y Ajuste Quirúrgico de Ubicación en Mapa
// Modal interactivo con pin arrastrable, vista satelital/calles,
// geocodificación inversa en tiempo real y enlace a Google Maps.
// ============================================================

import mapboxgl from 'mapbox-gl';
import { CONFIG } from './config.js';
import { geocodeAddress, reverseGeocode, parseCoordsOrUrl, isInSantaFe, SANTA_FE_BOUNDS } from './geocoder.js';
import { showToast } from './app.js';

let pickerMap = null;
let pickerMarker = null;
let currentPickerState = {
  lat: -31.6333,
  lng: -60.6936,
  direccion: '',
  barrio: '',
  localidad: 'Santa Fe',
  precision: 'MANUAL_EXACTA',
  onConfirm: null
};

let reverseGeocodeTimeout = null;

export function initMapPicker() {
  const modal = document.getElementById('modal-map-picker');
  if (!modal) return;

  // Botón buscar en modal
  const searchInput = document.getElementById('map-picker-search');
  const searchBtn = document.getElementById('map-picker-btn-search');

  const executeSearch = async () => {
    const q = searchInput?.value?.trim();
    if (!q) return;

    // Verificar si es coordenadas o Google Maps link
    const directCoords = parseCoordsOrUrl(q);
    if (directCoords) {
      setPickerPosition(directCoords.lng, directCoords.lat, true);
      showToast('Coordenadas detectadas y aplicadas', 'info');
      return;
    }

    const geocoded = await geocodeAddress(q, '', 'Santa Fe');
    if (geocoded && geocoded.lat && geocoded.lng) {
      setPickerPosition(geocoded.lng, geocoded.lat, true);
      updateInfoDisplay(geocoded.direccion || q, geocoded.barrio, geocoded.precision);
      showToast(`Ubicado: ${geocoded.display_name}`, 'success');
    } else {
      showToast('No se encontró la dirección indicada. Puede hacer clic en el mapa para ubicarla manualmente.', 'warning');
    }
  };

  searchBtn?.addEventListener('click', executeSearch);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  });

  // Selector de capas: Oscuro / Satélite / Calles
  document.querySelectorAll('.btn-picker-layer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-picker-layer').forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      const styleKey = targetBtn.dataset.layer;

      if (!pickerMap) return;
      if (styleKey === 'satelite') {
        pickerMap.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
      } else if (styleKey === 'calles') {
        pickerMap.setStyle('mapbox://styles/mapbox/streets-v12');
      } else {
        pickerMap.setStyle(CONFIG.mapbox.style);
      }
    });
  });

  // Botón Copiar Coordenadas
  document.getElementById('map-picker-btn-copy')?.addEventListener('click', () => {
    const txt = `${currentPickerState.lat.toFixed(6)}, ${currentPickerState.lng.toFixed(6)}`;
    navigator.clipboard?.writeText(txt);
    showToast(`Coordenadas copiadas: ${txt}`, 'info');
  });

  // Botón Confirmar Ubicación
  document.getElementById('map-picker-btn-confirm')?.addEventListener('click', () => {
    if (typeof currentPickerState.onConfirm === 'function') {
      const geom = `SRID=4326;POINT(${currentPickerState.lng} ${currentPickerState.lat})`;
      currentPickerState.onConfirm({
        lat: currentPickerState.lat,
        lng: currentPickerState.lng,
        geom,
        direccion: currentPickerState.direccion,
        barrio: currentPickerState.barrio,
        localidad: currentPickerState.localidad || 'Santa Fe',
        precision: currentPickerState.precision || 'MANUAL_EXACTA'
      });
    }
    modal.classList.add('hidden');
    showToast('Ubicación cartográfica guardada con precisión', 'success');
  });
}

function ensurePickerMap() {
  const container = document.getElementById('map-picker-map');
  if (!container) return;

  if (!pickerMap) {
    const token = CONFIG.mapbox.token;
    if (token) mapboxgl.accessToken = token;

    pickerMap = new mapboxgl.Map({
      container: 'map-picker-map',
      style: token ? CONFIG.mapbox.style : CONFIG.mapbox.fallbackStyle,
      center: [-60.6936, -31.6333],
      zoom: 13,
      attributionControl: false
    });

    pickerMap.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

    // Crear marcador arrastrable con estilo destacado
    const el = document.createElement('div');
    el.className = 'picker-custom-marker';
    el.innerHTML = `
      <div class="marker-pin-pulse"></div>
      <div class="marker-pin-icon">📍</div>
    `;

    pickerMarker = new mapboxgl.Marker({
      element: el,
      draggable: true,
      anchor: 'bottom'
    })
      .setLngLat([-60.6936, -31.6333])
      .addTo(pickerMap);

    // Evento arrastrar pin
    pickerMarker.on('dragend', () => {
      const lngLat = pickerMarker.getLngLat();
      onPositionChanged(lngLat.lng, lngLat.lat, false);
    });

    // Evento clic en cualquier punto del mapa para mover pin
    pickerMap.on('click', (e) => {
      setPickerPosition(e.lngLat.lng, e.lngLat.lat, false);
    });
  }

  setTimeout(() => {
    pickerMap.resize();
  }, 100);
}

function setPickerPosition(lng, lat, fly = true) {
  currentPickerState.lng = lng;
  currentPickerState.lat = lat;

  if (pickerMarker) {
    pickerMarker.setLngLat([lng, lat]);
  }

  if (fly && pickerMap) {
    pickerMap.flyTo({ center: [lng, lat], zoom: Math.max(pickerMap.getZoom(), 16), speed: 1.4 });
  }

  onPositionChanged(lng, lat, false);
}

async function onPositionChanged(lng, lat, skipReverse = false) {
  currentPickerState.lng = lng;
  currentPickerState.lat = lat;
  currentPickerState.precision = 'MANUAL_EXACTA';

  updateCoordsDisplay(lat, lng);

  // Actualizar enlace a Google Maps
  const gmapBtn = document.getElementById('map-picker-btn-gmaps');
  if (gmapBtn) {
    gmapBtn.href = `https://www.google.com/maps?q=${lat},${lng}`;
    gmapBtn.target = '_blank';
  }

  if (skipReverse) return;

  // Reverse geocodificación con debounce
  if (reverseGeocodeTimeout) clearTimeout(reverseGeocodeTimeout);
  reverseGeocodeTimeout = setTimeout(async () => {
    const rev = await reverseGeocode(lng, lat);
    if (rev) {
      currentPickerState.direccion = rev.direccion || currentPickerState.direccion;
      currentPickerState.barrio = rev.barrio || currentPickerState.barrio;
      currentPickerState.localidad = rev.localidad || 'Santa Fe';
      updateInfoDisplay(currentPickerState.direccion, currentPickerState.barrio, 'MANUAL_EXACTA');
    }
  }, 400);
}

function updateCoordsDisplay(lat, lng) {
  const coordEl = document.getElementById('map-picker-coords');
  if (coordEl) {
    coordEl.textContent = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
  }
}

function updateInfoDisplay(direccion, barrio, precision) {
  const addrEl = document.getElementById('map-picker-address-display');
  const precEl = document.getElementById('map-picker-precision-display');

  if (addrEl) {
    addrEl.textContent = direccion ? `${direccion}${barrio ? ` (${barrio})` : ''}` : 'Ubicación seleccionada';
  }

  if (precEl) {
    precEl.innerHTML = `<span class="badge badge-success" style="font-size:11px;padding:3px 8px;">🎯 Quirúrgica / Fijada en Mapa</span>`;
  }
}

// ------------------------------------------------------------
// Método público para abrir el selector cartográfico
// ------------------------------------------------------------
export async function openMapPicker({ currentCoords, address, barrio, localidad, title, onConfirm }) {
  const modal = document.getElementById('modal-map-picker');
  if (!modal) return;

  modal.classList.remove('hidden');
  ensurePickerMap();

  currentPickerState.onConfirm = onConfirm;
  currentPickerState.localidad = localidad || 'Santa Fe';

  // Título del modal
  const titleEl = document.getElementById('map-picker-title');
  if (titleEl) {
    titleEl.textContent = title || 'Ajuste Quirúrgico de Ubicación Cartográfica';
  }

  const searchInput = document.getElementById('map-picker-search');
  if (searchInput) {
    searchInput.value = address || '';
  }

  // Si ya tenemos coordenadas válidas
  if (currentCoords && typeof currentCoords.lat === 'number' && typeof currentCoords.lng === 'number') {
    setPickerPosition(currentCoords.lng, currentCoords.lat, true);
    currentPickerState.direccion = address || '';
    currentPickerState.barrio = barrio || '';
    updateInfoDisplay(address, barrio, 'MANUAL_EXACTA');
    return;
  }

  // Si se pasó una dirección textual, geocodificarla inicialmente
  if (address && address.trim()) {
    const geo = await geocodeAddress(address, barrio, localidad);
    if (geo && geo.lat && geo.lng) {
      setPickerPosition(geo.lng, geo.lat, true);
      currentPickerState.direccion = geo.direccion || address;
      currentPickerState.barrio = geo.barrio || barrio || '';
      updateInfoDisplay(currentPickerState.direccion, currentPickerState.barrio, geo.precision);
      return;
    }
  }

  // Fallback: Centro de Santa Fe Capital
  setPickerPosition(-60.6936, -31.6333, true);
  updateInfoDisplay('Arrastre el pin o haga clic en el mapa sobre la ubicación exacta', '', 'MANUAL_EXACTA');
}
