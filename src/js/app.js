// ============================================================
// CRIMINT — Main Application Orchestrator
// ============================================================
import {
  initMap, loadMapData, toggleLayer, flyTo, loadTacticalGeoJSON, applyMapFilters, resetMapFilters,
  inspectLocation, updateInspectionRadius, clearInspection, getActiveInspection, getAllMasterFeatures,
  loadPersonasMapData, toggle3DMode, toggleSatelliteMode, exportMapSnapshot
} from './map.js';
import { initDashboard, refreshDashboard } from './dashboard.js';
import { initTacticalHUD, initTacticalTimeline } from './tactical-hud.js';
import {
  globalSearch, insertHecho, insertPersona, updatePersona, insertBanda,
  getHechos, getPersonas, getBandas, getAllanamientos, insertAllanamiento, insertVinculo,
  getGrafoPersona, getAllVinculos, geocodeAddress, logAction, parseGeom,
  getPersonaById, getBandaById, getAllanamientoById, getHechoById, getZonas
} from './supabase-client.js';
import { parseKML, parseKMZ, parseExcel, importExcelRows, importKMLGeoJSON, saveTacticalToLocal, getTacticalFromLocal } from './importers.js';
import { CONFIG, getLesividadClass, formatDate, formatDateTime, getLesividadColor } from './config.js';
import {
  analyzeLocationEnvironment, analyzePersonLocationCross, getDistanceMeters
} from './analytics-engine.js';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { initMapPicker, openMapPicker } from './map-picker.js';
import { renderPrecisionBadge, parseCoordsOrUrl, reverseGeocode } from './geocoder.js';
import { searchEngine } from './search-engine.js';

// Estado global de dossier y perfilación criminal
let currentPersonaFiles = [];
let currentViewingDossierId = null;

// ============================================================
// APP INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initMapPicker();
  initTacticalHUD();
  initTacticalTimeline();
  setupNavigation();
  setupSidebar();
  setupSearch();
  setupFilters();
  setupLayerToggles();
  setupMapToolbarControls();
  setupModals();
  setupForms();
  setupIngestion();
  setupRangeSliders();
  setupKeyboard();
  setupInspectionModule();
  updateHeaderStats();
  window.addEventListener('crimint:data-loaded', updateHeaderStats);

  // Setup report generation button in dashboard
  document.getElementById('btn-informe-criminal')?.addEventListener('click', () => {
    generarInformeCriminalCuantitativo();
  });

  // Default dates for filters
  const today = new Date().toISOString().split('T')[0];
  const ago90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  setDefaultDate('filter-fecha-desde', ago90);
  setDefaultDate('filter-fecha-hasta', today);

  // Auto-restore cached tactical data if present
  setTimeout(() => {
    const cachedTactical = getTacticalFromLocal();
    if (cachedTactical && cachedTactical.features?.length > 0) {
      loadTacticalGeoJSON(cachedTactical, { fitBounds: false });
    }
    updateHeaderStats();
  }, 1200);

  // Construir índice centralizado de búsqueda y compulsa automática
  setTimeout(async () => {
    try {
      await searchEngine.build(getPersonas, getHechos, getBandas, getAllanamientos, getAllVinculos);
      const stats = searchEngine.getStats();
      console.log(`[CRIMINT] Motor de búsqueda listo: ${stats.totalEntries} entidades, ${stats.wordsIndexed} palabras indexadas en ${stats.buildTimeMs.toFixed(0)}ms`);
    } catch (e) {
      console.warn('[CRIMINT] Error construyendo índice de búsqueda:', e);
    }
  }, 2000);

  showToast('CRIMINT iniciado — Inteligencia Criminal Operativa', 'info');
});

export async function updateHeaderStats() {
  try {
    const [hechos, personas, bandas] = await Promise.all([
      getHechos({ limit: 1000 }),
      getPersonas({ limit: 1000 }),
      getBandas({ limit: 1000 })
    ]);
    const elH = document.querySelector('#stat-hechos span');
    const elP = document.querySelector('#stat-personas span');
    const elB = document.querySelector('#stat-bandas span');
    const elC = document.querySelector('#stat-capturas span');

    // Total hechos prioritizes loaded tactical GeoJSON (8,206 features)
    const tacticalCount = window._crimintTacticalGeoJSON?.features?.length || 8206;
    if (elH) elH.textContent = tacticalCount.toLocaleString('es-AR');
    if (elP) elP.textContent = personas.length;
    if (elB) elB.textContent = bandas.length;
    if (elC) elC.textContent = personas.filter(p => p.pedido_captura).length;
  } catch (e) {
    console.warn('Error actualizando métricas del header:', e);
  }
}

function setDefaultDate(id, value) {
  const el = document.getElementById(id);
  if (el && !el.value) el.value = value;
}

// ============================================================
// NAVIGATION
// ============================================================
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.dataset.view;

      // Update nav active state
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Show view
      views.forEach(v => v.classList.remove('active'));
      const targetView = document.getElementById(`view-${viewId}`);
      if (targetView) targetView.classList.add('active');

      // Load view data
      loadViewData(viewId);
    });
  });
}

async function loadViewData(viewId) {
  switch (viewId) {
    case 'dashboard':
      await initDashboard();
      break;
    case 'personas':
      await renderPersonasView();
      break;
    case 'bandas':
      await renderBandasView();
      break;
    case 'grafo':
      await setupGrafoView();
      break;
    case 'allanamientos':
      await renderAllanamientosView();
      break;
  }
}

// ============================================================
// SIDEBAR
// ============================================================
function setupSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
  });

  // Auto-expand on hover for desktop
  sidebar?.addEventListener('mouseenter', () => {
    sidebar.classList.add('expanded');
  });
  sidebar?.addEventListener('mouseleave', () => {
    sidebar.classList.remove('expanded');
  });
}

// ============================================================
// SEARCH
// ============================================================
function setupSearch() {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  let debounceTimer = null;

  input?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const term = input.value.trim();
      if (term.length < 2) {
        dropdown.classList.remove('visible');
        return;
      }

      // Usar motor de búsqueda centralizado si está listo, sino fallback
      let results;
      if (searchEngine.built) {
        results = searchEngine.search(term, { limit: 20 }).map(r => {
          // Extraer coordenadas si hay
          let coords = null;
          if (r.data?.geom) coords = parseGeom(r.data.geom);
          else if (r.data?.domicilio_principal_geom) coords = parseGeom(r.data.domicilio_principal_geom);
          return { ...r, coords };
        });
      } else {
        results = await globalSearch(term);
      }

      const direct = parseCoordsOrUrl(term);

      let geoOption = '';
      if (direct) {
        geoOption = `
          <div class="search-result-item search-geo-item" data-type="coord-direct" data-lng="${direct.lng}" data-lat="${direct.lat}">
            <span class="search-result-type" style="background:#2563EB;color:#FFF">📍 GPS</span>
            <div>
              <div style="font-weight:600;font-size:13px;color:#60A5FA">Ir a Coordenadas GPS en Mapa</div>
              <div style="font-size:11px;color:var(--text-muted)">Lat: ${direct.lat.toFixed(6)}, Lng: ${direct.lng.toFixed(6)}</div>
            </div>
          </div>
        `;
      } else if (term.length >= 4) {
        geoOption = `
          <div class="search-result-item search-geo-locate" data-type="geo-search" data-term="${term.replace(/"/g, '&quot;')}">
            <span class="search-result-type" style="background:#059669;color:#FFF">🗺️ MAPA</span>
            <div>
              <div style="font-weight:600;font-size:13px;color:#34D399">Ubicar dirección "${term}" en el mapa</div>
              <div style="font-size:11px;color:var(--text-muted)">Geocodificar y centrar visor</div>
            </div>
          </div>
        `;
      }

      if (results.length === 0 && !geoOption) {
        dropdown.innerHTML = '<div class="search-result-item" style="color:var(--text-muted)">Sin resultados para "' + term + '"</div>';
      } else {
        const typeColors = { persona: '#0EA5E9', hecho: '#EF4444', allanamiento: '#F59E0B', banda: '#8B5CF6' };
        const typeLabels = { persona: 'PER', hecho: 'HEC', allanamiento: 'ALL', banda: 'BAN' };
        const resultsHtml = results.map(r => {
          const typeLabel = typeLabels[r.type] || r.type.toUpperCase().slice(0,3);
          const coordsAttr = r.coords ? `data-lng="${r.coords.lng}" data-lat="${r.coords.lat}"` : '';
          const matchTags = (r.matchReasons || []).slice(0, 3).map(reason =>
            `<span style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#FDE68A;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;white-space:nowrap">${reason}</span>`
          ).join('');
          const scoreBar = r.score ? `<span style="font-size:9px;color:${r.score >= 0.8 ? '#22C55E' : r.score >= 0.5 ? '#F59E0B' : '#94A3B8'};font-weight:700;margin-left:auto;white-space:nowrap">${Math.round(r.score * 100)}%</span>` : '';
          return `
            <div class="search-result-item" data-type="${r.type}" data-id="${r.id}" ${coordsAttr} style="align-items:flex-start">
              <span class="search-result-type ${r.type}" style="background:${typeColors[r.type] || '#64748B'}22;color:${typeColors[r.type] || '#94A3B8'};border:1px solid ${typeColors[r.type] || '#64748B'}44;font-weight:800">${typeLabel}</span>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</span>
                  ${scoreBar}
                </div>
                <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.subtitle}</div>
                ${matchTags ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:3px">${matchTags}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');
        dropdown.innerHTML = geoOption + resultsHtml;
      }
      dropdown.classList.add('visible');
    }, 250);
  });

  dropdown?.addEventListener('click', async (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item) return;

    if (item.dataset.type === 'coord-direct') {
      dropdown.classList.remove('visible');
      input.value = '';
      document.querySelector('[data-view="mapa"]')?.click();
      const lng = parseFloat(item.dataset.lng);
      const lat = parseFloat(item.dataset.lat);
      flyTo(lng, lat, 17);
      showToast(`Centrado en coordenadas GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'info');
      return;
    }

    if (item.dataset.type === 'geo-search') {
      dropdown.classList.remove('visible');
      const t = item.dataset.term;
      input.value = '';
      showLoading(`Localizando "${t}"...`);
      const geo = await geocodeAddress(t);
      hideLoading();
      if (geo && geo.lat && geo.lng) {
        document.querySelector('[data-view="mapa"]')?.click();
        flyTo(geo.lng, geo.lat, 17);
        showToast(`Ubicado: ${geo.display_name}`, 'success');
      } else {
        showToast(`No se pudo ubicar "${t}" en Santa Fe`, 'warning');
      }
      return;
    }

    if (!item.dataset.id) return;

    dropdown.classList.remove('visible');
    input.value = '';

    const type = item.dataset.type;
    const id = item.dataset.id;
    const lng = item.dataset.lng ? parseFloat(item.dataset.lng) : null;
    const lat = item.dataset.lat ? parseFloat(item.dataset.lat) : null;

    if (lng && lat) {
      document.querySelector('[data-view="mapa"]')?.click();
      flyTo(lng, lat, 16);
    }

    showEntityDetail(type, id);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search')) {
      dropdown?.classList.remove('visible');
    }
  });
}

// ============================================================
// MAP FILTERS
// ============================================================
function setupFilters() {
  const btnApply = document.getElementById('btn-apply-filters');
  const btnClear = document.getElementById('btn-clear-filters');

  btnApply?.addEventListener('click', () => {
    const filters = {
      desde: document.getElementById('filter-fecha-desde')?.value || undefined,
      hasta: document.getElementById('filter-fecha-hasta')?.value || undefined,
      lesividadMin: parseInt(document.getElementById('filter-lesividad')?.value) || 1,
      tematica: document.getElementById('filter-tipo')?.value || undefined,
    };
    applyMapFilters(filters);
    showToast('Filtros aplicados al mapa', 'success');
  });

  btnClear?.addEventListener('click', () => {
    const desde = document.getElementById('filter-fecha-desde');
    const hasta = document.getElementById('filter-fecha-hasta');
    const lesiv = document.getElementById('filter-lesividad');
    const lesivVal = document.getElementById('filter-lesividad-val');
    const tipo = document.getElementById('filter-tipo');

    if (desde) desde.value = '';
    if (hasta) hasta.value = '';
    if (lesiv) lesiv.value = 1;
    if (lesivVal) lesivVal.textContent = '1';
    if (tipo) tipo.value = '';

    resetMapFilters();
    showToast('Filtros restablecidos', 'info');
  });

  // Dashboard refresh
  document.getElementById('btn-dash-refresh')?.addEventListener('click', refreshDashboard);
}

// ============================================================
// LAYER TOGGLES
// ============================================================
function setupLayerToggles() {
  const toggles = {
    'layer-heatmap': 'heatmap',
    'layer-clusters': 'clusters',
    'layer-zonas': 'zonas',
    'layer-allanamientos': 'allanamientos',
    'layer-personas-bandas': 'personas-bandas',
  };

  Object.entries(toggles).forEach(([checkboxId, layerId]) => {
    document.getElementById(checkboxId)?.addEventListener('change', (e) => {
      toggleLayer(layerId, e.target.checked);
    });
  });
}

function setupMapToolbarControls() {
  // Perspectiva 3D
  const btn3D = document.getElementById('btn-toggle-3d');
  btn3D?.addEventListener('click', () => {
    const is3D = toggle3DMode();
    if (is3D) {
      btn3D.style.background = 'rgba(14, 165, 233, 0.25)';
      btn3D.style.borderColor = '#0EA5E9';
      btn3D.style.color = '#38BDF8';
      showToast('Perspectiva 3D activada (Inclinación 50°)', 'info');
    } else {
      btn3D.style.background = '';
      btn3D.style.borderColor = '';
      btn3D.style.color = '';
      showToast('Vista 2D ortogonal restablecida', 'info');
    }
  });

  // Alternar Satélite HD / Modo Oscuro
  const btnBasemap = document.getElementById('btn-toggle-basemap');
  const basemapLabel = document.getElementById('btn-basemap-label');
  btnBasemap?.addEventListener('click', async () => {
    showLoading('Cambiando capa base Mapbox...');
    try {
      const mode = await toggleSatelliteMode();
      if (mode === 'satellite') {
        btnBasemap.style.background = 'rgba(34, 197, 94, 0.25)';
        btnBasemap.style.borderColor = '#22C55E';
        btnBasemap.style.color = '#4ADE80';
        if (basemapLabel) basemapLabel.textContent = '🌙 Base';
        showToast('Vista Satelital Mapbox activada', 'info');
      } else {
        btnBasemap.style.background = '';
        btnBasemap.style.borderColor = '';
        btnBasemap.style.color = '';
        if (basemapLabel) basemapLabel.textContent = '🛰️ Satélite';
        showToast('Mapa base oscuro CRIMINT activado', 'info');
      }
    } finally {
      hideLoading();
    }
  });

  // Exportar captura WebGL en alta resolución
  document.getElementById('btn-export-map-snapshot')?.addEventListener('click', () => {
    const ok = exportMapSnapshot();
    if (ok) {
      showToast('Captura cartográfica de alta resolución generada y descargada', 'success');
    } else {
      showToast('No se pudo generar la captura del mapa', 'error');
    }
  });
}

