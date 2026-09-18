import Chart from 'chart.js/auto';
import { getDashboardStats, getHechos, getPersonas, getBandas, getAllanamientos } from './supabase-client.js';
import { formatDate, getLesividadClass } from './config.js';
import { getActiveMapFeatures } from './map.js';

let chartAnioDelito = null;
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

// Helper functions to parse feature year & crime type
function extractFeatureYear(f) {
  const p = f.properties || f;
  const str = `${p.folder || ''} ${p.tipo || ''} ${p.nombre || ''} ${p.fecha || ''} ${p.resumen || ''}`;
  const match = str.match(/\b(202[0-9])\b/);
  if (match) return match[1];
  if (p.fecha) {
    const d = new Date(p.fecha);
    if (!isNaN(d.getFullYear())) return String(d.getFullYear());
  }
  return '2026';
}

function extractFeatureCrimeType(f) {
  const p = f.properties || f;
  let type = p.tipo_penal || p.tipo || p.folder || 'Incidencia';
  if (type === 'General' || type === 'Capa sin título') type = 'Incidencias Varias';
  return type;
}

export async function initDashboard() {
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

  // Auto refresh when map data changes or year filter changes
  window.addEventListener('crimint:data-loaded', () => refreshDashboard());
  document.getElementById('dash-filter-anio')?.addEventListener('change', () => refreshDashboard());

  await refreshDashboard();
}

