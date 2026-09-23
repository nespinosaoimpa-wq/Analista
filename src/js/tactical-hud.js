/**
 * CRIMINT — Interfaz Táctica HUD y Reproductor de Línea de Tiempo
 * Controla el panel lateral de inteligencia (temática, territorio, denunciados, evolución)
 * y la barra temporal inferior con animación mes a mes y año a año.
 */

import Chart from 'chart.js/auto';
import {
  analyzeIncidents,
  CRIME_THEMATICS
} from './analytics-engine.js';
import {
  getActiveMapFeatures,
  getAllMasterFeatures,
  applyMapFilters,
  resetMapFilters,
  getCurrentFilterCriteria,
  focusOnHotspot,
  focusOnDenunciado
} from './map.js';

let hudEvolutionChart = null;
let timelineInterval = null;
let isTimelinePlaying = false;
let currentTimelineYear = 'todos';
let currentTimelineMonth = 'todos';

export function initTacticalHUD() {
  const panel = document.getElementById('tactical-hud-panel');
  const toggleBtn = document.getElementById('btn-hud-toggle');
  const closeBtn = document.getElementById('btn-hud-close');
  const clearFilterBtn = document.getElementById('btn-hud-clear-filter');

  // Toggle drawer open/closed
  toggleBtn?.addEventListener('click', () => {
    panel?.classList.toggle('hidden');
    refreshHUDContent();
  });

  closeBtn?.addEventListener('click', () => {
    panel?.classList.add('hidden');
  });

  clearFilterBtn?.addEventListener('click', () => {
    resetMapFilters();
    updateFilterStatusUI({});
  });

  // Tab switching
  const tabBtns = document.querySelectorAll('.hud-tab-btn');
  const tabContents = document.querySelectorAll('.hud-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(`hud-tab-${tabId}`);
      if (target) target.classList.add('active');

      if (tabId === 'evolution') {
        renderHUDEvolutionChart();
      }
    });
  });

  // Denunciado live search inside HUD
  const searchInput = document.getElementById('hud-denunciado-search');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    filterDenunciadosList(q);
  });

  // Listen to map changes to update HUD numbers
  window.addEventListener('crimint:data-loaded', () => {
    refreshHUDContent();
    updateTimelineCounter();
  });

  window.addEventListener('crimint:filters-applied', (e) => {
    updateFilterStatusUI(e.detail || {});
  });

  // Initial render
  refreshHUDContent();
}

export function refreshHUDContent() {
  const master = getAllMasterFeatures();
  const active = getActiveMapFeatures();
  const dataset = (master && master.length > 0) ? master : active;
  if (!dataset || dataset.length === 0) return;

  const analysis = analyzeIncidents(dataset);

  // Update total badge
  const totalBadge = document.getElementById('hud-total-count');
  if (totalBadge) totalBadge.textContent = dataset.length.toLocaleString();

  // 1. Render Temáticas Tab
  renderThematicsTab(analysis.byThematic);

  // 2. Render Territorio Tab (Hotspots & Barrios)
  renderTerritoryTab(analysis.topHotspots, analysis.topBarrios);

  // 3. Render Denunciados Tab
  renderDenunciadosTab(analysis.topDenunciados);

  // 4. Render Evolution Metrics & Chart
  renderEvolutionMetrics(analysis.temporal);
}