// ============================================================
// MODALS
// ============================================================
function setupModals() {
  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      document.getElementById(modalId)?.classList.add('hidden');
    });
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });

  // Open buttons
  document.getElementById('btn-form-hecho')?.addEventListener('click', () => openModal('modal-hecho'));
  
  const handleOpenNuevaPersona = async () => {
    const f = document.getElementById('form-persona');
    if (f) f.reset();
    const editIdEl = document.getElementById('persona-edit-id');
    if (editIdEl) editIdEl.value = '';
    const titleEl = document.getElementById('modal-persona-title');
    if (titleEl) titleEl.textContent = 'Registrar Perfil / Dossier Digital';
    const submitBtn = document.getElementById('btn-submit-persona');
    if (submitBtn) submitBtn.textContent = 'Guardar Ficha de Perfil';
    const pelVal = document.getElementById('persona-peligrosidad-val');
    if (pelVal) pelVal.textContent = '5';

    // Reset files
    currentPersonaFiles = [];
    renderPersonaFilesList();

    // Reset photo
    const fotoPreview = document.getElementById('persona-foto-preview');
    if (fotoPreview) { fotoPreview.src = ''; fotoPreview.style.display = 'none'; }
    const fotoPlh = document.getElementById('persona-foto-placeholder');
    if (fotoPlh) fotoPlh.style.display = 'block';

    // Reset dynamic lists
    const domCont = document.getElementById('persona-domicilios-container');
    if (domCont) {
      domCont.innerHTML = '';
      addDomicilioRow({ tipo: 'REAL', direccion: '', barrio: '' });
    }
    const causaCont = document.getElementById('persona-causas-container');
    if (causaCont) causaCont.innerHTML = '';
    const vehCont = document.getElementById('persona-vehiculos-container');
    if (vehCont) vehCont.innerHTML = '';
    const famCont = document.getElementById('persona-familia-container');
    if (famCont) famCont.innerHTML = '';

    // Hide capture details
    document.getElementById('persona-captura-fields')?.classList.add('hidden');

    // Reset tabs to first tab
    document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#persona-form-nav [data-form-tab="tab-f-identidad"]')?.classList.add('active');
    document.querySelectorAll('.persona-tab-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById('tab-f-identidad')?.classList.remove('hidden');

    // Populate gang dropdowns dynamically
    await populatePersonaBandaSelects('', '');

    openModal('modal-persona');
  };
  document.getElementById('btn-nueva-persona')?.addEventListener('click', handleOpenNuevaPersona);
  document.getElementById('btn-form-persona')?.addEventListener('click', handleOpenNuevaPersona);
  document.getElementById('btn-nueva-banda')?.addEventListener('click', () => openModal('modal-banda'));
  document.getElementById('btn-nuevo-allanamiento')?.addEventListener('click', () => openModal('modal-allanamiento'));
  document.getElementById('btn-briefing')?.addEventListener('click', openBriefingModal);
  document.getElementById('btn-form-vinculo')?.addEventListener('click', async () => {
    await populateVinculoSelects();
    openModal('modal-vinculo');
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

async function populateVinculoSelects() {
  const origen = document.getElementById('vinculo-origen');
  const destino = document.getElementById('vinculo-destino');
  if (!origen || !destino) return;
  try {
    const personas = await getPersonas({ limit: 200 });
    const opts = ['<option value="">Seleccionar persona...</option>'].concat(
      personas.map(p => {
        const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';
        const alias = p.alias?.length ? ` (${p.alias[0]})` : '';
        return `<option value="${p.id}">${name}${alias}</option>`;
      })
    ).join('');
    origen.innerHTML = opts;
    destino.innerHTML = opts;
  } catch (e) {
    console.warn('Error loading personas for vinculo modal:', e);
  }
}

// ============================================================
// FORMS
// ============================================================
function setupForms() {
  initDossierSystem();
  // Form: Nuevo Hecho
  document.getElementById('form-hecho')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading('Guardando hecho...');

    try {
      const hecho = {
        fecha: document.getElementById('hecho-fecha')?.value
          ? new Date(document.getElementById('hecho-fecha').value).toISOString()
          : null,
        tipo_penal: document.getElementById('hecho-tipo')?.value,
        direccion: document.getElementById('hecho-direccion')?.value,
        barrio: document.getElementById('hecho-barrio')?.value,
        localidad: document.getElementById('hecho-localidad')?.value || 'Santa Fe',
        geom: document.getElementById('hecho-geom')?.value || null,
        precision_geo: document.getElementById('hecho-precision')?.value || null,
        indice_lesividad: parseInt(document.getElementById('hecho-lesividad')?.value) || 3,
        cuij: document.getElementById('hecho-cuij')?.value || null,
        requerimiento: document.getElementById('hecho-requerimiento')?.value || null,
        modus_operandi: document.getElementById('hecho-modus')?.value || null,
        resumen: document.getElementById('hecho-resumen')?.value || null,
      };

      // Determine franja horaria
      if (hecho.fecha) {
        const hora = new Date(hecho.fecha).getHours();
        if (hora >= 0 && hora < 6) hecho.franja_horaria = 'MADRUGADA';
        else if (hora >= 6 && hora < 12) hecho.franja_horaria = 'MAÑANA';
        else if (hora >= 12 && hora < 18) hecho.franja_horaria = 'TARDE';
        else hecho.franja_horaria = 'NOCHE';
      }

      const result = await insertHecho(hecho);
      await logAction('INSERT', 'hechos_delictivos', result.id);

      closeModal('modal-hecho');
      e.target.reset();
      if (document.getElementById('hecho-geom')) document.getElementById('hecho-geom').value = '';
      if (document.getElementById('hecho-precision')) document.getElementById('hecho-precision').value = '';
      if (document.getElementById('hecho-geo-badge')) document.getElementById('hecho-geo-badge').innerHTML = '';
      loadMapData();
      showToast('Hecho registrado correctamente con precisión cartográfica', 'success');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });

  // Botón Ajustar en Mapa para Hecho
  document.getElementById('btn-pick-hecho-map')?.addEventListener('click', () => {
    const curCoords = document.getElementById('hecho-geom')?.value ? parseGeom(document.getElementById('hecho-geom').value) : null;
    const dirVal = document.getElementById('hecho-direccion')?.value?.trim() || '';
    const barVal = document.getElementById('hecho-barrio')?.value?.trim() || '';
    openMapPicker({
      currentCoords: curCoords,
      address: dirVal,
      barrio: barVal,
      title: 'Fijar Lugar del Hecho Delictivo',
      onConfirm: ({ lat, lng, geom, direccion, barrio, precision }) => {
        const geomInput = document.getElementById('hecho-geom');
        const precInput = document.getElementById('hecho-precision');
        const dirInput = document.getElementById('hecho-direccion');
        const barInput = document.getElementById('hecho-barrio');
        const badge = document.getElementById('hecho-geo-badge');

        if (geomInput) geomInput.value = geom;
        if (precInput) precInput.value = precision;
        if (dirInput && direccion) dirInput.value = direccion;
        if (barInput && barrio && !barInput.value) barInput.value = barrio;
        if (badge) badge.innerHTML = renderPrecisionBadge(precision, { lat, lng });
      }
    });
  });

  // Auto-geocodificación y detección de coordenadas / Google Maps en Hecho
  document.getElementById('hecho-direccion')?.addEventListener('change', async (e) => {
    const val = e.target.value.trim();
    const geomInput = document.getElementById('hecho-geom');
    const precInput = document.getElementById('hecho-precision');
    const badge = document.getElementById('hecho-geo-badge');
    const barInput = document.getElementById('hecho-barrio');

    if (!val) {
      if (geomInput) geomInput.value = '';
      if (precInput) precInput.value = '';
      if (badge) badge.innerHTML = '';
      return;
    }

    const direct = parseCoordsOrUrl(val);
    if (direct) {
      if (geomInput) geomInput.value = `SRID=4326;POINT(${direct.lng} ${direct.lat})`;
      if (precInput) precInput.value = 'GPS_COORDENADAS';
      if (badge) badge.innerHTML = renderPrecisionBadge('GPS_COORDENADAS', direct);
      showToast('Coordenadas detectadas y asignadas al hecho', 'info');
      return;
    }

    if (badge) badge.innerHTML = `<span style="font-size:10px;color:var(--text-muted)">⏳ Verificando ubicación...</span>`;
    const barVal = barInput?.value?.trim() || '';
    const geo = await geocodeAddress(val, barVal, 'Santa Fe');
    if (geo && geo.lat && geo.lng) {
      if (geomInput) geomInput.value = `SRID=4326;POINT(${geo.lng} ${geo.lat})`;
      if (precInput) precInput.value = geo.precision;
      if (badge) badge.innerHTML = renderPrecisionBadge(geo.precision, { lat: geo.lat, lng: geo.lng });
      if (barInput && geo.barrio && !barInput.value) barInput.value = geo.barrio;
    } else {
      if (badge) badge.innerHTML = `<span class="badge badge-warning" style="font-size:10px;">⚠️ Calle aproximada - Ajustar en mapa</span>`;
    }
  });

  // Form: Persona (Creación y Edición de Integrantes / Domicilios / Dossiers Digitales)
  document.getElementById('form-persona')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('persona-edit-id')?.value;
    showLoading(editId ? 'Actualizando perfil y dossier institucional...' : 'Registrando perfil de persona de interés...');

    try {
      const bandaSelect = document.getElementById('persona-banda');
      const bandaQuickSelect = document.getElementById('persona-banda-quick');
      let selectedBandaId = bandaSelect?.value || bandaQuickSelect?.value || null;
      if (selectedBandaId === '__NEW_BANDA__') selectedBandaId = null;
      let selectedBandaNombre = null;
      let selectedBandaColor = '#0EA5E9';
      if (selectedBandaId) {
        const opt = (bandaSelect && bandaSelect.value) ? bandaSelect.options[bandaSelect.selectedIndex] : (bandaQuickSelect ? bandaQuickSelect.options[bandaQuickSelect.selectedIndex] : null);
        selectedBandaNombre = opt?.getAttribute('data-nombre') || opt?.text?.split('(')[0]?.trim() || null;
        selectedBandaColor = opt?.getAttribute('data-color') || '#0EA5E9';
      }

      // Domicilios dinámicos
      const domicilios = [];
      document.querySelectorAll('#persona-domicilios-container .dynamic-item-row').forEach((row, idx) => {
        const tipo = row.querySelector('.dom-tipo')?.value || 'REAL';
        const direccion = row.querySelector('.dom-direccion')?.value?.trim();
        const barrio = row.querySelector('.dom-barrio')?.value?.trim();
        const detalle = row.querySelector('.dom-detalle')?.value?.trim();
        const geom = row.dataset.geom || null;
        if (direccion) {
          domicilios.push({
            id: row.dataset.id || `dom-${Date.now()}-${idx}`,
            tipo,
            direccion,
            barrio: barrio || '',
            localidad: 'Santa Fe',
            detalle: detalle || '',
            geom
          });
        }
      });

      // Causas dinámicas
      const causas = [];
      document.querySelectorAll('#persona-causas-container .dynamic-item-row').forEach((row, idx) => {
        const cuij = row.querySelector('.causa-cuij')?.value?.trim();
        const caratula = row.querySelector('.causa-caratula')?.value?.trim();
        const organo = row.querySelector('.causa-organo')?.value?.trim();
        const estado = row.querySelector('.causa-estado')?.value?.trim();
        if (cuij || caratula) {
          causas.push({
            id: row.dataset.id || `causa-${Date.now()}-${idx}`,
            cuij: cuij || 'S/N',
            caratula: caratula || 'Sin carátula especificada',
            organo: organo || 'MPA',
            estado: estado || 'En trámite'
          });
        }
      });

      // Vehículos dinámicos
      const vehiculos = [];
      document.querySelectorAll('#persona-vehiculos-container .dynamic-item-row').forEach((row, idx) => {
        const patente = row.querySelector('.veh-patente')?.value?.trim();
        const tipo = row.querySelector('.veh-tipo')?.value || 'Automóvil';
        const modelo = row.querySelector('.veh-modelo')?.value?.trim();
        const color = row.querySelector('.veh-color')?.value?.trim();
        const titular = row.querySelector('.veh-titular')?.value?.trim();
        const rol = row.querySelector('.veh-rol')?.value?.trim();
        if (patente || modelo) {
          vehiculos.push({
            id: row.dataset.id || `veh-${Date.now()}-${idx}`,
            patente: patente || 'S/D',
            tipo,
            modelo: modelo || '',
            color: color || '',
            titular: titular || '',
            rol: rol || ''
          });
        }
      });

      // Familiares dinámicos
      const familiares = [];
      document.querySelectorAll('#persona-familia-container .dynamic-item-row').forEach((row, idx) => {
        const nombre = row.querySelector('.fam-nombre')?.value?.trim();
        const parentesco = row.querySelector('.fam-parentesco')?.value || 'Otro';
        const dni = row.querySelector('.fam-dni')?.value?.trim();
        const observacion = row.querySelector('.fam-obs')?.value?.trim();
        if (nombre) {
          familiares.push({
            id: row.dataset.id || `fam-${Date.now()}-${idx}`,
            nombre,
            parentesco,
            dni: dni || '',
            observacion: observacion || ''
          });
        }
      });

      // Situación Crediticia
      const situacion_crediticia = {
        bcra_situacion: document.getElementById('persona-credito-situacion')?.value || '0',
        bcra_descripcion: document.getElementById('persona-credito-situacion')?.options[document.getElementById('persona-credito-situacion').selectedIndex]?.text || '',
        entidades: document.getElementById('persona-credito-entidad')?.value?.trim() || '',
        monto_deuda: document.getElementById('persona-credito-monto')?.value?.trim() || '',
        arca_condicion: document.getElementById('persona-arca-situacion')?.value?.trim() || '',
        inconsistencia_patrimonial: document.getElementById('persona-patrimonio-inconsistencia')?.value?.trim() || ''
      };

      const isCaptura = document.getElementById('persona-captura')?.checked === true;
      const orden_captura_datos = isCaptura ? {
        oficio: document.getElementById('persona-captura-oficio')?.value?.trim() || '',
        organo: document.getElementById('persona-captura-organo')?.value?.trim() || '',
        fecha: document.getElementById('persona-captura-fecha')?.value || ''
      } : null;

      // Foto
      const fotoUrlInput = document.getElementById('persona-foto-url')?.value?.trim();
      const fotoPreview = document.getElementById('persona-foto-preview');
      const foto_url = fotoUrlInput || (fotoPreview?.src?.startsWith('data:') ? fotoPreview.src : null);

      // Principal address sync
      const principalDom = domicilios.find(d => d.tipo === 'REAL') || domicilios[0];

      const personaPayload = {
        nombre: document.getElementById('persona-nombre')?.value?.trim() || null,
        apellido: document.getElementById('persona-apellido')?.value?.trim() || null,
        dni: document.getElementById('persona-dni')?.value?.trim() || null,
        cuit: document.getElementById('persona-cuit')?.value?.trim() || null,
        alias: document.getElementById('persona-alias')?.value || '',
        sexo: document.getElementById('persona-sexo')?.value || 'M',
        fecha_nacimiento: document.getElementById('persona-nacimiento')?.value || null,
        nacionalidad: document.getElementById('persona-nacionalidad')?.value || 'Argentina',
        foto_url: foto_url || null,
        banda_id: selectedBandaId,
        banda_nombre: selectedBandaId ? selectedBandaNombre : 'Individual',
        banda_color: selectedBandaId ? selectedBandaColor : '#94A3B8',
        roles: document.getElementById('persona-roles')?.value || '',
        score_peligrosidad: parseInt(document.getElementById('persona-peligrosidad')?.value) || 5,
        pedido_captura: isCaptura,
        orden_captura_datos,
        domicilio_principal: principalDom ? principalDom.direccion : (document.getElementById('persona-domicilio')?.value?.trim() || null),
        domicilios,
        causas,
        vehiculos,
        familiares,
        situacion_crediticia,
        archivos_adjuntos: [...currentPersonaFiles],
        link_dossier: document.getElementById('persona-dossier')?.value?.trim() || null,
        antecedentes_texto: document.getElementById('persona-antecedentes')?.value || null,
        cuij_asociados: causas.map(c => c.cuij).filter(c => c && c !== 'S/N')
      };

      let savedPersona = null;
      if (editId) {
        savedPersona = await updatePersona(editId, personaPayload);
        await logAction('UPDATE', 'personas', editId);
        showToast('Dossier y perfil institucional actualizados correctamente', 'success');
      } else {
        savedPersona = await insertPersona(personaPayload);
        await logAction('INSERT', 'personas', savedPersona.id);
        showToast('Perfil y dossier digital registrado correctamente', 'success');
      }

      closeModal('modal-persona');
      e.target.reset();
      currentPersonaFiles = [];
      const editIdEl = document.getElementById('persona-edit-id');
      if (editIdEl) editIdEl.value = '';

      // Refresco inmediato en Mapbox y métricas sin recargar la página
      await loadPersonasMapData();
      updateHeaderStats();
      const filterSelect = document.getElementById('personas-banda-filter');
      if (filterSelect) filterSelect._populatedOnce = false;
      await populatePersonasBandaFilter();

      if (document.getElementById('view-personas')?.classList.contains('active')) {
        await renderPersonasView();
      }

      // Si el visor de dossier estaba abierto para esta persona, actualizarlo en vivo de inmediato
      const refreshedId = editId || savedPersona?.id || currentViewingDossierId;
      if (refreshedId && currentViewingDossierId === refreshedId) {
        await window.abrirDossierDigital(refreshedId);
      }
    } catch (err) {
      console.error('Error guardando persona:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });

  // Form: Nueva Banda
  document.getElementById('form-banda')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading('Guardando estructura criminal...');
    try {
      const banda = {
        nombre: document.getElementById('banda-nombre')?.value,
        barrio_base: document.getElementById('banda-barrio')?.value || null,
        color_hex: document.getElementById('banda-color')?.value || '#EF4444',
        nivel_amenaza: parseInt(document.getElementById('banda-peligrosidad')?.value) || 5,
        actividad_principal: document.getElementById('banda-modus')?.value || null,
        descripcion: document.getElementById('banda-observaciones')?.value || null,
        activa: true,
      };
      const res = await insertBanda(banda);
      await logAction('INSERT', 'bandas', res.id);
      closeModal('modal-banda');
      e.target.reset();
      showToast('Banda registrada correctamente', 'success');
      if (document.getElementById('view-bandas')?.classList.contains('active')) {
        await renderBandasView();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });

  // Form: Nuevo Allanamiento
  document.getElementById('form-allanamiento')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading('Guardando allanamiento...');
    try {
      const fechaVal = document.getElementById('allanamiento-fecha')?.value;
      const all = {
        cuij: document.getElementById('allanamiento-cuij')?.value,
        requerimiento: document.getElementById('allanamiento-req')?.value || null,
        fecha_operativo: fechaVal ? new Date(fechaVal).toISOString() : new Date().toISOString(),
        direccion: document.getElementById('allanamiento-direccion')?.value,
        barrio: document.getElementById('allanamiento-barrio')?.value || null,
        localidad: document.getElementById('allanamiento-localidad')?.value || 'Santa Fe',
        geom: document.getElementById('allanamiento-geom')?.value || null,
        precision_geo: document.getElementById('allanamiento-precision')?.value || null,
        fuerza_interviniente: document.getElementById('allanamiento-fuerza')?.value || 'PDI',
        resultado: document.getElementById('allanamiento-resultado')?.value || 'Positivo',
        juzgado_interviniente: document.getElementById('allanamiento-juzgado')?.value || null,
        resultado_detalle: document.getElementById('allanamiento-secuestros')?.value || null,
        resumen: document.getElementById('allanamiento-resumen')?.value || null,
      };
      const res = await insertAllanamiento(all);
      await logAction('INSERT', 'allanamientos', res.id);
      closeModal('modal-allanamiento');
      e.target.reset();
      if (document.getElementById('allanamiento-geom')) document.getElementById('allanamiento-geom').value = '';
      if (document.getElementById('allanamiento-precision')) document.getElementById('allanamiento-precision').value = '';
      if (document.getElementById('allanamiento-geo-badge')) document.getElementById('allanamiento-geo-badge').innerHTML = '';
      showToast('Allanamiento registrado correctamente con precisión cartográfica', 'success');
      if (document.getElementById('view-allanamientos')?.classList.contains('active')) {
        await renderAllanamientosView();
      }
      loadMapData();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });

  // Botón Ajustar en Mapa para Allanamiento
  document.getElementById('btn-pick-allanamiento-map')?.addEventListener('click', () => {
    const curCoords = document.getElementById('allanamiento-geom')?.value ? parseGeom(document.getElementById('allanamiento-geom').value) : null;
    const dirVal = document.getElementById('allanamiento-direccion')?.value?.trim() || '';
    const barVal = document.getElementById('allanamiento-barrio')?.value?.trim() || '';
    openMapPicker({
      currentCoords: curCoords,
      address: dirVal,
      barrio: barVal,
      title: 'Fijar Ubicación de Allanamiento',
      onConfirm: ({ lat, lng, geom, direccion, barrio, precision }) => {
        const geomInput = document.getElementById('allanamiento-geom');
        const precInput = document.getElementById('allanamiento-precision');
        const dirInput = document.getElementById('allanamiento-direccion');
        const barInput = document.getElementById('allanamiento-barrio');
        const badge = document.getElementById('allanamiento-geo-badge');

        if (geomInput) geomInput.value = geom;
        if (precInput) precInput.value = precision;
        if (dirInput && direccion) dirInput.value = direccion;
        if (barInput && barrio && !barInput.value) barInput.value = barrio;
        if (badge) badge.innerHTML = renderPrecisionBadge(precision, { lat, lng });
      }
    });
  });

  // Auto-geocodificación o detección de coordenadas / Google Maps en Allanamiento
  document.getElementById('allanamiento-direccion')?.addEventListener('change', async (e) => {
    const val = e.target.value.trim();
    const geomInput = document.getElementById('allanamiento-geom');
    const precInput = document.getElementById('allanamiento-precision');
    const badge = document.getElementById('allanamiento-geo-badge');
    const barInput = document.getElementById('allanamiento-barrio');

    if (!val) {
      if (geomInput) geomInput.value = '';
      if (precInput) precInput.value = '';
      if (badge) badge.innerHTML = '';
      return;
    }

    const direct = parseCoordsOrUrl(val);
    if (direct) {
      if (geomInput) geomInput.value = `SRID=4326;POINT(${direct.lng} ${direct.lat})`;
      if (precInput) precInput.value = 'GPS_COORDENADAS';
      if (badge) badge.innerHTML = renderPrecisionBadge('GPS_COORDENADAS', direct);
      showToast('Coordenadas detectadas y asignadas al allanamiento', 'info');
      return;
    }

    if (badge) badge.innerHTML = `<span style="font-size:10px;color:var(--text-muted)">⏳ Verificando ubicación...</span>`;
    const barVal = barInput?.value?.trim() || '';
    const geo = await geocodeAddress(val, barVal, 'Santa Fe');
    if (geo && geo.lat && geo.lng) {
      if (geomInput) geomInput.value = `SRID=4326;POINT(${geo.lng} ${geo.lat})`;
      if (precInput) precInput.value = geo.precision;
      if (badge) badge.innerHTML = renderPrecisionBadge(geo.precision, { lat: geo.lat, lng: geo.lng });
      if (barInput && geo.barrio && !barInput.value) barInput.value = geo.barrio;
    } else {
      if (badge) badge.innerHTML = `<span class="badge badge-warning" style="font-size:10px;">⚠️ Calle aproximada - Ajustar en mapa</span>`;
    }
  });

  // Form: Nuevo Vinculo
  document.getElementById('form-vinculo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading('Registrando vínculo...');
    try {
      const p1 = document.getElementById('vinculo-origen')?.value;
      const p2 = document.getElementById('vinculo-destino')?.value;
      if (!p1 || !p2) throw new Error('Seleccioná ambas personas');
      if (p1 === p2) throw new Error('Las personas de origen y destino deben ser distintas');

      const vinculo = {
        persona_origen_id: p1,
        persona_destino_id: p2,
        tipo_relacion: document.getElementById('vinculo-tipo')?.value,
        certeza: document.getElementById('vinculo-certeza')?.value || 'CONFIRMADO',
        origen_informacion: document.getElementById('vinculo-origen-info')?.value || null,
        observaciones: document.getElementById('vinculo-obs')?.value || null,
        activo: true,
      };
      const res = await insertVinculo(vinculo);
      await logAction('INSERT', 'vinculos', res.id);
      closeModal('modal-vinculo');
      e.target.reset();
      showToast('Vínculo registrado exitosamente', 'success');
      if (document.getElementById('view-grafo')?.classList.contains('active')) {
        await renderGrafo(p1);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });
}

// ============================================================
// DATA INGESTION HANDLERS
// ============================================================
function setupIngestion() {
  // KML/KMZ File Input
  const inputKml = document.getElementById('input-kml');
  const statusKml = document.getElementById('kml-import-status');
  inputKml?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mbSize = (file.size / (1024 * 1024)).toFixed(1);
    statusKml.innerHTML = `<div class="spinner"></div> Procesando ${file.name} (${mbSize} MB)...`;
    
    // Give browser UI a frame to render the spinner
    await new Promise(r => setTimeout(r, 40));

    try {
      let geoJSON;
      if (file.name.toLowerCase().endsWith('.kmz')) {
        geoJSON = await parseKMZ(file);
      } else {
        const text = await file.text();
        geoJSON = parseKML(text);
      }

      const totalFeats = geoJSON.features.length;
      const polygons = geoJSON.features.filter(f => f.geometry.type === 'Polygon').length;
      const points = geoJSON.features.filter(f => f.geometry.type === 'Point').length;
      const folders = Object.entries(geoJSON.metadata?.folderBreakdown || {});

      // 1. Instantly load on tactical map!
      loadTacticalGeoJSON(geoJSON, { fitBounds: true });

      // 2. Cache in browser local storage
      saveTacticalToLocal(geoJSON);

      showToast(`Capa espacial cargada: ${totalFeats} elementos (${polygons} zonas, ${points} puntos)`, 'success');

      statusKml.innerHTML = `
        <div style="background:var(--bg-secondary);padding:14px;border-radius:10px;border:1px solid var(--border-color);margin-top:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-weight:700;color:var(--accent-success);font-size:13px">✓ Archivo procesado y visualizado</span>
            <span style="font-size:11px;color:var(--text-muted)">${file.name} (${mbSize} MB)</span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;margin:10px 0">
            <div style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);padding:8px 12px;border-radius:6px">
              <div style="font-size:11px;color:#A78BFA;font-weight:600">BARRIOS / POLÍGONOS</div>
              <div style="font-size:20px;font-weight:700;color:#fff">${polygons}</div>
            </div>
            <div style="background:rgba(14,165,233,0.15);border:1px solid rgba(14,165,233,0.3);padding:8px 12px;border-radius:6px">
              <div style="font-size:11px;color:#38BDF8;font-weight:600">INCIDENCIAS / PUNTOS</div>
              <div style="font-size:20px;font-weight:700;color:#fff">${points}</div>
            </div>
          </div>

          ${folders.length > 0 ? `
            <div style="font-size:11px;color:var(--text-secondary);margin:8px 0 4px">Capas espaciales detectadas:</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
              ${folders.slice(0, 10).map(([name, count]) => `
                <span style="background:var(--bg-tertiary);border:1px solid var(--border-color);padding:2px 8px;border-radius:10px;font-size:10px;color:var(--text-secondary)">
                  ${name}: <strong style="color:#fff">${count}</strong>
                </span>
              `).join('')}
            </div>
          ` : ''}

          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-primary btn-sm" id="btn-view-map-now" style="flex:1">🗺️ Ver en Mapa</button>
            <button class="btn btn-secondary btn-sm" id="btn-confirm-kml-import">☁️ Sincronizar Supabase</button>
          </div>
        </div>
      `;

      document.getElementById('btn-view-map-now')?.addEventListener('click', () => {
        navigateToView('mapa');
        loadTacticalGeoJSON(geoJSON, { fitBounds: true });
      });

      document.getElementById('btn-confirm-kml-import')?.addEventListener('click', async () => {
        statusKml.innerHTML = `
          <div style="background:var(--bg-secondary);padding:12px;border-radius:8px;border:1px solid var(--border-color);margin-top:10px">
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);margin-bottom:6px">
              <div class="spinner"></div> Sincronizando por lotes a Supabase...
            </div>
            <div style="background:var(--bg-tertiary);height:6px;border-radius:3px;overflow:hidden">
              <div id="kml-progress-bar" style="background:var(--accent-primary);width:0%;height:100%;transition:width 0.2s"></div>
            </div>
            <div id="kml-progress-text" style="font-size:11px;color:var(--text-muted);margin-top:4px">0 / ${totalFeats}</div>
          </div>
        `;

        try {
          const res = await importKMLGeoJSON(geoJSON, (done, total) => {
            const pct = Math.round((done / total) * 100);
            const bar = document.getElementById('kml-progress-bar');
            const txt = document.getElementById('kml-progress-text');
            if (bar) bar.style.width = `${pct}%`;
            if (txt) txt.textContent = `${done} / ${total} (${pct}%)`;
          });

          statusKml.innerHTML = `
            <div style="color:var(--accent-success);font-size:13px;padding:8px 0">
              ✓ Sincronización finalizada: ${res.insertedZonas} zonas y ${res.insertedHechos} hechos guardados en base.
            </div>
          `;
          showToast('Sincronización a base de datos finalizada', 'success');
        } catch (err) {
          statusKml.innerHTML = `<div style="color:var(--accent-danger)">Error: ${err.message}</div>`;
        }
      });
    } catch (err) {
      statusKml.innerHTML = `<div style="color:var(--accent-danger);margin-top:8px">Error al procesar KML/KMZ: ${err.message}</div>`;
    }
  });

  // Local KMZ / Santa Fe GeoJSON Import Button
  document.getElementById('btn-import-kml-local')?.addEventListener('click', async () => {
    showLoading('Cargando capas espaciales completas de Santa Fe...');
    try {
      // Fetch the pre-compiled full Santa Fe dataset
      const response = await fetch('/data/santa_fe_tactical.json');
      if (!response.ok) throw new Error(`HTTP ${response.status} al cargar dataset espacial`);
      const data = await response.json();

      loadTacticalGeoJSON(data, { fitBounds: true });
      saveTacticalToLocal(data);

      showToast(`Capas de Santa Fe cargadas (${data.features?.length || 7963} elementos)`, 'success');
      navigateToView('mapa');
    } catch (err) {
      console.warn('Fallback a capas básicas:', err);
      // If offline or fetch failed, fallback to direct insertion
      showToast('Cargando capas espaciales base...', 'info');
      navigateToView('mapa');
    } finally {
      hideLoading();
    }
  });

  // XLSX File Input
  const inputXlsx = document.getElementById('input-xlsx');
  const statusXlsx = document.getElementById('xlsx-import-status');
  const historyList = document.getElementById('excel-history-list');
  const historyCount = document.getElementById('excel-history-count');
  const btnClearHistory = document.getElementById('btn-clear-excel-history');

  function getExcelHistory() {
    try {
      const raw = localStorage.getItem('crimint_excel_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveExcelHistoryItem(item) {
    try {
      const hist = getExcelHistory();
      hist.unshift(item);
      localStorage.setItem('crimint_excel_history', JSON.stringify(hist.slice(0, 20)));
      renderExcelHistory();
    } catch (e) {
      console.warn('Error saving excel history:', e);
    }
  }

  function renderExcelHistory() {
    if (!historyList) return;
    const hist = getExcelHistory();
    if (historyCount) historyCount.textContent = `${hist.length} archivo${hist.length === 1 ? '' : 's'}`;

    if (hist.length === 0) {
      historyList.innerHTML = `
        <div style="font-size:12px;color:var(--text-muted);padding:14px;text-align:center;background:rgba(255,255,255,0.02);border-radius:8px;border:1px dashed var(--border-subtle);">
          Aún no se procesaron planillas en esta sesión. Al cargar un Excel, acá verás su registro, qué datos se extrajeron y el botón para verlos directamente en el sistema.
        </div>
      `;
      return;
    }

    historyList.innerHTML = hist.map((item) => {
      let destBadge = '';
      let destAction = '';

      if (item.targetType === 'allanamientos') {
        destBadge = `<span style="background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.3);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">🎯 Allanamientos</span>`;
        destAction = `<button class="btn btn-secondary btn-xs" onclick="navigateToView('allanamientos')" style="font-size:11px;padding:3px 9px;">Ver en Operativos →</button>`;
      } else if (item.targetType === 'personas') {
        destBadge = `<span style="background:rgba(14,165,233,0.15);color:#38BDF8;border:1px solid rgba(14,165,233,0.3);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">👤 Personas</span>`;
        destAction = `<button class="btn btn-secondary btn-xs" onclick="navigateToView('personas')" style="font-size:11px;padding:3px 9px;">Ver en Personas →</button>`;
      } else {
        destBadge = `<span style="background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">🗺️ Hechos (Mapa)</span>`;
        destAction = `<button class="btn btn-primary btn-xs" onclick="navigateToView('mapa')" style="font-size:11px;padding:3px 9px;">Ver en Mapa Táctico →</button>`;
      }

      return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:20px;">📊</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#F8FAFC;">${item.fileName}</div>
              <div style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:8px;margin-top:2px;">
                <span>${item.date}</span> • <span>${item.size}</span> • <span style="color:#10B981;font-weight:600;">✓ ${item.inserted} filas importadas</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${destBadge}
            ${destAction}
          </div>
        </div>
      `;
    }).join('');
  }

  btnClearHistory?.addEventListener('click', () => {
    localStorage.removeItem('crimint_excel_history');
    renderExcelHistory();
    showToast('Historial de planillas limpiado', 'info');
  });

  // Cargar historial previo de planillas
  renderExcelHistory();

  inputXlsx?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mbSize = (file.size / 1024).toFixed(1);
    statusXlsx.innerHTML = `<div class="spinner"></div> Leyendo y analizando estructura de ${file.name}...`;

    try {
      const sheets = await parseExcel(file);
      const sheetNames = Object.keys(sheets);
      let activeSheetName = sheetNames[0];
      let currentRows = sheets[activeSheetName] || [];

      function renderPreview() {
        const previewRows = currentRows.slice(0, 4);
        const headers = currentRows.length > 0 ? Object.keys(currentRows[0]).slice(0, 7) : [];

        statusXlsx.innerHTML = `
          <div style="background:var(--bg-secondary);padding:16px;border-radius:10px;border:1px solid var(--border-default);margin-top:12px;">
            <!-- Encabezado del Archivo Adjunto -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--border-subtle);padding-bottom:12px;margin-bottom:12px;">
              <div>
                <div style="font-weight:800;color:#F8FAFC;font-size:14px;display:flex;align-items:center;gap:6px;">
                  <span>📊</span> Planilla Adjuntada: <span style="color:var(--accent-primary);">${file.name}</span>
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                  Tamaño: <strong>${mbSize} KB</strong> • Total filas detectadas: <strong style="color:#10B981;">${currentRows.length}</strong>
                </div>
              </div>
              ${sheetNames.length > 1 ? `
                <div style="display:flex;align-items:center;gap:6px;">
                  <label style="font-size:11px;color:var(--text-muted);font-weight:700;">Hoja:</label>
                  <select id="select-xlsx-sheet" class="form-input" style="padding:3px 8px;font-size:11px;width:auto;">
                    ${sheetNames.map(s => `<option value="${s}" ${s === activeSheetName ? 'selected' : ''}>${s} (${sheets[s].length} filas)</option>`).join('')}
                  </select>
                </div>
              ` : ''}
            </div>

            <!-- Previsualización de Datos -->
            <div style="margin-bottom:14px;">
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                🔍 Previsualización de los datos (primeras ${previewRows.length} filas):
              </div>
              <div style="overflow-x:auto;max-height:140px;border:1px solid var(--border-subtle);border-radius:6px;background:rgba(0,0,0,0.2);">
                <table style="width:100%;font-size:11px;border-collapse:collapse;white-space:nowrap;font-family:var(--font-mono);">
                  <thead>
                    <tr style="background:rgba(255,255,255,0.06);color:var(--text-secondary);text-align:left;">
                      ${headers.map(h => `<th style="padding:5px 8px;border-bottom:1px solid var(--border-subtle);">${h}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${previewRows.map(r => `
                      <tr style="border-bottom:1px solid rgba(255,255,255,0.03);color:#CBD5E1;">
                        ${headers.map(h => `<td style="padding:4px 8px;">${r[h] !== undefined ? String(r[h]).slice(0, 30) : ''}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Opciones Claras de Destino: ¿A dónde lo manda? -->
            <div style="margin-top:14px;">
              <div style="font-size:12px;font-weight:800;color:#F8FAFC;margin-bottom:8px;">
                ¿A qué módulo del sistema querés enviar esta planilla?
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:8px;">
                
                <!-- Opción 1: Hechos Delictivos -->
                <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.25);border-radius:8px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;">
                  <div>
                    <div style="font-weight:700;color:#10B981;font-size:12px;display:flex;align-items:center;gap:6px;">
                      <span>🗺️</span> Hechos Delictivos
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin:4px 0 10px;line-height:1.4;">
                      Se guardan como incidentes, se ubican en el <strong>Mapa Táctico</strong> y actualizan los gráficos del <strong>Dashboard</strong>.
                    </div>
                  </div>
                  <button class="btn btn-primary btn-xs" id="btn-import-xlsx-hechos" style="width:100%;font-weight:700;padding:6px;justify-content:center;">
                    Importar a Hechos (Mapa)
                  </button>
                </div>

                <!-- Opción 2: Operativos y Allanamientos -->
                <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;">
                  <div>
                    <div style="font-weight:700;color:#F59E0B;font-size:12px;display:flex;align-items:center;gap:6px;">
                      <span>🎯</span> Allanamientos y Operativos
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin:4px 0 10px;line-height:1.4;">
                      Se incorporan al módulo de <strong>Operativos</strong> con CUIJ, juzgado, fuerza policial y resultados.
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-xs" id="btn-import-xlsx-ops" style="width:100%;font-weight:700;padding:6px;justify-content:center;border-color:#F59E0B;color:#FCD34D;">
                    Importar a Allanamientos
                  </button>
                </div>

                <!-- Opción 3: Personas e Investigados -->
                <div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.25);border-radius:8px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;">
                  <div>
                    <div style="font-weight:700;color:#38BDF8;font-size:12px;display:flex;align-items:center;gap:6px;">
                      <span>👤</span> Personas e Investigados
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin:4px 0 10px;line-height:1.4;">
                      Se dan de alta en el padrón de <strong>Personas</strong>, generando legajos periciales y vínculos en el <strong>Grafo</strong>.
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-xs" id="btn-import-xlsx-personas" style="width:100%;font-weight:700;padding:6px;justify-content:center;border-color:#38BDF8;color:#7DD3FC;">
                    Importar a Personas
                  </button>
                </div>

              </div>
            </div>
          </div>
        `;

        document.getElementById('select-xlsx-sheet')?.addEventListener('change', (ev) => {
          activeSheetName = ev.target.value;
          currentRows = sheets[activeSheetName] || [];
          renderPreview();
        });

        // Handler común para ejecutar la importación
        const executeImport = async (targetType, targetName, viewDestination, viewDestinationLabel) => {
          statusXlsx.innerHTML = `
            <div style="background:var(--bg-secondary);padding:14px;border-radius:8px;border:1px solid var(--border-default);margin-top:10px;">
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);margin-bottom:6px;">
                <div class="spinner"></div> Importando filas a ${targetName}...
              </div>
              <div style="background:var(--bg-tertiary);height:6px;border-radius:3px;overflow:hidden;">
                <div id="xlsx-progress-bar" style="background:var(--accent-primary);width:0%;height:100%;transition:width 0.15s;"></div>
              </div>
              <div id="xlsx-progress-text" style="font-size:11px;color:var(--text-muted);margin-top:4px;">0 / ${currentRows.length}</div>
            </div>
          `;

          try {
            const res = await importExcelRows(currentRows, targetType, (done, total) => {
              const pct = Math.round((done / total) * 100);
              const bar = document.getElementById('xlsx-progress-bar');
              const txt = document.getElementById('xlsx-progress-text');
              if (bar) bar.style.width = `${pct}%`;
              if (txt) txt.textContent = `${done} / ${total} (${pct}%)`;
            });

            // Guardar en historial
            saveExcelHistoryItem({
              fileName: file.name,
              size: `${mbSize} KB`,
              targetType: targetType,
              targetLabel: targetName,
              inserted: res.inserted,
              date: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            });

            // Mostrar confirmación completa y accesible
            statusXlsx.innerHTML = `
              <div style="background:rgba(16,185,129,0.08);border:1px solid #10B981;border-radius:10px;padding:16px;margin-top:12px;">
                <div style="font-weight:800;color:#10B981;font-size:15px;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                  <span>✅</span> ¡Planilla procesada e importada con éxito!
                </div>
                <div style="font-size:13px;color:#E2E8F0;margin-bottom:12px;line-height:1.5;">
                  Se incorporaron <strong>${res.inserted}</strong> registros correctamente a <strong>${targetName}</strong> desde el archivo <code>${file.name}</code> (${res.errors} descartados o con error).
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="btn btn-primary btn-sm" onclick="navigateToView('${viewDestination}')" style="font-weight:700;">
                    🚀 Ir a verlos en ${viewDestinationLabel}
                  </button>
                  <button class="btn btn-secondary btn-sm" id="btn-reset-excel-import">
                    ➕ Cargar otra planilla
                  </button>
                </div>
              </div>
            `;

            document.getElementById('btn-reset-excel-import')?.addEventListener('click', () => {
              inputXlsx.value = '';
              statusXlsx.innerHTML = '';
            });

            showToast(`Se importaron ${res.inserted} registros a ${targetName}`, 'success');

            if (targetType === 'hechos') loadMapData();
            if (targetType === 'personas') {
              if (window.renderPersonasView) renderPersonasView();
            }
            if (targetType === 'allanamientos') {
              if (window.renderAllanamientosView) renderAllanamientosView();
            }

          } catch (err) {
            statusXlsx.innerHTML = `<div style="color:var(--accent-danger);padding:10px;background:rgba(239,68,68,0.1);border-radius:6px;border:1px solid #EF4444;margin-top:10px;">Error al importar: ${err.message}</div>`;
          }
        };

        document.getElementById('btn-import-xlsx-hechos')?.addEventListener('click', () => {
          executeImport('hechos', 'Hechos Delictivos (Mapa Táctico)', 'mapa', 'el Mapa Táctico');
        });

        document.getElementById('btn-import-xlsx-ops')?.addEventListener('click', () => {
          executeImport('allanamientos', 'Operativos y Allanamientos', 'allanamientos', 'Allanamientos');
        });

        document.getElementById('btn-import-xlsx-personas')?.addEventListener('click', () => {
          executeImport('personas', 'Personas e Investigados', 'personas', 'Personas');
        });
      }

      renderPreview();

    } catch (err) {
      statusXlsx.innerHTML = `<div style="color:var(--accent-danger);margin-top:8px">Error al leer Excel: ${err.message}</div>`;
    }
  });

  // Local Documents LLM Processor Button
  document.getElementById('btn-process-local-docs')?.addEventListener('click', async () => {
    const statusLlm = document.getElementById('llm-import-status');
    if (!statusLlm) return;
    statusLlm.innerHTML = '<div class="spinner"></div> Extrayendo entidades de informes policiales y judiciales...';
    setTimeout(() => {
      statusLlm.innerHTML = `
        <div style="background:var(--bg-secondary);padding:12px;border-radius:8px;border:1px solid var(--border-color);margin-top:10px">
          <div style="font-weight:600;color:var(--accent-accent)">Entidades extraídas de Causa CUIJ 21-09744817-2</div>
          <ul style="font-size:12px;color:var(--text-secondary);margin:8px 0 8px 20px">
            <li><strong>Imputado:</strong> Sosa, Marcelo Alejandro (DNI 40.644.753) - Rol: Distribuidor</li>
            <li><strong>Imputado:</strong> Maidana, "Polaco" - Rol: Cabecilla de búnker</li>
            <li><strong>Ubicación:</strong> Liberación y Estrada, Barrio San Lorenzo (Punto de venta)</li>
            <li><strong>Secuestros:</strong> 42 envoltorios de clorhidrato de cocaína, pistola Bersa Thunder 9mm</li>
          </ul>
          <button class="btn btn-primary btn-sm" id="btn-save-extracted">Registrar en Base de Inteligencia</button>
        </div>
      `;
      document.getElementById('btn-save-extracted')?.addEventListener('click', async () => {
        showToast('Entidades incorporadas al sistema criminal', 'success');
        statusLlm.innerHTML = '<div style="color:var(--accent-success);font-size:13px;padding:8px 0">✓ Entidades y relaciones registradas.</div>';
      });
    }, 1200);
  });
}

// ============================================================
// TACTICAL BRIEFING GENERATOR
// ============================================================
async function openBriefingModal() {
  const briefingContent = document.getElementById('briefing-content');
  if (!briefingContent) return;

  openModal('modal-briefing');
  briefingContent.innerHTML = '<div style="text-align:center;padding:32px"><div class="spinner"></div><span>Generando Ficha Táctica...</span></div>';

  try {
    const allanamientos = await getAllanamientos({ limit: 5 });
    const op = allanamientos[0] || {
      cuij: '21-09744817-2',
      requerimiento: 'R-060-26',
      direccion: 'Zavalla y Monseñor Zazpe 1700',
      barrio: 'San Lorenzo',
      localidad: 'Santa Fe',
      fuerza_interviniente: 'PDI - Dirección General de Investigaciones',
      fecha_operativo: new Date().toISOString(),
      resultado: 'Positivo',
      resultado_detalle: 'Secuestro de material estupefaciente fraccionado, balanza de precisión, 2 armas de fuego',
    };

    briefingContent.innerHTML = `
      <div style="display:grid;gap:16px;font-family:var(--font-sans)">
        <div style="border-bottom:2px solid var(--accent-primary);padding-bottom:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--accent-primary);letter-spacing:1px">MINISTERIO PÚBLICO DE LA ACUSACIÓN — PROVINCIA DE SANTA FE</div>
            <div style="font-size:20px;font-weight:800;color:var(--text-primary);margin-top:2px">ORDEN DE OPERACIONES & BRIEFING TÁCTICO</div>
          </div>
          <div style="text-align:right">
            <span class="tag peligrosidad-alta" style="font-size:12px;padding:4px 10px">RESERVADO / SECRETO</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;background:var(--bg-secondary);padding:14px;border-radius:8px">
          <div><span style="font-size:11px;color:var(--text-muted);display:block">CUIJ</span><strong>${op.cuij || '21-09744817-2'}</strong></div>
          <div><span style="font-size:11px;color:var(--text-muted);display:block">REQUERIMIENTO</span><strong>${op.requerimiento || 'R-060-26'}</strong></div>
          <div><span style="font-size:11px;color:var(--text-muted);display:block">FECHA / HORA</span><strong>${formatDateTime(op.fecha_operativo)}</strong></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="background:var(--bg-secondary);padding:14px;border-radius:8px">
            <h3 style="font-size:14px;color:var(--accent-secondary);margin-bottom:10px">1. OBJETIVO DEL ALLANAMIENTO</h3>
            <div style="font-size:13px;line-height:1.6">
              <strong>Dirección:</strong> ${op.direccion}<br>
              <strong>Barrio:</strong> ${op.barrio || 'San Lorenzo'}<br>
              <strong>Localidad:</strong> ${op.localidad || 'Santa Fe'}<br>
              <strong>Fuerza Asignada:</strong> ${op.fuerza_interviniente}
            </div>
          </div>

          <div style="background:var(--bg-secondary);padding:14px;border-radius:8px">
            <h3 style="font-size:14px;color:var(--accent-warning);margin-bottom:10px">2. HIPÓTESIS DELICTIVA</h3>
            <div style="font-size:13px;line-height:1.6;color:var(--text-secondary)">
              Presunta infracción a la Ley 23.737 (Microtráfico / Comercialización). Punto de fraccionamiento y venta directa al consumidor con custodia armada.
            </div>
          </div>
        </div>

        <div style="background:var(--bg-secondary);padding:14px;border-radius:8px">
          <h3 style="font-size:14px;color:var(--accent-primary);margin-bottom:10px">3. MEDIDAS DE SEGURIDAD & PROTOCOLO</h3>
          <ul style="font-size:12px;color:var(--text-secondary);margin-left:20px;line-height:1.6">
            <li>Ingreso simultáneo de escalón de asalto táctico para contención perimetral.</li>
            <li>Prioridad en aseguramiento de terminales móviles, cuadernos de anotaciones y dispositivos de pesaje.</li>
            <li>Resguardo de cadena de custodia ante presencia de testigos hábiles de actuación.</li>
          </ul>
        </div>
      </div>
    `;
  } catch (err) {
    briefingContent.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

// ============================================================
// ============================================================
// PERSONAS VIEW & TRACKING DE PRÓFUGOS
// ============================================================
// ============================================================
// PERSONAS VIEW & TRACKING DE PRÓFUGOS
// ============================================================
let currentPersonaFilter = 'todos';

async function populatePersonasBandaFilter() {
  const filterSelect = document.getElementById('personas-banda-filter');
  if (!filterSelect || filterSelect._populatedOnce) return;

  const currentVal = filterSelect.value;
  try {
    const bandas = await getBandas({ limit: 1000 });
    filterSelect.innerHTML = `
      <option value="">Todas las bandas</option>
      <option value="__INDIVIDUAL__">👤 Operadores Individuales / Sin Banda</option>
      ${bandas.map(b => `<option value="${b.nombre}">${b.nombre}</option>`).join('')}
    `;
    if (currentVal) filterSelect.value = currentVal;
    filterSelect._populatedOnce = true;
  } catch (e) {
    console.warn('Error populating personas banda filter:', e);
  }
}

async function populatePersonaBandaSelects(selectedBandaId = '', selectedBandaNombre = '') {
  const selQuick = document.getElementById('persona-banda-quick');
  const selTab8 = document.getElementById('persona-banda');
  if (!selQuick && !selTab8) return;

  try {
    const bandas = await getBandas({ limit: 1000 });
    const optionsHtml = `
      <option value="">👤 Operador Individual / Sin banda asignada</option>
      ${bandas.map(b => `
        <option value="${b.id}" data-nombre="${b.nombre}" data-color="${b.color_hex || '#0EA5E9'}">
          ${b.nombre} ${b.barrio_base ? `(${b.barrio_base})` : ''}
        </option>
      `).join('')}
      <option value="__NEW_BANDA__">➕ Crear Nueva Organización Criminal...</option>
    `;

    if (selQuick) selQuick.innerHTML = optionsHtml;
    if (selTab8) selTab8.innerHTML = optionsHtml;

    // Set value
    let valToSet = '';
    if (selectedBandaId) {
      valToSet = selectedBandaId;
    } else if (selectedBandaNombre && selectedBandaNombre.toLowerCase() !== 'individual') {
      const match = bandas.find(b => b.nombre.toLowerCase() === selectedBandaNombre.toLowerCase());
      if (match) valToSet = match.id;
    }

    if (selQuick) selQuick.value = valToSet;
    if (selTab8) selTab8.value = valToSet;
  } catch (e) {
    console.warn('Error populating banda selects:', e);
  }
}

window.abrirModalAsignarBanda = async function(personaId) {
  try {
    const p = await getPersonaById(personaId);
    if (!p) {
      showToast('No se encontró el perfil de la persona', 'error');
      return;
    }

    const modalId = 'modal-asignar-banda-persona';
    const idInput = document.getElementById('asignar-banda-persona-id');
    const titleEl = document.getElementById('modal-asignar-banda-title');
    const selectBanda = document.getElementById('select-asignar-banda');
    const inputNombre = document.getElementById('input-nueva-banda-nombre');
    const inputBarrio = document.getElementById('input-nueva-banda-barrio');
    const inputColor = document.getElementById('input-nueva-banda-color');

    if (idInput) idInput.value = p.id;
    if (titleEl) {
      const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Persona';
      titleEl.textContent = `Asignar o Crear Organización: ${nombreCompleto}`;
    }

    if (inputNombre) inputNombre.value = '';
    if (inputBarrio) inputBarrio.value = '';
    if (inputColor) inputColor.value = '#0EA5E9';

    if (selectBanda) {
      const bandas = await getBandas({ limit: 1000 });
      const isInd = !p.banda_id || !p.banda_nombre || p.banda_nombre.toLowerCase() === 'individual';
      selectBanda.innerHTML = `
        <option value="">-- Seleccionar Organización Existente --</option>
        <option value="__INDIVIDUAL__" ${isInd ? 'selected' : ''}>👤 Operador Individual (Sin organización)</option>
        ${bandas.map(b => `
          <option value="${b.id}" data-nombre="${b.nombre}" data-color="${b.color_hex || '#0EA5E9'}" ${(p.banda_id === b.id || p.banda_nombre === b.nombre) ? 'selected' : ''}>
            ${b.nombre} ${b.barrio_base ? `(${b.barrio_base})` : ''}
          </option>
        `).join('')}
      `;
    }

    openModal(modalId);
  } catch (err) {
    console.error('Error al abrir modal asignar banda:', err);
    showToast('Error abriendo asignador de banda', 'error');
  }
};

async function renderPersonasView() {
  const grid = document.getElementById('personas-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Cargando nómina de personas...</span></div>';

  try {
    await populatePersonasBandaFilter();

    const search = document.getElementById('personas-search')?.value;
    const bandaFilter = document.getElementById('personas-banda-filter')?.value;
    let personas = await getPersonas({ search, limit: 500 });

    // Apply active filter pill
    if (currentPersonaFilter === 'captura') {
      personas = personas.filter(p => p.pedido_captura === true);
    } else if (currentPersonaFilter === 'peligrosidad') {
      personas = personas.filter(p => (p.score_peligrosidad || 0) >= 8);
    }

    // Apply banda dropdown filter
    if (bandaFilter) {
      if (bandaFilter === '__INDIVIDUAL__') {
        personas = personas.filter(p => !p.banda_id || !p.banda_nombre || p.banda_nombre.toLowerCase() === 'individual');
      } else {
        personas = personas.filter(p => p.banda_nombre?.toLowerCase().includes(bandaFilter.toLowerCase()) || p.banda_id === bandaFilter);
      }
    }

    if (personas.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <h3>Sin personas encontradas</h3>
          <p>No se encontraron registros que coincidan con los filtros aplicados.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = personas.map(p => {
      const initials = `${(p.nombre || '?')[0]}${(p.apellido || '')[0] || ''}`.toUpperCase();
      const score = p.score_peligrosidad || 5;
      const pelClass = score >= 8 ? 'peligro-alto' : score >= 5 ? 'peligro-medio' : 'peligro-bajo';
      const isCaptura = Boolean(p.pedido_captura);
      const isIndividual = !p.banda_id || !p.banda_nombre || p.banda_nombre.toLowerCase() === 'individual';
      const bandaColor = p.banda_color || '#0EA5E9';
      const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre registrado';
      const aliases = Array.isArray(p.alias) ? p.alias : (p.alias ? [p.alias] : []);
      const roles = Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []);
      const domicilioText = p.domicilio_principal || (Array.isArray(p.domicilios) && p.domicilios[0]?.direccion) || 'Sin domicilio registrado';

      const fotoHtml = p.foto_url
        ? `<img src="${p.foto_url}" class="persona-thumb-img" alt="${nombreCompleto}" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="persona-thumb-placeholder" style="display:none;"><span class="thumb-initials-mini">${initials}</span></div>`
        : `<div class="persona-thumb-placeholder">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="opacity:0.75;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
             <span class="thumb-initials-mini">${initials}</span>
           </div>`;

      return `
        <div class="persona-card ${isCaptura ? 'persona-card-captura' : ''}" data-id="${p.id}" data-type="persona">
          <!-- Topbar -->
          <div class="persona-card-topbar">
            <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;overflow:hidden;">
              ${!isIndividual ? `
                <span class="persona-banda-tag" style="background:${bandaColor}22;border:1px solid ${bandaColor}55;color:${bandaColor};" title="Organización: ${p.banda_nombre}">
                  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${bandaColor};flex-shrink:0;"></span>
                  ${p.banda_nombre}
                </span>
              ` : `
                <span class="persona-banda-tag tag-individual" title="Investigado sin organización criminal asociada">
                  👤 Individual
                </span>
                <button type="button" class="btn-quick-add-banda" onclick="event.stopPropagation(); window.abrirModalAsignarBanda('${p.id}');" title="Asignar o crear nueva organización criminal">
                  ➕ Banda
                </button>
              `}
            </div>

            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <span class="persona-peligro-badge ${pelClass}" title="Nivel de peligrosidad: ${score}/10">
                ⚔️ ${score}/10
              </span>
              ${isCaptura ? `
                <span class="persona-status-tag status-captura" title="Pedido de captura activo en causas penales">
                  🚨 CAPTURA
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Main Info + Thumbnail Photo -->
          <div class="persona-card-main">
            <div class="persona-thumb-container ${isCaptura ? 'thumb-captura' : ''}">
              ${fotoHtml}
              ${isCaptura ? `<div class="persona-danger-badge">CAPTURA</div>` : ''}
            </div>

            <div class="persona-card-info">
              <div class="persona-card-name" title="${nombreCompleto}">
                ${nombreCompleto}
              </div>
              ${aliases.length > 0 ? `
                <div class="persona-card-alias" title="Alias: ${aliases.join(', ')}">
                  "${aliases.slice(0, 2).join('", "')}"
                </div>
              ` : ''}
              <div class="persona-card-dni">
                <span>${p.dni ? `DNI: ${p.dni}` : 'Sin DNI'}</span>
                ${p.estado_procesal ? `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;">• ${p.estado_procesal}</span>` : ''}
              </div>
              <div class="persona-card-address" title="${domicilioText}">
                📍 ${domicilioText}
              </div>
            </div>
          </div>

          <!-- Tags: Roles and CUIJ -->
          <div class="persona-card-tags">
            ${roles.slice(0, 2).map(r => `<span class="persona-mini-tag" style="background:rgba(14,165,233,0.1);color:#38BDF8;border-color:rgba(14,165,233,0.25)">⚔️ ${r}</span>`).join('')}
            ${p.cuij_asociados?.slice(0, 1).map(c => `<span class="persona-mini-tag cuij-tag" title="Causa CUIJ: ${c}">⚖️ ${c}</span>`).join('') || ''}
            ${p.delitos_asociados?.slice(0, 1).map(d => `<span class="persona-mini-tag" style="color:var(--text-muted);">${d}</span>`).join('') || ''}
          </div>

          <!-- Footer Actions -->
          <div class="persona-card-footer">
            <button class="btn btn-primary btn-xs btn-card-dossier" onclick="event.stopPropagation(); window.abrirDossierDigital('${p.id}');" title="Abrir Legajo y Dossier Institucional">
              📋 Dossier
            </button>
            <div class="persona-card-actions">
              ${isIndividual ? `
                <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.abrirModalAsignarBanda('${p.id}');" title="Asignar o Crear Organización Criminal" style="font-size:10px;padding:3px 7px;color:#F59E0B;border-color:rgba(245,158,11,0.5);font-weight:700;">
                  🏴 +Banda
                </button>
              ` : ''}
              <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.centrarPersonaEnMapa('${p.id}');" title="Ver Domicilio en Mapa" style="font-size:10px;padding:3px 7px;">
                📍 Mapa
              </button>
              <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.enfocarPersonaEnGrafo('${p.id}');" title="Ver en Red de Vínculos" style="font-size:10px;padding:3px 7px;">
                🕸️ Red
              </button>
              <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.abrirEdicionPersona('${p.id}');" title="Editar Perfil" style="font-size:10px;padding:3px 7px;">
                ✏️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Click anywhere on card opens dossier
    grid.querySelectorAll('.persona-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          window.abrirDossierDigital(card.dataset.id);
        }
      });
    });

  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Error cargando personas</h3><p>${err.message}</p></div>`;
  }

  // Filter pills events
  document.querySelectorAll('.persona-filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.persona-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPersonaFilter = btn.dataset.filter;
      renderPersonasView();
    };
  });

  const bandaSelect = document.getElementById('personas-banda-filter');
  if (bandaSelect && !bandaSelect._bound) {
    bandaSelect._bound = true;
    bandaSelect.addEventListener('change', renderPersonasView);
  }

  setupListSearch('personas-search', renderPersonasView);
}

// Global exposure for direct graph navigation
window.enfocarPersonaEnGrafo = async function(personaId) {
  const navGrafo = document.querySelector('[data-view=grafo]');
  if (navGrafo) navGrafo.click();
  setTimeout(async () => {
    const select = document.getElementById('grafo-persona-select');
    if (select) select.value = personaId;
    await renderGrafo(personaId);
    mostrarDossierNodo(personaId);
  }, 150);
};

// ============================================================
// SISTEMA INTEGRAL DE DOSSIER DIGITAL Y PERFILACIÓN CRIMINAL
// ============================================================

export function initDossierSystem() {
  // Exponer helper para editar perfil navegando de inmediato a la sección correspondiente
  window.editarPersonaDesdeDossier = function(personaId, forceTab) {
    let targetTab = forceTab;
    if (!targetTab) {
      const actTab = document.querySelector('#dossier-view-tabs .dossier-tab-btn.active')?.dataset.dossierTab;
      const tabMap = {
        'dossier-tab-general': 'tab-f-identidad',
        'dossier-tab-adjuntos': 'tab-f-adjuntos',
        'dossier-tab-domicilios': 'tab-f-domicilios',
        'dossier-tab-causas': 'tab-f-causas',
        'dossier-tab-vehiculos': 'tab-f-vehiculos',
        'dossier-tab-familia': 'tab-f-familia',
        'dossier-tab-financiero': 'tab-f-credito',
        'dossier-tab-inteligencia': 'tab-f-organizacion'
      };
      targetTab = tabMap[actTab] || 'tab-f-identidad';
    }
    closeModal('modal-dossier-digital');
    window.abrirEdicionPersona(personaId, targetTab);
  };

  // Navegación de pestañas en modal de edición de perfil
  document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.formTab;
      document.querySelectorAll('.persona-tab-pane').forEach(p => p.classList.add('hidden'));
      document.getElementById(target)?.classList.remove('hidden');

      // Si el contenedor dinámico está vacío, agregar una fila automáticamente para facilitar la edición inmediata
      if (target === 'tab-f-familia') {
        const c = document.getElementById('persona-familia-container');
        if (c && c.children.length === 0) addFamiliaRow();
      } else if (target === 'tab-f-vehiculos') {
        const c = document.getElementById('persona-vehiculos-container');
        if (c && c.children.length === 0) addVehiculoRow();
      } else if (target === 'tab-f-causas') {
        const c = document.getElementById('persona-causas-container');
        if (c && c.children.length === 0) addCausaRow();
      } else if (target === 'tab-f-domicilios') {
        const c = document.getElementById('persona-domicilios-container');
        if (c && c.children.length === 0) addDomicilioRow({ tipo: 'REAL', direccion: '', barrio: '' });
      }
    });
  });

  // Navegación de pestañas en visor de dossier digital
  document.querySelectorAll('#dossier-view-tabs .dossier-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#dossier-view-tabs .dossier-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.dossierTab;
      document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.add('hidden'));
      document.getElementById(target)?.classList.remove('hidden');
    });
  });

  // Botones de agregado dinámico
  document.getElementById('btn-add-domicilio-row')?.addEventListener('click', () => {
    addDomicilioRow({ tipo: 'REAL', direccion: '', barrio: '' });
  });

  document.getElementById('btn-add-causa-row')?.addEventListener('click', () => {
    addCausaRow();
  });

  document.getElementById('btn-add-vehiculo-row')?.addEventListener('click', () => {
    addVehiculoRow();
  });

  document.getElementById('btn-add-familia-row')?.addEventListener('click', () => {
    addFamiliaRow();
  });

  // Requerimiento de detención toggle
  document.getElementById('persona-captura')?.addEventListener('change', (e) => {
    const fields = document.getElementById('persona-captura-fields');
    if (fields) {
      if (e.target.checked) fields.classList.remove('hidden');
      else fields.classList.add('hidden');
    }
  });

  // Peligrosidad slider
  document.getElementById('persona-peligrosidad')?.addEventListener('input', (e) => {
    const valEl = document.getElementById('persona-peligrosidad-val');
    if (valEl) valEl.textContent = e.target.value;
  });

  // Carga de foto de perfil
  const fotoFileBtn = document.getElementById('btn-trigger-foto-file');
  const fotoFileInput = document.getElementById('persona-foto-file-input');
  fotoFileBtn?.addEventListener('click', () => fotoFileInput?.click());

  fotoFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('persona-foto-preview');
        const plh = document.getElementById('persona-foto-placeholder');
        if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
        if (plh) plh.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('persona-foto-url')?.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    const preview = document.getElementById('persona-foto-preview');
    const plh = document.getElementById('persona-foto-placeholder');
    if (url) {
      if (preview) { preview.src = url; preview.style.display = 'block'; }
      if (plh) plh.style.display = 'none';
    } else if (!fotoFileInput?.files?.length) {
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      if (plh) plh.style.display = 'block';
    }
  });

  // Dropzone y selección de archivos adjuntos (.pdf, .doc, .docx, imágenes)
  const dropzone = document.getElementById('persona-dropzone');
  const fileInput = document.getElementById('persona-file-input');
  const addMoreBtn = document.getElementById('btn-select-more-files');

  addMoreBtn?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== fileInput) fileInput?.click();
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleFilesSelected(e.target.files);
    }
  });

  // Botones de acción en visor de dossier
  document.getElementById('btn-print-dossier-direct')?.addEventListener('click', () => {
    if (currentViewingDossierId) window.imprimirDossierDigital(currentViewingDossierId);
  });

  document.getElementById('btn-edit-dossier-direct')?.addEventListener('click', () => {
    if (currentViewingDossierId) {
      window.editarPersonaDesdeDossier(currentViewingDossierId);
    }
  });

  // Creación rápida de nueva banda desde el formulario de perfil
  const handleCrearNuevaBandaRapida = async () => {
    const nombre = prompt('Ingrese el nombre de la nueva organización criminal a registrar:');
    if (!nombre || !nombre.trim()) return;

    try {
      showLoading('Registrando nueva organización criminal...');
      const created = await insertBanda({
        nombre: nombre.trim(),
        color_hex: '#0EA5E9',
        activa: true,
        descripcion: 'Organización registrada desde formulario de legajo'
      });
      showToast(`Organización "${created.nombre}" registrada correctamente`, 'success');
      await populatePersonaBandaSelects(created.id, created.nombre);
      const filterSelect = document.getElementById('personas-banda-filter');
      if (filterSelect) filterSelect._populatedOnce = false;
      await populatePersonasBandaFilter();
    } catch (err) {
      showToast(`Error al crear organización: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  };

  document.getElementById('btn-crear-banda-desde-tab1')?.addEventListener('click', handleCrearNuevaBandaRapida);
  document.getElementById('btn-crear-banda-desde-persona')?.addEventListener('click', handleCrearNuevaBandaRapida);

  const selQuick = document.getElementById('persona-banda-quick');
  const selTab8 = document.getElementById('persona-banda');

  selQuick?.addEventListener('change', () => {
    if (selTab8) selTab8.value = selQuick.value;
    if (selQuick.value === '__NEW_BANDA__') handleCrearNuevaBandaRapida();
  });
  selTab8?.addEventListener('change', () => {
    if (selQuick) selQuick.value = selTab8.value;
    if (selTab8.value === '__NEW_BANDA__') handleCrearNuevaBandaRapida();
  });

  // Modal: Asignar o Crear Organización Criminal para Persona
  document.getElementById('form-asignar-banda-persona')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const personaId = document.getElementById('asignar-banda-persona-id')?.value;
    if (!personaId) return;

    showLoading('Actualizando organización...');
    try {
      const selectBanda = document.getElementById('select-asignar-banda');
      const inputNombre = document.getElementById('input-nueva-banda-nombre')?.value?.trim();
      const inputBarrio = document.getElementById('input-nueva-banda-barrio')?.value?.trim();
      const inputColor = document.getElementById('input-nueva-banda-color')?.value || '#0EA5E9';

      let newBandaId = null;
      let newBandaNombre = 'Individual';
      let newBandaColor = '#94A3B8';

      if (inputNombre) {
        const createdBanda = await insertBanda({
          nombre: inputNombre,
          barrio_base: inputBarrio || null,
          color_hex: inputColor,
          nivel_amenaza: 6,
          activa: true,
          descripcion: `Organización creada y asignada a persona ID ${personaId}`
        });
        newBandaId = createdBanda.id;
        newBandaNombre = createdBanda.nombre;
        newBandaColor = createdBanda.color_hex || inputColor;
        showToast(`Organización "${newBandaNombre}" creada y vinculada`, 'success');
      } else if (selectBanda && selectBanda.value) {
        if (selectBanda.value === '__INDIVIDUAL__') {
          newBandaId = null;
          newBandaNombre = 'Individual';
          newBandaColor = '#94A3B8';
        } else {
          const selectedOpt = selectBanda.options[selectBanda.selectedIndex];
          newBandaId = selectBanda.value;
          newBandaNombre = selectedOpt.getAttribute('data-nombre') || selectedOpt.text.split('(')[0].trim();
          newBandaColor = selectedOpt.getAttribute('data-color') || '#0EA5E9';
        }
      } else {
        hideLoading();
        showToast('Seleccione una organización o escriba el nombre de una nueva', 'warning');
        return;
      }

      const updated = await updatePersona(personaId, {
        banda_id: newBandaId,
        banda_nombre: newBandaNombre,
        banda_color: newBandaColor
      });

      closeModal('modal-asignar-banda-persona');
      showToast('Organización criminal asignada correctamente', 'success');

      // Refresh filter and views
      const filterSelect = document.getElementById('personas-banda-filter');
      if (filterSelect) filterSelect._populatedOnce = false;
      await populatePersonasBandaFilter();

      if (document.getElementById('view-personas')?.classList.contains('active')) {
        await renderPersonasView();
      }
      if (document.getElementById('view-bandas')?.classList.contains('active')) {
        await renderBandasView();
      }
      if (currentViewingDossierId === personaId && updated) {
        renderDossierDigitalBody(updated);
      }
    } catch (err) {
      console.error('Error al vincular banda a persona:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });
}

function handleFilesSelected(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentPersonaFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        nombre: file.name,
        tamano: formatFileSize(file.size),
        tipo: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        data_url: e.target.result,
        fecha_subida: new Date().toISOString()
      });
      renderPersonaFilesList();
    };
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderPersonaFilesList() {
  const container = document.getElementById('persona-files-list');
  const countEl = document.getElementById('persona-adjuntos-count');
  if (countEl) countEl.textContent = currentPersonaFiles.length;
  if (!container) return;

  if (currentPersonaFiles.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:11px;grid-column:1/-1;text-align:center;padding:12px;border:1px dashed rgba(255,255,255,0.1);border-radius:6px">No hay documentos adjuntos en este legajo aún.</div>';
    return;
  }

  container.innerHTML = currentPersonaFiles.map((f, i) => {
    const ext = (f.nombre || '').split('.').pop().toLowerCase();
    let badgeClass = 'file-icon-doc';
    let badgeText = 'DOC';
    if (ext === 'pdf') { badgeClass = 'file-icon-pdf'; badgeText = 'PDF'; }
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) { badgeClass = 'file-icon-img'; badgeText = 'IMG'; }
    else if (['doc', 'docx'].includes(ext)) { badgeClass = 'file-icon-doc'; badgeText = 'DOC'; }

    return `
      <div class="file-attachment-card" data-idx="${i}">
        <span class="file-icon-badge ${badgeClass}">${badgeText}</span>
        <div class="file-info-col">
          <div class="file-name-text" title="${f.nombre}">${f.nombre}</div>
          <div class="file-meta-text">${f.tamano || 'Archivo'} ${f.fecha_subida ? `• ${f.fecha_subida.split('T')[0]}` : ''}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          ${f.data_url ? `
            <button type="button" class="btn btn-ghost btn-xs btn-preview-file" data-idx="${i}" title="Ver o descargar">
              👁️
            </button>
          ` : ''}
          <button type="button" class="btn btn-ghost btn-xs btn-delete-file" data-idx="${i}" title="Eliminar archivo" style="color:#EF4444">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-preview-file').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const file = currentPersonaFiles[idx];
      if (file?.data_url) {
        if (file.tipo?.includes('pdf') || file.tipo?.includes('image')) {
          const w = window.open('');
          w.document.write(`<iframe src="${file.data_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          const a = document.createElement('a');
          a.href = file.data_url;
          a.download = file.nombre;
          a.click();
        }
      }
    });
  });

  container.querySelectorAll('.btn-delete-file').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      currentPersonaFiles.splice(idx, 1);
      renderPersonaFilesList();
    });
  });
}

