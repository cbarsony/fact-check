// Palette for multiple series
const SERIES_COLORS = [
  '#4e8cde',
  '#e07b39',
  '#4dab72',
  '#c25b8a',
  '#a07cc4',
  '#e0c03a',
  '#3ab5c4',
  '#e05252',
];

let activeChart = null;

/**
 * Destroy any existing Chart.js instance to avoid "canvas already in use" errors.
 */
function destroyChart() {
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
}

/**
 * Build a line chart (continuous × continuous, time on one axis).
 * @param {HTMLCanvasElement} canvas
 * @param {object} params  { labels, datasets, xLabel, yLabel }
 */
function renderLineChart(canvas, { labels, datasets, xLabel, yLabel }) {
  destroyChart();
  activeChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        spanGaps: true,
      })),
    },
    options: chartOptions(xLabel, yLabel),
  });
}

/**
 * Build a vertical bar chart (discrete × continuous).
 */
function renderBarChart(canvas, { labels, datasets, xLabel, yLabel }) {
  destroyChart();
  activeChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
        borderWidth: 0,
      })),
    },
    options: chartOptions(xLabel, yLabel),
  });
}

/**
 * Build a horizontal bar chart (continuous × discrete).
 */
function renderHorizontalBarChart(canvas, { labels, datasets, xLabel, yLabel }) {
  destroyChart();
  activeChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
        borderWidth: 0,
      })),
    },
    options: {
      ...chartOptions(xLabel, yLabel),
      indexAxis: 'y',
    },
  });
}

/**
 * Render a table/heatmap for discrete × discrete combinations.
 * Outputs HTML into a container element instead of using canvas.
 */
function renderTable(container, { rowLabels, colLabels, matrix, rowAxisLabel, colAxisLabel }) {
  destroyChart();
  const canvas = container.querySelector('#chart-canvas');
  if (canvas) canvas.style.display = 'none';

  let html = `<div class="table-wrapper"><table class="data-table">`;
  html += `<thead><tr><th>${rowAxisLabel} / ${colAxisLabel}</th>`;
  colLabels.forEach(c => { html += `<th>${c}</th>`; });
  html += `</tr></thead><tbody>`;
  rowLabels.forEach((r, ri) => {
    html += `<tr><td class="row-header">${r}</td>`;
    colLabels.forEach((_, ci) => {
      const val = matrix[ri][ci];
      const display = val === null || val === undefined ? '—' : val.toFixed(2);
      html += `<td class="data-cell">${display}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  container.insertAdjacentHTML('beforeend', html);
}

/** Shared Chart.js options in the professional dark style. */
function chartOptions(xLabel, yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#c8d0d8',
          font: { family: 'Inter, system-ui, sans-serif', size: 12 },
          boxWidth: 14,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1e2530',
        borderColor: '#3a4555',
        borderWidth: 1,
        titleColor: '#e0e6ee',
        bodyColor: '#a8b4c0',
        titleFont: { family: 'Inter, system-ui, sans-serif', size: 13 },
        bodyFont: { family: '"Roboto Mono", monospace', size: 12 },
        padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y !== undefined ? ctx.parsed.y.toFixed(2) : ctx.parsed.x.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: !!xLabel,
          text: xLabel || '',
          color: '#8a96a3',
          font: { family: 'Inter, system-ui, sans-serif', size: 12 },
        },
        ticks: { color: '#8a96a3', font: { family: 'Inter, system-ui, sans-serif', size: 11 } },
        grid: { color: '#2a3240' },
        border: { color: '#3a4555' },
      },
      y: {
        title: {
          display: !!yLabel,
          text: yLabel || '',
          color: '#8a96a3',
          font: { family: 'Inter, system-ui, sans-serif', size: 12 },
        },
        ticks: { color: '#8a96a3', font: { family: '"Roboto Mono", monospace', size: 11 } },
        grid: { color: '#2a3240' },
        border: { color: '#3a4555' },
      },
    },
  };
}