function renderThematicsTab(byThematic = {}) {
  const container = document.getElementById('hud-thematics-list');
  if (!container) return;

  const currentFilters = getCurrentFilterCriteria();
  const activeThematic = currentFilters.tematica || '';

  container.innerHTML = Object.values(byThematic)
    .sort((a, b) => b.count - a.count)
    .map(t => {
      const isActive = activeThematic === t.id;
      return `
        <div class="hud-item-card ${isActive ? 'active-filter' : ''}" data-tematica="${t.id}" style="${isActive ? `border-color: ${t.color}; background: rgba(255,255,255,0.06);` : ''}">
          <div class="hud-item-left">
            <span style="font-size: 14px;">${t.icon}</span>
            <div>
              <div class="hud-item-name" style="color: ${isActive ? t.color : 'var(--text-primary)'}; font-weight: ${isActive ? '700' : '500'};">
                ${t.nombre}
              </div>
              <div style="font-size: 10px; color: var(--text-muted);">
                ${t.percentage}% del total de incidencias
              </div>
            </div>
          </div>
          <div class="hud-item-count" style="${isActive ? `color: #060A13; background: ${t.color}; font-weight: 800;` : ''}">
            ${t.count}
          </div>
        </div>
      `;
    }).join('');

  container.querySelectorAll('.hud-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const tId = card.dataset.tematica;
      const current = getCurrentFilterCriteria().tematica;
      if (current === tId) {
        applyMapFilters({ tematica: '' });
      } else {
        applyMapFilters({ tematica: tId });
      }
    });
  });
}

function renderTerritoryTab(topHotspots = [], topBarrios = []) {
  const container = document.getElementById('hud-hotspots-list');
  if (!container) return;

  const hotspotsHTML = topHotspots.slice(0, 15).map(h => `
    <div class="hud-item-card hud-hotspot-item" data-lng="${h.coordenadas[0]}" data-lat="${h.coordenadas[1]}" data-name="${h.ubicacion}">
      <div class="hud-item-left">
        <span class="hud-item-dot" style="background: #EF4444;"></span>
        <div>
          <div class="hud-item-name">${h.ubicacion}</div>
          <div style="font-size: 10px; color: var(--text-muted);">${h.delitos.slice(0, 2).join(' • ')}</div>
        </div>
      </div>
      <div class="hud-item-count" title="Incidencias concentradas">${h.incidencias}</div>
    </div>
  `).join('');

  const barriosHTML = `
    <div style="margin-top: 14px; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #A78BFA; text-transform: uppercase;">
      🏘️ Barrios con Mayor Carga Delictiva:
    </div>
    ${topBarrios.slice(0, 8).map(b => `
      <div class="hud-item-card hud-barrio-item" data-barrio="${b.barrio}">
        <div class="hud-item-left">
          <span class="hud-item-dot" style="background: #8B5CF6;"></span>
          <div class="hud-item-name">${b.barrio}</div>
        </div>
        <div class="hud-item-count">${b.count}</div>
      </div>
    `).join('')}
  `;

  container.innerHTML = hotspotsHTML + barriosHTML;

  // Click on hotspot -> fly to coords
  container.querySelectorAll('.hud-hotspot-item').forEach(card => {
    card.addEventListener('click', () => {
      const lng = parseFloat(card.dataset.lng);
      const lat = parseFloat(card.dataset.lat);
      const name = card.dataset.name;
      if (!isNaN(lng) && !isNaN(lat)) {
        focusOnHotspot([lng, lat], name);
      }
    });
  });

  // Click on barrio -> filter by barrio
  container.querySelectorAll('.hud-barrio-item').forEach(card => {
    card.addEventListener('click', () => {
      const barrio = card.dataset.barrio;
      if (barrio) {
        applyMapFilters({ territorio: barrio });
      }
    });
  });
}

function renderDenunciadosTab(topDenunciados = []) {
  const container = document.getElementById('hud-denunciados-list');
  if (!container) return;

  if (topDenunciados.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:11px;text-align:center;padding:16px;">No se identificaron personas recurrentes en la selección.</div>';
    return;
  }

  container.innerHTML = topDenunciados.map(d => `
    <div class="hud-item-card hud-denunciado-item" data-name="${d.nombre}">
      <div class="hud-item-left">
        <span style="font-size:13px">👤</span>
        <div>
          <div class="hud-item-name" style="font-weight:600; color:#fff">${d.nombre}</div>
          <div style="font-size:10px; color:#F87171;">${d.delitos.slice(0, 2).join(' • ')}</div>
        </div>
      </div>
      <div class="hud-item-count" style="color:#EF4444; background:rgba(239,68,68,0.15)">
        ${d.incidencias} hechos
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.hud-denunciado-item').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.dataset.name;
      if (name) {
        focusOnDenunciado(name);
      }
    });
  });
}

