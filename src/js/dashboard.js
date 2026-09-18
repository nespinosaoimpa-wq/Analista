import Chart from 'chart.js/auto';
import { getDashboardStats, getHechos } from './supabase-client.js';
import { formatDate, getLesividadClass } from './config.js';

let chartTendencia = null;
let chartTipos = null;
let chartBarrios = null;
let chartLesividad = null;

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#8896AB',
        font: { family: 'Inter', size: 11 },
        padding: 12,
      },
    },
    tooltip: {
      backgroundColor: '#111B2E',
      titleColor: '#E8ECF4',
      bodyColor: '#8896AB',
      borderColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      titleFont: { family: 'Inter', weight: '600' },
      bodyFont: { family: 'Inter' },
    },
  },
  scales: {
    x: {
      ticks: { color: '#4B5D78', font: { family: 'Inter', size: 10 } },
      grid: { color: 'rgba(255,255,255,0.03)' },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      ticks: { color: '#4B5D78', font: { family: 'Inter', size: 10 } },
      grid: { color: 'rgba(255,255,255,0.03)' },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
  },
};

export async function initDashboard() {
  // Set default dates
  const desde = document.getElementById('dash-fecha-desde');
  const hasta = document.getElementById('dash-fecha-hasta');

  if (desde && !desde.value) {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    desde.value = d.toISOString().split('T')[0];
  }
  if (hasta && !hasta.value) {
    hasta.value = new Date().toISOString().split('T')[0];
  }

  await refreshDashboard();
}

export async function refreshDashboard() {
  const desde = document.getElementById('dash-fecha-desde')?.value;
  const hasta = document.getElementById('dash-fecha-hasta')?.value;

  try {
    const stats = await getDashboardStats(
      desde ? new Date(desde).toISOString() : undefined,
      hasta ? new Date(hasta + 'T23:59:59').toISOString() : undefined,
    );

    // Update KPIs
    animateNumber('kpi-val-hechos', stats.total_hechos || 0);
    animateNumber('kpi-val-personas', stats.total_personas || 0);
    animateNumber('kpi-val-bandas', stats.total_bandas || 0);
    animateNumber('kpi-val-ops', stats.total_allanamientos || 0);

    // Update header stats
    const statHechos = document.querySelector('#stat-hechos span');
    const statPersonas = document.querySelector('#stat-personas span');
    const statBandas = document.querySelector('#stat-bandas span');
    if (statHechos) statHechos.textContent = stats.total_hechos || 0;
    if (statPersonas) statPersonas.textContent = stats.total_personas || 0;
    if (statBandas) statBandas.textContent = stats.total_bandas || 0;

    // Charts
    renderTendenciaChart(stats.tendencia_diaria || []);
    renderTiposChart(stats.por_tipo || []);
    renderBarriosChart(stats.por_barrio || []);
    renderLesividadChart(stats.por_lesividad || []);

    // Table
    await renderHechosTable(desde, hasta);

  } catch (e) {
    console.error('Dashboard refresh error:', e);
  }
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const current = parseInt(el.textContent) || 0;
  const diff = target - current;
  const duration = 600;
  const steps = 30;
  const increment = diff / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current + increment * step);
    }
  }, duration / steps);
}

function renderTendenciaChart(data) {
  const ctx = document.getElementById('chart-tendencia');
  if (!ctx) return;

  if (chartTendencia) chartTendencia.destroy();

  chartTendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => {
        const dt = new Date(d.fecha);
        return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      }),
      datasets: [{
        label: 'Hechos',
        data: data.map(d => d.cantidad),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#F59E0B',
      }],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
      },
    },
  });
}

function renderTiposChart(data) {
  const ctx = document.getElementById('chart-tipos');
  if (!ctx) return;

  if (chartTipos) chartTipos.destroy();

  const colors = [
    '#EF4444', '#F59E0B', '#0EA5E9', '#22C55E', '#8B5CF6',
    '#EC4899', '#14B8A6', '#6366F1', '#F43F5E', '#84CC16',
    '#06B6D4', '#D97706', '#7C3AED',
  ];

  chartTipos = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.tipo),
      datasets: [{
        data: data.map(d => d.cantidad),
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#0B1120',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          position: 'right',
          labels: {
            color: '#8896AB',
            font: { family: 'Inter', size: 10 },
            padding: 8,
            boxWidth: 10,
          },
        },
      },
    },
  });
}

function renderBarriosChart(data) {
  const ctx = document.getElementById('chart-barrios');
  if (!ctx) return;

  if (chartBarrios) chartBarrios.destroy();

  chartBarrios = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.barrio),
      datasets: [{
        label: 'Hechos',
        data: data.map(d => d.cantidad),
        backgroundColor: 'rgba(14,165,233,0.6)',
        borderColor: '#0EA5E9',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      ...chartDefaults,
      indexAxis: 'y',
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
      },
    },
  });
}

function renderLesividadChart(data) {
  const ctx = document.getElementById('chart-lesividad');
  if (!ctx) return;

  if (chartLesividad) chartLesividad.destroy();

  const colors = data.map(d => {
    if (d.nivel <= 3) return '#22C55E';
    if (d.nivel <= 6) return '#F59E0B';
    return '#EF4444';
  });

  chartLesividad = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => `L${d.nivel}`),
      datasets: [{
        label: 'Hechos',
        data: data.map(d => d.cantidad),
        backgroundColor: colors.map(c => c + '99'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
      },
    },
  });
}

async function renderHechosTable(desde, hasta) {
  const tbody = document.getElementById('table-hechos-body');
  if (!tbody) return;

  try {
    const hechos = await getHechos({
      desde: desde ? new Date(desde).toISOString() : undefined,
      hasta: hasta ? new Date(hasta + 'T23:59:59').toISOString() : undefined,
      limit: 25,
    });

    if (hechos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No hay hechos registrados en este período</td></tr>`;
      return;
    }

    tbody.innerHTML = hechos.map(h => {
      const lClass = getLesividadClass(h.indice_lesividad);
      return `
        <tr data-id="${h.id}">
          <td>${formatDate(h.fecha)}</td>
          <td>${h.tipo_penal || '—'}</td>
          <td>${h.direccion || '—'}</td>
          <td>${h.barrio || '—'}</td>
          <td><span class="lesividad-badge ${lClass}">${h.indice_lesividad}</span></td>
          <td style="font-family:var(--font-mono);font-size:11px;color:var(--accent-primary)">${h.cuij || '—'}</td>
          <td>
            <button class="btn btn-ghost btn-sm btn-ver-hecho" data-id="${h.id}" title="Ver en mapa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--accent-danger)">Error cargando datos</td></tr>`;
  }
}