export async function refreshDashboard() {
  const selectedYear = document.getElementById('dash-filter-anio')?.value || 'todos';
  const desde = document.getElementById('dash-fecha-desde')?.value;
  const hasta = document.getElementById('dash-fecha-hasta')?.value;

  try {
    const mapFeatures = getActiveMapFeatures();
    let stats;

    if (mapFeatures && mapFeatures.length > 0) {
      // -------------------------------------------------------------
      // Compute stats directly from active MAP features!
      // -------------------------------------------------------------
      let filtered = mapFeatures;

      // Filter by selected year if not 'todos'
      if (selectedYear !== 'todos') {
        filtered = filtered.filter(f => extractFeatureYear(f) === selectedYear);
      }

      // Filter by date range if provided
      if (desde) filtered = filtered.filter(f => !f.properties?.fecha || f.properties.fecha >= desde);
      if (hasta) filtered = filtered.filter(f => !f.properties?.fecha || f.properties.fecha <= hasta + 'T23:59:59');

      const personas = await getPersonas({ limit: 1000 });
      const bandas = await getBandas({ limit: 1000 });
      const allanamientos = await getAllanamientos({ limit: 1000 });

      const porTipo = {};
      const porBarrio = {};
      const porLesividad = {};
      const porDia = {};
      const matrixAnioDelito = { 2024: {}, 2025: {}, 2026: {} };
      const allCrimeTypes = new Set();

      filtered.forEach(f => {
        const props = f.properties || {};
        const year = extractFeatureYear(f);
        const tipo = extractFeatureCrimeType(f);
        const barrio = props.barrio || props.nombre || 'Santa Fe';
        const lesividad = props.lesividad || 3;

        allCrimeTypes.add(tipo);
        porTipo[tipo] = (porTipo[tipo] || 0) + 1;
        if (barrio) porBarrio[barrio] = (porBarrio[barrio] || 0) + 1;
        porLesividad[lesividad] = (porLesividad[lesividad] || 0) + 1;

        if (!matrixAnioDelito[year]) matrixAnioDelito[year] = {};
        matrixAnioDelito[year][tipo] = (matrixAnioDelito[year][tipo] || 0) + 1;

        const dia = props.fecha ? props.fecha.split('T')[0] : 'sin_fecha';
        porDia[dia] = (porDia[dia] || 0) + 1;
      });

      stats = {
        total_hechos: filtered.length,
        total_personas: personas.length,
        total_bandas: bandas.length,
        total_allanamientos: allanamientos.length,
        por_tipo: Object.entries(porTipo).map(([tipo, cantidad]) => ({ tipo, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
        por_barrio: Object.entries(porBarrio).map(([barrio, cantidad]) => ({ barrio, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 15),
        por_lesividad: Object.entries(porLesividad).map(([nivel, cantidad]) => ({ nivel: parseInt(nivel), cantidad })).sort((a, b) => a.nivel - b.nivel),
        tendencia_diaria: Object.entries(porDia).map(([fecha, cantidad]) => ({ fecha, cantidad })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        por_anio_delito: {
          matrix: matrixAnioDelito,
          types: Array.from(allCrimeTypes)
        }
      };

    } else {
      // Fallback to database stats
      stats = await getDashboardStats(
        desde ? new Date(desde).toISOString() : undefined,
        hasta ? new Date(hasta + 'T23:59:59').toISOString() : undefined,
      );
    }

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

    // Render All Charts
    renderAnioDelitoChart(stats.por_anio_delito || { matrix: {}, types: [] });
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

function renderAnioDelitoChart(dataByYearAndType) {
  const ctx = document.getElementById('chart-anio-delito');
  if (!ctx) return;

  if (chartAnioDelito) chartAnioDelito.destroy();

  const years = ['2024', '2025', '2026'];
  const categories = dataByYearAndType.types && dataByYearAndType.types.length > 0
    ? dataByYearAndType.types
    : ['Homicidios', 'Armas', 'Microtráfico', 'Abuso de armas'];

  const COLOR_MAP = {
    'HOMICIDIOS Y USURPACIONES': '#EF4444',
    'Homicidio': '#EF4444',
    'ARMAS': '#F97316',
    'Abuso de armas': '#F97316',
    'HAF y HAB': '#FB923C',
    'Tentativa de homicidio': '#FB923C',
    'Priorizaciones 2025': '#F59E0B',
    'Priorizaciones 2024': '#EAB308',
    'Microtráfico': '#0EA5E9',
    'Comercialización de estupefacientes': '#0EA5E9',
    'SANTO TOMÉ': '#3B82F6',
    'Reactivos': '#06B6D4',
    'INCIDENCIAS': '#10B981',
    'BARRIOS': '#8B5CF6',
  };

  const defaultColors = [
    '#EF4444', '#F59E0B', '#0EA5E9', '#22C55E', '#8B5CF6',
    '#EC4899', '#14B8A6', '#6366F1', '#F43F5E', '#84CC16',
  ];

  const datasets = categories.slice(0, 10).map((cat, idx) => {
    const color = COLOR_MAP[cat] || defaultColors[idx % defaultColors.length];
    return {
      label: cat,
      data: years.map(y => dataByYearAndType.matrix?.[y]?.[cat] || 0),
      backgroundColor: color + 'CC',
      borderColor: color,
      borderWidth: 1,
      borderRadius: 4,
    };
  });

  chartAnioDelito = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years.map(y => `Año ${y}`),
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          position: 'top',
          labels: {
            color: '#8896AB',
            font: { family: 'Inter', size: 11 },
            padding: 12,
            boxWidth: 12,
          }
        },
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          ticks: { color: '#E8ECF4', font: { family: 'Inter', size: 12, weight: '600' } },
          grid: { color: 'rgba(255,255,255,0.03)' },
        },
        y: {
          ticks: { color: '#8896AB', font: { family: 'Inter', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.03)' },
          title: { display: true, text: 'Cantidad de Incidencias', color: '#4B5D78', font: { size: 10 } }
        }
      }
    }
  });
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
        return isNaN(dt.valueOf()) ? d.fecha : dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
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
    const mapFeatures = getActiveMapFeatures();
    let hechos = [];

    if (mapFeatures && mapFeatures.length > 0) {
      hechos = mapFeatures.slice(0, 25).map((f, i) => {
        const props = f.properties || {};
        return {
          id: props.id || `hecho-${i}`,
          fecha: props.fecha || new Date().toISOString(),
          tipo_penal: props.tipo || props.folder || 'Incidencia',
          direccion: props.direccion || props.nombre || 'Santa Fe',
          barrio: props.barrio || 'Santa Fe',
          indice_lesividad: props.lesividad || 3,
          cuij: props.cuij || '—',
        };
      });
    } else {
      hechos = await getHechos({
        desde: desde ? new Date(desde).toISOString() : undefined,
        hasta: hasta ? new Date(hasta + 'T23:59:59').toISOString() : undefined,
        limit: 25,
      });
    }

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