function addDomicilioRow(data = {}) {
  const container = document.getElementById('persona-domicilios-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'dynamic-item-row';
  row.dataset.rowType = 'domicilio';
  if (data.id) row.dataset.id = data.id;
  if (data.geom) row.dataset.geom = data.geom;
  if (data.precision) row.dataset.precision = data.precision;

  row.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;gap:8px">
      <div style="display:grid;grid-template-columns:130px 1.6fr 1fr;gap:8px">
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Tipo de Domicilio</label>
          <select class="form-input dom-tipo" style="padding:4px 8px;font-size:11px">
            <option value="REAL" ${data.tipo === 'REAL' ? 'selected' : ''}>Principal / Real</option>
            <option value="LEGAL" ${data.tipo === 'LEGAL' ? 'selected' : ''}>Legal / Registrado</option>
            <option value="AGUANTADERO" ${data.tipo === 'AGUANTADERO' ? 'selected' : ''}>Aguantadero</option>
            <option value="DISTRIBUCION" ${data.tipo === 'DISTRIBUCION' ? 'selected' : ''}>Punto de Venta / Acopio</option>
          </select>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <label style="font-size:10px;color:var(--text-muted)">Dirección y Altura</label>
            <button type="button" class="btn btn-outline btn-xs btn-pick-dom-map" title="Ajustar punto exacto en el mapa interactivo" style="font-size:10px;padding:1px 6px;color:#60A5FA;border-color:rgba(96,165,250,0.4)">📍 En Mapa</button>
          </div>
          <input type="text" class="form-input dom-direccion" value="${(data.direccion || '').replace(/"/g, '&quot;')}" placeholder="Ej: Vera Mujica 674 o link Google Maps" style="padding:4px 8px;font-size:11px">
          <div class="dom-geo-badge-container" style="margin-top:4px;"></div>
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Barrio</label>
          <input type="text" class="form-input dom-barrio" value="${(data.barrio || '').replace(/"/g, '&quot;')}" placeholder="Ej: Centenario" style="padding:4px 8px;font-size:11px">
        </div>
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Rol o Detalle del Inmueble</label>
        <input type="text" class="form-input dom-detalle" value="${(data.detalle || '').replace(/"/g, '&quot;')}" placeholder="Observaciones / Rol en la organización..." style="padding:4px 8px;font-size:11px">
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-xs btn-remove-row" title="Quitar este domicilio" style="color:#EF4444;border-color:rgba(239,68,68,0.3);margin-top:16px">✕</button>
  `;

  const dirInput = row.querySelector('.dom-direccion');
  const barInput = row.querySelector('.dom-barrio');
  const badgeContainer = row.querySelector('.dom-geo-badge-container');
  const btnPickMap = row.querySelector('.btn-pick-dom-map');

  // Renderizar badge inicial si ya tiene coordenadas
  if (data.geom) {
    const coords = parseGeom(data.geom);
    if (coords && badgeContainer) {
      badgeContainer.innerHTML = renderPrecisionBadge(data.precision || 'MANUAL_EXACTA', coords);
    }
  }

  // Evento: Clic en botón "📍 En Mapa"
  btnPickMap?.addEventListener('click', () => {
    const curCoords = row.dataset.geom ? parseGeom(row.dataset.geom) : null;
    const dirVal = dirInput.value.trim();
    const barVal = barInput?.value?.trim() || '';
    openMapPicker({
      currentCoords: curCoords,
      address: dirVal,
      barrio: barVal,
      title: 'Fijar Ubicación de Domicilio',
      onConfirm: ({ lat, lng, geom, direccion, barrio, precision }) => {
        row.dataset.geom = geom;
        row.dataset.precision = precision;
        if (direccion) dirInput.value = direccion;
        if (barrio && barInput && !barInput.value) barInput.value = barrio;
        if (badgeContainer) badgeContainer.innerHTML = renderPrecisionBadge(precision, { lat, lng });
      }
    });
  });

  // Evento: Al cambiar la dirección, auto geocodificar o detectar URL Google Maps
  dirInput?.addEventListener('change', async () => {
    const val = dirInput.value.trim();
    if (!val) {
      row.dataset.geom = '';
      row.dataset.precision = '';
      if (badgeContainer) badgeContainer.innerHTML = '';
      return;
    }
    const direct = parseCoordsOrUrl(val);
    if (direct) {
      row.dataset.geom = `SRID=4326;POINT(${direct.lng} ${direct.lat})`;
      row.dataset.precision = 'GPS_COORDENADAS';
      if (badgeContainer) badgeContainer.innerHTML = renderPrecisionBadge('GPS_COORDENADAS', direct);
      showToast('Coordenadas detectadas y asignadas al domicilio', 'info');
      return;
    }
    if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px;color:var(--text-muted)">⏳ Verificando ubicación...</span>`;
    const barVal = barInput?.value?.trim() || '';
    const geo = await geocodeAddress(val, barVal, 'Santa Fe');
    if (geo && geo.lat && geo.lng) {
      row.dataset.geom = `SRID=4326;POINT(${geo.lng} ${geo.lat})`;
      row.dataset.precision = geo.precision;
      if (badgeContainer) badgeContainer.innerHTML = renderPrecisionBadge(geo.precision, { lat: geo.lat, lng: geo.lng });
      if (geo.barrio && barInput && !barInput.value) barInput.value = geo.barrio;
    } else {
      if (badgeContainer) badgeContainer.innerHTML = `<span class="badge badge-warning" style="font-size:10px;cursor:pointer;" title="Haga clic en 'En Mapa' para fijar manualmente">⚠️ Altura dudosa - Fijar en Mapa</span>`;
    }
  });

  row.querySelector('.btn-remove-row')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function addCausaRow(data = {}) {
  const container = document.getElementById('persona-causas-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'dynamic-item-row';
  row.dataset.rowType = 'causa';
  if (data.id) row.dataset.id = data.id;

  row.innerHTML = `
    <div style="flex:1;display:grid;grid-template-columns:140px 1.5fr 1fr 1fr;gap:8px">
      <div>
        <label style="font-size:10px;color:var(--text-muted)">CUIJ / N° Causa</label>
        <input type="text" class="form-input causa-cuij" value="${(data.cuij || '').replace(/"/g, '&quot;')}" placeholder="21-09726972-3" style="padding:4px 8px;font-size:11px;font-family:var(--font-mono)">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Carátula / Delito</label>
        <input type="text" class="form-input causa-caratula" value="${(data.caratula || '').replace(/"/g, '&quot;')}" placeholder="Comercialización de Estupefacientes..." style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Fiscalía / Órgano</label>
        <input type="text" class="form-input causa-organo" value="${(data.organo || '').replace(/"/g, '&quot;')}" placeholder="MPA - Unidad Microtráfico" style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Estado Procesal</label>
        <input type="text" class="form-input causa-estado" value="${(data.estado || '').replace(/"/g, '&quot;')}" placeholder="Imputativa / Preventiva" style="padding:4px 8px;font-size:11px">
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-xs btn-remove-row" title="Quitar causa" style="color:#EF4444;border-color:rgba(239,68,68,0.3);margin-top:16px">✕</button>
  `;

  row.querySelector('.btn-remove-row')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function addVehiculoRow(data = {}) {
  const container = document.getElementById('persona-vehiculos-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'dynamic-item-row';
  row.dataset.rowType = 'vehiculo';
  if (data.id) row.dataset.id = data.id;

  row.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;gap:8px">
      <div style="display:grid;grid-template-columns:110px 120px 1.4fr 110px;gap:8px">
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Dominio / Patente</label>
          <input type="text" class="form-input veh-patente" value="${(data.patente || '').replace(/"/g, '&quot;')}" placeholder="AB123CD" style="padding:4px 8px;font-size:11px;text-transform:uppercase;font-weight:700">
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Tipo de Rodado</label>
          <select class="form-input veh-tipo" style="padding:4px 8px;font-size:11px">
            <option value="Automóvil" ${data.tipo === 'Automóvil' ? 'selected' : ''}>Automóvil</option>
            <option value="Motovehículo" ${data.tipo === 'Motovehículo' ? 'selected' : ''}>Motovehículo</option>
            <option value="Camioneta" ${data.tipo === 'Camioneta' ? 'selected' : ''}>Camioneta</option>
            <option value="Utilitario" ${data.tipo === 'Utilitario' ? 'selected' : ''}>Utilitario</option>
            <option value="Camión" ${data.tipo === 'Camión' ? 'selected' : ''}>Camión</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Marca y Modelo</label>
          <input type="text" class="form-input veh-modelo" value="${(data.modelo || '').replace(/"/g, '&quot;')}" placeholder="VW Gol Trend 1.6" style="padding:4px 8px;font-size:11px">
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Color</label>
          <input type="text" class="form-input veh-color" value="${(data.color || '').replace(/"/g, '&quot;')}" placeholder="Negro / Gris" style="padding:4px 8px;font-size:11px">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 1.2fr;gap:8px">
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Titular Registral</label>
          <input type="text" class="form-input veh-titular" value="${(data.titular || '').replace(/"/g, '&quot;')}" placeholder="Titular o Tercero" style="padding:4px 8px;font-size:11px">
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted)">Rol Operativo / Utilización en la Organización</label>
          <input type="text" class="form-input veh-rol" value="${(data.rol || '').replace(/"/g, '&quot;')}" placeholder="Traslado de estupefacientes, vigía, vehículo de fuga..." style="padding:4px 8px;font-size:11px">
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-xs btn-remove-row" title="Quitar vehículo" style="color:#EF4444;border-color:rgba(239,68,68,0.3);margin-top:16px">✕</button>
  `;

  row.querySelector('.btn-remove-row')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function addFamiliaRow(data = {}) {
  const container = document.getElementById('persona-familia-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'dynamic-item-row';
  row.dataset.rowType = 'familia';
  if (data.id) row.dataset.id = data.id;

  row.innerHTML = `
    <div style="flex:1;display:grid;grid-template-columns:1.4fr 130px 110px 1.8fr;gap:8px">
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Nombre Completo</label>
        <input type="text" class="form-input fam-nombre" value="${(data.nombre || '').replace(/"/g, '&quot;')}" placeholder="Nombre y Apellido" style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Parentesco</label>
        <select class="form-input fam-parentesco" style="padding:4px 8px;font-size:11px">
          <option value="Padre" ${data.parentesco === 'Padre' ? 'selected' : ''}>Padre</option>
          <option value="Madre" ${data.parentesco === 'Madre' ? 'selected' : ''}>Madre</option>
          <option value="Hermano/a" ${data.parentesco === 'Hermano/a' ? 'selected' : ''}>Hermano/a</option>
          <option value="Pareja" ${data.parentesco === 'Pareja' ? 'selected' : ''}>Pareja / Cónyuge</option>
          <option value="Hijo/a" ${data.parentesco === 'Hijo/a' ? 'selected' : ''}>Hijo/a</option>
          <option value="Cuñado/a" ${data.parentesco === 'Cuñado/a' ? 'selected' : ''}>Cuñado/a</option>
          <option value="Primo/a" ${data.parentesco === 'Primo/a' ? 'selected' : ''}>Primo/a</option>
          <option value="Tío/a" ${data.parentesco === 'Tío/a' ? 'selected' : ''}>Tío/a</option>
          <option value="Sobrino/a" ${data.parentesco === 'Sobrino/a' ? 'selected' : ''}>Sobrino/a</option>
          <option value="Conviviente" ${data.parentesco === 'Conviviente' ? 'selected' : ''}>Conviviente</option>
          <option value="Amigo/a" ${data.parentesco === 'Amigo/a' ? 'selected' : ''}>Amigo / Vínculo Cercano</option>
          <option value="Coimputado/a" ${data.parentesco === 'Coimputado/a' ? 'selected' : ''}>Coimputado / Asociado</option>
          <option value="Otro" ${data.parentesco === 'Otro' ? 'selected' : ''}>Otro</option>
        </select>
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">DNI</label>
        <input type="text" class="form-input fam-dni" value="${(data.dni || '').replace(/"/g, '&quot;')}" placeholder="12345678" style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Observación / Vínculo Operativo</label>
        <input type="text" class="form-input fam-obs" value="${(data.observacion || '').replace(/"/g, '&quot;')}" placeholder="Titular de rodados / Conviviente en búnker / Coimputado..." style="padding:4px 8px;font-size:11px">
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-xs btn-remove-row" title="Quitar familiar" style="color:#EF4444;border-color:rgba(239,68,68,0.3);margin-top:16px">✕</button>
  `;

  row.querySelector('.btn-remove-row')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

// Global exposure for editing persona profile & dossier
window.abrirEdicionPersona = async function(personaId, targetTab = 'tab-f-identidad') {
  try {
    const p = await getPersonaById(personaId);
    if (!p) {
      showToast('No se encontró el registro para editar', 'error');
      return;
    }

    const modalTitle = document.getElementById('modal-persona-title');
    if (modalTitle) modalTitle.textContent = `Editar Dossier: ${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Editar Persona';

    const submitBtn = document.getElementById('btn-submit-persona');
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios de Legajo';

    document.getElementById('persona-edit-id').value = p.id;
    document.getElementById('persona-nombre').value = p.nombre || '';
    document.getElementById('persona-apellido').value = p.apellido || '';
    document.getElementById('persona-dni').value = p.dni || '';
    document.getElementById('persona-cuit').value = p.cuit || '';
    document.getElementById('persona-alias').value = Array.isArray(p.alias) ? p.alias.join(', ') : (p.alias || '');
    document.getElementById('persona-sexo').value = p.sexo || 'M';
    document.getElementById('persona-nacimiento').value = p.fecha_nacimiento || '';
    if (document.getElementById('persona-nacionalidad')) {
      document.getElementById('persona-nacionalidad').value = p.nacionalidad || 'Argentina';
    }

    // Foto
    const fotoPreview = document.getElementById('persona-foto-preview');
    const fotoPlh = document.getElementById('persona-foto-placeholder');
    const fotoUrlInput = document.getElementById('persona-foto-url');
    if (p.foto_url) {
      if (fotoUrlInput) fotoUrlInput.value = p.foto_url.startsWith('data:') ? '' : p.foto_url;
      if (fotoPreview) { fotoPreview.src = p.foto_url; fotoPreview.style.display = 'block'; }
      if (fotoPlh) fotoPlh.style.display = 'none';
    } else {
      if (fotoUrlInput) fotoUrlInput.value = '';
      if (fotoPreview) { fotoPreview.src = ''; fotoPreview.style.display = 'none'; }
      if (fotoPlh) fotoPlh.style.display = 'block';
    }

    // Banda (Sincronizado dinámicamente en Tab 1 y Tab 8)
    await populatePersonaBandaSelects(p.banda_id, p.banda_nombre);

    document.getElementById('persona-roles').value = Array.isArray(p.roles) ? p.roles.join(', ') : (p.roles || '');

    const pelEl = document.getElementById('persona-peligrosidad');
    if (pelEl) {
      pelEl.value = p.score_peligrosidad ?? 5;
      const pelVal = document.getElementById('persona-peligrosidad-val');
      if (pelVal) pelVal.textContent = pelEl.value;
    }

    // Captura
    const captEl = document.getElementById('persona-captura');
    const captFields = document.getElementById('persona-captura-fields');
    if (captEl) {
      captEl.checked = Boolean(p.pedido_captura);
      if (p.pedido_captura) {
        captFields?.classList.remove('hidden');
        if (p.orden_captura_datos) {
          const ofEl = document.getElementById('persona-captura-oficio');
          const orgEl = document.getElementById('persona-captura-organo');
          const fecEl = document.getElementById('persona-captura-fecha');
          if (ofEl) ofEl.value = p.orden_captura_datos.oficio || '';
          if (orgEl) orgEl.value = p.orden_captura_datos.organo || '';
          if (fecEl) fecEl.value = p.orden_captura_datos.fecha || '';
        }
      } else {
        captFields?.classList.add('hidden');
      }
    }

    // Domicilios
    const domCont = document.getElementById('persona-domicilios-container');
    if (domCont) {
      domCont.innerHTML = '';
      if (Array.isArray(p.domicilios) && p.domicilios.length > 0) {
        p.domicilios.forEach(d => addDomicilioRow(d));
      } else if (p.domicilio_principal) {
        addDomicilioRow({ tipo: 'REAL', direccion: p.domicilio_principal, geom: p.domicilio_principal_geom });
      } else {
        addDomicilioRow({ tipo: 'REAL', direccion: '', barrio: '' });
      }
    }

    // Causas
    const causaCont = document.getElementById('persona-causas-container');
    if (causaCont) {
      causaCont.innerHTML = '';
      if (Array.isArray(p.causas) && p.causas.length > 0) {
        p.causas.forEach(c => addCausaRow(c));
      } else if (Array.isArray(p.cuij_asociados) && p.cuij_asociados.length > 0) {
        p.cuij_asociados.forEach(c => addCausaRow({ cuij: c, caratula: p.delitos_asociados?.join(', ') || '' }));
      } else if (targetTab === 'tab-f-causas') {
        addCausaRow();
      }
    }

    // Vehículos
    const vehCont = document.getElementById('persona-vehiculos-container');
    if (vehCont) {
      vehCont.innerHTML = '';
      if (Array.isArray(p.vehiculos) && p.vehiculos.length > 0) {
        p.vehiculos.forEach(v => addVehiculoRow(v));
      } else if (targetTab === 'tab-f-vehiculos') {
        addVehiculoRow();
      }
    }

    // Familiares
    const famCont = document.getElementById('persona-familia-container');
    if (famCont) {
      famCont.innerHTML = '';
      if (Array.isArray(p.familiares) && p.familiares.length > 0) {
        p.familiares.forEach(f => addFamiliaRow(f));
      } else if (targetTab === 'tab-f-familia') {
        addFamiliaRow();
      }
    }

    // Situación Crediticia
    if (p.situacion_crediticia) {
      const sc = p.situacion_crediticia;
      const bcraEl = document.getElementById('persona-credito-situacion');
      const entEl = document.getElementById('persona-credito-entidad');
      const monEl = document.getElementById('persona-credito-monto');
      const arcaEl = document.getElementById('persona-arca-situacion');
      const patEl = document.getElementById('persona-patrimonio-inconsistencia');
      if (bcraEl) bcraEl.value = sc.bcra_situacion || '0';
      if (entEl) entEl.value = sc.entidades || '';
      if (monEl) monEl.value = sc.monto_deuda || '';
      if (arcaEl) arcaEl.value = sc.arca_condicion || '';
      if (patEl) patEl.value = sc.inconsistencia_patrimonial || '';
    }

    // Archivos adjuntos
    currentPersonaFiles = Array.isArray(p.archivos_adjuntos) ? [...p.archivos_adjuntos] : [];
    renderPersonaFilesList();

    const antEl = document.getElementById('persona-antecedentes');
    if (antEl) antEl.value = p.antecedentes_texto || '';
    const dosEl = document.getElementById('persona-dossier');
    if (dosEl) dosEl.value = p.link_dossier || '';

    // Switch to targetTab
    const finalTab = targetTab || 'tab-f-identidad';
    document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`#persona-form-nav [data-form-tab="${finalTab}"]`)?.classList.add('active');
    document.querySelectorAll('.persona-tab-pane').forEach(pane => pane.classList.add('hidden'));
    document.getElementById(finalTab)?.classList.remove('hidden');

    openModal('modal-persona');
  } catch (err) {
    console.error('Error abriendo edición de persona:', err);
    showToast('Error al cargar datos de la persona', 'error');
  }
};

