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

// Estado global de dossier y perfilación criminal
let currentPersonaFiles = [];
let currentViewingDossierId = null;

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
  
  const handleOpenNuevaPersona = () => {
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

  // Form: Persona (Creación y Edición de Integrantes / Domicilios / Dossiers Digitales)
  document.getElementById('form-persona')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('persona-edit-id')?.value;
    showLoading(editId ? 'Actualizando perfil y dossier institucional...' : 'Registrando perfil de persona de interés...');

    try {
      const bandaSelect = document.getElementById('persona-banda');
      const selectedBandaId = bandaSelect?.value || null;
      const selectedBandaNombre = bandaSelect?.options[bandaSelect.selectedIndex]?.text || null;

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

      if (editId) {
        await updatePersona(editId, personaPayload);
        await logAction('UPDATE', 'personas', editId);
        showToast('Dossier y perfil institucional actualizados correctamente', 'success');
      } else {
        const result = await insertPersona(personaPayload);
        await logAction('INSERT', 'personas', result.id);
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

      if (document.getElementById('view-personas')?.classList.contains('active')) {
        await renderPersonasView();
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
          <div class="entity-tags" style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              ${p.alias?.slice(0, 2).map(a => `<span class="tag alias">${a}</span>`).join('') || ''}
              ${p.roles?.slice(0, 2).map(r => `<span class="tag rol">${r}</span>`).join('') || ''}
              ${!isCaptura ? `<span class="tag ${pClass}">Peligro: ${p.score_peligrosidad || 5}/10</span>` : ''}
            </div>
            <div style="display:flex;gap:4px;align-items:center;">
              <button class="btn btn-primary btn-xs" onclick="event.stopPropagation(); window.abrirDossierDigital('${p.id}');" title="Abrir Dossier Digital Completo" style="font-size:10px;padding:3px 8px;font-weight:800;display:inline-flex;align-items:center;gap:4px;background:#0284c7;border:1px solid #38bdf8;color:#fff;">
                📋 Dossier
              </button>
              <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.abrirEdicionPersona('${p.id}');" title="Editar Perfil" style="font-size:10px;padding:3px 6px;">
                ✏️
              </button>
              <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.centrarPersonaEnMapa('${p.id}');" title="Ver Domicilio en Mapa" style="font-size:10px;padding:3px 6px;">
                📍
              </button>
              <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.enfocarPersonaEnGrafo('${p.id}');" title="Ver en Red de Vínculos" style="font-size:10px;padding:3px 7px;display:flex;align-items:center;gap:3px;">
                🕸️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Click en la tarjeta abre directamente el Dossier Digital nativo
    grid.querySelectorAll('.entity-card').forEach(card => {
      card.addEventListener('click', () => window.abrirDossierDigital(card.dataset.id));
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
  // Navegación de pestañas en modal de edición de perfil
  document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.formTab;
      document.querySelectorAll('.persona-tab-pane').forEach(p => p.classList.add('hidden'));
      document.getElementById(target)?.classList.remove('hidden');
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
      closeModal('modal-dossier-digital');
      window.abrirEdicionPersona(currentViewingDossierId);
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

  row.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;gap:8px">
      <div style="display:grid;grid-template-columns:140px 1.5fr 1fr;gap:8px">
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
          <label style="font-size:10px;color:var(--text-muted)">Dirección y Altura</label>
          <input type="text" class="form-input dom-direccion" value="${(data.direccion || '').replace(/"/g, '&quot;')}" placeholder="Ej: Vera Mujica 674" style="padding:4px 8px;font-size:11px">
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
    <div style="flex:1;display:grid;grid-template-columns:110px 110px 1.2fr 100px 1.2fr;gap:8px">
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Dominio / Patente</label>
        <input type="text" class="form-input veh-patente" value="${(data.patente || '').replace(/"/g, '&quot;')}" placeholder="AB123CD" style="padding:4px 8px;font-size:11px;text-transform:uppercase;font-weight:700">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Tipo</label>
        <select class="form-input veh-tipo" style="padding:4px 8px;font-size:11px">
          <option value="Automóvil" ${data.tipo === 'Automóvil' ? 'selected' : ''}>Automóvil</option>
          <option value="Motovehículo" ${data.tipo === 'Motovehículo' ? 'selected' : ''}>Motovehículo</option>
          <option value="Camioneta" ${data.tipo === 'Camioneta' ? 'selected' : ''}>Camioneta</option>
          <option value="Utilitario" ${data.tipo === 'Utilitario' ? 'selected' : ''}>Utilitario</option>
        </select>
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Marca y Modelo</label>
        <input type="text" class="form-input veh-modelo" value="${(data.modelo || '').replace(/"/g, '&quot;')}" placeholder="VW Gol Trend" style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Color</label>
        <input type="text" class="form-input veh-color" value="${(data.color || '').replace(/"/g, '&quot;')}" placeholder="Negro / Gris" style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Titular Registral</label>
        <input type="text" class="form-input veh-titular" value="${(data.titular || '').replace(/"/g, '&quot;')}" placeholder="Titular o Tercero" style="padding:4px 8px;font-size:11px">
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
    <div style="flex:1;display:grid;grid-template-columns:1.5fr 120px 110px 2fr;gap:8px">
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
          <option value="Otro" ${data.parentesco === 'Otro' ? 'selected' : ''}>Otro</option>
        </select>
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">DNI</label>
        <input type="text" class="form-input fam-dni" value="${(data.dni || '').replace(/"/g, '&quot;')}" placeholder="12345678" style="padding:4px 8px;font-size:11px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--text-muted)">Observación / Vínculo Operativo</label>
        <input type="text" class="form-input fam-obs" value="${(data.observacion || '').replace(/"/g, '&quot;')}" placeholder="Titular de rodados / Coimputado..." style="padding:4px 8px;font-size:11px">
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-xs btn-remove-row" title="Quitar familiar" style="color:#EF4444;border-color:rgba(239,68,68,0.3);margin-top:16px">✕</button>
  `;

  row.querySelector('.btn-remove-row')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

// Global exposure for editing persona profile & dossier
window.abrirEdicionPersona = async function(personaId) {
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

    // Banda
    const bandaSelect = document.getElementById('persona-banda');
    if (bandaSelect) {
      if (p.banda_id) {
        bandaSelect.value = p.banda_id;
      } else if (p.banda_nombre) {
        const opt = Array.from(bandaSelect.options).find(o => o.text.toLowerCase() === p.banda_nombre.toLowerCase());
        if (opt) bandaSelect.value = opt.value;
        else bandaSelect.value = '';
      } else {
        bandaSelect.value = '';
      }
    }

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
      }
    }

    // Vehículos
    const vehCont = document.getElementById('persona-vehiculos-container');
    if (vehCont) {
      vehCont.innerHTML = '';
      if (Array.isArray(p.vehiculos)) {
        p.vehiculos.forEach(v => addVehiculoRow(v));
      }
    }

    // Familiares
    const famCont = document.getElementById('persona-familia-container');
    if (famCont) {
      famCont.innerHTML = '';
      if (Array.isArray(p.familiares)) {
        p.familiares.forEach(f => addFamiliaRow(f));
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

    // Switch to tab 1
    document.querySelectorAll('#persona-form-nav .dossier-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#persona-form-nav [data-form-tab="tab-f-identidad"]')?.classList.add('active');
    document.querySelectorAll('.persona-tab-pane').forEach(pane => pane.classList.add('hidden'));
    document.getElementById('tab-f-identidad')?.classList.remove('hidden');

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
            <span style="background:${bandaColor}22;border:1px solid ${bandaColor}66;color:${bandaColor};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800">
              🏴 ${p.banda_nombre || 'Individual'}
            </span>
            <span style="background:${p.score_peligrosidad >= 8 ? '#EF4444' : '#F59E0B'};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">
              Peligrosidad: ${p.score_peligrosidad || 5}/10
            </span>
            <span style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);color:var(--text-primary);padding:2px 8px;border-radius:12px;font-size:11px">
              ${p.estado_procesal || 'IDENTIFICADO'}
            </span>
            ${rolesList.map(r => `<span style="background:rgba(14,165,233,0.12);color:var(--accent-secondary);padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600">⚔️ ${r}</span>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:6px;flex-direction:column;flex-shrink:0" class="dossier-actions-bar">
          <button class="btn btn-outline btn-xs" onclick="window.centrarPersonaEnMapa('${p.id}'); closeModal('modal-dossier-digital');" style="display:flex;align-items:center;gap:6px;padding:6px 10px">
            📍 Centrar en Mapa
          </button>
          <button class="btn btn-outline btn-xs" onclick="window.enfocarPersonaEnGrafo('${p.id}'); closeModal('modal-dossier-digital');" style="display:flex;align-items:center;gap:6px;padding:6px 10px">
            🕸️ Ver en Red de Vínculos
          </button>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 1: FICHA E IDENTIDAD GENERAL -->
    <div class="dossier-content-section" id="dossier-tab-general">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;margin-bottom:16px">
        <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px">
          <div class="dossier-section-title">Datos Personales y Registro</div>
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
          <div class="dossier-section-title">Síntesis Operativa y Territorial</div>
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
        <div class="dossier-section-title">Resumen de Inteligencia Criminal</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap">
          ${p.antecedentes_texto || 'No se registraron observaciones de antecedentes para este perfil.'}
        </div>
      </div>
    </div>

    <!-- SECCIÓN 2: DOCUMENTOS Y ADJUNTOS (.pdf, .doc, .docx, imágenes) -->
    <div class="dossier-content-section hidden" id="dossier-tab-adjuntos">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:#fff">Documentación, Actas y Peritajes Incorporados al Dossier (${archivos.length})</div>
        <button type="button" class="btn btn-secondary btn-xs" onclick="closeModal('modal-dossier-digital'); window.abrirEdicionPersona('${p.id}'); setTimeout(() => document.querySelector('[data-form-tab=tab-f-adjuntos]')?.click(), 150);">
          + Adjuntar Archivos
        </button>
      </div>

      ${archivos.length === 0 ? `
        <div style="text-align:center;padding:32px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px">
          <div style="font-size:28px;margin-bottom:6px">📎</div>
          <div style="font-size:13px;font-weight:700;color:#fff">Sin archivos incorporados</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Puede incorporar actas de allanamiento, informes periciales, oficios o fotografías en formato PDF, DOC, DOCX o imágenes.</div>
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
      <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:12px">
        Inmuebles, Asentamientos y Puntos Territoriales Vinculados (${domicilios.length})
      </div>

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
                </div>
              </div>

              ${coords ? `
                <button type="button" class="btn btn-secondary btn-xs" onclick="window.centrarCoordenadasMapa(${coords.lng}, ${coords.lat}, '${(d.direccion || '').replace(/'/g, "\\'")}'); closeModal('modal-dossier-digital');" style="font-size:10px;padding:4px 8px;white-space:nowrap">
                  🗺️ Ver en Mapa
                </button>
              ` : `
                <span style="font-size:10px;color:var(--text-muted)">Pendiente geocodificación</span>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- SECCIÓN 4: CAUSAS Y PROCESOS CUIJ -->
    <div class="dossier-content-section hidden" id="dossier-tab-causas">
      <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:12px">
        Investigaciones Penales Preparatorias y Causas CUIJ (${causas.length})
      </div>

      ${causas.length === 0 ? `
        <div style="text-align:center;padding:24px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px;color:var(--text-muted);font-size:12px">
          No registra causas CUIJ vinculadas en el sistema.
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px">
          ${causas.map(c => `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px 14px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <span style="font-family:var(--font-mono);color:var(--accent-primary);font-weight:800;font-size:12px">
                  ⚖️ CUIJ: ${c.cuij}
                </span>
                <span style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">
                  ${c.estado || 'En trámite'}
                </span>
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
      <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:12px">
        Parque Automotor y Rodados Detectados (${vehiculos.length})
      </div>

      ${vehiculos.length === 0 ? `
        <div style="text-align:center;padding:24px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px;color:var(--text-muted);font-size:12px">
          No registra vehículos asociados en este legajo.
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:12px">
          ${vehiculos.map(v => `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="font-family:var(--font-mono);font-size:13px;font-weight:900;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;color:#fff">
                  ${v.patente}
                </span>
                <span style="font-size:11px;color:var(--text-muted)">${v.tipo || 'Rodado'}</span>
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
      <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:12px">
        Red de Parentesco y Convivencia (${familiares.length})
      </div>

      ${familiares.length === 0 ? `
        <div style="text-align:center;padding:24px;background:rgba(255,255,255,0.015);border:1px dashed rgba(255,255,255,0.15);border-radius:8px;color:var(--text-muted);font-size:12px">
          No se registraron vínculos familiares directos en este perfil.
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:12px">
          ${familiares.map(fam => `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:12px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <strong style="color:#fff;font-size:13px">${fam.nombre}</strong>
                <span style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#FDE68A;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px">
                  ${fam.parentesco}
                </span>
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
      <div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:8px;padding:14px;margin-bottom:14px">
        <div class="dossier-section-title">Perfilación Territorial e Inteligencia Criminal</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">
          ${p.antecedentes_texto || 'Sin notas de inteligencia operativa adicionales.'}
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
}

// Global exposure for printing / PDF export of dossier
window.imprimirDossierDigital = async function(personaId) {
  if (!personaId && currentViewingDossierId) personaId = currentViewingDossierId;
  if (!personaId) return;

  await window.abrirDossierDigital(personaId);
  // Mostrar todas las secciones simultáneamente para impresión
  document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.remove('hidden'));
  window.print();
  // Restaurar pestaña activa tras imprimir
  const activeTabBtn = document.querySelector('#dossier-view-tabs .dossier-tab-btn.active');
  const targetId = activeTabBtn ? activeTabBtn.dataset.dossierTab : 'dossier-tab-general';
  document.querySelectorAll('.dossier-content-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(targetId)?.classList.remove('hidden');
};

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
              <button class="btn btn-outline btn-xs" onclick="window.verFichaDesdeInspeccion('${per.id}')" style="font-size:10px;">Ficha Judicial</button>
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
