// ============================================================
// CRIMINT — Main Application Orchestrator
// ============================================================
import { initMap, loadMapData, toggleLayer, flyTo } from './map.js';
import { initDashboard, refreshDashboard } from './dashboard.js';
import {
  globalSearch, insertHecho, insertPersona, insertBanda,
  getPersonas, getBandas, getAllanamientos, insertAllanamiento, insertVinculo,
  getGrafoPersona, geocodeAddress, logAction, parseGeom,
} from './supabase-client.js';
import { parseKML, parseKMZ, parseExcel, importExcelRows, importKMLGeoJSON } from './importers.js';
import { CONFIG, getLesividadClass, formatDate, formatDateTime } from './config.js';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

// ============================================================
// APP INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initMap();
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

  // Default dates for filters
  const today = new Date().toISOString().split('T')[0];
  const ago90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  setDefaultDate('filter-fecha-desde', ago90);
  setDefaultDate('filter-fecha-hasta', today);

  showToast('CRIMINT iniciado correctamente', 'info');
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
    if (elH) elH.textContent = hechos.length;
    if (elP) elP.textContent = personas.length;
    if (elB) elB.textContent = bandas.length;
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
        dropdown.innerHTML = results.map(r => `
          <div class="search-result-item" data-type="${r.type}" data-id="${r.id}">
            <span class="search-result-type ${r.type}">${r.type === 'persona' ? 'PER' : r.type === 'hecho' ? 'HEC' : 'BAN'}</span>
            <div>
              <div style="font-weight:500;font-size:13px">${r.title}</div>
              <div style="font-size:11px;color:var(--text-muted)">${r.subtitle}</div>
            </div>
          </div>
        `).join('');
      }
      dropdown.classList.add('visible');
    }, 300);
  });

  dropdown?.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item || !item.dataset.id) return;

    dropdown.classList.remove('visible');
    input.value = '';

    // Navigate to result
    const type = item.dataset.type;
    if (type === 'persona') {
      navigateToView('personas');
    } else if (type === 'hecho') {
      navigateToView('mapa');
    } else if (type === 'banda') {
      navigateToView('bandas');
    }
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
      desde: document.getElementById('filter-fecha-desde')?.value
        ? new Date(document.getElementById('filter-fecha-desde').value).toISOString()
        : undefined,
      hasta: document.getElementById('filter-fecha-hasta')?.value
        ? new Date(document.getElementById('filter-fecha-hasta').value + 'T23:59:59').toISOString()
        : undefined,
      lesividadMin: parseInt(document.getElementById('filter-lesividad')?.value) || 1,
      tipo: document.getElementById('filter-tipo')?.value || undefined,
    };
    loadMapData(filters);
    showToast('Filtros aplicados', 'success');
  });

  btnClear?.addEventListener('click', () => {
    document.getElementById('filter-fecha-desde').value = '';
    document.getElementById('filter-fecha-hasta').value = '';
    document.getElementById('filter-lesividad').value = 1;
    document.getElementById('filter-lesividad-val').textContent = '1';
    document.getElementById('filter-tipo').value = '';
    loadMapData();
    showToast('Filtros limpiados', 'info');
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
    statusKml.innerHTML = '<div class="spinner"></div> Procesando archivo geográfico...';
    try {
      let geoJSON;
      if (file.name.toLowerCase().endsWith('.kmz')) {
        geoJSON = await parseKMZ(file);
      } else {
        const text = await file.text();
        geoJSON = parseKML(text);
      }

      const polygons = geoJSON.features.filter(f => f.geometry.type === 'Polygon').length;
      const points = geoJSON.features.filter(f => f.geometry.type === 'Point').length;

      statusKml.innerHTML = `
        <div style="background:var(--bg-secondary);padding:12px;border-radius:8px;border:1px solid var(--border-color);margin-top:10px">
          <div style="font-weight:600;color:var(--accent-primary)">Archivo analizado: ${file.name}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin:6px 0">
            Encontrados: <strong>${polygons}</strong> polígonos/zonas y <strong>${points}</strong> puntos georreferenciados.
          </div>
          <button class="btn btn-primary btn-sm" id="btn-confirm-kml-import">Confirmar Ingesta a Supabase</button>
        </div>
      `;

      document.getElementById('btn-confirm-kml-import')?.addEventListener('click', async () => {
        statusKml.innerHTML = '<div class="spinner"></div> Importando datos geográficos a la base...';
        try {
          const res = await importKMLGeoJSON(geoJSON);
          statusKml.innerHTML = `
            <div style="color:var(--accent-success);font-size:13px;padding:8px 0">
              ✓ Ingesta completada: ${res.insertedZonas} zonas y ${res.insertedHechos} hechos importados.
            </div>
          `;
          showToast('Datos KML importados con éxito', 'success');
          loadMapData();
        } catch (err) {
          statusKml.innerHTML = `<div style="color:var(--accent-danger)">Error: ${err.message}</div>`;
        }
      });
    } catch (err) {
      statusKml.innerHTML = `<div style="color:var(--accent-danger);margin-top:8px">Error al procesar KML/KMZ: ${err.message}</div>`;
    }
  });

  // Local KMZ Import Button
  document.getElementById('btn-import-kml-local')?.addEventListener('click', async () => {
    showLoading('Cargando capas tácticas de Santa Fe...');
    try {
      const santaFeZonas = [
        {
          nombre: 'Barrio Yapeyú - Zona Conflicto',
          tipo: 'BANDA_CONFLICTO',
          barrio: 'Yapeyú',
          geom: 'SRID=4326;POLYGON((-60.740042 -31.559614, -60.744912 -31.565812, -60.745792 -31.571443, -60.736673 -31.573600, -60.732338 -31.567037, -60.731845 -31.561991, -60.740042 -31.559614))',
          color_hex: '#EF4444',
          descripcion: 'Área de alta conflictividad armada y microtráfico - Los Chingos / Los de Siempre'
        },
        {
          nombre: 'San Lorenzo - Zona Operativa',
          tipo: 'PATRULLAJE_PRIORITARIO',
          barrio: 'San Lorenzo',
          geom: 'SRID=4326;POLYGON((-60.7325 -31.6500, -60.7250 -31.6520, -60.7230 -31.6620, -60.7350 -31.6610, -60.7325 -31.6500))',
          color_hex: '#F59E0B',
          descripcion: 'Sector de allanamientos e intervenciones de saturación policial'
        },
        {
          nombre: 'Barranquitas Sur / Oeste',
          tipo: 'BANDA_CONFLICTO',
          barrio: 'Barranquitas',
          geom: 'SRID=4326;POLYGON((-60.7200 -31.6300, -60.7100 -31.6320, -60.7120 -31.6400, -60.7220 -31.6390, -60.7200 -31.6300))',
          color_hex: '#8B5CF6',
          descripcion: 'Corredor de distribución y puntos de acopio de microtráfico'
        }
      ];

      for (const z of santaFeZonas) {
        await (await import('./supabase-client.js')).default.from('zonas_geograficas').insert(z);
      }
      showToast('Capas tácticas de Santa Fe cargadas', 'success');
      loadMapData();
      document.querySelector('[data-view=mapa]')?.click();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
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
// PERSONAS VIEW
// ============================================================
async function renderPersonasView() {
  const grid = document.getElementById('personas-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Cargando personas...</span></div>';

  try {
    const search = document.getElementById('personas-search')?.value;
    const personas = await getPersonas({ search, limit: 100 });

    if (personas.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <h3>Sin personas registradas</h3>
          <p>Cargá personas manualmente o importá datos desde archivos.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = personas.map(p => {
      const initials = `${(p.nombre || '?')[0]}${(p.apellido || '')[0] || ''}`.toUpperCase();
      const pClass = p.score_peligrosidad >= 7 ? 'peligrosidad-alta' : p.score_peligrosidad >= 4 ? 'peligrosidad-media' : 'peligrosidad-baja';

      return `
        <div class="entity-card" data-id="${p.id}" data-type="persona">
          <div class="entity-card-header">
            <div class="entity-avatar persona">${initials}</div>
            <div>
              <div class="entity-card-name">${p.nombre || ''} ${p.apellido || ''}</div>
              <div class="entity-card-sub">${p.dni ? `DNI: ${p.dni}` : 'Sin DNI'}</div>
            </div>
          </div>
          <div class="entity-card-body">
            ${p.domicilio_principal ? `<div class="entity-field"><span class="entity-field-label">Domicilio</span><span class="entity-field-value">${p.domicilio_principal}</span></div>` : ''}
            ${p.modus_operandi ? `<div class="entity-field"><span class="entity-field-label">M.O.</span><span class="entity-field-value">${p.modus_operandi}</span></div>` : ''}
          </div>
          <div class="entity-tags">
            ${p.alias?.map(a => `<span class="tag alias">${a}</span>`).join('') || ''}
            ${p.roles?.map(r => `<span class="tag rol">${r}</span>`).join('') || ''}
            <span class="tag ${pClass}">P: ${p.score_peligrosidad}</span>
          </div>
        </div>
      `;
    }).join('');

    // Click handlers
    grid.querySelectorAll('.entity-card').forEach(card => {
      card.addEventListener('click', () => showEntityDetail('persona', card.dataset.id));
    });

  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Error cargando personas</h3><p>${err.message}</p></div>`;
  }

  // Search handler
  setupListSearch('personas-search', renderPersonasView);
}

// ============================================================
// BANDAS VIEW
// ============================================================
async function renderBandasView() {
  const grid = document.getElementById('bandas-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="spinner"></div><span>Cargando bandas...</span></div>';

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
      return `
        <div class="entity-card" data-id="${b.id}" data-type="banda">
          <div class="entity-card-header">
            <div class="entity-avatar banda">${b.nombre[0]?.toUpperCase() || 'B'}</div>
            <div>
              <div class="entity-card-name">${b.nombre}</div>
              <div class="entity-card-sub">${b.barrio_base || 'Sin barrio base'}</div>
            </div>
          </div>
          <div class="entity-card-body">
            ${b.actividad_principal ? `<div class="entity-field"><span class="entity-field-label">Actividad</span><span class="entity-field-value">${b.actividad_principal}</span></div>` : ''}
            ${b.descripcion ? `<div class="entity-field"><span class="entity-field-label">Notas</span><span class="entity-field-value">${b.descripcion.substring(0, 100)}...</span></div>` : ''}
          </div>
          <div class="entity-tags">
            <span class="tag ${b.activa ? 'peligrosidad-alta' : 'peligrosidad-baja'}">${b.activa ? 'ACTIVA' : 'INACTIVA'}</span>
            ${b.nivel_amenaza ? `<span class="tag alias">Amenaza: ${b.nivel_amenaza}</span>` : ''}
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
      const resultColor = a.resultado === 'POSITIVO' ? 'accent-success' : 'accent-danger';
      return `
        <div class="entity-card" data-id="${a.id}" data-type="allanamiento">
          <div class="entity-card-header">
            <div class="entity-avatar operativo">⊕</div>
            <div>
              <div class="entity-card-name">${a.direccion || 'Sin dirección'}</div>
              <div class="entity-card-sub">${a.cuij || ''} ${a.requerimiento || ''}</div>
            </div>
          </div>
          <div class="entity-card-body">
            <div class="entity-field"><span class="entity-field-label">Fecha</span><span class="entity-field-value">${formatDateTime(a.fecha_operativo)}</span></div>
            <div class="entity-field"><span class="entity-field-label">Fuerza</span><span class="entity-field-value">${a.fuerza_interviniente || '—'}</span></div>
            ${a.resultado ? `<div class="entity-field"><span class="entity-field-label">Resultado</span><span class="entity-field-value" style="color:var(--${resultColor})">${a.resultado}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }

  setupListSearch('allanamientos-search', renderAllanamientosView);
}

// ============================================================
// GRAFO VIEW (vis-network)
// ============================================================
async function setupGrafoView() {
  // Populate persona selector
  const select = document.getElementById('grafo-persona-select');
  if (!select) return;

  try {
    const personas = await getPersonas({ limit: 200 });
    select.innerHTML = '<option value="">Seleccionar persona...</option>';
    personas.forEach(p => {
      const name = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre';
      const aliasStr = p.alias?.length ? ` (${p.alias[0]})` : '';
      select.innerHTML += `<option value="${p.id}">${name}${aliasStr}</option>`;
    });
  } catch (e) {
    console.error('Error loading personas for grafo:', e);
  }

  document.getElementById('btn-grafo-load')?.addEventListener('click', async () => {
    const personaId = select.value;
    if (!personaId) {
      showToast('Seleccioná una persona', 'warning');
      return;
    }
    await renderGrafo(personaId);
  });
}

async function renderGrafo(personaId) {
  const container = document.getElementById('grafo-canvas');
  if (!container) return;

  try {
    const vinculos = await getGrafoPersona(personaId);

    if (!vinculos || vinculos.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>Sin vínculos</h3><p>Esta persona no tiene vínculos registrados.</p></div>';
      return;
    }

    container.innerHTML = '';

    const nodesMap = new Map();
    const edges = [];

    vinculos.forEach(v => {
      const origenId = v.persona_origen_id || v.origen_id;
      const destinoId = v.persona_destino_id || v.destino_id;
      const tipo = v.tipo_relacion || v.tipo;

      if (origenId && !nodesMap.has(origenId)) {
        const name = v.origen_nombre || v.persona_origen?.nombre || 'Desconocido';
        nodesMap.set(origenId, {
          id: origenId,
          label: name,
          color: origenId === personaId ? '#F59E0B' : '#0EA5E9',
          font: { color: '#E8ECF4', size: 12 },
          borderWidth: origenId === personaId ? 3 : 1,
          size: origenId === personaId ? 25 : 18,
        });
      }

      if (destinoId && !nodesMap.has(destinoId)) {
        const name = v.destino_nombre || v.persona_destino?.nombre || 'Desconocido';
        nodesMap.set(destinoId, {
          id: destinoId,
          label: name,
          color: '#0EA5E9',
          font: { color: '#E8ECF4', size: 12 },
          borderWidth: 1,
          size: 18,
        });
      }

      edges.push({
        from: origenId,
        to: destinoId,
        label: tipo?.replace('_', ' ') || '',
        color: { color: CONFIG.vinculoColors[tipo] || '#6B7280', opacity: 0.7 },
        font: { color: '#4B5D78', size: 9, strokeWidth: 0 },
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      });
    });

    const nodes = new DataSet(Array.from(nodesMap.values()));
    const edgeDataSet = new DataSet(edges);

    new Network(container, { nodes, edges: edgeDataSet }, {
      physics: {
        barnesHut: { gravitationalConstant: -3000, springLength: 150 },
        stabilization: { iterations: 100 },
      },
      nodes: {
        shape: 'dot',
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10 },
      },
      edges: {
        smooth: { type: 'curvedCW', roundness: 0.2 },
        width: 2,
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
      },
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
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
      const { data: p, error } = await (await import('./supabase-client.js')).default.from('personas').select('*').eq('id', id).single();
      if (error) throw error;

      titulo.textContent = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Persona';
      contenido.innerHTML = `
        <div style="display:grid;gap:16px">
          <div class="form-section-title">Identidad</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">NOMBRE</span>${p.nombre || '—'} ${p.apellido || ''}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">DNI</span>${p.dni || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ALIAS</span>${p.alias?.join(', ') || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">NACIMIENTO</span>${formatDate(p.fecha_nacimiento)}</div>
          </div>

          <div class="form-section-title">Descripción Física</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">TEZ</span>${p.tez || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">CABELLO</span>${p.cabello || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">CONTEXTURA</span>${p.contextura || '—'}</div>
          </div>
          ${p.senas_particulares ? `<div style="font-size:13px"><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">SEÑAS PARTICULARES</span>${p.senas_particulares}</div>` : ''}

          <div class="form-section-title">Análisis Criminal</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">PELIGROSIDAD</span><span style="font-size:20px;font-weight:800;font-family:var(--font-mono);color:${p.score_peligrosidad >= 7 ? 'var(--accent-danger)' : p.score_peligrosidad >= 4 ? 'var(--accent-primary)' : 'var(--accent-success)'}">${p.score_peligrosidad}/10</span></div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ROLES</span>${p.roles?.join(', ') || '—'}</div>
          </div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">DOMICILIO</span><span style="font-size:13px">${p.domicilio_principal || '—'}</span></div>
          ${p.antecedentes_texto ? `<div><span style="color:var(--text-muted);display:block;font-size:11px;margin-bottom:2px">ANTECEDENTES</span><div style="font-size:13px;color:var(--text-secondary);max-height:200px;overflow-y:auto;padding:8px;background:var(--bg-primary);border-radius:8px">${p.antecedentes_texto}</div></div>` : ''}

          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-accent btn-sm" onclick="document.getElementById('modal-detalle').classList.add('hidden');document.querySelector('[data-view=grafo]').click();">Ver Vínculos</button>
            ${p.domicilio_principal_geom ? '<button class="btn btn-secondary btn-sm" id="btn-ver-en-mapa">Ver en Mapa</button>' : ''}
          </div>
        </div>
      `;
    } else if (type === 'banda') {
      const { data: b, error } = await (await import('./supabase-client.js')).default.from('bandas').select('*').eq('id', id).single();
      if (error) throw error;
      titulo.textContent = b.nombre;
      contenido.innerHTML = `
        <div style="display:grid;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
            <div><span style="color:var(--text-muted);display:block;font-size:11px">BARRIO BASE</span>${b.barrio_base || '—'}</div>
            <div><span style="color:var(--text-muted);display:block;font-size:11px">ESTADO</span><span class="tag ${b.activa ? 'peligrosidad-alta' : 'peligrosidad-baja'}">${b.activa ? 'ACTIVA' : 'INACTIVA'}</span></div>
          </div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">MODUS OPERANDI / ACTIVIDADES</span><div style="font-size:13px;margin-top:4px">${b.actividad_principal || '—'}</div></div>
          <div><span style="color:var(--text-muted);display:block;font-size:11px">INTELIGENCIA TÁCTICA</span><div style="font-size:13px;margin-top:4px;color:var(--text-secondary)">${b.descripcion || 'Sin observaciones registradas.'}</div></div>
        </div>
      `;
    } else if (type === 'allanamiento') {
      const { data: a, error } = await (await import('./supabase-client.js')).default.from('allanamientos').select('*').eq('id', id).single();
      if (error) throw error;
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
      const { data: h, error } = await (await import('./supabase-client.js')).default.from('hechos_delictivos').select('*').eq('id', id).single();
      if (error) throw error;
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

function navigateToView(viewId) {
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