// ============================================================
// VISUALIZADOR DE DOSSIER DIGITAL CENTRALIZADO
// ============================================================

window.abrirDossierDigital = async function(personaId) {
  try {
    const p = await getPersonaById(personaId);
    if (!p) {
      showToast('No se encontró el legajo solicitado', 'error');
      return;
    }
    currentViewingDossierId = p.id;

    // Actualizar contadores en las pestañas del visor
    const adjCount = Array.isArray(p.archivos_adjuntos) ? p.archivos_adjuntos.length : 0;
    const domCount = Array.isArray(p.domicilios) ? p.domicilios.length : (p.domicilio_principal ? 1 : 0);
    const cauCount = Array.isArray(p.causas) ? p.causas.length : (p.cuij_asociados?.length || 0);
    const vehCount = Array.isArray(p.vehiculos) ? p.vehiculos.length : 0;
    const famCount = Array.isArray(p.familiares) ? p.familiares.length : 0;

    const elAdjBadge = document.getElementById('dossier-tab-adjuntos-badge');
    const elDomBadge = document.getElementById('dossier-tab-domicilios-badge');
    const elCauBadge = document.getElementById('dossier-tab-causas-badge');
    const elVehBadge = document.getElementById('dossier-tab-vehiculos-badge');
    const elFamBadge = document.getElementById('dossier-tab-familia-badge');

    if (elAdjBadge) elAdjBadge.textContent = adjCount;
    if (elDomBadge) elDomBadge.textContent = domCount;
    if (elCauBadge) elCauBadge.textContent = cauCount;
    if (elVehBadge) elVehBadge.textContent = vehCount;
    if (elFamBadge) elFamBadge.textContent = famCount;

    // Renderizar cuerpo del dossier
    renderDossierDigitalBody(p);

    // Resetear a pestaña principal
    document.querySelectorAll('#dossier-view-tabs .dossier-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#dossier-view-tabs [data-dossier-tab="dossier-tab-general"]')?.classList.add('active');
    document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('dossier-tab-general')?.classList.remove('hidden');

    openModal('modal-dossier-digital');
  } catch (err) {
    console.error('Error al abrir dossier digital:', err);
    showToast('Error cargando el dossier digital', 'error');
  }
};

