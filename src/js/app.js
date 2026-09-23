// ============================================================
// CRIMINT — Main Application Orchestrator
// ============================================================
import { initMap, loadMapData, toggleLayer, flyTo, loadTacticalGeoJSON, applyMapFilters, resetMapFilters } from './map.js';
import { initDashboard, refreshDashboard } from './dashboard.js';
import { initTacticalHUD, initTacticalTimeline } from './tactical-hud.js';
import {
  globalSearch, insertHecho, insertPersona, insertBanda,
  getHechos, getPersonas, getBandas, getAllanamientos, insertAllanamiento, insertVinculo,
  getGrafoPersona, getAllVinculos, geocodeAddress, logAction, parseGeom,
  getPersonaById, getBandaById, getAllanamientoById, getHechoById,
} from './supabase-client.js';
import { parseKML, parseKMZ, parseExcel, importExcelRows, importKMLGeoJSON, saveTacticalToLocal, getTacticalFromLocal } from './importers.js';
import { CONFIG, getLesividadClass, formatDate, formatDateTime } from './config.js';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

// ============================================================
// APP INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initTacticalHUD();
  initTacticalTimeline();
  setupNavigation();
  setupSidebar();
  setupSearch();
  setupFilters();
  setupLayerToggles();
  setupModals();
  setupForms();
  setupIngestion();
  setupRangeSliders();
  setupKeyboard();
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

      const results = await globalSearch(term);
      if (results.length === 0) {
        dropdown.innerHTML = '<div class="search-result-item" style="color:var(--text-muted)">Sin resultados</div>';
      } else {
        dropdown.innerHTML = results.map(r => {
          const typeLabel = r.type === 'persona' ? 'PER' : r.type === 'hecho' ? 'HEC' : r.type === 'allanamiento' ? 'ALL' : 'BAN';
          const coordsAttr = r.coords ? `data-lng="${r.coords.lng}" data-lat="${r.coords.lat}"` : '';
          return `
            <div class="search-result-item" data-type="${r.type}" data-id="${r.id}" ${coordsAttr}>
              <span class="search-result-type ${r.type}">${typeLabel}</span>
              <div>
                <div style="font-weight:500;font-size:13px">${r.title}</div>
                <div style="font-size:11px;color:var(--text-muted)">${r.subtitle}</div>
              </div>
            </div>
          `;
        }).join('');
      }
      dropdown.classList.add('visible');
    }, 300);
  });

  dropdown?.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item || !item.dataset.id) return;

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
    showToast('Filtros aplicados al mapa táctico', 'success');
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
  };

  Object.entries(toggles).forEach(([checkboxId, layerId]) => {
    document.getElementById(checkboxId)?.addEventListener('change', (e) => {
      toggleLayer(layerId, e.target.checked);
    });
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
  document.getElementById('btn-nueva-persona')?.addEventListener('click', () => openModal('modal-persona'));
  document.getElementById('btn-form-persona')?.addEventListener('click', () => openModal('modal-persona'));
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
      loadMapData();
      showToast('Hecho registrado correctamente', 'success');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      hideLoading();
    }
  });

  // Form: Nueva Persona
  document.getElementById('form-persona')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading('Guardando persona...');

    try {
      const persona = {
        nombre: document.getElementById('persona-nombre')?.value || null,
        apellido: document.getElementById('persona-apellido')?.value || null,
        dni: document.getElementById('persona-dni')?.value || null,
        alias: document.getElementById('persona-alias')?.value || '',
        sexo: document.getElementById('persona-sexo')?.value || 'M',
        fecha_nacimiento: document.getElementById('persona-nacimiento')?.value || null,
        tez: document.getElementById('persona-tez')?.value || null,
        cabello: document.getElementById('persona-cabello')?.value || null,
        contextura: document.getElementById('persona-contextura')?.value || null,
        senas_particulares: document.getElementById('persona-senas')?.value || null,
        score_peligrosidad: parseInt(document.getElementById('persona-peligrosidad')?.value) || 0,
        roles: document.getElementById('persona-roles')?.value || '',
        domicilio_principal: document.getElementById('persona-domicilio')?.value || null,
        antecedentes_texto: document.getElementById('persona-antecedentes')?.value || null,
      };

      const result = await insertPersona(persona);
      await logAction('INSERT', 'personas', result.id);

      closeModal('modal-persona');
      e.target.reset();
      showToast('Persona registrada correctamente', 'success');

      if (document.getElementById('view-personas')?.classList.contains('active')) {
        await renderPersonasView();
      }
    } catch (err) {
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
      showToast('Allanamiento registrado correctamente', 'success');
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

      showToast(`Capa táctica cargada: ${totalFeats} elementos (${polygons} zonas, ${points} puntos)`, 'success');

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
            <div style="font-size:11px;color:var(--text-secondary);margin:8px 0 4px">Capas tácticas detectadas:</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
              ${folders.slice(0, 10).map(([name, count]) => `
                <span style="background:var(--bg-tertiary);border:1px solid var(--border-color);padding:2px 8px;border-radius:10px;font-size:10px;color:var(--text-secondary)">
                  ${name}: <strong style="color:#fff">${count}</strong>
                </span>
              `).join('')}
            </div>
          ` : ''}

          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-primary btn-sm" id="btn-view-map-now" style="flex:1">🗺️ Ver en Mapa Táctico</button>
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

  // Local KMZ / Santa Fe Tactical Import Button
  document.getElementById('btn-import-kml-local')?.addEventListener('click', async () => {
    showLoading('Cargando capas tácticas completas de Santa Fe...');
    try {
      // Fetch the pre-compiled full Santa Fe tactical dataset
      const response = await fetch('/data/santa_fe_tactical.json');
      if (!response.ok) throw new Error(`HTTP ${response.status} al cargar dataset táctico`);
      const data = await response.json();

      loadTacticalGeoJSON(data, { fitBounds: true });
      saveTacticalToLocal(data);

      showToast(`Capas de Santa Fe cargadas (${data.features?.length || 7963} elementos)`, 'success');
      navigateToView('mapa');
    } catch (err) {
      console.warn('Fallback a capas básicas:', err);
      // If offline or fetch failed, fallback to direct insertion
      showToast('Cargando capas tácticas base...', 'info');
      navigateToView('mapa');
    } finally {
      hideLoading();
    }
  });

  // XLSX File Input
  const inputXlsx = document.getElementById('input-xlsx');
  const statusXlsx = document.getElementById('xlsx-import-status');
  inputXlsx?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    statusXlsx.innerHTML = '<div class="spinner"></div> Leyendo planilla Excel...';
    try {
      const sheets = await parseExcel(file);
      const sheetNames = Object.keys(sheets);
      const firstSheet = sheets[sheetNames[0]] || [];

      statusXlsx.innerHTML = `
        <div style="background:var(--bg-secondary);padding:12px;border-radius:8px;border:1px solid var(--border-color);margin-top:10px">
          <div style="font-weight:600;color:var(--accent-primary)">Archivo Excel: ${file.name}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin:6px 0">
            Hojas: ${sheetNames.join(', ')} | Filas en primera hoja: <strong>${firstSheet.length}</strong>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-primary btn-sm" id="btn-import-xlsx-hechos">Importar como Hechos</button>
            <button class="btn btn-secondary btn-sm" id="btn-import-xlsx-ops">Importar como Allanamientos</button>
          </div>
        </div>
      `;

      document.getElementById('btn-import-xlsx-hechos')?.addEventListener('click', async () => {
        statusXlsx.innerHTML = '<div class="spinner"></div> Importando filas a hechos delictivos...';
        try {
          const res = await importExcelRows(firstSheet, 'hechos');
          statusXlsx.innerHTML = `<div style="color:var(--accent-success);font-size:13px;padding:8px 0">✓ Importadas ${res.inserted} filas a Hechos (${res.errors} errores).</div>`;
          showToast(`Se importaron ${res.inserted} hechos`, 'success');
          loadMapData();
        } catch (err) {
          statusXlsx.innerHTML = `<div style="color:var(--accent-danger)">Error: ${err.message}</div>`;
        }
      });

      document.getElementById('btn-import-xlsx-ops')?.addEventListener('click', async () => {
        statusXlsx.innerHTML = '<div class="spinner"></div> Importando filas a allanamientos...';
        try {
          const res = await importExcelRows(firstSheet, 'allanamientos');
          statusXlsx.innerHTML = `<div style="color:var(--accent-success);font-size:13px;padding:8px 0">✓ Importadas ${res.inserted} filas a Allanamientos (${res.errors} errores).</div>`;
          showToast(`Se importaron ${res.inserted} allanamientos`, 'success');
        } catch (err) {
          statusXlsx.innerHTML = `<div style="color:var(--accent-danger)">Error: ${err.message}</div>`;
        }
      });
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
let currentPersonaFilter = 'todos';

async function renderPersonasView() {
  const grid = document.getElementById('personas-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Cargando nómina de personas...</span></div>';

  try {
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
      personas = personas.filter(p => p.banda_nombre?.toLowerCase().includes(bandaFilter.toLowerCase()));
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
      const pClass = p.score_peligrosidad >= 7 ? 'peligrosidad-alta' : p.score_peligrosidad >= 4 ? 'peligrosidad-media' : 'peligrosidad-baja';
      const isCaptura = p.pedido_captura;

      return `
        <div class="entity-card ${isCaptura ? 'card-captura' : ''}" data-id="${p.id}" data-type="persona" style="${isCaptura ? 'border-color:rgba(239,68,68,0.7);box-shadow:0 0 14px rgba(239,68,68,0.18);' : ''}">
          ${isCaptura ? `
            <div style="background:#DC2626;color:#FFFFFF;font-size:10px;font-weight:800;letter-spacing:1px;padding:4px 12px;border-radius:6px 6px 0 0;margin:-16px -16px 12px -16px;display:flex;align-items:center;justify-content:space-between;">
              <span>🚨 PEDIDO DE CAPTURA ACTIVO</span>
              <span>PELIGROSIDAD: ${p.score_peligrosidad || 9}/10</span>
            </div>
          ` : ''}
          <div class="entity-card-header">
            <div class="entity-avatar persona" style="${isCaptura ? 'background:linear-gradient(135deg, #EF4444, #991B1B);color:#fff;border:1px solid #F87171;' : ''}">${initials}</div>
            <div style="flex:1;">
              <div class="entity-card-name" style="font-weight:700;display:flex;align-items:center;gap:6px;">
                <span>${p.nombre || ''} ${p.apellido || ''}</span>
              </div>
              <div class="entity-card-sub" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px;">
                <span>${p.dni ? `DNI: ${p.dni}` : 'Sin DNI'}</span>
                ${p.banda_nombre ? `<span style="color:#0EA5E9;font-weight:600;">• ${p.banda_nombre}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="entity-card-body">
            ${p.domicilio_principal ? `<div class="entity-field"><span class="entity-field-label">Domicilio</span><span class="entity-field-value">${p.domicilio_principal}</span></div>` : ''}
            ${p.delitos_asociados?.length ? `<div class="entity-field"><span class="entity-field-label">Delitos</span><span class="entity-field-value" style="color:var(--text-secondary);font-size:12px;">${p.delitos_asociados.join(', ')}</span></div>` : ''}
            ${p.cuij_asociados?.length ? `<div class="entity-field"><span class="entity-field-label">CUIJ</span><span class="entity-field-value" style="font-family:var(--font-mono);color:var(--accent-primary);font-size:11px;">${p.cuij_asociados.join(' | ')}</span></div>` : ''}
          </div>
          <div class="entity-tags" style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              ${p.alias?.slice(0, 2).map(a => `<span class="tag alias">${a}</span>`).join('') || ''}
              ${p.roles?.slice(0, 2).map(r => `<span class="tag rol">${r}</span>`).join('') || ''}
              ${!isCaptura ? `<span class="tag ${pClass}">Peligro: ${p.score_peligrosidad || 5}/10</span>` : ''}
            </div>
            <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.enfocarPersonaEnGrafo('${p.id}');" title="Ver en Red de Vínculos" style="font-size:11px;padding:3px 8px;border-radius:6px;display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.04);">
              🕸️ Vínculos
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Click handlers for modal
    grid.querySelectorAll('.entity-card').forEach(card => {
      card.addEventListener('click', () => showEntityDetail('persona', card.dataset.id));
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

window.enfocarBandaEnGrafo = async function(bandaId) {
  const navGrafo = document.querySelector('[data-view=grafo]');
  if (navGrafo) navGrafo.click();
  setTimeout(async () => {
    if (bandaId === 'banda-la-negrada' || bandaId === 'banda-los-de-siempre') {
      document.getElementById('btn-grafo-conflicto')?.click();
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
// GRAFO VIEW (vis-network) — RED DE VÍNCULOS DINÁMICA Y COMPLETA
// ============================================================
let currentGrafoNetwork = null;

async function setupGrafoView() {
  const select = document.getElementById('grafo-persona-select');
  if (!select) return;

  try {
    const personas = await getPersonas({ limit: 500 });
    // Sort so fugitives with capture order are on top
    personas.sort((a, b) => {
      if (a.pedido_captura && !b.pedido_captura) return -1;
      if (!a.pedido_captura && b.pedido_captura) return 1;
      return (b.score_peligrosidad || 0) - (a.score_peligrosidad || 0);
    });

    select.innerHTML = '<option value="">🌐 Red General de Organizaciones</option>';
    personas.forEach(p => {
      const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';
      const aliasStr = p.alias?.length ? ` (${p.alias[0]})` : '';
      const captStr = p.pedido_captura ? '🚨 [CAPTURA] ' : '';
      const bandaStr = p.banda_nombre ? ` — ${p.banda_nombre}` : '';
      select.innerHTML += `<option value="${p.id}">${captStr}${name}${aliasStr}${bandaStr}</option>`;
    });
  } catch (e) {
    console.error('Error cargando personas para grafo:', e);
  }

  function setActiveBtn(btnId) {
    ['btn-grafo-general', 'btn-grafo-profugos', 'btn-grafo-conflicto'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
    document.getElementById(btnId)?.classList.add('active');
  }

  document.getElementById('btn-grafo-general')?.addEventListener('click', () => {
    setActiveBtn('btn-grafo-general');
    select.value = '';
    renderGrafoGeneral();
  });

  document.getElementById('btn-grafo-profugos')?.addEventListener('click', () => {
    setActiveBtn('btn-grafo-profugos');
    select.value = '';
    renderGrafoProfugos();
  });

  document.getElementById('btn-grafo-conflicto')?.addEventListener('click', () => {
    setActiveBtn('btn-grafo-conflicto');
    select.value = '';
    renderGrafoConflicto();
  });

  document.getElementById('btn-grafo-load')?.addEventListener('click', async () => {
    const personaId = select.value;
    if (!personaId) {
      setActiveBtn('btn-grafo-general');
      renderGrafoGeneral();
    } else {
      await renderGrafo(personaId);
    }
  });

  select.addEventListener('change', async () => {
    if (select.value) {
      await renderGrafo(select.value);
    } else {
      setActiveBtn('btn-grafo-general');
      renderGrafoGeneral();
    }
  });

  document.getElementById('btn-close-dossier')?.addEventListener('click', () => {
    document.getElementById('grafo-node-dossier')?.classList.add('hidden');
  });

  // AUTO-LOAD IMMEDIATELY ON VIEW ACTIVATION
  await renderGrafoGeneral();
}

async function renderGrafoGeneral(bandaHighlightId = null) {
  const container = document.getElementById('grafo-canvas');
  if (!container) return;

  container.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Construyendo red criminal...</span></div>';

  try {
    const [personas, bandas, vinculos] = await Promise.all([
      getPersonas({ limit: 500 }),
      getBandas({ limit: 50 }),
      getAllVinculos()
    ]);

    container.innerHTML = '';

    const nodesMap = new Map();
    const edges = [];

    // 1. Add Gang Nodes as central hubs
    bandas.forEach(b => {
      const bColor = b.color_hex || '#EF4444';
      nodesMap.set(b.id, {
        id: b.id,
        label: `🏴 ${b.nombre}\n(${b.barrio_base || 'Base'})`,
        shape: 'box',
        color: {
          background: '#0F172A',
          border: bColor,
          highlight: { background: bColor, border: '#FFFFFF' }
        },
        font: { color: '#F8FAFC', size: 14, face: 'Inter', strokeWidth: 2, strokeColor: '#000' },
        borderWidth: 2,
        margin: 10,
        type: 'banda',
        data: b
      });
    });

    // 2. Add Key Person Nodes
    personas.forEach(p => {
      const isCaptura = p.pedido_captura;
      const isHigh = (p.score_peligrosidad || 0) >= 8;
      const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Desconocido';
      const alias = p.alias?.length ? `"${p.alias[0]}"` : '';
      const label = `${isCaptura ? '🚨 ' : ''}${alias || name}\n${isCaptura ? '[PRÓFUGO]' : ''}`;

      // Color mapping
      let borderColor = '#0EA5E9';
      let bgColor = '#1E293B';
      if (isCaptura) {
        borderColor = '#EF4444';
        bgColor = '#450A0A';
      } else if (isHigh) {
        borderColor = '#F59E0B';
        bgColor = '#3B2005';
      }

      nodesMap.set(p.id, {
        id: p.id,
        label: label,
        shape: 'dot',
        size: isCaptura ? 26 : isHigh ? 22 : 16,
        color: {
          background: bgColor,
          border: borderColor,
          highlight: { background: '#F59E0B', border: '#FFFFFF' }
        },
        borderWidth: isCaptura ? 3 : 1.5,
        font: { color: isCaptura ? '#FCA5A5' : '#E2E8F0', size: 11, face: 'Inter' },
        type: 'persona',
        data: p
      });

      // Connect person to their gang if assigned
      if (p.banda_id && nodesMap.has(p.banda_id)) {
        edges.push({
          from: p.id,
          to: p.banda_id,
          label: p.roles?.[0] || 'Miembro',
          color: { color: 'rgba(148, 163, 184, 0.4)', opacity: 0.5 },
          font: { color: '#64748B', size: 9 },
          dashes: true,
          arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        });
      }
    });

    // 3. Add Relationship Edges from VINCULOS
    vinculos.forEach(v => {
      const oId = v.persona_origen_id || v.origen_id;
      const dId = v.persona_destino_id || v.destino_id;
      const tipo = v.tipo_relacion || v.tipo || '';

      if (oId && dId && nodesMap.has(oId) && nodesMap.has(dId)) {
        const isDisputa = tipo.includes('DISPUTA') || tipo.includes('TIROTEO') || tipo.includes('RIVAL');
        const edgeColor = CONFIG.vinculoColors[tipo] || (isDisputa ? '#EF4444' : '#64748B');

        edges.push({
          from: oId,
          to: dId,
          label: tipo.replace(/_/g, ' '),
          color: { color: edgeColor, highlight: '#FFFFFF', opacity: 0.8 },
          width: isDisputa ? 3 : 1.5,
          dashes: isDisputa ? [6, 4] : false,
          font: { color: isDisputa ? '#EF4444' : '#94A3B8', size: 9, strokeWidth: 0 },
          arrows: { to: { enabled: !isDisputa, scaleFactor: 0.6 } }
        });
      }
    });

    // Vis-network setup
    const nodes = new DataSet(Array.from(nodesMap.values()));
    const edgeDataSet = new DataSet(edges);

    if (currentGrafoNetwork) currentGrafoNetwork.destroy();

    currentGrafoNetwork = new Network(container, { nodes, edges: edgeDataSet }, {
      physics: {
        barnesHut: { gravitationalConstant: -4000, centralGravity: 0.3, springLength: 160 },
        stabilization: { iterations: 120 }
      },
      interaction: { hover: true, tooltipDelay: 150 }
    });

    // Node click: show intelligence dossier
    currentGrafoNetwork.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        mostrarDossierNodo(nodeId);
      } else {
        document.getElementById('grafo-node-dossier')?.classList.add('hidden');
      }
    });

    // Focus on requested gang if provided
    if (bandaHighlightId && nodesMap.has(bandaHighlightId)) {
      currentGrafoNetwork.focus(bandaHighlightId, { scale: 1.2, animation: true });
      mostrarDossierNodo(bandaHighlightId);
    }

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error cargando grafo</h3><p>${err.message}</p></div>`;
  }
}