function filterDenunciadosList(query = '') {
  const items = document.querySelectorAll('.hud-denunciado-item');
  items.forEach(item => {
    const name = (item.dataset.name || '').toLowerCase();
    if (name.includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function renderEvolutionMetrics(temporal = {}) {
  const metricsEl = document.getElementById('hud-evolution-metrics');
  if (!metricsEl) return;

  const yCounts = temporal.yearCounts || {};
  metricsEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:6px;margin-bottom:10px">
      <div style="background:rgba(255,255,255,0.04);padding:6px;border-radius:6px;text-align:center">
        <div style="font-size:9px;color:var(--text-muted)">AÑO 2024</div>
        <div style="font-size:14px;font-weight:700;color:#F59E0B">${yCounts['2024'] || 0}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);padding:6px;border-radius:6px;text-align:center">
        <div style="font-size:9px;color:var(--text-muted)">AÑO 2025</div>
        <div style="font-size:14px;font-weight:700;color:#0EA5E9">${yCounts['2025'] || 0}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);padding:6px;border-radius:6px;text-align:center">
        <div style="font-size:9px;color:var(--text-muted)">AÑO 2026</div>
        <div style="font-size:14px;font-weight:700;color:#22C55E">${yCounts['2026'] || 0}</div>
      </div>
    </div>
  `;

  renderHUDEvolutionChart(temporal);
}

function renderHUDEvolutionChart(temporalData) {
  const ctx = document.getElementById('hud-chart-evolution');
  if (!ctx) return;

  if (hudEvolutionChart) hudEvolutionChart.destroy();

  const matrix = temporalData?.matrix || {
    '2024': Array(12).fill(0),
    '2025': Array(12).fill(0),
    '2026': Array(12).fill(0)
  };
  const months = temporalData?.mesesNombres || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  hudEvolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: '2024',
          data: matrix['2024'] || [],
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245,158,11,0.1)',
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: '2025',
          data: matrix['2025'] || [],
          borderColor: '#0EA5E9',
          backgroundColor: 'rgba(14,165,233,0.1)',
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: '2026',
          data: matrix['2026'] || [],
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.1)',
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#8896AB', font: { family: 'Inter', size: 10 }, boxWidth: 10 }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#111B2E',
          titleFont: { size: 10 },
          bodyFont: { size: 10 }
        }
      },
      scales: {
        x: { ticks: { color: '#4B5D78', font: { size: 9 } }, grid: { display: false } },
        y: { ticks: { color: '#4B5D78', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } }
      }
    }
  });
}

function updateFilterStatusUI(criteria = {}) {
  const statusEl = document.getElementById('hud-filter-status');
  const textEl = document.getElementById('hud-active-filter-text');
  if (!statusEl || !textEl) return;

  const activeParts = [];
  if (criteria.tematica) activeParts.push(`Temática: ${criteria.tematica}`);
  if (criteria.anio) activeParts.push(`Año: ${criteria.anio}`);
  if (criteria.mes) activeParts.push(`Mes: ${criteria.mes}`);
  if (criteria.denunciado) activeParts.push(`Denunciado: ${criteria.denunciado}`);
  if (criteria.territorio) activeParts.push(`Zona: ${criteria.territorio}`);
  if (criteria.lesividadMin && criteria.lesividadMin > 1) activeParts.push(`Lesividad ≥ ${criteria.lesividadMin}`);

  if (activeParts.length > 0) {
    textEl.textContent = `🔍 ${activeParts.join(' | ')}`;
    statusEl.classList.remove('hidden');
  } else {
    statusEl.classList.add('hidden');
  }
}

// ============================================================
// TIMELINE PLAYER CONTROLLER
// ============================================================

export function initTacticalTimeline() {
  const yearGroup = document.getElementById('timeline-year-group');
  const monthGroup = document.getElementById('timeline-month-group');
  const playBtn = document.getElementById('btn-timeline-play');
  const resetBtn = document.getElementById('btn-timeline-reset');

  // Year Selection
  yearGroup?.querySelectorAll('.btn-segment').forEach(btn => {
    btn.addEventListener('click', () => {
      yearGroup.querySelectorAll('.btn-segment').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimelineYear = btn.dataset.year;

      applyMapFilters({
        anio: currentTimelineYear === 'todos' ? '' : currentTimelineYear
      });
    });
  });

  // Month Selection
  monthGroup?.querySelectorAll('.btn-month-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      monthGroup.querySelectorAll('.btn-month-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimelineMonth = btn.dataset.month;

      applyMapFilters({
        mes: currentTimelineMonth === 'todos' ? '' : currentTimelineMonth
      });
    });
  });

  // Reset Button
  resetBtn?.addEventListener('click', () => {
    stopTimelinePlayer();
    currentTimelineYear = 'todos';
    currentTimelineMonth = 'todos';

    // Reset buttons
    yearGroup?.querySelectorAll('.btn-segment').forEach(b => {
      b.classList.toggle('active', b.dataset.year === 'todos');
    });
    monthGroup?.querySelectorAll('.btn-month-pill').forEach(b => {
      b.classList.toggle('active', b.dataset.month === 'todos');
    });

    resetMapFilters();
  });

  // Play / Pause Player Button
  playBtn?.addEventListener('click', () => {
    if (isTimelinePlaying) {
      stopTimelinePlayer();
    } else {
      startTimelinePlayer();
    }
  });

  updateTimelineCounter();
}

function startTimelinePlayer() {
  const playBtn = document.getElementById('btn-timeline-play');
  const playIcon = document.getElementById('timeline-play-icon');
  const playLabel = document.getElementById('timeline-play-label');
  const monthGroup = document.getElementById('timeline-month-group');

  isTimelinePlaying = true;
  if (playBtn) playBtn.classList.add('playing');
  if (playIcon) playIcon.textContent = '⏸';
  if (playLabel) playLabel.textContent = 'Pausar';

  let currentMonthIndex = 1; // 1 to 12

  // If year is 'todos', default to 2024 for sensible animation
  if (currentTimelineYear === 'todos') {
    currentTimelineYear = '2024';
    const yearGroup = document.getElementById('timeline-year-group');
    yearGroup?.querySelectorAll('.btn-segment').forEach(b => {
      b.classList.toggle('active', b.dataset.year === '2024');
    });
  }

  timelineInterval = setInterval(() => {
    // Update month pills UI
    monthGroup?.querySelectorAll('.btn-month-pill').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.month) === currentMonthIndex);
    });

    // Apply filter
    applyMapFilters({
      anio: currentTimelineYear,
      mes: currentMonthIndex
    });

    // Advance month
    currentMonthIndex++;
    if (currentMonthIndex > 12) {
      currentMonthIndex = 1;
      // Advance to next year: 2024 -> 2025 -> 2026 -> 2024
      if (currentTimelineYear === '2024') currentTimelineYear = '2025';
      else if (currentTimelineYear === '2025') currentTimelineYear = '2026';
      else currentTimelineYear = '2024';

      const yearGroup = document.getElementById('timeline-year-group');
      yearGroup?.querySelectorAll('.btn-segment').forEach(b => {
        b.classList.toggle('active', b.dataset.year === currentTimelineYear);
      });
    }
  }, 1200);
}

function stopTimelinePlayer() {
  const playBtn = document.getElementById('btn-timeline-play');
  const playIcon = document.getElementById('timeline-play-icon');
  const playLabel = document.getElementById('timeline-play-label');

  isTimelinePlaying = false;
  clearInterval(timelineInterval);
  timelineInterval = null;

  if (playBtn) playBtn.classList.remove('playing');
  if (playIcon) playIcon.textContent = '▶';
  if (playLabel) playLabel.textContent = 'Evolución Mes a Mes';
}

function updateTimelineCounter() {
  const countText = document.getElementById('timeline-count-text');
  if (!countText) return;
  const activeCount = getActiveMapFeatures().length;
  countText.textContent = `${activeCount.toLocaleString()} incidencias activas`;
}