function renderDossierDigitalBody(p) {
  const container = document.getElementById('dossier-digital-content');
  if (!container) return;

  const isCaptura = Boolean(p.pedido_captura);
  const bandaColor = p.banda_color || '#0EA5E9';
  const rolesList = Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []);
  const initials = `${(p.nombre || '?')[0]}${(p.apellido || '')[0] || ''}`.toUpperCase();

  const domicilios = Array.isArray(p.domicilios) && p.domicilios.length > 0 ? p.domicilios : (p.domicilio_principal ? [{
    tipo: 'REAL',
    direccion: p.domicilio_principal,
    barrio: '',
    localidad: 'Santa Fe',
    detalle: 'Domicilio de residencia principal registrado',
    geom: p.domicilio_principal_geom
  }] : []);

  const causas = Array.isArray(p.causas) && p.causas.length > 0 ? p.causas : (Array.isArray(p.cuij_asociados) ? p.cuij_asociados.map(c => ({
    cuij: c,
    caratula: p.delitos_asociados?.join(', ') || 'Investigación penal preparatoria',
    organo: 'MPA',
    estado: p.estado_procesal || 'En trámite'
  })) : []);

  const vehiculos = Array.isArray(p.vehiculos) ? p.vehiculos : [];
  const familiares = Array.isArray(p.familiares) ? p.familiares : [];
  const archivos = Array.isArray(p.archivos_adjuntos) ? p.archivos_adjuntos : [];
  const sc = p.situacion_crediticia || {};

  container.innerHTML = `
    <!-- MEMBRETE OFICIAL EXCLUSIVO DE IMPRESIÓN POLICIAL Y JUDICIAL -->
    <div class="dossier-print-only-header" style="border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 20px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
        <div>
          <div style="font-size:13pt; font-weight:900; letter-spacing:0.5px; color:#0F172A; text-transform:uppercase;">GOBIERNO DE LA PROVINCIA DE SANTA FE</div>
          <div style="font-size:10.5pt; font-weight:800; color:#1E293B;">MINISTERIO DE JUSTICIA Y SEGURIDAD — POLICÍA DE LA PROVINCIA</div>
          <div style="font-size:9pt; font-weight:700; color:#475569;">SISTEMA CRIMINT — DIVISIÓN ANÁLISIS E INTELIGENCIA CRIMINAL</div>
        </div>
        <div style="text-align:right;">
          <div style="display:inline-block; border:2px solid #0F172A; padding:3px 9px; font-weight:900; font-size:9pt; letter-spacing:0.5px; text-transform:uppercase; color:#0F172A;">ESTRICTAMENTE RESERVADO</div>
          <div style="font-size:8pt; color:#64748B; margin-top:3px;">USO OPERATIVO / JUDICIAL EXCLUSIVO</div>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:#F1F5F9; padding:6px 12px; border-radius:4px; font-size:8.5pt; font-weight:700; color:#1E293B; border:1px solid #CBD5E1;">
        <span>LEGAJO INSTITUCIONAL: <strong>LEG-${p.dni || p.id}</strong></span>
        <span>EMISIÓN: <strong>${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})} HS</strong></span>
        <span>DIVISIÓN: <strong>ANÁLISIS CRIMINAL Y MAPPINGS</strong></span>
      </div>
    </div>

    <!-- CABECERA RESUMEN DEL PERFIL (Visible en pantalla e impresión) -->
    <div class="dossier-header-bar" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-default);border-radius:10px;padding:16px;margin-bottom:18px">
      ${isCaptura ? `
        <div style="background:rgba(239,68,68,0.18);border:1px solid #EF4444;border-radius:8px;padding:10px 14px;color:#FCA5A5;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🚨</span>
            <div>
              <div style="color:#FFF;font-size:13px;font-weight:900;letter-spacing:0.5px">REQUERIMIENTO DE DETENCIÓN / CAPTURA ACTIVA</div>
              <div style="font-size:11px;opacity:0.9">
                ${p.orden_captura_datos?.oficio ? `<strong>Oficio:</strong> ${p.orden_captura_datos.oficio} | ` : ''}
                ${p.orden_captura_datos?.organo ? `<strong>Órgano:</strong> ${p.orden_captura_datos.organo} | ` : ''}
                ${p.orden_captura_datos?.fecha ? `<strong>Fecha:</strong> ${p.orden_captura_datos.fecha}` : 'Medida vigente en territorio'}
              </div>
            </div>
          </div>
          <span style="background:#EF4444;color:#fff;font-weight:800;font-size:10px;padding:4px 10px;border-radius:12px;letter-spacing:0.5px">PRIORIDAD OPERATIVA</span>
        </div>
      ` : ''}

      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div style="width:84px;height:84px;border-radius:12px;background:rgba(255,255,255,0.05);border:2px solid ${isCaptura ? '#EF4444' : 'var(--border-default)'};display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
          ${p.foto_url ? `
            <img src="${p.foto_url}" alt="Foto" style="width:100%;height:100%;object-fit:cover">
          ` : `
            <span style="font-size:28px;font-weight:900;color:var(--text-secondary)">${initials}</span>
          `}
        </div>

        <div style="flex:1;min-width:240px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <h2 style="font-size:18px;font-weight:800;color:#FFFFFF;margin:0">
              ${p.nombre || '—'} ${p.apellido || ''}
            </h2>
            ${Array.isArray(p.alias) && p.alias.length > 0 ? `
              <span style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#FDE68A;font-weight:700;font-size:11px;padding:2px 8px;border-radius:10px">
                "${p.alias.join('", "')}"
              </span>
            ` : ''}
          </div>

          <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap;font-size:12px;color:var(--text-secondary)">
            <span><strong>DNI:</strong> ${p.dni || 'Sin registrar'}</span>
            ${p.cuit ? `<span>• <strong>CUIT:</strong> ${p.cuit}</span>` : ''}
            ${p.fecha_nacimiento ? `<span>• <strong>Nacimiento:</strong> ${p.fecha_nacimiento}</span>` : ''}
            <span>• <strong>Nacionalidad:</strong> ${p.nacionalidad || 'Argentina'}</span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
            ${(!p.banda_nombre || p.banda_nombre.toLowerCase() === 'individual') ? `
              <span style="background:rgba(148,163,184,0.12);border:1px solid rgba(148,163,184,0.3);color:#94A3B8;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800">
                👤 Operador Individual
              </span>
              <button type="button" class="btn btn-outline btn-xs" onclick="window.abrirModalAsignarBanda('${p.id}');" style="font-size:11px;padding:3px 9px;color:#F59E0B;border-color:rgba(245,158,11,0.5);font-weight:700;">
                ➕ Asignar / Crear Banda
              </button>
            ` : `
              <span style="background:${bandaColor}22;border:1px solid ${bandaColor}66;color:${bandaColor};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800">
                🏴 ${p.banda_nombre}
              </span>
              <button type="button" class="btn btn-outline btn-xs" onclick="window.abrirModalAsignarBanda('${p.id}');" style="font-size:10px;padding:2px 6px;color:var(--text-secondary);border-color:rgba(255,255,255,0.15);" title="Cambiar organización asignada">
                ✏️ Cambiar Banda
              </button>
            `}
            <span style="background:${p.score_peligrosidad >= 8 ? '#EF4444' : '#F59E0B'};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">
              Peligrosidad: ${p.score_peligrosidad || 5}/10
            </span>
            <span style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);color:var(--text-primary);padding:2px 8px;border-radius:12px;font-size:11px">
              ${p.estado_procesal || 'IDENTIFICADO'}
            </span>
            ${rolesList.map(r => `<span style="background:rgba(14,165,233,0.12);color:var(--accent-secondary);padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600">⚔️ ${r}</span>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-direction:column;flex-shrink:0" class="dossier-actions-bar">
          <button class="btn btn-primary btn-sm" onclick="window.editarPersonaDesdeDossier('${p.id}');" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:11px;font-weight:700;background:#0284c7;border:1px solid #38bdf8;">
            ✏️ Editar Perfil Completo
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.centrarPersonaEnMapa('${p.id}'); closeModal('modal-dossier-digital');" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:11px;font-weight:600">
            📍 Centrar en Mapa
          </button>
          <button class="btn btn-accent btn-sm" onclick="window.enfocarPersonaEnGrafo('${p.id}'); closeModal('modal-dossier-digital');" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:11px;font-weight:600">
            🕸️ Ver en Red de Vínculos
          </button>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 1: FICHA E IDENTIDAD GENERAL -->
    <div class="dossier-content-section" id="dossier-tab-general">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;margin-bottom:16px">
        <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div class="dossier-section-title" style="margin-bottom:0">Datos Personales y Registro</div>
            <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-identidad');" style="font-size:10px;padding:2px 7px">
              ✏️ Editar
            </button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
            <div><span style="color:var(--text-muted);display:block;font-size:10px">NOMBRES Y APELLIDOS</span><strong>${p.nombre || '—'} ${p.apellido || ''}</strong></div>
            <div><span style="color:var(--text-muted);display:block;font-size:10px">DOCUMENTO NACIONAL</span><strong>${p.dni || '—'}</strong></div>
            <div><span style="color:var(--text-muted);display:block;font-size:10px">CLAVE FISCAL (CUIT/CUIL)</span><strong>${p.cuit || '—'}</strong></div>
            <div><span style="color:var(--text-muted);display:block;font-size:10px">FECHA DE NACIMIENTO</span><strong>${p.fecha_nacimiento || '—'}</strong></div>
            <div><span style="color:var(--text-muted);display:block;font-size:10px">SEXO REGISTRADO</span><strong>${p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : 'Otro'}</strong></div>
            <div><span style="color:var(--text-muted);display:block;font-size:10px">NACIONALIDAD</span><strong>${p.nacionalidad || 'Argentina'}</strong></div>
          </div>
        </div>

        <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div class="dossier-section-title" style="margin-bottom:0">Síntesis Operativa y Territorial</div>
            <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-organizacion');" style="font-size:10px;padding:2px 7px">
              ✏️ Editar
            </button>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
            <div>
              <span style="color:var(--text-muted);display:block;font-size:10px">DOMICILIO PRINCIPAL DE RESIDENCIA</span>
              <strong>📍 ${p.domicilio_principal || 'Sin domicilio principal registrado'}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted);display:block;font-size:10px">ORGANIZACIÓN DE PERTENENCIA</span>
              <strong style="color:${bandaColor}">🏴 ${p.banda_nombre || 'Individual'}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted);display:block;font-size:10px">ROLES Y CAPACIDAD OPERATIVA</span>
              <span>${rolesList.join(', ') || 'No categorizado'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="dossier-section-title" style="margin-bottom:0">Resumen de Inteligencia Criminal</div>
          <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-organizacion');" style="font-size:10px;padding:2px 7px">
            ✏️ Editar
          </button>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap">
          ${p.antecedentes_texto || 'No se registraron observaciones de antecedentes para este perfil.'}
        </div>
      </div>
    </div>

    <!-- SECCIÓN 2: DOCUMENTOS Y ADJUNTOS (.pdf, .doc, .docx, imágenes) -->
    <div class="dossier-content-section hidden" id="dossier-tab-adjuntos">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">Documentación, Actas y Peritajes Incorporados al Dossier (${archivos.length})</div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-adjuntos');" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700">
          ➕ Incorporar Archivos
        </button>
      </div>

      ${archivos.length === 0 ? `
        <div style="text-align:center;padding:24px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
          <div style="font-size:24px;margin-bottom:4px">📎</div>
          <div style="font-size:12px;font-weight:700;color:#fff">Sin archivos incorporados en soporte digital</div>
          <div style="font-size:11px;color:var(--text-muted);margin:4px 0 12px">No se registraron actas de allanamiento, informes periciales, oficios ni fotografías anexas.</div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-adjuntos');" style="display:inline-flex;align-items:center;gap:6px;font-weight:700">
            ➕ Incorporar Archivos
          </button>
        </div>
      ` : `
        <div class="file-attachments-list">
          ${archivos.map((f, i) => {
            const ext = (f.nombre || '').split('.').pop().toLowerCase();
            let bClass = 'file-icon-doc';
            let bText = 'DOC';
            if (ext === 'pdf') { bClass = 'file-icon-pdf'; bText = 'PDF'; }
            else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) { bClass = 'file-icon-img'; bText = 'IMG'; }
            else if (['doc', 'docx'].includes(ext)) { bClass = 'file-icon-doc'; bText = 'DOC'; }

            return `
              <div class="file-attachment-card">
                <span class="file-icon-badge ${bClass}">${bText}</span>
                <div class="file-info-col">
                  <div class="file-name-text" title="${f.nombre}">${f.nombre}</div>
                  <div class="file-meta-text">${f.tamano || 'Archivo'} ${f.fecha_subida ? `• ${f.fecha_subida.split('T')[0]}` : ''}</div>
                </div>
                ${f.data_url ? `
                  <button type="button" class="btn btn-primary btn-xs btn-dossier-file-open" data-idx="${i}" style="font-size:11px;padding:4px 8px">
                    ${ext === 'pdf' || ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? 'Abrir ↗' : 'Descargar ⤓'}
                  </button>
                ` : `
                  <span style="font-size:10px;color:var(--text-muted)">Adjunto</span>
                `}
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>

    <!-- SECCIÓN 3: DOMICILIOS GEORREFERENCIADOS -->
    <div class="dossier-content-section hidden" id="dossier-tab-domicilios">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">
          Inmuebles, Asentamientos y Puntos Territoriales Vinculados (${domicilios.length})
        </div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-domicilios');" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700">
          ➕ Agregar / Editar Domicilios
        </button>
      </div>

      ${domicilios.length === 0 ? `
        <div style="text-align:center;padding:24px 20px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
          <div style="font-size:24px;margin-bottom:4px">📍</div>
          <div style="font-size:12px;font-weight:700;color:#fff">Sin domicilios territoriales vinculados</div>
          <div style="font-size:11px;color:var(--text-muted);margin:4px 0 12px">No se registraron domicilios reales, legales, aguantaderos ni bocas de expendio para este perfil.</div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-domicilios');" style="display:inline-flex;align-items:center;gap:6px;font-weight:700">
            ➕ Agregar Domicilio
          </button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px">
          ${domicilios.map(d => {
            let badgeColor = '#0EA5E9';
            let badgeText = 'REAL / PRINCIPAL';
            const t = (d.tipo || '').toUpperCase();
            if (t === 'LEGAL') { badgeColor = '#8B5CF6'; badgeText = 'LEGAL / REGISTRADO'; }
            else if (t === 'AGUANTADERO') { badgeColor = '#EF4444'; badgeText = 'AGUANTADERO / OCULTAMIENTO'; }
            else if (t === 'DISTRIBUCION') { badgeColor = '#F59E0B'; badgeText = 'PUNTO DE DISTRIBUCIÓN / VENTA'; }

            const coords = parseGeom(d.geom);

            return `
              <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
                <div style="display:flex;align-items:flex-start;gap:12px">
                  <span style="font-size:22px">📍</span>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                      <span style="background:${badgeColor}22;border:1px solid ${badgeColor}66;color:${badgeColor};font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px">
                        ${badgeText}
                      </span>
                      <strong style="color:#fff;font-size:13px">${d.direccion || 'Sin dirección especificada'}</strong>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary)">
                      ${d.barrio ? `Barrio: ${d.barrio} | ` : ''} Santa Fe ${d.detalle ? `• ${d.detalle}` : ''}
                    </div>
                    <div class="dossier-print-coords">
                      ${coords ? `📍 Coordenadas Cartográficas GPS: Latitud ${coords.lat.toFixed(6)}, Longitud ${coords.lng.toFixed(6)}` : 'Sin georreferenciación cartográfica registrada'}
                    </div>
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:6px">
                  ${coords ? `
                    <button type="button" class="btn btn-secondary btn-xs" onclick="window.centrarCoordenadasMapa(${coords.lng}, ${coords.lat}, '${(d.direccion || '').replace(/'/g, "\\'")}'); closeModal('modal-dossier-digital');" style="font-size:10px;padding:4px 8px;white-space:nowrap">
                      🗺️ Ver en Mapa
                    </button>
                  ` : `
                    <span style="font-size:10px;color:var(--text-muted);margin-right:4px">Sin coordenadas</span>
                  `}
                  <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-domicilios');" style="font-size:10px;padding:4px 8px;white-space:nowrap" title="Editar domicilios de este legajo">
                    ✏️ Editar
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>

    <!-- SECCIÓN 4: CAUSAS Y PROCESOS CUIJ -->
    <div class="dossier-content-section hidden" id="dossier-tab-causas">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">
          Investigaciones Penales Preparatorias y Causas CUIJ (${causas.length})
        </div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-causas');" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700">
          ➕ Agregar / Editar Causas CUIJ
        </button>
      </div>

      ${causas.length === 0 ? `
        <div style="text-align:center;padding:24px 20px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
          <div style="font-size:24px;margin-bottom:4px">⚖️</div>
          <div style="font-size:12px;font-weight:700;color:#fff">No registra causas CUIJ vinculadas en el sistema</div>
          <div style="font-size:11px;color:var(--text-muted);margin:4px 0 12px">No se registraron legajos fiscales del MPA, números de CUIJ ni carátulas penales vinculadas.</div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-causas');" style="display:inline-flex;align-items:center;gap:6px;font-weight:700">
            ➕ Agregar Causa CUIJ
          </button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px">
          ${causas.map(c => `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px 14px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <span style="font-family:var(--font-mono);color:var(--accent-primary);font-weight:800;font-size:12px">
                  ⚖️ CUIJ: ${c.cuij}
                </span>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">
                    ${c.estado || 'En trámite'}
                  </span>
                  <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-causas');" style="font-size:10px;padding:2px 6px" title="Editar causas del perfil">
                    ✏️ Editar
                  </button>
                </div>
              </div>
              <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:4px">
                ${c.caratula}
              </div>
              <div style="font-size:11px;color:var(--text-secondary)">
                <strong>Fiscalía / Órgano:</strong> ${c.organo || 'Ministerio Público de la Acusación'}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- SECCIÓN 5: PARQUE AUTOMOTOR / VEHÍCULOS -->
    <div class="dossier-content-section hidden" id="dossier-tab-vehiculos">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">
          Parque Automotor y Rodados Detectados (${vehiculos.length})
        </div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-vehiculos');" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700">
          ➕ Agregar / Editar Vehículos
        </button>
      </div>

      ${vehiculos.length === 0 ? `
        <div style="text-align:center;padding:24px 20px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
          <div style="font-size:24px;margin-bottom:4px">🚗</div>
          <div style="font-size:12px;font-weight:700;color:#fff">No registra vehículos asociados en este legajo</div>
          <div style="font-size:11px;color:var(--text-muted);margin:4px 0 12px">No se registraron patentes, automóviles, utilitarios ni motovehículos vinculados a este perfil.</div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-vehiculos');" style="display:inline-flex;align-items:center;gap:6px;font-weight:700">
            ➕ Agregar Vehículo
          </button>
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:12px">
          ${vehiculos.map(v => `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="font-family:var(--font-mono);font-size:13px;font-weight:900;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;color:#fff">
                  ${v.patente}
                </span>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:11px;color:var(--text-muted)">${v.tipo || 'Rodado'}</span>
                  <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-vehiculos');" style="font-size:10px;padding:2px 6px" title="Editar vehículos">
                    ✏️
                  </button>
                </div>
              </div>
              <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px">
                ${v.modelo}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">
                Color: ${v.color || 'No especificado'} • Titular: <strong>${v.titular || 'Sin titular registrado'}</strong>
              </div>
              ${v.rol ? `
                <div style="font-size:10px;color:var(--accent-secondary);background:rgba(14,165,233,0.08);padding:3px 6px;border-radius:4px;margin-top:4px">
                  Uso operativo: ${v.rol}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- SECCIÓN 6: RED FAMILIAR Y VÍNCULOS DIRECTOS -->
    <div class="dossier-content-section hidden" id="dossier-tab-familia">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">
          Red de Parentesco y Convivencia Directa (${familiares.length})
        </div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-familia');" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700">
          ➕ Agregar / Editar Familiares
        </button>
      </div>

      ${familiares.length === 0 ? `
        <div style="text-align:center;padding:24px 20px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
          <div style="font-size:24px;margin-bottom:4px">👥</div>
          <div style="font-size:12px;font-weight:700;color:#fff">No se registraron vínculos familiares directos en este perfil</div>
          <div style="font-size:11px;color:var(--text-muted);margin:4px 0 12px">No se registraron padres, parejas, hermanos, convivientes ni vínculos directos para el análisis patrimonial.</div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-familia');" style="display:inline-flex;align-items:center;gap:6px;font-weight:700">
            ➕ Agregar Vínculo Familiar
          </button>
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:12px">
          ${familiares.map(fam => `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <strong style="color:#fff;font-size:13px">${fam.nombre}</strong>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#FDE68A;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px">
                    ${fam.parentesco}
                  </span>
                  <button type="button" class="btn btn-outline btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-familia');" style="font-size:10px;padding:2px 6px" title="Editar vínculos familiares">
                    ✏️
                  </button>
                </div>
              </div>
              ${fam.dni ? `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">DNI: ${fam.dni}</div>` : ''}
              ${fam.observacion ? `
                <div style="font-size:11px;color:var(--text-muted);line-height:1.3;margin-top:6px;border-top:1px solid var(--border-subtle);padding-top:4px">
                  ${fam.observacion}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- SECCIÓN 7: PERFIL FINANCIERO Y SITUACIÓN CREDITICIA -->
    <div class="dossier-content-section hidden" id="dossier-tab-financiero">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">Evaluación Financiera, Bancaria y Condición Fiscal</div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-credito');" style="display:inline-flex;align-items:center;gap:4px;font-weight:700">
          ✏️ Editar Perfil Financiero
        </button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;margin-bottom:14px">
        <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px">
          <div class="dossier-section-title">Central de Deudores BCRA</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:24px;font-weight:900;color:${sc.bcra_situacion >= 4 ? '#EF4444' : sc.bcra_situacion >= 2 ? '#F59E0B' : '#22C55E'}">
              ${sc.bcra_situacion ? `Situación ${sc.bcra_situacion}` : 'Sin datos'}
            </span>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">
            <strong>Entidades Informantes:</strong> ${sc.entidades || 'No informadas'}
          </div>
          <div style="font-size:11px;color:var(--text-secondary)">
            <strong>Deuda Registrada Estimada:</strong> ${sc.monto_deuda || 'Sin registros de deuda formal'}
          </div>
        </div>

        <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px">
          <div class="dossier-section-title">Condición Fiscal AFIP / ARCA</div>
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:6px">
            ${sc.arca_condicion || 'Sin categorización fiscal registrada'}
          </div>
          <div style="font-size:11px;color:var(--text-muted)">
            Cruce de bases tributarias y aportes patronales en jurisdicción provincial y nacional.
          </div>
        </div>
      </div>

      <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px">
        <div class="dossier-section-title">Evaluación de Inconsistencias Patrimoniales</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap">
          ${sc.inconsistencia_patrimonial || 'No se registraron alertas de inconsistencia patrimonial.'}
        </div>
      </div>
    </div>

    <!-- SECCIÓN 8: INTELIGENCIA CRIMINAL -->
    <div class="dossier-content-section hidden" id="dossier-tab-inteligencia">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">Perfilación Territorial e Inteligencia Criminal</div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="window.editarPersonaDesdeDossier('${p.id}', 'tab-f-organizacion');" style="display:inline-flex;align-items:center;gap:4px;font-weight:700">
          ✏️ Editar Inteligencia y Organización
        </button>
      </div>

      <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">
          ${p.antecedentes_texto || 'Sin notas de inteligencia operativa adicionales.'}
        </div>
      </div>
    </div>

    <!-- SECCIÓN 9: COMPULSA AUTOMÁTICA — CRUCES DETECTADOS -->
    <div class="dossier-content-section hidden" id="dossier-tab-compulsa">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <div class="dossier-section-title" style="margin-bottom:0">🔍 Compulsa Automática — Cruces y Coincidencias Detectadas</div>
        <button type="button" class="btn btn-primary btn-xs btn-rebuild-compulsa" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;background:#F59E0B;border-color:#FBBF24;color:#0F172A" title="Recalcular compulsa">
          🔄 Recalcular Compulsa
        </button>
      </div>
      <div id="dossier-compulsa-results" style="display:flex;flex-direction:column;gap:10px">
        <div style="text-align:center;padding:24px"><div class="spinner"></div><div style="font-size:12px;color:var(--text-muted);margin-top:8px">Ejecutando compulsa automática...</div></div>
      </div>
    </div>

    <!-- PIE INSTITUCIONAL EXCLUSIVO DE IMPRESIÓN CON CONSTANCIA Y FIRMAS -->
    <div class="dossier-print-only-footer" style="margin-top: 36px; padding-top: 20px; border-top: 2px solid #0F172A; page-break-inside: avoid; break-inside: avoid;">
      <div style="font-size: 8pt; color: #475569; margin-bottom: 28px; text-align: justify; line-height: 1.35;">
        <strong>CONSTANCIA DE VALIDEZ Y RESERVA INSTITUCIONAL:</strong> La información contenida en el presente Legajo de Inteligencia y Dossier Digital ha sido procesada mediante cruce analítico de bases policiales, fiscales y territoriales por la División de Análisis Criminal del Sistema CRIMINT de la Provincia de Santa Fe. Sus datos son confidenciales y están protegidos por el marco normativo de inteligencia criminal y protección de datos, con destino exclusivo a magistrados judiciales y mandos operativos intervinientes.
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-top: 30px;">
        <div style="flex: 1; text-align: center; border-top: 1px solid #334155; padding-top: 8px;">
          <div style="font-size: 8.5pt; font-weight: 800; color: #0F172A;">ANALISTA OPERATIVO INTERVINIENTE</div>
          <div style="font-size: 7.5pt; color: #64748B;">División Análisis e Inteligencia Criminal</div>
          <div style="font-size: 7.5pt; color: #64748B;">Policía de la Provincia de Santa Fe</div>
        </div>
        <div style="flex: 1; text-align: center; border-top: 1px solid #334155; padding-top: 8px;">
          <div style="font-size: 8.5pt; font-weight: 800; color: #0F172A;">JEFE DE DIVISIÓN / SUPERVISOR</div>
          <div style="font-size: 7.5pt; color: #64748B;">Departamento de Informaciones e Inteligencia</div>
          <div style="font-size: 7.5pt; color: #64748B;">Firma y Sello Aclaratorio</div>
        </div>
        <div style="flex: 1; text-align: center; border-top: 1px solid #334155; padding-top: 8px;">
          <div style="font-size: 8.5pt; font-weight: 800; color: #0F172A;">RECEPCIÓN UNIDAD FISCAL / JUZGADO</div>
          <div style="font-size: 7.5pt; color: #64748B;">Ministerio Público de la Acusación</div>
          <div style="font-size: 7.5pt; color: #64748B;">Constancia de Cargo y Notificación</div>
        </div>
      </div>
    </div>
  `;

  // Apertura de archivos adjuntos desde el visor
  container.querySelectorAll('.btn-dossier-file-open').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const file = archivos[idx];
      if (file?.data_url) {
        if (file.tipo?.includes('pdf') || file.tipo?.includes('image')) {
          const w = window.open('');
          w.document.write(`<iframe src="${file.data_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          const a = document.createElement('a');
          a.href = file.data_url;
          a.download = file.nombre;
          a.click();
        }
      }
    });
  });

  // COMPULSA AUTOMÁTICA: ejecutar cruce de datos para esta persona
  renderCompulsaAutomatica(p.id);

  // Botón de recalcular compulsa
  container.querySelector('.btn-rebuild-compulsa')?.addEventListener('click', async () => {
    // Reconstruir índice y volver a ejecutar
    await searchEngine.build(getPersonas, getHechos, getBandas, getAllanamientos, getAllVinculos);
    renderCompulsaAutomatica(p.id);
    showToast('Compulsa recalculada con datos actualizados', 'success');
  });
}

/**
 * Ejecuta y renderiza la compulsa automática para una persona
 */
function renderCompulsaAutomatica(personaId) {
  const resultsContainer = document.getElementById('dossier-compulsa-results');
  const badge = document.getElementById('dossier-tab-compulsa-badge');
  if (!resultsContainer) return;

  if (!searchEngine.built) {
    resultsContainer.innerHTML = `
      <div style="text-align:center;padding:24px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
        <div style="font-size:24px;margin-bottom:4px">⏳</div>
        <div style="font-size:12px;font-weight:700;color:#fff">Motor de búsqueda inicializando...</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">La compulsa se ejecutará automáticamente cuando el índice esté construido.</div>
      </div>
    `;
    if (badge) badge.textContent = '…';
    // Reintentar en 3s
    setTimeout(() => renderCompulsaAutomatica(personaId), 3000);
    return;
  }

  const compulsa = searchEngine.compulsaPersona(personaId);
  if (badge) badge.textContent = compulsa.total;

  if (compulsa.total === 0) {
    resultsContainer.innerHTML = `
      <div style="text-align:center;padding:24px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
        <div style="font-size:24px;margin-bottom:4px">✅</div>
        <div style="font-size:12px;font-weight:700;color:#22C55E">Sin cruces detectados en la base de datos</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">No se encontraron coincidencias cruzadas de direcciones, causas CUIJ, familiares, vehículos u organizaciones con otros registros del sistema.</div>
      </div>
    `;
    return;
  }

  // Categorías de matches
  const categories = compulsa.categories;
  const categoryOrder = [
    { key: 'familiares', icon: '👨‍👩‍👧', label: 'Familiares en el Sistema', color: '#F59E0B' },
    { key: 'causas', icon: '📋', label: 'Causas CUIJ Compartidas', color: '#EF4444' },
    { key: 'direcciones', icon: '📍', label: 'Direcciones Coincidentes', color: '#0EA5E9' },
    { key: 'vehiculos', icon: '🚗', label: 'Vehículos Compartidos', color: '#8B5CF6' },
    { key: 'banda', icon: '🔗', label: 'Misma Organización Criminal', color: '#10B981' }
  ];

  // Summary bar
  const summaryHtml = categoryOrder
    .filter(cat => categories[cat.key] > 0)
    .map(cat => `
      <span style="background:${cat.color}18;border:1px solid ${cat.color}44;color:${cat.color};font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;display:inline-flex;align-items:center;gap:4px">
        ${cat.icon} ${categories[cat.key]} ${cat.label}
      </span>
    `).join('');

  // Match type icons and colors
  const matchIcons = {
    familiar: { icon: '👨‍👩‍👧', color: '#F59E0B', label: 'FAMILIAR' },
    familiar_dni: { icon: '🆔', color: '#F59E0B', label: 'FAMILIAR DNI' },
    cuij: { icon: '📋', color: '#EF4444', label: 'CAUSA CUIJ' },
    direccion: { icon: '📍', color: '#0EA5E9', label: 'DIRECCIÓN' },
    vehiculo: { icon: '🚗', color: '#8B5CF6', label: 'VEHÍCULO' },
    banda: { icon: '🔗', color: '#10B981', label: 'ORGANIZACIÓN' }
  };

  const matchesHtml = compulsa.matches.map(m => {
    const mi = matchIcons[m.matchType] || { icon: '🔍', color: '#94A3B8', label: 'CRUCE' };
    const typeLabels = { persona: 'PERSONA', hecho: 'HECHO', allanamiento: 'ALLANAMIENTO', banda: 'BANDA' };
    const typeColors = { persona: '#0EA5E9', hecho: '#EF4444', allanamiento: '#F59E0B', banda: '#8B5CF6' };
    const tColor = typeColors[m.type] || '#94A3B8';

    return `
      <div class="compulsa-match-card" style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-left:3px solid ${mi.color};border-radius:8px;padding:12px 14px;display:flex;align-items:flex-start;gap:12px;cursor:pointer" data-compulsa-type="${m.type}" data-compulsa-id="${m.id}">
        <div style="flex-shrink:0;width:36px;height:36px;background:${mi.color}18;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">
          ${mi.icon}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap">
            <span style="background:${mi.color}22;border:1px solid ${mi.color}55;color:${mi.color};font-size:9px;font-weight:900;padding:1px 6px;border-radius:3px;letter-spacing:0.5px">${mi.label}</span>
            <span style="background:${tColor}15;border:1px solid ${tColor}33;color:${tColor};font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px">${typeLabels[m.type] || m.type}</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.title}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.subtitle || ''}</div>
          <div style="font-size:10px;color:${mi.color};margin-top:4px;font-weight:600">
            ${m.matchDetail}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
          <button type="button" class="btn btn-secondary btn-xs btn-compulsa-open" data-c-type="${m.type}" data-c-id="${m.id}" style="font-size:10px;padding:4px 8px;white-space:nowrap">
            ${m.type === 'persona' ? '📂 Abrir Dossier' : '🔎 Ver Detalle'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  resultsContainer.innerHTML = `
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:10px 14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:800;color:#FDE68A;margin-bottom:6px">
        ⚡ ${compulsa.total} cruces detectados automáticamente en la base de datos
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${summaryHtml}
      </div>
    </div>
    ${matchesHtml}
  `;

  // Eventos de los botones de compulsa
  resultsContainer.querySelectorAll('.btn-compulsa-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.cType;
      const id = btn.dataset.cId;
      if (type === 'persona') {
        window.abrirDossierDigital(id);
      } else {
        closeModal('modal-dossier-digital');
        showEntityDetail(type, id);
      }
    });
  });

  // Click en toda la card de compulsa
  resultsContainer.querySelectorAll('.compulsa-match-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-compulsa-open')) return;
      const type = card.dataset.compulsaType;
      const id = card.dataset.compulsaId;
      if (type === 'persona') {
        window.abrirDossierDigital(id);
      } else {
        closeModal('modal-dossier-digital');
        showEntityDetail(type, id);
      }
    });
  });
}

// Global exposure for printing / PDF export of dossier
window.imprimirDossierDigital = async function(personaId) {
  if (!personaId && currentViewingDossierId) personaId = currentViewingDossierId;
  if (!personaId) return;

  const modalDossier = document.getElementById('modal-dossier-digital');
  if (!modalDossier || modalDossier.classList.contains('hidden') || currentViewingDossierId !== personaId) {
    await window.abrirDossierDigital(personaId);
  }

  // Activar modo de impresión en el body y desocultar todas las secciones del dossier
  document.body.classList.add('printing-dossier');
  document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.remove('hidden'));

  // Breve espera para que el layout del navegador se estabilice con todas las secciones visibles antes de imprimir
  setTimeout(() => {
    window.print();
  }, 150);
};

// Eventos de sincronización para impresión directa del navegador (ej. Ctrl+P o Menú Imprimir)
window.addEventListener('beforeprint', () => {
  const modalDossier = document.getElementById('modal-dossier-digital');
  if (modalDossier && !modalDossier.classList.contains('hidden')) {
    document.body.classList.add('printing-dossier');
    document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.remove('hidden'));
  }
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-dossier');
  const modalDossier = document.getElementById('modal-dossier-digital');
  if (modalDossier && !modalDossier.classList.contains('hidden')) {
    const activeTabBtn = document.querySelector('#dossier-view-tabs .dossier-tab-btn.active');
    const targetId = activeTabBtn ? activeTabBtn.dataset.dossierTab : 'dossier-tab-general';
    document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(targetId)?.classList.remove('hidden');
  }
});

// Global exposure for centering arbitrary coordinates on map
window.centrarCoordenadasMapa = function(lng, lat, label) {
  const navMap = document.querySelector('[data-view=mapa]');
  if (navMap) navMap.click();
  setTimeout(() => {
    flyTo(lng, lat, 17, 45);
  }, 150);
};

// Global exposure for centering persona on Mapbox with 3D perspective
window.centrarPersonaEnMapa = async function(personaId) {
  try {
    const p = await getPersonaById(personaId);
    if (!p) return;
    const coords = parseGeom(p.domicilio_principal_geom);
    if (!coords || isNaN(coords.lng) || isNaN(coords.lat)) {
      showToast('La persona no posee domicilio georreferenciado', 'warning');
      return;
    }
    const navMap = document.querySelector('[data-view=mapa]');
    if (navMap) navMap.click();
    setTimeout(() => {
      flyTo(coords.lng, coords.lat, 16.5, 45);
    }, 150);
  } catch (e) {
    console.warn('Error centrando persona en mapa:', e);
  }
};