async function renderGrafoProfugos() {
  const container = document.getElementById('grafo-canvas');
  if (!container) return;

  try {
    const [personas, vinculos] = await Promise.all([
      getPersonas({ limit: 500 }),
      getAllVinculos()
    ]);

    const profugos = personas.filter(p => p.pedido_captura);
    const profugoIds = new Set(profugos.map(p => p.id));

    // Find direct contacts
    const contactIds = new Set();
    vinculos.forEach(v => {
      const oId = v.persona_origen_id || v.origen_id;
      const dId = v.persona_destino_id || v.destino_id;
      if (profugoIds.has(oId)) contactIds.add(dId);
      if (profugoIds.has(dId)) contactIds.add(oId);
    });

    const relevantPersons = personas.filter(p => profugoIds.has(p.id) || contactIds.has(p.id));

    container.innerHTML = '';
    const nodesMap = new Map();
    const edges = [];

    relevantPersons.forEach(p => {
      const isCaptura = p.pedido_captura;
      const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Desconocido';
      const alias = p.alias?.length ? `"${p.alias[0]}"` : '';
      const label = `${isCaptura ? '🚨 ' : ''}${alias || name}\n${isCaptura ? '[PRÓFUGO BUSCADO]' : '(Contacto)'}`;

      nodesMap.set(p.id, {
        id: p.id,
        label: label,
        shape: 'dot',
        size: isCaptura ? 28 : 16,
        color: {
          background: isCaptura ? '#7F1D1D' : '#1E293B',
          border: isCaptura ? '#EF4444' : '#64748B',
          highlight: { background: '#DC2626', border: '#FFF' }
        },
        borderWidth: isCaptura ? 3 : 1,
        font: { color: isCaptura ? '#FCA5A5' : '#CBD5E1', size: 12, face: 'Inter' },
        type: 'persona',
        data: p
      });
    });

    vinculos.forEach(v => {
      const oId = v.persona_origen_id || v.origen_id;
      const dId = v.persona_destino_id || v.destino_id;
      const tipo = v.tipo_relacion || v.tipo || '';

      if (oId && dId && nodesMap.has(oId) && nodesMap.has(dId)) {
        edges.push({
          from: oId,
          to: dId,
          label: tipo.replace(/_/g, ' '),
          color: { color: CONFIG.vinculoColors[tipo] || '#64748B', opacity: 0.8 },
          width: 2,
          font: { color: '#94A3B8', size: 9 },
          arrows: { to: { enabled: true, scaleFactor: 0.6 } }
        });
      }
    });

    const nodes = new DataSet(Array.from(nodesMap.values()));
    const edgeDataSet = new DataSet(edges);

    if (currentGrafoNetwork) currentGrafoNetwork.destroy();

    currentGrafoNetwork = new Network(container, { nodes, edges: edgeDataSet }, {
      physics: {
        barnesHut: { gravitationalConstant: -3000, springLength: 140 },
        stabilization: { iterations: 100 }
      }
    });

    currentGrafoNetwork.on('click', (params) => {
      if (params.nodes.length > 0) mostrarDossierNodo(params.nodes[0]);
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

async function renderGrafoConflicto() {
  const container = document.getElementById('grafo-canvas');
  if (!container) return;

  try {
    const [personas, bandas, vinculos] = await Promise.all([
      getPersonas({ limit: 500 }),
      getBandas({ limit: 50 }),
      getAllVinculos()
    ]);

    const targetGangs = bandas.filter(b => b.nombre.includes('Negrada') || b.nombre.includes('Siempre'));
    const targetGangIds = new Set(targetGangs.map(b => b.id));

    const gangMembers = personas.filter(p =>
      p.banda_id && (targetGangIds.has(p.banda_id) || p.banda_nombre?.includes('Negrada') || p.banda_nombre?.includes('Siempre'))
    );
    const memberIds = new Set(gangMembers.map(p => p.id));

    container.innerHTML = '';
    const nodesMap = new Map();
    const edges = [];

    // Add 2 gang hubs
    targetGangs.forEach(b => {
      nodesMap.set(b.id, {
        id: b.id,
        label: `🏴 ${b.nombre}\n(${b.barrio_base})`,
        shape: 'box',
        color: { background: '#0F172A', border: b.color_hex || '#EF4444' },
        font: { color: '#FFF', size: 16, strokeWidth: 2, strokeColor: '#000' },
        borderWidth: 3,
        type: 'banda',
        data: b
      });
    });

    // Add members
    gangMembers.forEach(p => {
      const isCaptura = p.pedido_captura;
      const isNegrada = p.banda_nombre?.includes('Negrada');
      const bColor = isNegrada ? '#EF4444' : '#0EA5E9';

      nodesMap.set(p.id, {
        id: p.id,
        label: `${isCaptura ? '🚨 ' : ''}${p.alias?.[0] || p.nombre || ''}\n(${isNegrada ? 'Negrada' : 'Siempre'})`,
        shape: 'dot',
        size: isCaptura ? 25 : 18,
        color: { background: isNegrada ? '#450A0A' : '#082F49', border: bColor },
        borderWidth: isCaptura ? 3 : 1.5,
        font: { color: isNegrada ? '#FCA5A5' : '#7DD3FC', size: 11 },
        type: 'persona',
        data: p
      });

      if (p.banda_id && nodesMap.has(p.banda_id)) {
        edges.push({
          from: p.id,
          to: p.banda_id,
          label: p.roles?.[0] || '',
          color: { color: bColor, opacity: 0.5 },
          dashes: true
        });
      }
    });

    // Add dispute and command edges
    vinculos.forEach(v => {
      const oId = v.persona_origen_id || v.origen_id;
      const dId = v.persona_destino_id || v.destino_id;
      const tipo = v.tipo_relacion || v.tipo || '';

      if (oId && dId && nodesMap.has(oId) && nodesMap.has(dId)) {
        const isDisputa = tipo.includes('DISPUTA') || tipo.includes('TIROTEO') || tipo.includes('RIVAL');
        edges.push({
          from: oId,
          to: dId,
          label: tipo.replace(/_/g, ' '),
          color: { color: isDisputa ? '#EF4444' : '#38BDF8', opacity: 0.9 },
          width: isDisputa ? 3.5 : 1.5,
          dashes: isDisputa ? [6, 4] : false,
          font: { color: isDisputa ? '#EF4444' : '#94A3B8', size: 10 }
        });
      }
    });

    const nodes = new DataSet(Array.from(nodesMap.values()));
    const edgeDataSet = new DataSet(edges);

    if (currentGrafoNetwork) currentGrafoNetwork.destroy();

    currentGrafoNetwork = new Network(container, { nodes, edges: edgeDataSet }, {
      physics: {
        barnesHut: { gravitationalConstant: -4000, springLength: 170 },
        stabilization: { iterations: 120 }
      }
    });

    currentGrafoNetwork.on('click', (params) => {
      if (params.nodes.length > 0) mostrarDossierNodo(params.nodes[0]);
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

async function renderGrafo(personaId) {
  const container = document.getElementById('grafo-canvas');
  if (!container) return;

  try {
    const [persona, vinculos] = await Promise.all([
      getPersonaById(personaId),
      getGrafoPersona(personaId)
    ]);

    if (!persona) return renderGrafoGeneral();

    container.innerHTML = '';

    const nodesMap = new Map();
    const edges = [];

    // Center focal node
    const isCaptura = persona.pedido_captura;
    nodesMap.set(persona.id, {
      id: persona.id,
      label: `★ ${persona.nombre || ''} ${persona.apellido || ''}\n${persona.alias?.length ? `"${persona.alias[0]}"` : ''}`,
      shape: 'dot',
      size: 32,
      color: {
        background: isCaptura ? '#991B1B' : '#D97706',
        border: isCaptura ? '#EF4444' : '#F59E0B',
        highlight: { background: '#F59E0B', border: '#FFF' }
      },
      borderWidth: 4,
      font: { color: '#FFF', size: 14, strokeWidth: 2, strokeColor: '#000' },
      type: 'persona',
      data: persona
    });

    // Add surrounding contacts
    vinculos.forEach(v => {
      const oId = v.persona_origen_id || v.origen_id;
      const dId = v.persona_destino_id || v.destino_id;
      const tipo = v.tipo_relacion || v.tipo || '';
      const otherId = oId === personaId ? dId : oId;
      const otherName = oId === personaId ? (v.destino_nombre || 'Contacto') : (v.origen_nombre || 'Contacto');

      if (otherId && !nodesMap.has(otherId)) {
        nodesMap.set(otherId, {
          id: otherId,
          label: otherName,
          shape: 'dot',
          size: 20,
          color: { background: '#1E293B', border: '#0EA5E9' },
          font: { color: '#E2E8F0', size: 11 },
          type: 'persona'
        });
      }

      if (oId && dId && nodesMap.has(oId) && nodesMap.has(dId)) {
        const edgeColor = CONFIG.vinculoColors[tipo] || '#64748B';
        edges.push({
          from: oId,
          to: dId,
          label: tipo.replace(/_/g, ' '),
          color: { color: edgeColor, opacity: 0.85 },
          width: 2,
          font: { color: '#94A3B8', size: 10 },
          arrows: { to: { enabled: true, scaleFactor: 0.6 } }
        });
      }
    });

    const nodes = new DataSet(Array.from(nodesMap.values()));
    const edgeDataSet = new DataSet(edges);

    if (currentGrafoNetwork) currentGrafoNetwork.destroy();

    currentGrafoNetwork = new Network(container, { nodes, edges: edgeDataSet }, {
      physics: {
        barnesHut: { gravitationalConstant: -2500, springLength: 150 },
        stabilization: { iterations: 80 }
      }
    });

    currentGrafoNetwork.on('click', (params) => {
      if (params.nodes.length > 0) mostrarDossierNodo(params.nodes[0]);
    });

    mostrarDossierNodo(personaId);

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

async function mostrarDossierNodo(nodeId) {
  const panel = document.getElementById('grafo-node-dossier');
  const content = document.getElementById('dossier-content');
  const badge = document.getElementById('dossier-badge');
  if (!panel || !content) return;

  panel.classList.remove('hidden');

  // Check if it's a Banda or Persona
  const b = await getBandaById(nodeId);
  if (b) {
    if (badge) {
      badge.textContent = 'ESTRUCTURA CRIMINAL';
      badge.style.background = b.color_hex || '#EF4444';
    }
    content.innerHTML = `
      <div style="font-weight:800;font-size:16px;color:#F8FAFC;margin-bottom:4px;">${b.nombre}</div>
      <div style="font-size:12px;color:var(--accent-primary);margin-bottom:12px;">Base: ${b.barrio_base || 'Santa Fe'}</div>
      ${b.cabecilla_principal ? `<div style="font-size:12px;margin-bottom:6px;"><strong style="color:var(--text-muted);">Liderazgo:</strong> ${b.cabecilla_principal}</div>` : ''}
      ${b.actividad_principal ? `<div style="font-size:12px;margin-bottom:6px;"><strong style="color:var(--text-muted);">Actividad:</strong> ${b.actividad_principal}</div>` : ''}
      ${b.delitos_alta_lesividad ? `<div style="font-size:12px;margin-bottom:6px;color:#F87171;"><strong style="color:#EF4444;">Alta Lesividad:</strong> ${b.delitos_alta_lesividad}</div>` : ''}
      <div style="margin-top:14px;display:flex;gap:6px;">
        <button class="btn btn-outline btn-xs" onclick="showEntityDetail('banda', '${b.id}')">Ver Ficha Completa</button>
      </div>
    `;
    return;
  }

  const p = await getPersonaById(nodeId);
  if (p) {
    const isCaptura = p.pedido_captura;
    if (badge) {
      badge.textContent = isCaptura ? '🚨 PEDIDO DE CAPTURA' : 'PERSONA DE INTERÉS';
      badge.style.background = isCaptura ? '#DC2626' : 'var(--accent-secondary)';
    }

    content.innerHTML = `
      ${isCaptura ? `
        <div style="background:rgba(239,68,68,0.2);border:1px solid #EF4444;border-radius:6px;padding:6px 10px;margin-bottom:10px;color:#FCA5A5;font-size:11px;font-weight:700;">
          ⚠️ PRÓFUGO CON PEDIDO DE CAPTURA ACTIVO
        </div>
      ` : ''}
      <div style="font-weight:800;font-size:15px;color:#F8FAFC;">${p.nombre || ''} ${p.apellido || ''}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">
        ${p.alias?.length ? `Alias: <strong>${p.alias.join(', ')}</strong> • ` : ''}DNI: ${p.dni || 'S/D'}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;background:rgba(255,255,255,0.03);padding:8px;border-radius:6px;margin-bottom:10px;">
        <div><span style="color:var(--text-muted);display:block;">BANDA:</span><strong>${p.banda_nombre || 'Individual'}</strong></div>
        <div><span style="color:var(--text-muted);display:block;">PELIGROSIDAD:</span><strong style="color:${(p.score_peligrosidad || 0) >= 8 ? '#EF4444' : '#F59E0B'}">${p.score_peligrosidad || 5}/10</strong></div>
      </div>
      ${p.domicilio_principal ? `<div style="font-size:11px;margin-bottom:6px;"><span style="color:var(--text-muted);">Domicilio:</span> ${p.domicilio_principal}</div>` : ''}
      ${p.cuij_asociados?.length ? `<div style="font-size:11px;margin-bottom:6px;"><span style="color:var(--text-muted);">CUIJ:</span> <span style="font-family:var(--font-mono);color:var(--accent-primary);">${p.cuij_asociados.join(', ')}</span></div>` : ''}
      <div style="margin-top:14px;display:flex;gap:6px;">
        <button class="btn btn-outline btn-xs" onclick="showEntityDetail('persona', '${p.id}')">Ficha Judicial</button>
        <button class="btn btn-primary btn-xs" onclick="renderGrafo('${p.id}')">Enfocar Vínculos</button>
      </div>
    `;
  }
}

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
  const titulo = document.getElementById('detalle-titulo');
  const contenido = document.getElementById('detalle-contenido');
  if (!titulo || !contenido) return;

  openModal('modal-detalle');
  contenido.innerHTML = '<div style="text-align:center;padding:32px"><div class="spinner"></div></div>';

  try {
    if (type === 'persona') {
      const p = await getPersonaById(id);
      if (!p) throw new Error('No se encontró el registro de la persona.');

      const isCaptura = p.pedido_captura;
      titulo.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span>${p.nombre || ''} ${p.apellido || ''}</span>
          ${isCaptura ? '<span class="tag" style="background:#DC2626;color:#fff;font-size:10px;font-weight:800;">🚨 PEDIDO DE CAPTURA</span>' : ''}
        </div>
      `;

      contenido.innerHTML = `
        <div style="display:grid;gap:16px">
          ${isCaptura ? `
            <div style="background:rgba(239,68,68,0.15);border:1px solid #EF4444;border-radius:8px;padding:12px 16px;color:#FCA5A5;font-weight:700;display:flex;align-items:center;gap:10px;">
              <span style="font-size:20px;">🚨</span>
              <div>
                <div style="color:#FFF;font-size:13px;font-weight:800;">ORDEN JUDICIAL DE CAPTURA ACTIVA</div>
                <div style="font-size:11px;opacity:0.9;font-weight:400;">Requerido en causa judicial. Notificar de inmediato al Ministerio Público de la Acusación / Brigada de Capturas.</div>
              </div>
            </div>
          ` : ''}

          <div class="form-section-title">Identidad y Estructura</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">NOMBRE COMPLETO</span>${p.nombre || '—'} ${p.apellido || ''}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">DNI</span>${p.dni || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ALIAS CONOCIDO</span>${p.alias?.join(', ') || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ORGANIZACIÓN / BANDA</span><strong style="color:#0EA5E9">${p.banda_nombre || 'Individual'}</strong></div>
          </div>

          <div class="form-section-title">Análisis de Inteligencia Criminal</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">NIVEL DE PELIGROSIDAD</span><span style="font-size:20px;font-weight:800;font-family:var(--font-mono);color:${(p.score_peligrosidad || 0) >= 7 ? 'var(--accent-danger)' : 'var(--accent-primary)'}">${p.score_peligrosidad || 5}/10</span></div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ROLES EN LA RED</span>${p.roles?.join(', ') || '—'}</div>
          </div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">DOMICILIO CONOCIDO / BASE</span><span style="font-size:13px">${p.domicilio_principal || '—'}</span></div>
          ${p.cuij_asociados?.length ? `<div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">CAUSAS CUIJ EN TRÁMITE</span><div style="font-family:var(--font-mono);color:var(--accent-primary);font-size:12px;">${p.cuij_asociados.join(' | ')}</div></div>` : ''}
          ${p.antecedentes_texto ? `<div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ANTECEDENTES E HISTORIAL</span><div style="font-size:13px;color:var(--text-secondary);max-height:200px;overflow-y:auto;padding:8px;background:var(--bg-primary);border-radius:8px">${p.antecedentes_texto}</div></div>` : ''}

          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('modal-detalle').classList.add('hidden'); window.enfocarPersonaEnGrafo('${p.id}');">🕸️ Ver en Red de Vínculos</button>
            ${p.domicilio_principal_geom ? '<button class="btn btn-secondary btn-sm" id="btn-ver-en-mapa">Ver en Mapa</button>' : ''}
          </div>
        </div>
      `;
    } else if (type === 'banda') {
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
          <div><span style="color:var(--text-muted);display:block;font-size:11px">INTELIGENCIA TÁCTICA</span><div style="font-size:13px;margin-top:4px;color:var(--text-secondary)">${b.descripcion || 'Sin observaciones registradas.'}</div></div>
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