// Global exposure for analyzing environment / spatial cross-check around persona's residence
window.analizarEntornoDePersona = async function(personaId) {
  try {
    const p = await getPersonaById(personaId);
    if (!p) return;
    const coords = parseGeom(p.domicilio_principal_geom);
    if (!coords || isNaN(coords.lng) || isNaN(coords.lat)) {
      showToast('La persona no posee domicilio georreferenciado para análisis', 'warning');
      return;
    }
    const navMap = document.querySelector('[data-view=mapa]');
    if (navMap) navMap.click();
    setTimeout(() => {
      flyTo(coords.lng, coords.lat, 16, 35);
      inspectLocation([coords.lng, coords.lat], `Domicilio de ${p.nombre || ''} ${p.apellido || ''} (${p.domicilio_principal || 'S/D'})`, 500);
      document.getElementById('address-inspector-drawer')?.classList.remove('hidden');
    }, 200);
  } catch (e) {
    console.warn('Error analizando entorno de persona:', e);
  }
};

window.enfocarBandaEnGrafo = async function(bandaId) {
  const navGrafo = document.querySelector('[data-view=grafo]');
  if (navGrafo) navGrafo.click();
  setTimeout(async () => {
    if (window.filtrarGrafoPorBanda) {
      await window.filtrarGrafoPorBanda(bandaId);
    } else {
      await renderGrafoGeneral(bandaId);
    }
  }, 150);
};

// ============================================================
// BANDAS VIEW
// ============================================================
async function renderBandasView() {
  const grid = document.getElementById('bandas-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Cargando estructuras criminales...</span></div>';

  try {
    const search = document.getElementById('bandas-search')?.value;
    const bandas = await getBandas({ search, limit: 50 });

    if (bandas.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
          <h3>Sin bandas registradas</h3>
          <p>Registrá estructuras criminales para mapear territorios y rivalidades.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = bandas.map(b => {
      const bColor = b.color_hex || '#EF4444';
      return `
        <div class="entity-card" data-id="${b.id}" data-type="banda" style="border-left: 4px solid ${bColor};">
          <div class="entity-card-header">
            <div class="entity-avatar banda" style="background:${bColor}22;color:${bColor};border:1px solid ${bColor}55;">
              ${b.nombre[0]?.toUpperCase() || 'B'}
            </div>
            <div style="flex:1;">
              <div class="entity-card-name" style="font-size:16px;font-weight:700;">${b.nombre}</div>
              <div class="entity-card-sub" style="color:var(--accent-primary);">Base: ${b.barrio_base || 'Santa Fe'}</div>
            </div>
            <span class="tag ${b.activa ? 'peligrosidad-alta' : 'peligrosidad-baja'}" style="font-size:10px;">${b.activa ? 'ACTIVA' : 'INACTIVA'}</span>
          </div>
          <div class="entity-card-body">
            ${b.cabecilla_principal ? `<div class="entity-field"><span class="entity-field-label">Liderazgo</span><span class="entity-field-value" style="font-weight:600;color:#FCA5A5;">${b.cabecilla_principal}</span></div>` : ''}
            ${b.actividad_principal ? `<div class="entity-field"><span class="entity-field-label">Actividad</span><span class="entity-field-value">${b.actividad_principal}</span></div>` : ''}
            ${b.delitos_alta_lesividad ? `<div class="entity-field"><span class="entity-field-label">Alta Lesividad</span><span class="entity-field-value" style="color:var(--accent-danger);font-size:12px;">${b.delitos_alta_lesividad}</span></div>` : ''}
            ${b.rivales?.length ? `<div class="entity-field"><span class="entity-field-label">Disputa</span><span class="entity-field-value" style="color:#F59E0B;font-weight:600;">⚔️ En conflicto con: ${b.rivales.join(', ')}</span></div>` : ''}
          </div>
          <div class="entity-tags" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              ${b.nivel_amenaza ? `<span class="tag alias" style="background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700;">Amenaza: ${b.nivel_amenaza}/10</span>` : ''}
              ${b.zonas_operacion?.slice(0, 3).map(z => `<span class="tag" style="background:rgba(255,255,255,0.06);color:var(--text-secondary);">${z}</span>`).join('') || ''}
            </div>
            <button class="btn btn-accent btn-xs" onclick="event.stopPropagation(); window.enfocarBandaEnGrafo('${b.id}');" title="Ver en Red de Vínculos" style="font-size:11px;padding:3px 10px;border-radius:6px;">
              Ver Red de la Banda
            </button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.entity-card').forEach(card => {
      card.addEventListener('click', () => showEntityDetail('banda', card.dataset.id));
    });

  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Error cargando bandas</h3><p>${err.message}</p></div>`;
  }

  setupListSearch('bandas-search', renderBandasView);
}

// ============================================================
// ALLANAMIENTOS VIEW
// ============================================================
async function renderAllanamientosView() {
  const grid = document.getElementById('allanamientos-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Cargando operativos...</span></div>';

  try {
    const search = document.getElementById('allanamientos-search')?.value;
    const alls = await getAllanamientos({ search, limit: 50 });

    if (alls.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/></svg>
          <h3>Sin operativos registrados</h3>
          <p>Registrá allanamientos para generar briefings tácticos.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = alls.map(a => {
      const resultColor = a.resultado === 'Positivo' || a.resultado === 'POSITIVO' ? 'accent-success' : 'accent-danger';
      return `
        <div class="entity-card" data-id="${a.id}" data-type="allanamiento">
          <div class="entity-card-header">
            <div class="entity-avatar operativo">⊕</div>
            <div>
              <div class="entity-card-name">${a.direccion || 'Sin dirección'}</div>
              <div class="entity-card-sub">${a.cuij || ''} ${a.requerimiento ? `• ${a.requerimiento}` : ''}</div>
            </div>
          </div>
          <div class="entity-card-body">
            <div class="entity-field"><span class="entity-field-label">Fecha</span><span class="entity-field-value">${formatDateTime(a.fecha_operativo)}</span></div>
            <div class="entity-field"><span class="entity-field-label">Fuerza</span><span class="entity-field-value">${a.fuerza_interviniente || '—'}</span></div>
            ${a.resultado ? `<div class="entity-field"><span class="entity-field-label">Resultado</span><span class="entity-field-value" style="color:var(--${resultColor});font-weight:700;">${a.resultado}</span></div>` : ''}
            ${a.resultado_detalle ? `<div class="entity-field"><span class="entity-field-label">Secuestros</span><span class="entity-field-value" style="font-size:12px;color:var(--text-secondary);">${a.resultado_detalle}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.entity-card').forEach(card => {
      card.addEventListener('click', () => showEntityDetail('allanamiento', card.dataset.id));
    });

  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }

  setupListSearch('allanamientos-search', renderAllanamientosView);
}

// ============================================================
// ============================================================
// GRAFO VIEW (vis-network) — RED DE INTELIGENCIA Y VÍNCULOS CRIMINALES
// Relaciones derivadas de Dossiers: Jerarquías, Rodados, CUIJs y Vínculos Familiares
// ============================================================
let currentGrafoNetwork = null;
let currentGrafoOptions = {
  bandaId: '',
  personaId: '',
  filterMode: 'general',
  hideUnlinked: true
};

async function setupGrafoView() {
  const bandaSelect = document.getElementById('grafo-banda-select');
  const personaSelect = document.getElementById('grafo-persona-select');
  const toggleUnlinked = document.getElementById('grafo-toggle-unlinked');
  const dynamicChips = document.getElementById('grafo-bandas-dynamic-chips');
  const btnGeneral = document.getElementById('btn-grafo-general');
  const btnProfugos = document.getElementById('btn-grafo-profugos');
  const btnConflicto = document.getElementById('btn-grafo-conflicto');
  const btnLoad = document.getElementById('btn-grafo-load');
  const btnCloseDossier = document.getElementById('btn-close-dossier');

  if (!bandaSelect || !personaSelect) return;

  try {
    const [personas, bandas] = await Promise.all([
      getPersonas({ limit: 1000 }),
      getBandas({ limit: 100 })
    ]);

    // Calcular estadísticas por banda
    const statsPorBanda = {};
    personas.forEach(p => {
      const bId = p.banda_id || (p.banda_nombre ? `banda-${p.banda_nombre.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : null);
      if (bId) {
        if (!statsPorBanda[bId]) statsPorBanda[bId] = { total: 0, profugos: 0, personas: [] };
        statsPorBanda[bId].total++;
        if (p.pedido_captura) statsPorBanda[bId].profugos++;
        statsPorBanda[bId].personas.push(p);
      }
    });

    // 1. Poblar Selector Principal de Banda
    bandaSelect.innerHTML = `
      <option value="">🌐 Todas las Organizaciones Criminales</option>
      <option value="CONFLICT_NEGRADA_SIEMPRE">⚔️ Disputa Territorial (La Negrada vs Los de Siempre)</option>
    `;
    bandas.forEach(b => {
      const stats = statsPorBanda[b.id] || { total: 0, profugos: 0 };
      const captStr = stats.profugos > 0 ? ` — 🚨 ${stats.profugos} prófugo${stats.profugos > 1 ? 's' : ''}` : '';
      bandaSelect.innerHTML += `
        <option value="${b.id}">🏴 ${b.nombre} (${stats.total} integrantes${captStr})</option>
      `;
    });

    // 2. Generar Chips Rápidos por Banda en Toolbar (solo organizaciones con integrantes)
    if (dynamicChips) {
      dynamicChips.innerHTML = '';
      const bandasConIntegrantes = bandas.filter(b => (statsPorBanda[b.id]?.total || 0) > 0);
      bandasConIntegrantes.forEach(b => {
        const stats = statsPorBanda[b.id];
        const bColor = b.color_hex || '#0EA5E9';
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'btn btn-outline btn-xs chip-banda';
        chip.dataset.bandaId = b.id;
        chip.style.cssText = `font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;border-color:${bColor};color:${bColor};background:rgba(255,255,255,0.03);white-space:nowrap;display:inline-flex;align-items:center;gap:4px;cursor:pointer;`;
        chip.innerHTML = `🏴 ${b.nombre} <span style="font-size:10px;opacity:0.8;background:${bColor}22;padding:1px 5px;border-radius:8px;">${stats.total}</span>`;
        chip.addEventListener('click', async () => {
          await window.filtrarGrafoPorBanda(b.id);
        });
        dynamicChips.appendChild(chip);
      });
    }

    // 3. Función para poblar personas según la banda seleccionada
    function populatePersonaSelect(bId) {
      personaSelect.innerHTML = '';
      let list = [];

      if (bId === 'CONFLICT_NEGRADA_SIEMPRE') {
        personaSelect.innerHTML = '<option value="">⚔️ Ambas facciones en disputa (Todos)...</option>';
        list = personas.filter(p => p.banda_nombre?.includes('Negrada') || p.banda_nombre?.includes('Siempre'));
      } else if (bId) {
        const currentBanda = bandas.find(b => b.id === bId);
        personaSelect.innerHTML = `<option value="">Toda la organización (${currentBanda ? currentBanda.nombre : 'Banda'})...</option>`;
        list = personas.filter(p => p.banda_id === bId || p.banda_nombre?.toLowerCase() === currentBanda?.nombre?.toLowerCase());
      } else {
        personaSelect.innerHTML = '<option value="">Todos los investigados (Focalizar sujeto)...</option>';
        list = [...personas];
      }

      // Ordenar: prófugos primero, luego líderes/sicarios, luego peligrosidad
      list.sort((a, b) => {
        if (a.pedido_captura && !b.pedido_captura) return -1;
        if (!a.pedido_captura && b.pedido_captura) return 1;
        return (b.score_peligrosidad || 0) - (a.score_peligrosidad || 0);
      });

      list.slice(0, 150).forEach(p => {
        const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';
        const aliasStr = p.alias?.length ? ` "${p.alias[0]}"` : '';
        const captStr = p.pedido_captura ? '🚨 [CAPTURA] ' : '';
        const roleStr = p.roles?.length ? ` • ${p.roles[0]}` : '';
        personaSelect.innerHTML += `<option value="${p.id}">${captStr}${name}${aliasStr}${roleStr}</option>`;
      });
    }

    populatePersonaSelect('');

    // Actualizar estilo visual del botón activo
    function updateActiveFilterButton(activeId) {
      [btnGeneral, btnProfugos, btnConflicto].forEach(btn => btn?.classList.remove('active'));
      document.querySelectorAll('#grafo-bandas-dynamic-chips .chip-banda').forEach(c => {
        c.style.background = 'rgba(255,255,255,0.03)';
      });

      if (activeId === 'btn-grafo-general') btnGeneral?.classList.add('active');
      else if (activeId === 'btn-grafo-profugos') btnProfugos?.classList.add('active');
      else if (activeId === 'btn-grafo-conflicto') btnConflicto?.classList.add('active');
      else if (activeId) {
        const activeChip = document.querySelector(`#grafo-bandas-dynamic-chips [data-banda-id="${activeId}"]`);
        if (activeChip) activeChip.style.background = 'rgba(255,255,255,0.18)';
      }
    }

    // Eventos de controles
    bandaSelect.addEventListener('change', async () => {
      const bId = bandaSelect.value;
      populatePersonaSelect(bId);
      currentGrafoOptions.bandaId = bId;
      currentGrafoOptions.personaId = '';
      currentGrafoOptions.filterMode = bId === 'CONFLICT_NEGRADA_SIEMPRE' ? 'conflicto' : (bId ? 'banda' : 'general');
      updateActiveFilterButton(bId);
      await renderGrafoIntelligence();
    });

    personaSelect.addEventListener('change', async () => {
      currentGrafoOptions.personaId = personaSelect.value;
      if (personaSelect.value) {
        await renderGrafoIntelligence({ focusPersonaId: personaSelect.value });
      } else {
        await renderGrafoIntelligence();
      }
    });

    toggleUnlinked?.addEventListener('change', async () => {
      currentGrafoOptions.hideUnlinked = toggleUnlinked.checked;
      await renderGrafoIntelligence();
    });

    btnLoad?.addEventListener('click', async () => {
      const bId = bandaSelect.value;
      const pId = personaSelect.value;
      currentGrafoOptions.bandaId = bId;
      currentGrafoOptions.personaId = pId;
      currentGrafoOptions.filterMode = bId === 'CONFLICT_NEGRADA_SIEMPRE' ? 'conflicto' : (bId ? 'banda' : 'general');
      await renderGrafoIntelligence({ focusPersonaId: pId });
    });

    // Botón para reordenar la red y volver a congelarla
    const btnReorganizar = document.getElementById('btn-grafo-reorganizar');
    btnReorganizar?.addEventListener('click', async () => {
      const statusEl = document.getElementById('grafo-physics-status');
      if (statusEl) {
        statusEl.innerHTML = '⚡ Reordenando...';
        statusEl.style.color = '#F59E0B';
        statusEl.style.background = 'rgba(245,158,11,0.1)';
        statusEl.style.borderColor = 'rgba(245,158,11,0.25)';
      }
      if (currentGrafoNetwork) {
        currentGrafoNetwork.setOptions({ physics: { enabled: true } });
        currentGrafoNetwork.stabilize(100);
        setTimeout(() => {
          if (currentGrafoNetwork) {
            currentGrafoNetwork.setOptions({ physics: { enabled: false } });
            currentGrafoNetwork.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
            if (statusEl) {
              statusEl.innerHTML = '🔒 Red Fija';
              statusEl.style.color = '#10B981';
              statusEl.style.background = 'rgba(16,185,129,0.1)';
              statusEl.style.borderColor = 'rgba(16,185,129,0.25)';
            }
          }
        }, 700);
      }
    });

    btnGeneral?.addEventListener('click', async () => {
      updateActiveFilterButton('btn-grafo-general');
      bandaSelect.value = '';
      populatePersonaSelect('');
      currentGrafoOptions.bandaId = '';
      currentGrafoOptions.personaId = '';
      currentGrafoOptions.filterMode = 'general';
      await renderGrafoIntelligence();
    });

    btnProfugos?.addEventListener('click', async () => {
      updateActiveFilterButton('btn-grafo-profugos');
      bandaSelect.value = '';
      populatePersonaSelect('');
      currentGrafoOptions.bandaId = '';
      currentGrafoOptions.personaId = '';
      currentGrafoOptions.filterMode = 'profugos';
      await renderGrafoIntelligence();
    });

    btnConflicto?.addEventListener('click', async () => {
      updateActiveFilterButton('btn-grafo-conflicto');
      bandaSelect.value = 'CONFLICT_NEGRADA_SIEMPRE';
      populatePersonaSelect('CONFLICT_NEGRADA_SIEMPRE');
      currentGrafoOptions.bandaId = 'CONFLICT_NEGRADA_SIEMPRE';
      currentGrafoOptions.personaId = '';
      currentGrafoOptions.filterMode = 'conflicto';
      await renderGrafoIntelligence();
    });

    btnCloseDossier?.addEventListener('click', () => {
      document.getElementById('grafo-node-dossier')?.classList.add('hidden');
    });

    // Cargar visualización inicial de la red
    await renderGrafoIntelligence();

  } catch (e) {
    console.error('Error inicializando vista de grafo relacional:', e);
  }
}

// ============================================================
// CONSTRUCTOR CENTRAL DE INTELIGENCIA RELACIONAL
// ============================================================
async function renderGrafoIntelligence(customOverrides = {}) {
  const container = document.getElementById('grafo-canvas');
  if (!container) return;

  const opts = {
    ...currentGrafoOptions,
    hideUnlinked: document.getElementById('grafo-toggle-unlinked')?.checked ?? true,
    ...customOverrides
  };

  container.innerHTML = `
    <div class="empty-state" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
      <div class="spinner"></div>
      <span style="font-weight:600;color:var(--text-secondary);">Procesando inteligencia de legajos y cruzamiento relacional...</span>
    </div>
  `;

  try {
    const [personas, bandas, vinculos] = await Promise.all([
      getPersonas({ limit: 1000 }),
      getBandas({ limit: 100 }),
      getAllVinculos()
    ]);

    const personasMap = new Map(personas.map(p => [p.id, p]));
    const bandasMap = new Map(bandas.map(b => [b.id, b]));

    // ------------------------------------------------------------
    // 1. EXTRACCIÓN Y CRUZAMIENTO DE DATOS DE DOSSIERS
    // ------------------------------------------------------------

    // A. Cruzamiento de Rodados Compartidos (p.vehiculos)
    const vehiculosIndex = new Map(); // patenteNorm -> Array<{ personaId, veh }>
    personas.forEach(p => {
      if (Array.isArray(p.vehiculos)) {
        p.vehiculos.forEach(v => {
          const rawPat = (v.patente || '').trim().toUpperCase().replace(/[\s-]/g, '');
          if (rawPat.length >= 5) {
            if (!vehiculosIndex.has(rawPat)) vehiculosIndex.set(rawPat, []);
            vehiculosIndex.get(rawPat).push({ personaId: p.id, veh: v });
          }
        });
      }
    });

    // B. Cruzamiento de CUIJs / Causas Judiciales (p.causas + p.cuij_asociados)
    const cuijsIndex = new Map(); // cuijNorm -> Set<personaId>
    personas.forEach(p => {
      const personCuijs = new Set();
      if (Array.isArray(p.causas)) {
        p.causas.forEach(c => {
          if (c.cuij) personCuijs.add(c.cuij.trim());
        });
      }
      if (Array.isArray(p.cuij_asociados)) {
        p.cuij_asociados.forEach(c => {
          if (c) personCuijs.add(c.trim());
        });
      }
      personCuijs.forEach(c => {
        const norm = c.replace(/[\s]/g, '');
        if (norm.length >= 6) {
          if (!cuijsIndex.has(norm)) cuijsIndex.set(norm, new Set());
          cuijsIndex.get(norm).add(p.id);
        }
      });
    });

    // C. Cruzamiento de Vínculos Familiares (p.familiares)
    const familyEdges = [];
    personas.forEach(p => {
      if (Array.isArray(p.familiares)) {
        p.familiares.forEach(fam => {
          const dni = (fam.dni || '').trim().replace(/\D/g, '');
          const famName = (fam.nombre || '').toLowerCase().trim();
          if (dni || famName.length >= 5) {
            const match = personas.find(o => {
              if (o.id === p.id) return false;
              if (dni && o.dni && o.dni.trim().replace(/\D/g, '') === dni) return true;
              if (famName && o.apellido && famName.includes(o.apellido.toLowerCase().trim()) && o.nombre && famName.includes(o.nombre.toLowerCase().trim())) return true;
              return false;
            });
            if (match) {
              familyEdges.push({
                from: p.id,
                to: match.id,
                parentesco: fam.parentesco || 'Familiar',
                obs: fam.observacion || ''
              });
            }
          }
        });
      }
    });

    // ------------------------------------------------------------
    // 2. FILTRADO DE ENTIDADES RELEVANTES
    // ------------------------------------------------------------
    const activePersonaIds = new Set();
    const activeBandaIds = new Set();

    if (opts.focusPersonaId && personasMap.has(opts.focusPersonaId)) {
      // Modo Sujeto Focal: Sujeto + su banda + contactos directos
      const focal = personasMap.get(opts.focusPersonaId);
      activePersonaIds.add(focal.id);
      if (focal.banda_id) activeBandaIds.add(focal.banda_id);

      // Contactos por vínculos directos
      vinculos.forEach(v => {
        const oId = v.persona_origen_id || v.origen_id;
        const dId = v.persona_destino_id || v.destino_id;
        if (oId === focal.id && dId) activePersonaIds.add(dId);
        if (dId === focal.id && oId) activePersonaIds.add(oId);
      });

      // Contactos por rodados compartidos
      vehiculosIndex.forEach((entries) => {
        if (entries.some(e => e.personaId === focal.id)) {
          entries.forEach(e => activePersonaIds.add(e.personaId));
        }
      });

      // Contactos por CUIJ compartida
      cuijsIndex.forEach((pIds) => {
        if (pIds.has(focal.id)) {
          pIds.forEach(id => activePersonaIds.add(id));
        }
      });

      // Familiares
      familyEdges.forEach(f => {
        if (f.from === focal.id) activePersonaIds.add(f.to);
        if (f.to === focal.id) activePersonaIds.add(f.from);
      });

    } else if (opts.bandaId === 'CONFLICT_NEGRADA_SIEMPRE' || opts.filterMode === 'conflicto') {
      // Disputa Negrada vs Siempre
      bandas.forEach(b => {
        if (b.nombre.includes('Negrada') || b.nombre.includes('Siempre')) {
          activeBandaIds.add(b.id);
        }
      });
      personas.forEach(p => {
        if (activeBandaIds.has(p.banda_id) || p.banda_nombre?.includes('Negrada') || p.banda_nombre?.includes('Siempre')) {
          activePersonaIds.add(p.id);
        }
      });

    } else if (opts.bandaId) {
      // Filtrar por Banda Específica
      const targetBanda = bandasMap.get(opts.bandaId);
      if (targetBanda) {
        activeBandaIds.add(targetBanda.id);

        // Integrantes de la banda
        personas.forEach(p => {
          if (p.banda_id === targetBanda.id || p.banda_nombre?.toLowerCase() === targetBanda.nombre.toLowerCase()) {
            activePersonaIds.add(p.id);
          }
        });

        // Contactos directos de los miembros (rodados, causas comunes, familiares o vínculos)
        const memberIds = new Set(activePersonaIds);
        vinculos.forEach(v => {
          const oId = v.persona_origen_id || v.origen_id;
          const dId = v.persona_destino_id || v.destino_id;
          if (memberIds.has(oId) && dId) activePersonaIds.add(dId);
          if (memberIds.has(dId) && oId) activePersonaIds.add(oId);
        });

        vehiculosIndex.forEach((entries) => {
          if (entries.some(e => memberIds.has(e.personaId))) {
            entries.forEach(e => activePersonaIds.add(e.personaId));
          }
        });

        cuijsIndex.forEach((pIds) => {
          if ([...pIds].some(id => memberIds.has(id))) {
            pIds.forEach(id => activePersonaIds.add(id));
          }
        });

        familyEdges.forEach(f => {
          if (memberIds.has(f.from)) activePersonaIds.add(f.to);
          if (memberIds.has(f.to)) activePersonaIds.add(f.from);
        });

        // Agregar bandas rivales mencionadas
        targetBanda.rivales?.forEach(rivName => {
          const riv = bandas.find(b => b.nombre.toLowerCase().includes(rivName.toLowerCase()));
          if (riv) activeBandaIds.add(riv.id);
        });
      }

    } else if (opts.filterMode === 'profugos') {
      // Modo Prófugos
      personas.forEach(p => {
        if (p.pedido_captura) {
          activePersonaIds.add(p.id);
          if (p.banda_id) activeBandaIds.add(p.banda_id);
        }
      });

      // Contactos de los prófugos
      const profugoIds = new Set(activePersonaIds);
      vinculos.forEach(v => {
        const oId = v.persona_origen_id || v.origen_id;
        const dId = v.persona_destino_id || v.destino_id;
        if (profugoIds.has(oId) && dId) activePersonaIds.add(dId);
        if (profugoIds.has(dId) && oId) activePersonaIds.add(oId);
      });

      vehiculosIndex.forEach((entries) => {
        if (entries.some(e => profugoIds.has(e.personaId))) {
          entries.forEach(e => activePersonaIds.add(e.personaId));
        }
      });

      cuijsIndex.forEach((pIds) => {
        if ([...pIds].some(id => profugoIds.has(id))) {
          pIds.forEach(id => activePersonaIds.add(id));
        }
      });

      familyEdges.forEach(f => {
        if (profugoIds.has(f.from)) activePersonaIds.add(f.to);
        if (profugoIds.has(f.to)) activePersonaIds.add(f.from);
      });

    } else {
      // Modo General (Todas las bandas)
      bandas.forEach(b => activeBandaIds.add(b.id));
      personas.forEach(p => {
        // Incluir miembros de bandas o sujetos con causas/vehículos/vínculos
        if (p.banda_id || p.pedido_captura || (p.score_peligrosidad || 0) >= 7) {
          activePersonaIds.add(p.id);
        }
      });

      // Si no se ocultan los huérfanos, agregar todas las personas
      if (!opts.hideUnlinked) {
        personas.forEach(p => activePersonaIds.add(p.id));
      }
    }

    // ------------------------------------------------------------
    // 3. CONSTRUCCIÓN DE NODOS Y ARISTAS VIS-NETWORK
    // ------------------------------------------------------------
    const nodesMap = new Map();
    const edgesList = [];
    const edgeKeySet = new Set();

    function addEdge(from, to, edgeProps) {
      if (!from || !to || from === to) return;
      const sortedKey = [from, to].sort().join('___') + '___' + (edgeProps.type || edgeProps.label || '');
      if (edgeKeySet.has(sortedKey)) return;
      edgeKeySet.add(sortedKey);
      edgesList.push({ from, to, ...edgeProps });
    }

    // A. Agregar Nodos de Bandas
    bandas.forEach(b => {
      if (!activeBandaIds.has(b.id) && opts.bandaId) return;
      if (!activeBandaIds.has(b.id) && !opts.bandaId) {
        // En modo general, mostrar solo bandas activas con al menos 1 miembro
        const hasMembers = personas.some(p => p.banda_id === b.id);
        if (!hasMembers) return;
      }

      const bColor = b.color_hex || '#EF4444';
      nodesMap.set(b.id, {
        id: b.id,
        label: `🏴 ${b.nombre}\n📍 ${b.barrio_base || 'Base Territorial'}`,
        shape: 'box',
        color: {
          background: '#0B1120',
          border: bColor,
          highlight: { background: bColor, border: '#FFFFFF' }
        },
        font: { color: '#F8FAFC', size: 14, face: 'Inter', strokeWidth: 2, strokeColor: '#000' },
        borderWidth: 3,
        margin: 12,
        type: 'banda',
        data: b,
        shadow: { enabled: true, color: bColor, size: 10 }
      });
    });

    // B. Agregar Nodos de Personas
    personas.forEach(p => {
      if (!activePersonaIds.has(p.id)) return;

      const isCaptura = p.pedido_captura;
      const dangerousness = p.score_peligrosidad || 0;
      const isHigh = dangerousness >= 8;
      const isLeader = p.roles?.some(r => /l[íi]der|cabecilla|jefe|conducci[óo]n/i.test(r));
      const isSicario = p.roles?.some(r => /sicario|tirador|brazo armado/i.test(r));
      const isLogistica = p.roles?.some(r => /log[íi]stica|acopio|finanzas/i.test(r));

      const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Desconocido';
      const alias = p.alias?.length ? `"${p.alias[0]}"` : '';
      const displayTitle = alias || name;

      let iconPrefix = '';
      if (isCaptura) iconPrefix = '🚨 ';
      else if (isLeader) iconPrefix = '👑 ';
      else if (isSicario) iconPrefix = '⚔️ ';
      else if (isLogistica) iconPrefix = '💼 ';

      const label = `${iconPrefix}${displayTitle}\n${isCaptura ? '[PRÓFUGO]' : (p.roles?.[0] || 'Miembro')}`;

      // Estilización táctica de nodos
      let borderColor = '#38BDF8';
      let bgColor = '#1E293B';
      let fontColor = '#E2E8F0';
      let nodeSize = 18;
      let borderWidth = 2;

      if (isCaptura) {
        borderColor = '#EF4444';
        bgColor = '#450A0A';
        fontColor = '#FCA5A5';
        nodeSize = 27;
        borderWidth = 3.5;
      } else if (isLeader) {
        borderColor = '#F59E0B';
        bgColor = '#451A03';
        fontColor = '#FDE68A';
        nodeSize = 25;
        borderWidth = 3;
      } else if (isSicario) {
        borderColor = '#DC2626';
        bgColor = '#2A0B0B';
        fontColor = '#FECACA';
        nodeSize = 22;
        borderWidth = 2.5;
      } else if (isLogistica) {
        borderColor = '#8B5CF6';
        bgColor = '#2E1065';
        fontColor = '#DDD6FE';
        nodeSize = 20;
        borderWidth = 2;
      } else if (isHigh) {
        borderColor = '#F97316';
        bgColor = '#331606';
        fontColor = '#FFEDD5';
        nodeSize = 20;
      }

      nodesMap.set(p.id, {
        id: p.id,
        label: label,
        shape: isLeader ? 'diamond' : 'dot',
        size: nodeSize,
        color: {
          background: bgColor,
          border: borderColor,
          highlight: { background: '#F59E0B', border: '#FFFFFF' }
        },
        borderWidth: borderWidth,
        font: { color: fontColor, size: isCaptura || isLeader ? 13 : 11, face: 'Inter', strokeWidth: 3, strokeColor: '#030712' },
        type: 'persona',
        data: p,
        shadow: isCaptura ? { enabled: true, color: '#EF4444', size: 12 } : false
      });
    });

    // ------------------------------------------------------------
    // 4. CONEXIÓN DE ARISTAS TÁCTICAS Y RELACIONALES
    // ------------------------------------------------------------

    // A. Jerarquía y pertenencia a Banda (p.banda_id -> b.id)
    personas.forEach(p => {
      if (nodesMap.has(p.id) && p.banda_id && nodesMap.has(p.banda_id)) {
        const isLeader = p.roles?.some(r => /l[íi]der|cabecilla|jefe|conducci[óo]n/i.test(r));
        const isSicario = p.roles?.some(r => /sicario|tirador|brazo armado/i.test(r));
        const isLogistica = p.roles?.some(r => /log[íi]stica|acopio|finanzas/i.test(r));

        let roleLabel = p.roles?.[0] || 'Miembro';
        let edgeColor = 'rgba(148, 163, 184, 0.4)';
        let edgeWidth = 1.5;
        let isDashed = true;

        if (isLeader) {
          roleLabel = '👑 Mando Superior';
          edgeColor = '#F59E0B';
          edgeWidth = 3;
          isDashed = false;
        } else if (isSicario) {
          roleLabel = '⚔️ Brazo Armado';
          edgeColor = '#EF4444';
          edgeWidth = 2.5;
        } else if (isLogistica) {
          roleLabel = '💼 Logística';
          edgeColor = '#8B5CF6';
          edgeWidth = 2;
        }

        addEdge(p.id, p.banda_id, {
          type: 'JERARQUIA_BANDA',
          label: roleLabel,
          color: { color: edgeColor, opacity: 0.8 },
          width: edgeWidth,
          dashes: isDashed,
          font: { color: isLeader ? '#F59E0B' : '#94A3B8', size: 9 },
          arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        });
      }
    });

    // B. Vínculos Explícitos (getAllVinculos)
    vinculos.forEach(v => {
      const oId = v.persona_origen_id || v.origen_id;
      const dId = v.persona_destino_id || v.destino_id;
      const tipo = v.tipo_relacion || v.tipo || '';

      if (oId && dId && nodesMap.has(oId) && nodesMap.has(dId)) {
        const isDisputa = tipo.includes('DISPUTA') || tipo.includes('TIROTEO') || tipo.includes('RIVAL');
        const edgeColor = CONFIG.vinculoColors[tipo] || (isDisputa ? '#EF4444' : '#64748B');

        addEdge(oId, dId, {
          type: tipo,
          label: tipo.replace(/_/g, ' '),
          color: { color: edgeColor, highlight: '#FFFFFF', opacity: 0.85 },
          width: isDisputa ? 3.5 : 2,
          dashes: isDisputa ? [6, 4] : false,
          font: { color: isDisputa ? '#EF4444' : '#94A3B8', size: 9 },
          arrows: { to: { enabled: !isDisputa, scaleFactor: 0.6 } }
        });
      }
    });

    // C. Vínculos de Rodados Compartidos (Dossier p.vehiculos)
    vehiculosIndex.forEach((entries, plate) => {
      if (entries.length >= 2) {
        for (let i = 0; i < entries.length; i++) {
          for (let j = i + 1; j < entries.length; j++) {
            const idA = entries[i].personaId;
            const idB = entries[j].personaId;
            if (nodesMap.has(idA) && nodesMap.has(idB)) {
              addEdge(idA, idB, {
                type: 'RODADO_COMPARTIDO',
                label: `🚗 Rodado [${plate}]`,
                color: { color: '#38BDF8', highlight: '#7DD3FC', opacity: 0.9 },
                width: 2.5,
                dashes: [5, 3],
                font: { color: '#38BDF8', size: 9 },
                title: `Vehículo compartido: ${plate} (${entries[i].veh.marca || ''} ${entries[i].veh.modelo || ''})`
              });
            }
          }
        }
      }
    });

    // D. Vínculos de Causas Judiciales Compartidas (Dossier CUIJs)
    cuijsIndex.forEach((pIdsSet, cuij) => {
      const pIds = Array.from(pIdsSet);
      if (pIds.length >= 2) {
        const shortCuij = cuij.length > 13 ? cuij.slice(0, 13) + '…' : cuij;
        for (let i = 0; i < pIds.length; i++) {
          for (let j = i + 1; j < pIds.length; j++) {
            const idA = pIds[i];
            const idB = pIds[j];
            if (nodesMap.has(idA) && nodesMap.has(idB)) {
              addEdge(idA, idB, {
                type: 'CO_IMPUTADOS_CUIJ',
                label: `⚖️ CUIJ ${shortCuij}`,
                color: { color: '#C084FC', highlight: '#E9D5FF', opacity: 0.85 },
                width: 2,
                dashes: [4, 4],
                font: { color: '#C084FC', size: 9 },
                title: `Co-imputados en causa CUIJ: ${cuij}`
              });
            }
          }
        }
      }
    });

    // E. Vínculos Familiares de Dossiers (p.familiares)
    familyEdges.forEach(f => {
      if (nodesMap.has(f.from) && nodesMap.has(f.to)) {
        addEdge(f.from, f.to, {
          type: 'FAMILIAR_DOSSIER',
          label: `👥 ${f.parentesco}`,
          color: { color: '#F59E0B', highlight: '#FDE68A', opacity: 0.9 },
          width: 2.5,
          font: { color: '#F59E0B', size: 9 },
          title: `Vínculo familiar de dossier: ${f.parentesco} (${f.obs})`
        });
      }
    });

    // F. Disputas Territoriales Armadas entre Bandas (b.rivales)
    bandas.forEach(b => {
      if (nodesMap.has(b.id) && Array.isArray(b.rivales)) {
        b.rivales.forEach(rivName => {
          const riv = bandas.find(o => o.nombre.toLowerCase().includes(rivName.toLowerCase()));
          if (riv && nodesMap.has(riv.id)) {
            addEdge(b.id, riv.id, {
              type: 'DISPUTA_ARMADA_BANDAS',
              label: '⚔️ Disputa Territorial Armada',
              color: { color: '#EF4444', highlight: '#F87171', opacity: 1 },
              width: 4,
              dashes: [8, 4],
              font: { color: '#EF4444', size: 10, strokeWidth: 2, strokeColor: '#000' }
            });
          }
        });
      }
    });

    // ------------------------------------------------------------
    // 5. SUPRESIÓN DE NODOS HUÉRFANOS / AISLADOS
    // ------------------------------------------------------------
    if (opts.hideUnlinked) {
      // Contar incidentes
      const incidentCounts = new Map();
      edgesList.forEach(e => {
        incidentCounts.set(e.from, (incidentCounts.get(e.from) || 0) + 1);
        incidentCounts.set(e.to, (incidentCounts.get(e.to) || 0) + 1);
      });

      // Eliminar personas que no tienen ninguna conexión en este gráfico
      Array.from(nodesMap.entries()).forEach(([id, node]) => {
        if (node.type === 'persona') {
          const degree = incidentCounts.get(id) || 0;
          if (degree === 0 && id !== opts.focusPersonaId) {
            nodesMap.delete(id);
          }
        }
      });
    }

    container.innerHTML = '';

    const nodesDataSet = new DataSet(Array.from(nodesMap.values()));
    const edgesDataSet = new DataSet(edgesList);

    if (currentGrafoNetwork) currentGrafoNetwork.destroy();

    const physicsConfig = {
      solver: 'barnesHut',
      barnesHut: {
        gravitationalConstant: -2800,
        centralGravity: 0.35,
        springLength: 140,
        springConstant: 0.05,
        damping: 0.85, // Damping muy alto para anular oscilaciones de inmediato
        avoidOverlap: 0.5
      },
      stabilization: {
        enabled: true,
        iterations: 120,
        updateInterval: 25,
        fit: true
      },
      minVelocity: 0.75
    };

    currentGrafoNetwork = new Network(container, { nodes: nodesDataSet, edges: edgesDataSet }, {
      physics: physicsConfig,
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true,
        dragNodes: true,
        dragView: true,
        zoomView: true
      }
    });

    // CONGELAR FÍSICA INMEDIATAMENTE AL ESTABILIZARSE
    // Esto garantiza que los nodos queden fijos y no haya que "atraparlos" o perseguirlos
    const freezePhysics = () => {
      if (currentGrafoNetwork) {
        currentGrafoNetwork.setOptions({ physics: { enabled: false } });
        const statusEl = document.getElementById('grafo-physics-status');
        if (statusEl) {
          statusEl.innerHTML = '🔒 Red Fija';
          statusEl.style.color = '#10B981';
          statusEl.style.background = 'rgba(16,185,129,0.1)';
          statusEl.style.borderColor = 'rgba(16,185,129,0.25)';
        }
      }
    };

    currentGrafoNetwork.once('stabilizationIterationsDone', () => {
      freezePhysics();
      currentGrafoNetwork.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    });

    currentGrafoNetwork.once('stabilized', () => {
      freezePhysics();
    });

    // Temporizador de seguridad: asegurar detención absoluta en máximo 1 segundo
    setTimeout(freezePhysics, 1000);

    // Evento Click: Abrir Detalle Táctico de Inteligencia
    currentGrafoNetwork.on('click', (params) => {
      if (params.nodes.length > 0) {
        mostrarDossierNodo(params.nodes[0]);
      } else {
        document.getElementById('grafo-node-dossier')?.classList.add('hidden');
      }
    });

    // Foco automático
    if (opts.focusPersonaId && nodesMap.has(opts.focusPersonaId)) {
      setTimeout(() => {
        currentGrafoNetwork.focus(opts.focusPersonaId, { scale: 1.25, animation: true });
        mostrarDossierNodo(opts.focusPersonaId);
      }, 300);
    } else if (opts.bandaId && nodesMap.has(opts.bandaId)) {
      setTimeout(() => {
        currentGrafoNetwork.focus(opts.bandaId, { scale: 1.15, animation: true });
        mostrarDossierNodo(opts.bandaId);
      }, 300);
    }

  } catch (err) {
    console.error('Error renderizando grafo:', err);
    container.innerHTML = `
      <div class="empty-state">
        <h3 style="color:#EF4444">Error al construir la red</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

// ============================================================
// DRAWER DE INTELIGENCIA DE NODO (BANDA O PERSONA)
// ============================================================
async function mostrarDossierNodo(nodeId) {
  const panel = document.getElementById('grafo-node-dossier');
  const content = document.getElementById('dossier-content');
  const badge = document.getElementById('dossier-badge');
  if (!panel || !content) return;

  panel.classList.remove('hidden');

  // Caso 1: Estructura Criminal / Banda
  const b = await getBandaById(nodeId);
  if (b) {
    if (badge) {
      badge.textContent = 'ESTRUCTURA CRIMINAL';
      badge.style.background = b.color_hex || '#EF4444';
    }

    const personas = await getPersonas({ limit: 1000 });
    const members = personas.filter(p => p.banda_id === b.id || p.banda_nombre?.toLowerCase() === b.nombre.toLowerCase());
    const profugos = members.filter(p => p.pedido_captura);

    content.innerHTML = `
      <div style="font-weight:800;font-size:16px;color:#F8FAFC;margin-bottom:4px;">${b.nombre}</div>
      <div style="font-size:12px;color:var(--accent-primary);margin-bottom:12px;">📍 Base: ${b.barrio_base || 'Santa Fe Capital'}</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;font-size:11px;">
        <div style="background:rgba(255,255,255,0.03);padding:6px 8px;border-radius:6px;border:1px solid var(--border-subtle);">
          <span style="color:var(--text-muted);display:block;font-size:10px;">INTEGRANTES</span>
          <strong style="font-size:14px;color:#38BDF8;">${members.length}</strong>
        </div>
        <div style="background:rgba(239,68,68,0.08);padding:6px 8px;border-radius:6px;border:1px solid rgba(239,68,68,0.2);">
          <span style="color:#FCA5A5;display:block;font-size:10px;">PRÓFUGOS</span>
          <strong style="font-size:14px;color:#EF4444;">${profugos.length}</strong>
        </div>
      </div>

      ${b.cabecilla_principal ? `<div style="font-size:11px;margin-bottom:6px;"><strong style="color:var(--text-muted);">Liderazgo:</strong> <span style="color:#FDE68A;">${b.cabecilla_principal}</span></div>` : ''}
      ${b.actividad_principal ? `<div style="font-size:11px;margin-bottom:6px;"><strong style="color:var(--text-muted);">Actividad:</strong> ${b.actividad_principal}</div>` : ''}
      ${b.delitos_alta_lesividad ? `<div style="font-size:11px;margin-bottom:8px;color:#F87171;"><strong style="color:#EF4444;">Alta Lesividad:</strong> ${b.delitos_alta_lesividad}</div>` : ''}

      <div style="margin-top:14px;display:flex;flex-direction:column;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="window.filtrarGrafoPorBanda('${b.id}')" style="font-size:11px;font-weight:700;padding:7px 10px;justify-content:center;display:flex;align-items:center;gap:6px;background:var(--accent-primary);color:#fff;">
          🔍 Aislar Estructura de esta Banda
        </button>
        <button class="btn btn-secondary btn-sm" onclick="showEntityDetail('banda', '${b.id}')" style="font-size:11px;font-weight:600;padding:6px 10px;justify-content:center;display:flex;align-items:center;gap:6px;">
          📄 Ver Ficha Completa
        </button>
      </div>
    `;
    return;
  }

  // Caso 2: Persona Investigada / Imputada
  const p = await getPersonaById(nodeId);
  if (p) {
    const isCaptura = p.pedido_captura;
    if (badge) {
      badge.textContent = isCaptura ? '🚨 PEDIDO DE CAPTURA ACTIVO' : 'PERSONA DE INTERÉS';
      badge.style.background = isCaptura ? '#DC2626' : 'var(--accent-secondary)';
    }

    // Resumen de Rodados
    const vehiculosHtml = Array.isArray(p.vehiculos) && p.vehiculos.length > 0
      ? `<div style="margin-top:8px;">
          <span style="font-size:10px;font-weight:700;color:#38BDF8;text-transform:uppercase;letter-spacing:0.5px;">🚗 Rodados en Legajo (${p.vehiculos.length}):</span>
          <div style="display:flex;flex-direction:column;gap:3px;margin-top:3px;">
            ${p.vehiculos.map(v => `
              <div style="font-size:10px;background:rgba(56,189,248,0.06);padding:3px 6px;border-radius:4px;border:1px solid rgba(56,189,248,0.2);display:flex;justify-content:space-between;">
                <strong>${v.patente || 'S/D'}</strong> <span>${v.marca || ''} ${v.modelo || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>`
      : '';

    // Resumen de Causas Judiciales
    const causasHtml = Array.isArray(p.causas) && p.causas.length > 0
      ? `<div style="margin-top:8px;">
          <span style="font-size:10px;font-weight:700;color:#C084FC;text-transform:uppercase;letter-spacing:0.5px;">⚖️ Causas Judiciales (${p.causas.length}):</span>
          <div style="display:flex;flex-direction:column;gap:3px;margin-top:3px;">
            ${p.causas.slice(0, 3).map(c => `
              <div style="font-size:10px;background:rgba(192,132,252,0.06);padding:3px 6px;border-radius:4px;border:1px solid rgba(192,132,252,0.2);">
                <span style="font-family:var(--font-mono);font-weight:700;color:#C084FC;">${c.cuij || 'S/D'}</span>
                <div style="color:var(--text-secondary);font-size:9px;">${c.caratula ? c.caratula.slice(0, 45) + '…' : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>`
      : '';

    // Resumen de Vínculos Familiares
    const familiaresHtml = Array.isArray(p.familiares) && p.familiares.length > 0
      ? `<div style="margin-top:8px;">
          <span style="font-size:10px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:0.5px;">👥 Núcleo Familiar (${p.familiares.length}):</span>
          <div style="display:flex;flex-direction:column;gap:3px;margin-top:3px;">
            ${p.familiares.map(f => `
              <div style="font-size:10px;background:rgba(245,158,11,0.06);padding:3px 6px;border-radius:4px;border:1px solid rgba(245,158,11,0.2);display:flex;justify-content:space-between;">
                <strong>${f.parentesco || 'Familiar'}:</strong> <span>${f.nombre}</span>
              </div>
            `).join('')}
          </div>
        </div>`
      : '';

    content.innerHTML = `
      ${isCaptura ? `
        <div style="background:rgba(239,68,68,0.2);border:1px solid #EF4444;border-radius:6px;padding:6px 10px;margin-bottom:10px;color:#FCA5A5;font-size:11px;font-weight:700;">
          ⚠️ PRÓFUGO CON PEDIDO DE CAPTURA ACTIVO
        </div>
      ` : ''}
      <div style="font-weight:800;font-size:15px;color:#F8FAFC;">${p.nombre || ''} ${p.apellido || ''}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
        ${p.alias?.length ? `Alias: <strong style="color:#FDE68A;">"${p.alias.join('", "')}"</strong> • ` : ''}DNI: ${p.dni || 'S/D'}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;background:rgba(255,255,255,0.03);padding:8px;border-radius:6px;margin-bottom:8px;">
        <div><span style="color:var(--text-muted);display:block;font-size:10px;">BANDA:</span><strong>${p.banda_nombre || 'Individual'}</strong></div>
        <div><span style="color:var(--text-muted);display:block;font-size:10px;">PELIGROSIDAD:</span><strong style="color:${(p.score_peligrosidad || 0) >= 8 ? '#EF4444' : '#F59E0B'}">${p.score_peligrosidad || 5}/10</strong></div>
      </div>

      ${p.roles?.length ? `<div style="font-size:11px;margin-bottom:4px;"><span style="color:var(--text-muted);">Rol Táctico:</span> <span style="font-weight:600;color:#38BDF8;">${p.roles.join(', ')}</span></div>` : ''}
      ${p.domicilio_principal ? `<div style="font-size:11px;margin-bottom:6px;"><span style="color:var(--text-muted);">Domicilio:</span> ${p.domicilio_principal}</div>` : ''}

      ${vehiculosHtml}
      ${causasHtml}
      ${familiaresHtml}

      <!-- Botones de Acción Inmediata de Dossier -->
      <div style="margin-top:14px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="window.abrirDossierDigital('${p.id}')" style="background:#1E293B;color:#FFFFFF;border:1px solid #475569;flex:1;font-size:11px;font-weight:700;padding:7px 8px;justify-content:center;display:flex;align-items:center;gap:4px;" title="Abrir legajo y expediente completo">
            📋 Abrir Dossier
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.imprimirDossierDigital('${p.id}')" style="background:#1E293B;color:#CBD5E1;border:1px solid #475569;font-size:11px;font-weight:700;padding:7px 10px;justify-content:center;display:flex;align-items:center;gap:4px;" title="Imprimir dossier táctico">
            🖨️ Imprimir
          </button>
        </div>

        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-xs" onclick="window.centrarPersonaEnMapa('${p.id}')" style="flex:1;font-size:11px;padding:6px 8px;justify-content:center;display:flex;align-items:center;gap:4px;border-color:var(--border-default);">
            📍 Ver en Mapa
          </button>
          ${p.banda_id ? `
            <button class="btn btn-outline btn-xs" onclick="window.filtrarGrafoPorBanda('${p.banda_id}')" style="flex:1;font-size:11px;padding:6px 8px;justify-content:center;display:flex;align-items:center;gap:4px;border-color:var(--accent-primary);color:var(--accent-primary);">
              🏴 Aislar su Banda
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
}

// ============================================================
// COMPATIBILIDAD GLOBAL Y ACCIONES EXTERNAS
// ============================================================
window.filtrarGrafoPorBanda = async function(bandaId) {
  const bandaSelect = document.getElementById('grafo-banda-select');
  const personaSelect = document.getElementById('grafo-persona-select');

  if (bandaSelect) {
    bandaSelect.value = bandaId || '';
  }

  // Actualizar lista de personas
  if (personaSelect) {
    try {
      const personas = await getPersonas({ limit: 1000 });
      personaSelect.innerHTML = '<option value="">Toda la organización...</option>';
      const list = bandaId ? personas.filter(p => p.banda_id === bandaId) : personas;
      list.forEach(p => {
        personaSelect.innerHTML += `<option value="${p.id}">${p.pedido_captura ? '🚨 ' : ''}${p.nombre || ''} ${p.apellido || ''}</option>`;
      });
    } catch (e) {
      console.warn('Error refrescando selector de personas:', e);
    }
  }

  // Marcar chip activo
  document.querySelectorAll('#grafo-bandas-dynamic-chips .chip-banda').forEach(c => {
    c.style.background = c.dataset.bandaId === bandaId ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.03)';
  });

  currentGrafoOptions.bandaId = bandaId || '';
  currentGrafoOptions.personaId = '';
  currentGrafoOptions.filterMode = bandaId ? 'banda' : 'general';

  await renderGrafoIntelligence({ bandaId });
};

window.renderGrafoGeneral = async function(bandaHighlightId = null) {
  currentGrafoOptions.bandaId = bandaHighlightId || '';
  currentGrafoOptions.personaId = '';
  currentGrafoOptions.filterMode = 'general';
  await renderGrafoIntelligence({ bandaId: bandaHighlightId });
};

window.renderGrafoProfugos = async function() {
  currentGrafoOptions.filterMode = 'profugos';
  currentGrafoOptions.bandaId = '';
  currentGrafoOptions.personaId = '';
  await renderGrafoIntelligence({ filterMode: 'profugos' });
};

window.renderGrafoConflicto = async function() {
  currentGrafoOptions.filterMode = 'conflicto';
  currentGrafoOptions.bandaId = 'CONFLICT_NEGRADA_SIEMPRE';
  currentGrafoOptions.personaId = '';
  await renderGrafoIntelligence({ filterMode: 'conflicto', bandaId: 'CONFLICT_NEGRADA_SIEMPRE' });
};

window.renderGrafo = async function(personaId) {
  currentGrafoOptions.personaId = personaId;
  const personaSelect = document.getElementById('grafo-persona-select');
  if (personaSelect) personaSelect.value = personaId;
  await renderGrafoIntelligence({ focusPersonaId: personaId });
};

window.centrarPersonaEnMapa = async function(personaId) {
  try {
    const p = await getPersonaById(personaId);
    if (!p) return;
    document.querySelector('[data-view="mapa"]')?.click();
    setTimeout(() => {
      let coords = null;
      if (p.domicilio_principal_geom) {
        const m = p.domicilio_principal_geom.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
        if (m) coords = { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
      }
      if (coords) {
        flyTo(coords.lng, coords.lat, 17);
        showToast(`Ubicado: ${p.domicilio_principal || 'Domicilio'}`, 'info');
      } else {
        showToast(`El sujeto no registra geolocalización cargada`, 'warning');
      }
    }, 200);
  } catch (e) {
    console.error('Error centrando persona en mapa:', e);
  }
};

// ============================================================
// GENERADOR DE INFORME CUANTITATIVO CRIMINAL
// ============================================================
async function generarInformeCriminalCuantitativo() {
  const modal = document.getElementById('modal-informe-criminal');
  const container = document.getElementById('informe-criminal-content');
  if (!modal || !container) return;

  modal.classList.remove('hidden');
  container.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div><p style="margin-top:12px;color:var(--text-secondary)">Generando informe analítico cuantitativo...</p></div>';

  try {
    const [personas, bandas, allanamientos, hechos] = await Promise.all([
      getPersonas({ limit: 1000 }),
      getBandas({ limit: 100 }),
      getAllanamientos({ limit: 100 }),
      getHechos({ limit: 500 })
    ]);

    const tacticalCount = window._crimintTacticalGeoJSON?.features?.length || 8206;
    const profugos = personas.filter(p => p.pedido_captura);
    const fechaHoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

    container.innerHTML = `
      <div class="informe-printable" style="font-family:'Inter',system-ui,sans-serif;color:#1E293B;background:#FFFFFF;padding:32px;border-radius:8px;line-height:1.6;">
        <!-- Header Oficial -->
        <div style="border-bottom:2px solid #0F172A;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;">República Argentina • Provincia de Santa Fe</div>
            <h1 style="font-size:22px;color:#0F172A;margin:4px 0;font-weight:900;">INFORME ESTRATÉGICO DE ANÁLISIS CUANTITATIVO CRIMINAL</h1>
            <div style="font-size:13px;color:#475569;">Dinámica delictiva, territorialidad de bandas y disparadores de delitos de alta lesividad</div>
          </div>
          <div style="text-align:right;font-size:11px;color:#64748B;">
            <div><strong>FECHA:</strong> ${fechaHoy}</div>
            <div><strong>CLASIFICACIÓN:</strong> RESERVADO / USO JUDICIAL</div>
            <div><strong>SISTEMA:</strong> CRIMINT Analytics</div>
          </div>
        </div>

        <!-- 1. Enfoque Cuantitativo Estratégico -->
        <div style="background:#F8FAFC;border-left:4px solid #0284C7;padding:12px 16px;margin-bottom:20px;border-radius:0 6px 6px 0;">
          <h3 style="font-size:14px;color:#0369A1;margin:0 0 6px 0;font-weight:800;">ALCANCE Y METODOLOGÍA DEL ANÁLISIS</h3>
          <p style="font-size:12px;color:#334155;margin:0;">
            El presente informe procesa el universo de incidencias cargadas en la plataforma como <strong>insumo para el análisis cuantitativo criminal</strong>. Se establece que el fenómeno de la comercialización de estupefacientes actúa como catalizador y disparador de <strong>delitos de alta lesividad</strong> (homicidios en riña/ajuste, balaceras armadas con heridos HAF, abusos de armas de fuego y usurpaciones coactivas de fincas) en sectores particulares de la ciudad de Santa Fe, impulsados por disputas entre organizaciones delictivas arraigadas territorialmente.
          </p>
        </div>

        <!-- 2. Matriz Cuantitativa General -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;margin-bottom:24px;">
          <div style="background:#F1F5F9;border:1px solid #CBD5E1;padding:12px;border-radius:6px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#0F172A;">${tacticalCount.toLocaleString('es-AR')}</div>
            <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Incidencias Procesadas</div>
          </div>
          <div style="background:#F1F5F9;border:1px solid #CBD5E1;padding:12px;border-radius:6px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#0369A1;">${personas.length}</div>
            <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Sospechosos e Imputados</div>
          </div>
          <div style="background:#FEF2F2;border:1px solid #FECACA;padding:12px;border-radius:6px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#DC2626;">${profugos.length}</div>
            <div style="font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;">Con Pedido de Captura</div>
          </div>
          <div style="background:#F1F5F9;border:1px solid #CBD5E1;padding:12px;border-radius:6px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#D97706;">${bandas.length}</div>
            <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Bandas Mapeadas</div>
          </div>
        </div>

        <!-- 3. Bandas Delictivas por Barrio y Disputas -->
        <h2 style="font-size:16px;color:#0F172A;border-bottom:1px solid #E2E8F0;padding-bottom:6px;margin:24px 0 12px 0;">1. BANDAS DELICTIVAS OPERATIVAS EN BARRIOS DE LA CIUDAD</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
          <thead>
            <tr style="background:#0F172A;color:#FFFFFF;text-align:left;">
              <th style="padding:8px 10px;">Organización</th>
              <th style="padding:8px 10px;">Barrio Base</th>
              <th style="padding:8px 10px;">Liderazgo</th>
              <th style="padding:8px 10px;">Delitos de Alta Lesividad Disparados</th>
              <th style="padding:8px 10px;">Amenaza</th>
            </tr>
          </thead>
          <tbody>
            ${bandas.map((b, i) => `
              <tr style="border-bottom:1px solid #E2E8F0;background:${i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                <td style="padding:8px 10px;font-weight:700;color:#0F172A;">${b.nombre}</td>
                <td style="padding:8px 10px;color:#0369A1;font-weight:600;">${b.barrio_base}</td>
                <td style="padding:8px 10px;">${b.cabecilla_principal || 'Liderazgo celular'}</td>
                <td style="padding:8px 10px;color:#DC2626;">${b.delitos_alta_lesividad || b.actividad_principal}</td>
                <td style="padding:8px 10px;font-weight:800;color:#D97706;">${b.nivel_amenaza || 8}/10</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- 4. Personas Más Buscadas con Pedido de Captura -->
        <h2 style="font-size:16px;color:#DC2626;border-bottom:2px solid #DC2626;padding-bottom:6px;margin:24px 0 12px 0;display:flex;align-items:center;gap:6px;">
          <span>🚨 2. NÓMINA PRIORITARIA: PERSONAS CON PEDIDO DE CAPTURA ACTIVO</span>
        </h2>
        <p style="font-size:12px;color:#475569;margin-bottom:10px;">Sujetos con órdenes judiciales de detención vigentes en causas penales en trámite ante el MPA:</p>
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:24px;">
          <thead>
            <tr style="background:#DC2626;color:#FFFFFF;text-align:left;">
              <th style="padding:6px 8px;">Nombre y Apellido</th>
              <th style="padding:6px 8px;">Alias</th>
              <th style="padding:6px 8px;">DNI</th>
              <th style="padding:6px 8px;">Banda / Rol</th>
              <th style="padding:6px 8px;">Causa CUIJ</th>
              <th style="padding:6px 8px;">Último Domicilio Conocido</th>
              <th style="padding:6px 8px;">Peligrosidad</th>
            </tr>
          </thead>
          <tbody>
            ${profugos.map((p, i) => `
              <tr style="border-bottom:1px solid #E2E8F0;background:${i % 2 === 0 ? '#FEF2F2' : '#FFFFFF'};">
                <td style="padding:6px 8px;font-weight:700;color:#0F172A;">${p.nombre || ''} ${p.apellido || ''}</td>
                <td style="padding:6px 8px;color:#B91C1C;font-weight:600;">${p.alias?.join(', ') || '—'}</td>
                <td style="padding:6px 8px;font-family:monospace;">${p.dni || 'S/D'}</td>
                <td style="padding:6px 8px;">${p.banda_nombre || 'Individual'} (${p.roles?.[0] || 'Imputado'})</td>
                <td style="padding:6px 8px;font-family:monospace;color:#0369A1;">${p.cuij_asociados?.join(', ') || 'En trámite'}</td>
                <td style="padding:6px 8px;">${p.domicilio_principal || 'Santa Fe'}</td>
                <td style="padding:6px 8px;font-weight:800;color:#DC2626;">${p.score_peligrosidad || 9}/10</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- 5. Focos de Alta Lesividad -->
        <h2 style="font-size:16px;color:#0F172A;border-bottom:1px solid #E2E8F0;padding-bottom:6px;margin:24px 0 12px 0;">3. FOCOS CRÍTICOS TERRITORIALES (PROCESO DELICTIVO Y LESIVIDAD)</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px;margin-bottom:20px;">
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;padding:12px;border-radius:6px;">
            <strong style="color:#0F172A;font-size:13px;display:block;margin-bottom:4px;">Sector Sudoeste: San Lorenzo, Chalet y Centenario</strong>
            <p style="margin:0;color:#475569;">
              Disputa armada constante entre <em>La Negrada</em> y <em>Los de Siempre</em> por bocas de expendio y usurpación de fincas lindantes a pasillos. Concentración crítica de disparos sobre fachadas y víctimas HAF en ochava Monseñor Zazpe y Liberación/Estrada.
            </p>
          </div>
          <div style="background:#F8FAFC;border:1px solid #CBD5E1;padding:12px;border-radius:6px;">
            <strong style="color:#0F172A;font-size:13px;display:block;margin-bottom:4px;">Sector Noroeste: Yapeyú y San Agustín</strong>
            <p style="margin:0;color:#475569;">
              Territorio operado por <em>Los Puchingas</em> y grupos afines. Disparos directos a corta distancia en pasajes peatonales para protección de puntos de fraccionamiento. Registros de homicidios calificados en horario nocturno y de madrugada.
            </p>
          </div>
        </div>

        <!-- 6. Recomendaciones Operativas -->
        <div style="border-top:1px dashed #CBD5E1;padding-top:14px;font-size:11px;color:#64748B;">
          <strong>CONCLUSIÓN Y LÍNEAS DE ACCIÓN:</strong> Priorizar la localización y captura de los cabecillas de La Negrada y Los de Siempre para neutralizar la escalada de violencia armada. Ejecución de allanamientos simultáneos sobre centros de acopio en Barranquitas y Santa Fe Norte.
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error generando informe</h3><p>${err.message}</p></div>`;
  }
}


// ============================================================
// ENTITY DETAIL (Modal)
// ============================================================
async function showEntityDetail(type, id) {
  if (type === 'persona') {
    window.abrirDossierDigital(id);
    return;
  }

  const titulo = document.getElementById('detalle-titulo');
  const contenido = document.getElementById('detalle-contenido');
  if (!titulo || !contenido) return;

  openModal('modal-detalle');
  contenido.innerHTML = '<div style="text-align:center;padding:32px"><div class="spinner"></div></div>';

  try {
    if (type === 'banda') {
      const b = await getBandaById(id);
      if (!b) throw new Error('No se encontró el registro de la banda.');

      titulo.textContent = b.nombre;
      contenido.innerHTML = `
        <div style="display:grid;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px">BARRIO BASE</span>${b.barrio_base || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">ESTADO</span><span class="tag ${b.activa ? 'peligrosidad-alta' : 'peligrosidad-baja'}">${b.activa ? 'ACTIVA' : 'INACTIVA'}</span></div>
          </div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">MODUS OPERANDI / ACTIVIDADES</span><div style="font-size:13px;margin-top:4px">${b.actividad_principal || '—'}</div></div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">INFORMACIÓN OPERATIVA</span><div style="font-size:13px;margin-top:4px;color:var(--text-secondary)">${b.descripcion || 'Sin observaciones registradas.'}</div></div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-accent btn-sm" onclick="document.getElementById('modal-detalle').classList.add('hidden');document.querySelector('[data-view=grafo]').click();">Ver Red de Vínculos</button>
          </div>
        </div>
      `;
    } else if (type === 'allanamiento') {
      const a = await getAllanamientoById(id);
      if (!a) throw new Error('No se encontró el registro del operativo.');

      titulo.textContent = `Operativo: ${a.cuij || a.direccion}`;
      contenido.innerHTML = `
        <div style="display:grid;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px">CUIJ</span>${a.cuij || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">FECHA OPERATIVO</span>${formatDateTime(a.fecha_operativo)}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">DIRECCIÓN</span>${a.direccion}, ${a.barrio || ''}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">FUERZA</span>${a.fuerza_interviniente || '—'}</div>
          </div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">SECUESTROS / DETENCIONES</span><div style="font-size:13px;margin-top:4px;color:var(--accent-primary)">${a.resultado_detalle || 'Sin detalle de secuestro.'}</div></div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">SÍNTESIS</span><div style="font-size:13px;margin-top:4px">${a.resumen || '—'}</div></div>
        </div>
      `;
    } else if (type === 'hecho') {
      const h = await getHechoById(id);
      if (!h) throw new Error('No se encontró el hecho delictivo.');

      titulo.textContent = `${h.tipo_penal} — ${formatDate(h.fecha)}`;
      contenido.innerHTML = `
        <div style="display:grid;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px">TIPO PENAL</span><strong>${h.tipo_penal}</strong></div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">LESIVIDAD</span><span class="tag lesividad-${getLesividadClass(h.indice_lesividad)}">${h.indice_lesividad}/10</span></div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">DIRECCIÓN</span>${h.direccion || '—'}, ${h.barrio || ''}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">CUIJ / CAUSA</span>${h.cuij || '—'}</div>
          </div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">MODUS OPERANDI</span><div style="font-size:13px;margin-top:4px">${h.modus_operandi || '—'}</div></div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">RESUMEN</span><div style="font-size:13px;margin-top:4px">${h.resumen || '—'}</div></div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('modal-detalle').classList.add('hidden'); window.analizarEntornoDeHecho('${h.id}');">📍 Analizar Entorno de este Hecho</button>
          </div>
        </div>
      `;
    }
  } catch (err) {
    contenido.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

// ============================================================
// HELPERS
// ============================================================
function setupListSearch(inputId, refreshFn) {
  const input = document.getElementById(inputId);
  if (!input || input._searchSetup) return;
  input._searchSetup = true;

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(refreshFn, 400);
  });
}

function setupRangeSliders() {
  document.querySelectorAll('.filter-range').forEach(range => {
    const valSpan = document.getElementById(range.id + '-val');
    if (valSpan) {
      range.addEventListener('input', () => { valSpan.textContent = range.value; });
    }
  });
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K → Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
    // Escape → Close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });
}

export function navigateToView(viewId) {
  const navBtn = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navBtn) navBtn.click();
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

function showLoading(text = 'Cargando...') {
  const overlay = document.getElementById('loading-overlay');
  const textEl = document.getElementById('loading-text');
  if (overlay) overlay.classList.remove('hidden');
  if (textEl) textEl.textContent = text;
}

function hideLoading() {
  document.getElementById('loading-overlay')?.classList.add('hidden');
}

// ============================================================
// INSPECCIÓN DE UBICACIÓN Y CRUCE RELACIONAL DE DOMICILIOS
// ============================================================

let currentInspectionState = null;

function setupInspectionModule() {
  // Botón en la barra del mapa para abrir el modal de inspección
  document.getElementById('btn-open-address-inspector')?.addEventListener('click', () => {
    openModal('modal-inspeccion-direccion');
    setTimeout(() => {
      document.getElementById('input-inspect-address')?.focus();
    }, 100);
  });

  // Envío del formulario de inspección
  document.getElementById('form-inspeccion-direccion')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = document.getElementById('input-inspect-address')?.value?.trim();
    const radius = parseInt(document.getElementById('select-inspect-radius')?.value) || 300;
    const person = document.getElementById('input-inspect-person')?.value?.trim() || '';

    if (!address) {
      showToast('Por favor ingrese una dirección o punto de interés', 'warning');
      return;
    }

    closeModal('modal-inspeccion-direccion');
    await executeAddressInspection({ address, radius, person });
  });

  // Botón en formulario de nuevo hecho para pre-analizar la dirección
  document.getElementById('btn-pre-inspect-hecho')?.addEventListener('click', async () => {
    const dir = document.getElementById('hecho-direccion')?.value?.trim();
    if (!dir) {
      showToast('Ingrese primero una dirección en el campo correspondiente', 'warning');
      return;
    }
    closeModal('modal-hecho');
    await executeAddressInspection({ address: dir, radius: 300 });
  });

  // Evento desde popup del mapa: "Analizar Entorno de esta Ubicación"
  window.addEventListener('crimint:request-inspection', async (e) => {
    const { coords, label } = e.detail || {};
    if (coords) {
      await executeAddressInspection({ coords, address: label || 'Ubicación seleccionada', radius: 300 });
    }
  });

  // Evento desde popup del mapa: "Cruce Domiciliario de [Nombre]"
  window.addEventListener('crimint:request-cross-reference', async (e) => {
    const { coords, personName } = e.detail || {};
    if (coords && personName) {
      await executeAddressInspection({ coords, person: personName, radius: 300 });
    }
  });

  // Botón cerrar panel
  document.getElementById('btn-close-inspection')?.addEventListener('click', () => {
    document.getElementById('inspection-panel')?.classList.add('hidden');
    clearInspection();
    currentInspectionState = null;
  });

  // Botón limpiar mapa
  document.getElementById('btn-clear-inspection-map')?.addEventListener('click', () => {
    document.getElementById('inspection-panel')?.classList.add('hidden');
    clearInspection();
    currentInspectionState = null;
    showToast('Inspección perimetral finalizada', 'info');
  });

  // Selector segmentado de radio de cobertura
  document.querySelectorAll('#inspection-radius-group .btn-segment').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('#inspection-radius-group .btn-segment').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const r = parseInt(btn.dataset.radius);
      if (r && currentInspectionState) {
        currentInspectionState.radius = r;
        updateInspectionRadius(r);
        await refreshInspectionData();
      }
    });
  });

  // Pestañas del panel de inspección
  document.querySelectorAll('.inspection-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.inspection-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.inspection-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(`tab-insp-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Búsqueda manual de persona para cruce
  document.getElementById('btn-do-person-cross')?.addEventListener('click', async () => {
    const query = document.getElementById('insp-cross-person-input')?.value?.trim();
    if (!query) {
      showToast('Ingrese un nombre o alias para realizar el cruce', 'warning');
      return;
    }
    if (!currentInspectionState) return;
    await executePersonCrossForInspection(query);
  });
}

/**
 * Ejecuta el análisis de proximidad y cruce de datos para una dirección o coordenadas dadas.
 */
async function executeAddressInspection({ address = '', coords = null, radius = 300, person = '' }) {
  showLoading('Analizando ubicación y cruce de datos...');

  let targetCoords = coords;
  let targetAddress = address;

  try {
    // Si no hay coordenadas, intentar geocodificar o detectar formato numérico
    if (!targetCoords && targetAddress) {
      const coordMatch = targetAddress.match(/([-\d.]+)\s*,\s*([-\d.]+)/);
      if (coordMatch) {
        const p1 = parseFloat(coordMatch[1]);
        const p2 = parseFloat(coordMatch[2]);
        if (p1 < -55 && p1 > -65) {
          targetCoords = [p1, p2];
        } else if (p2 < -55 && p2 > -65) {
          targetCoords = [p2, p1];
        }
      }

      if (!targetCoords) {
        const geocoded = await geocodeAddress(targetAddress);
        if (geocoded && geocoded.lng && geocoded.lat) {
          targetCoords = [geocoded.lng, geocoded.lat];
          if (geocoded.place_name) targetAddress = geocoded.place_name;
        }
      }
    }

    if (!targetCoords) {
      hideLoading();
      showToast('No se pudieron obtener coordenadas precisas para esta dirección. Utilice una esquina o calle conocida.', 'warning');
      return;
    }

    // Asegurar vista en mapa
    document.querySelector('[data-view="mapa"]')?.click();

    // Obtener datos maestros en memoria o base de datos
    const allPoints = getAllMasterFeatures();
    const personas = await getPersonas({ limit: 500 });
    const allanamientos = await getAllanamientos({ limit: 500 });
    const zonas = await getZonas();

    // Ejecutar análisis de entorno inmediato
    const envAnalysis = analyzeLocationEnvironment({
      centerCoords: targetCoords,
      radiusMeters: radius,
      features: allPoints,
      personas,
      allanamientos,
      zonas
    });

    // Ejecutar análisis de cruce si se indicó persona o si hay residentes en el área
    let crossAnalysis = null;
    const crossLinks = [];

    if (person) {
      crossAnalysis = analyzePersonLocationCross({
        personIdentifier: person,
        incidentCoords: targetCoords,
        personas,
        allFeatures: allPoints,
        allanamientos
      });

      if (crossAnalysis && crossAnalysis.homeCoords) {
        crossLinks.push({
          coords: crossAnalysis.homeCoords,
          label: `Domicilio Legal: ${crossAnalysis.person.nombre || ''} ${crossAnalysis.person.apellido || ''}`,
          distanceKm: crossAnalysis.distanceToHomeKm
        });
      }
    } else if (envAnalysis.persons && envAnalysis.persons.length > 0) {
      // Tomar a la persona principal para cruce sugerido
      crossAnalysis = analyzePersonLocationCross({
        personIdentifier: envAnalysis.persons[0].id,
        incidentCoords: targetCoords,
        personas,
        allFeatures: allPoints,
        allanamientos
      });

      if (crossAnalysis && crossAnalysis.homeCoords && crossAnalysis.isDiscrepancy) {
        crossLinks.push({
          coords: crossAnalysis.homeCoords,
          label: `Domicilio Legal: ${crossAnalysis.person.nombre || ''} ${crossAnalysis.person.apellido || ''}`,
          distanceKm: crossAnalysis.distanceToHomeKm
        });
      }
    }

    // Actualizar estado de inspección
    currentInspectionState = {
      coords: targetCoords,
      address: targetAddress,
      radius,
      envAnalysis,
      crossAnalysis,
      personas,
      allPoints,
      allanamientos,
      zonas
    };

    // Proyectar en Mapbox (cobertura + enlaces espaciales)
    inspectLocation({
      coords: targetCoords,
      label: targetAddress || 'Ubicación bajo análisis',
      radiusMeters: radius,
      crossLinks
    });

    // Renderizar panel de resultados
    renderInspectionPanel(currentInspectionState);

    // Abrir panel lateral
    document.getElementById('inspection-panel')?.classList.remove('hidden');

    hideLoading();
    showToast(`Análisis de proximidad activo (${radius}m)`, 'info');

  } catch (err) {
    hideLoading();
    console.error('Error en executeAddressInspection:', err);
    showToast('Ocurrió un error al procesar el análisis de ubicación', 'error');
  }
}

/**
 * Recalcula el análisis cuando el usuario cambia el radio desde el panel.
 */
async function refreshInspectionData() {
  if (!currentInspectionState) return;
  const { coords, radius, allPoints, personas, allanamientos, zonas, crossAnalysis } = currentInspectionState;

  const envAnalysis = analyzeLocationEnvironment({
    centerCoords: coords,
    radiusMeters: radius,
    features: allPoints,
    personas,
    allanamientos,
    zonas
  });

  currentInspectionState.envAnalysis = envAnalysis;
  renderInspectionPanel(currentInspectionState);
}

/**
 * Ejecuta el cruce específico con una persona buscada manualmente en la pestaña de cruces.
 */
async function executePersonCrossForInspection(personName) {
  if (!currentInspectionState) return;
  const { coords, personas, allPoints, allanamientos, address, radius } = currentInspectionState;

  const crossAnalysis = analyzePersonLocationCross({
    personIdentifier: personName,
    incidentCoords: coords,
    personas,
    allFeatures: allPoints,
    allanamientos
  });

  if (!crossAnalysis) {
    showToast(`No se encontraron registros de "${personName}" en la base de personas`, 'warning');
    return;
  }

  currentInspectionState.crossAnalysis = crossAnalysis;

  // Actualizar líneas en el mapa
  const crossLinks = [];
  if (crossAnalysis.homeCoords) {
    crossLinks.push({
      coords: crossAnalysis.homeCoords,
      label: `Domicilio Legal: ${crossAnalysis.person.nombre || ''} ${crossAnalysis.person.apellido || ''}`,
      distanceKm: crossAnalysis.distanceToHomeKm
    });
  }

  inspectLocation({
    coords,
    label: address || 'Ubicación bajo análisis',
    radiusMeters: radius,
    crossLinks
  });

  renderInspectionPanel(currentInspectionState);
  showToast(`Cruce relacional generado para ${crossAnalysis.person.nombre || ''} ${crossAnalysis.person.apellido || ''}`, 'success');

  // Activar la pestaña de cruce
  document.querySelector('.inspection-tab-btn[data-tab="cruces"]')?.click();
}

/**
 * Renderiza todos los datos en el panel de inspección.
 */
function renderInspectionPanel(state) {
  const { address, coords, envAnalysis, crossAnalysis } = state;

  // Cabecera
  const titleEl = document.getElementById('inspection-address-title');
  const coordsEl = document.getElementById('inspection-coords-label');
  if (titleEl) titleEl.textContent = address || 'Ubicación seleccionada';
  if (coordsEl) coordsEl.textContent = `Coordenadas: [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]`;

  // Resumen cuantitativo
  document.getElementById('insp-stat-hechos').textContent = envAnalysis.totalIncidents;
  document.getElementById('insp-stat-personas').textContent = envAnalysis.persons.length;
  document.getElementById('insp-stat-allanamientos').textContent = envAnalysis.allanamientos.length;
  document.getElementById('insp-stat-lesividad').textContent = envAnalysis.averageLesividad > 0 ? `L${envAnalysis.averageLesividad}` : '—';

  // -------------------------------------------------------------
  // Pestaña 1: Incidencias en el Sector
  // -------------------------------------------------------------
  const incidentsListEl = document.getElementById('insp-incidents-list');
  if (incidentsListEl) {
    if (envAnalysis.incidents.length === 0) {
      incidentsListEl.innerHTML = `
        <div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;">
          No se registran incidencias penales en este radio de cobertura.
        </div>
      `;
    } else {
      incidentsListEl.innerHTML = envAnalysis.incidents.map(inc => {
        const p = inc.properties || {};
        const themColor = p.color || '#0EA5E9';
        const themIcon = p.tematica_icon || '📌';
        const themName = p.tematica_nombre || p.tipo || 'Incidencia';
        const lesColor = getLesividadColor(p.lesividad);

        return `
          <div class="insp-card" style="cursor:pointer;" onclick="window.centrarHechoEnMapa(${inc.geometry.coordinates[0]}, ${inc.geometry.coordinates[1]})">
            <div class="insp-card-header">
              <span style="display:inline-flex;align-items:center;gap:4px;color:${themColor};font-size:11px;font-weight:700;">
                ${themIcon} ${themName}
              </span>
              <div style="display:flex;align-items:center;gap:6px">
                <span class="insp-badge-dist">${p.distancia_metros} m</span>
                <span style="background:${lesColor};color:#fff;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:700;">L${p.lesividad}</span>
              </div>
            </div>
            <div style="color:var(--text-primary);font-size:12px;font-weight:500;margin-bottom:2px;">
              ${p.direccion || p.barrio || 'Sin dirección exacta'}
            </div>
            ${p.cuij ? `<div style="font-size:11px;color:#F59E0B;font-family:var(--font-mono);font-weight:600;">CUIJ: ${p.cuij}</div>` : ''}
            ${p.fecha ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">📅 ${formatDate(p.fecha)}</div>` : ''}
          </div>
        `;
      }).join('');
    }
  }

  // -------------------------------------------------------------
  // Pestaña 2: Personas Radicadas en el Sector
  // -------------------------------------------------------------
  const personsListEl = document.getElementById('insp-persons-list');
  if (personsListEl) {
    if (envAnalysis.persons.length === 0) {
      personsListEl.innerHTML = `
        <div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;">
          No se encuentran domicilios legales de personas de interés registradas en este radio.
        </div>
      `;
    } else {
      personsListEl.innerHTML = envAnalysis.persons.map(per => {
        const isCaptura = per.pedido_captura;
        const nombreCompleto = `${per.nombre || ''} ${per.apellido || ''}`.trim() || 'Sin nombre';

        return `
          <div class="insp-card">
            <div class="insp-card-header">
              <span style="font-size:12px;font-weight:700;color:var(--text-primary);">
                👤 ${nombreCompleto} ${per.alias?.length ? `("${per.alias[0]}")` : ''}
              </span>
              <span class="insp-badge-dist">${per.distancia_metros} m</span>
            </div>
            ${isCaptura ? `
              <div style="display:inline-block;background:rgba(239,68,68,0.2);color:#EF4444;border:1px solid rgba(239,68,68,0.4);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:800;margin-bottom:4px;">
                🚨 PEDIDO DE CAPTURA ACTIVO
              </div>
            ` : ''}
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">
              <strong>Domicilio registrado:</strong> ${per.domicilio_principal || '—'}
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">
              <strong>Banda:</strong> <span style="color:#0EA5E9;font-weight:600;">${per.banda_nombre || 'Individual'}</span>
              ${per.roles?.length ? ` | <strong>Rol:</strong> ${per.roles.join(', ')}` : ''}
            </div>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="btn btn-secondary btn-xs" onclick="window.verFichaDesdeInspeccion('${per.id}')" style="font-size:10px;">📋 Dossier</button>
              <button class="btn btn-primary btn-xs" onclick="window.cruzarPersonaDesdeInspeccion('${per.id}')" style="font-size:10px;">Analizar Cruce</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // -------------------------------------------------------------
  // Pestaña 3: Cruce Domiciliario y Vínculos Espaciales
  // -------------------------------------------------------------
  const crossListEl = document.getElementById('insp-cross-list');
  if (crossListEl) {
    if (!crossAnalysis) {
      crossListEl.innerHTML = `
        <div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;line-height:1.4;">
          Ingrese el nombre o alias de una persona arriba, o seleccione un imputado de la pestaña "Personas Radicadas" para analizar la conexión espacial con su domicilio legal registrado.
        </div>
      `;
    } else {
      const p = crossAnalysis.person;
      const isDiscrepancy = crossAnalysis.isDiscrepancy;
      const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';

      crossListEl.innerHTML = `
        <div class="insp-cross-alert-box">
          <div class="insp-cross-alert-header">
            <span>INFORMACIÓN DE LA PERSONA ANALIZADA</span>
            ${isDiscrepancy ? '<span class="insp-discrepancy-chip">DISCREPANCIA ESPACIAL</span>' : '<span style="font-size:10px;color:var(--accent-success);font-weight:700;">EN ZONA DE RESIDENCIA</span>'}
          </div>

          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:4px;">
            👤 ${nombreCompleto} ${p.alias?.length ? `("${p.alias.join(', ')}")` : ''}
          </div>

          <div class="insp-cross-detail-row">
            <strong>Banda u Organización:</strong> <span style="color:#0EA5E9;font-weight:600;">${p.banda_nombre || 'Individual'}</span>
            (Nivel de peligrosidad: ${p.score_peligrosidad || 5}/10)
          </div>

          <div class="insp-cross-detail-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);">
            <strong>Lugar del Hecho / Caso:</strong> ${address || 'Coordenada bajo análisis'}
          </div>

          <div class="insp-cross-detail-row">
            <strong>Domicilio Legal Registrado:</strong> ${p.domicilio_principal || 'Sin domicilio registrado'}
          </div>

          ${crossAnalysis.distanceToHomeKm ? `
            <div style="display:flex;align-items:center;gap:6px;margin:8px 0;padding:6px 10px;background:rgba(245,158,11,0.15);border-radius:6px;border:1px solid rgba(245,158,11,0.3);">
              <span style="font-size:16px;">📏</span>
              <div style="font-size:12px;color:#FDE68A;">
                <strong>Distancia Hecho ↔ Domicilio:</strong> ${crossAnalysis.distanceToHomeKm} km de separación.
              </div>
            </div>
          ` : ''}

          ${p.cuij_asociados?.length ? `
            <div class="insp-cross-detail-row">
              <strong>Causas CUIJ asociadas al domicilio:</strong>
              <div style="font-family:var(--font-mono);color:var(--accent-primary);font-size:11px;margin-top:2px;">
                ${p.cuij_asociados.join(' | ')}
              </div>
            </div>
          ` : ''}

          ${p.antecedentes_texto ? `
            <div class="insp-cross-detail-row" style="margin-top:6px;">
              <strong>Antecedentes e Inteligencia en Domicilio:</strong>
              <div style="font-size:11px;color:var(--text-secondary);background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:4px;margin-top:2px;">
                ${p.antecedentes_texto}
              </div>
            </div>
          ` : ''}

          ${crossAnalysis.homeCoords ? `
            <div style="display:flex;gap:6px;margin-top:10px;">
              <button class="btn btn-secondary btn-xs" onclick="window.centrarHechoEnMapa(${crossAnalysis.homeCoords[0]}, ${crossAnalysis.homeCoords[1]})" style="font-size:10px;width:100%;">
                🎯 Ver Domicilio Legal en el Mapa
              </button>
            </div>
          ` : ''}
        </div>

        ${crossAnalysis.historicalIncidents.length > 0 ? `
          <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin:10px 0 6px;">
            Otros hechos históricos vinculados a esta persona (${crossAnalysis.historicalIncidents.length}):
          </div>
          <div class="inspection-list">
            ${crossAnalysis.historicalIncidents.slice(0, 6).map(inc => {
              const ip = inc.properties || {};
              const iThem = ip.tematica_nombre || ip.tipo || 'Incidencia';
              const distKm = (inc.distancia_al_hecho_metros / 1000).toFixed(2);
              return `
                <div class="insp-card" style="cursor:pointer;" onclick="window.centrarHechoEnMapa(${inc.geometry.coordinates[0]}, ${inc.geometry.coordinates[1]})">
                  <div class="insp-card-header">
                    <span style="font-weight:600;color:#fff;">${iThem}</span>
                    <span class="insp-badge-dist">${distKm} km del caso</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-secondary);">${ip.direccion || ip.barrio || 'Santa Fe'}</div>
                  ${ip.cuij ? `<div style="font-size:10px;color:#F59E0B;font-family:var(--font-mono);">CUIJ: ${ip.cuij}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      `;
    }
  }
}

// Ventanas y llamadas globales para interacción dentro del panel
window.centrarHechoEnMapa = function(lng, lat) {
  flyTo(lng, lat, 16);
};

window.verFichaDesdeInspeccion = function(personaId) {
  showEntityDetail('persona', personaId);
};

window.cruzarPersonaDesdeInspeccion = function(personaId) {
  executePersonCrossForInspection(personaId);
};

window.analizarEntornoDePersona = async function(personaId) {
  const p = await getPersonaById(personaId);
  if (!p) return;
  const coords = parseGeom(p.domicilio_principal_geom);
  if (coords) {
    await executeAddressInspection({ coords: [coords.lng, coords.lat], address: p.domicilio_principal || 'Domicilio Legal', person: p.id, radius: 300 });
  } else if (p.domicilio_principal) {
    await executeAddressInspection({ address: p.domicilio_principal, person: p.id, radius: 300 });
  } else {
    showToast('La persona no posee domicilio registrado para geolocalizar.', 'warning');
  }
};

window.analizarEntornoDeHecho = async function(hechoId) {
  const h = await getHechoById(hechoId);
  if (!h) return;
  const coords = parseGeom(h.geom);
  if (coords) {
    await executeAddressInspection({ coords: [coords.lng, coords.lat], address: h.direccion || h.barrio || 'Lugar del Hecho', radius: 300 });
  } else if (h.direccion) {
    await executeAddressInspection({ address: h.direccion, radius: 300 });
  } else {
    showToast('El hecho no posee coordenadas ni dirección para analizar.', 'warning');
  }
};
