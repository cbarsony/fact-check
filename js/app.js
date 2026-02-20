/* ── State ─────────────────────────────────────────────── */
let allCountries = [];
let selectedCountries = []; // array of { id, name }
let countrySearchFilter = '';

/* ── DOM refs (populated on DOMContentLoaded) ─────────── */
let xAxisSelect, yAxisSelect;
let xSubControls, ySubControls;
let generateBtn, chartArea, statusMsg;

/* ── Bootstrap ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  xAxisSelect = document.getElementById('x-axis-select');
  yAxisSelect = document.getElementById('y-axis-select');
  xSubControls = document.getElementById('x-sub-controls');
  ySubControls = document.getElementById('y-sub-controls');
  generateBtn = document.getElementById('generate-btn');
  chartArea = document.getElementById('chart-area');
  statusMsg = document.getElementById('status-msg');

  populateDimensionSelects();

  xAxisSelect.addEventListener('change', () => renderSubControls('x'));
  yAxisSelect.addEventListener('change', () => renderSubControls('y'));
  generateBtn.addEventListener('click', onGenerate);

  // Load country list in background
  setStatus('Loading country list…', false);
  try {
    allCountries = await fetchCountries();
    setStatus('', false);
  } catch (err) {
    setStatus(`Could not load country list: ${err.message}`, true);
  }

  // Trigger initial sub-controls render
  renderSubControls('x');
  renderSubControls('y');
});

/* ── Dimension selects ────────────────────────────────── */
function populateDimensionSelects() {
  DIMENSIONS.forEach(dim => {
    [xAxisSelect, yAxisSelect].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = dim.id;
      opt.textContent = dim.label;
      sel.appendChild(opt);
    });
  });
  // Default: x = time, y = gdp_growth
  xAxisSelect.value = 'time';
  yAxisSelect.value = 'gdp_growth';
}

/* ── Sub-controls ─────────────────────────────────────── */
function renderSubControls(axis) {
  const select = axis === 'x' ? xAxisSelect : yAxisSelect;
  const container = axis === 'x' ? xSubControls : ySubControls;
  const dimId = select.value;
  const dim = DIMENSIONS.find(d => d.id === dimId);

  container.innerHTML = '';
  if (!dim) return;

  if (dim.id === 'time') {
    container.appendChild(buildTimeControls(axis));
  } else if (dim.id === 'country') {
    container.appendChild(buildCountryControls(axis));
  }
  // Indicator dimensions need no extra controls here;
  // country + time are handled as "common" controls rendered below both selects.
  updateCommonControls();
}

/**
 * After both axis values are known, decide whether to show the shared
 * country-picker / time-range block that appears when both axes are indicators.
 */
function updateCommonControls() {
  const xId = xAxisSelect.value;
  const yId = yAxisSelect.value;
  const commonArea = document.getElementById('common-controls');
  commonArea.innerHTML = '';

  const xDim = DIMENSIONS.find(d => d.id === xId);
  const yDim = DIMENSIONS.find(d => d.id === yId);
  if (!xDim || !yDim) return;

  // Both are WB indicator dimensions → need country + time range
  const xIsIndicator = xDim.wbIndicator !== null;
  const yIsIndicator = yDim.wbIndicator !== null;
  const hasCountry = xId === 'country' || yId === 'country';
  const hasTime = xId === 'time' || yId === 'time';

  if (xIsIndicator && yIsIndicator) {
    // Show combined country + time range controls
    const wrap = document.createElement('div');
    wrap.className = 'common-block';
    wrap.innerHTML = '<p class="sub-label">Countries &amp; Time Range</p>';
    wrap.appendChild(buildCountryControls('common'));
    wrap.appendChild(buildTimeControls('common'));
    commonArea.appendChild(wrap);
  } else if (!hasCountry && (xIsIndicator || yIsIndicator)) {
    // One axis is an indicator, the other isn't country → need country
    const wrap = document.createElement('div');
    wrap.className = 'common-block';
    wrap.innerHTML = '<p class="sub-label">Select Countries</p>';
    wrap.appendChild(buildCountryControls('common'));
    commonArea.appendChild(wrap);
  }
  if (!hasTime && (xIsIndicator || yIsIndicator)) {
    const existing = commonArea.querySelector('.time-controls');
    if (!existing) {
      const wrap = document.createElement('div');
      wrap.className = 'common-block';
      wrap.innerHTML = '<p class="sub-label">Time Range</p>';
      wrap.appendChild(buildTimeControls('common'));
      commonArea.appendChild(wrap);
    }
  }
}

function buildTimeControls(ns) {
  const wrap = document.createElement('div');
  wrap.className = 'time-controls';
  const currentYear = new Date().getFullYear();
  wrap.innerHTML = `
    <div class="input-row">
      <label>Start Year
        <input type="number" id="${ns}-start-year" class="year-input" value="1990" min="1960" max="${currentYear}" />
      </label>
      <label>End Year
        <input type="number" id="${ns}-end-year" class="year-input" value="${currentYear - 1}" min="1960" max="${currentYear}" />
      </label>
    </div>`;
  return wrap;
}

function buildCountryControls(ns) {
  const wrap = document.createElement('div');
  wrap.className = 'country-controls';
  wrap.innerHTML = `
    <input type="text" id="${ns}-country-search" class="country-search" placeholder="Search countries…" autocomplete="off" />
    <div id="${ns}-country-list" class="country-list"></div>
    <div id="${ns}-selected-countries" class="selected-tags"></div>`;

  // Bind events after insertion (use setTimeout to allow DOM update)
  setTimeout(() => {
    const searchEl = document.getElementById(`${ns}-country-search`);
    const listEl = document.getElementById(`${ns}-country-list`);
    const tagsEl = document.getElementById(`${ns}-selected-countries`);
    if (!searchEl) return;

    renderCountryList(ns, listEl, tagsEl, '');
    searchEl.addEventListener('input', () => {
      renderCountryList(ns, listEl, tagsEl, searchEl.value.trim().toLowerCase());
    });
  }, 0);

  return wrap;
}

function renderCountryList(ns, listEl, tagsEl, filter) {
  listEl.innerHTML = '';
  const filtered = filter
    ? allCountries.filter(c => c.name.toLowerCase().includes(filter))
    : allCountries;
  const displayed = filtered.slice(0, 80); // cap for performance

  displayed.forEach(country => {
    const isSelected = selectedCountries.some(s => s.id === country.id);
    const item = document.createElement('div');
    item.className = 'country-item' + (isSelected ? ' selected' : '');
    item.textContent = country.name;
    item.addEventListener('click', () => {
      toggleCountry(country);
      renderCountryList(ns, listEl, tagsEl, filter);
      renderSelectedTags(ns, tagsEl);
    });
    listEl.appendChild(item);
  });

  renderSelectedTags(ns, tagsEl);
}

function renderSelectedTags(ns, tagsEl) {
  tagsEl.innerHTML = '';
  selectedCountries.forEach(country => {
    const tag = document.createElement('span');
    tag.className = 'country-tag';
    tag.innerHTML = `${country.name} <button class="tag-remove" data-id="${country.id}" title="Remove">×</button>`;
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      toggleCountry(country);
      // Re-render all country pickers
      document.querySelectorAll('.country-list').forEach(el => {
        const nsAttr = el.id.replace('-country-list', '');
        const searchEl = document.getElementById(`${nsAttr}-country-search`);
        const tagsEl2 = document.getElementById(`${nsAttr}-selected-countries`);
        if (searchEl && tagsEl2) {
          renderCountryList(nsAttr, el, tagsEl2, searchEl.value.trim().toLowerCase());
        }
      });
    });
    tagsEl.appendChild(tag);
  });
}

function toggleCountry(country) {
  const idx = selectedCountries.findIndex(s => s.id === country.id);
  if (idx >= 0) {
    selectedCountries.splice(idx, 1);
  } else {
    selectedCountries.push(country);
  }
}

/* ── Generate ─────────────────────────────────────────── */
async function onGenerate() {
  const xId = xAxisSelect.value;
  const yId = yAxisSelect.value;
  const xDim = DIMENSIONS.find(d => d.id === xId);
  const yDim = DIMENSIONS.find(d => d.id === yId);

  // Clear previous chart output
  clearChartArea();
  setStatus('', false);

  // Gather params
  const params = gatherParams(xId, yId);
  if (!params) return; // validation failed

  const chartType = getChartType(xDim, yDim);

  try {
    generateBtn.disabled = true;
    setStatus('Fetching data…', false);

    if (chartType === 'line') {
      await handleLineChart(xDim, yDim, params);
    } else if (chartType === 'bar') {
      await handleBarChart(xDim, yDim, params);
    } else if (chartType === 'horizontalBar') {
      await handleHorizontalBarChart(xDim, yDim, params);
    } else {
      await handleTable(xDim, yDim, params);
    }

    setStatus('', false);
  } catch (err) {
    setStatus(`Error: ${err.message}`, true);
  } finally {
    generateBtn.disabled = false;
  }
}

/* ── Param gathering ──────────────────────────────────── */
function gatherParams(xId, yId) {
  const params = {};

  // Time range
  const startEl = findYearInput('start');
  const endEl = findYearInput('end');
  if (startEl && endEl) {
    params.startYear = parseInt(startEl.value, 10);
    params.endYear = parseInt(endEl.value, 10);
    if (params.startYear > params.endYear) {
      setStatus('Start year must be ≤ end year.', true);
      return null;
    }
  } else if (xId !== 'country' && yId !== 'country') {
    // Provide fallback years when no time picker is visible
    params.startYear = 1990;
    params.endYear = new Date().getFullYear() - 1;
  }

  // Countries
  if (selectedCountries.length === 0) {
    // If country axis selected but none chosen
    if (xId === 'country' || yId === 'country' || hasIndicatorAxis(xId, yId)) {
      setStatus('Please select at least one country.', true);
      return null;
    }
  }
  params.countries = [...selectedCountries];

  return params;
}

function hasIndicatorAxis(xId, yId) {
  const xDim = DIMENSIONS.find(d => d.id === xId);
  const yDim = DIMENSIONS.find(d => d.id === yId);
  return (xDim && xDim.wbIndicator) || (yDim && yDim.wbIndicator);
}

/** Find the first visible year input matching type ('start' or 'end'). */
function findYearInput(type) {
  return (
    document.getElementById(`x-${type}-year`) ||
    document.getElementById(`y-${type}-year`) ||
    document.getElementById(`common-${type}-year`)
  );
}

/* ── Chart handlers ───────────────────────────────────── */

/**
 * Line chart: time × indicator or indicator × time.
 * Shows one line per country.
 */
async function handleLineChart(xDim, yDim, params) {
  const indicatorDim = xDim.wbIndicator ? xDim : yDim;
  const { startYear, endYear, countries } = params;

  if (countries.length === 0) {
    setStatus('Please select at least one country.', true);
    return;
  }

  const raw = await fetchIndicatorData(
    countries.map(c => c.id),
    indicatorDim.wbIndicator,
    startYear,
    endYear
  );

  if (!raw || raw.length === 0) {
    setStatus('No data available for the selected parameters.', true);
    return;
  }

  // Build year labels
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(String(y));

  // Group by country
  const byCountry = {};
  raw.forEach(entry => {
    const code = entry.countryiso3code || entry.country.id;
    if (!byCountry[code]) byCountry[code] = {};
    byCountry[code][entry.date] = entry.value;
  });

  const datasets = countries.map(c => ({
    label: c.name,
    data: years.map(y => byCountry[c.id]?.[y] ?? null),
  }));

  const canvas = document.getElementById('chart-canvas');
  canvas.style.display = 'block';
  renderLineChart(canvas, {
    labels: years,
    datasets,
    xLabel: 'Year',
    yLabel: indicatorDim.label,
  });
}

/**
 * Bar chart: country (discrete) × indicator (continuous).
 * Shows one grouped bar set per selected year (or a single bar per country).
 */
async function handleBarChart(xDim, yDim, params) {
  // x is discrete (country), y is continuous (indicator) — or vice-versa after swap
  const isXCountry = xDim.id === 'country';
  const indicatorDim = isXCountry ? yDim : xDim;
  const { startYear, endYear, countries } = params;

  if (countries.length === 0) {
    setStatus('Please select at least one country.', true);
    return;
  }

  const raw = await fetchIndicatorData(
    countries.map(c => c.id),
    indicatorDim.wbIndicator,
    startYear,
    endYear
  );

  if (!raw || raw.length === 0) {
    setStatus('No data available for the selected parameters.', true);
    return;
  }

  // Use only the latest year with data for each country
  const latestByCountry = {};
  raw.forEach(entry => {
    if (entry.value === null) return;
    const code = entry.countryiso3code || entry.country.id;
    if (!latestByCountry[code] || entry.date > latestByCountry[code].date) {
      latestByCountry[code] = entry;
    }
  });

  const labels = countries.map(c => c.name);
  const values = countries.map(c => latestByCountry[c.id]?.value ?? null);

  const canvas = document.getElementById('chart-canvas');
  canvas.style.display = 'block';
  renderBarChart(canvas, {
    labels,
    datasets: [{ label: indicatorDim.label, data: values }],
    xLabel: 'Country',
    yLabel: indicatorDim.label,
  });
}

/**
 * Horizontal bar chart: indicator (continuous) × country (discrete).
 */
async function handleHorizontalBarChart(xDim, yDim, params) {
  // Just swap axes semantics and reuse bar logic
  const indicatorDim = xDim.wbIndicator ? xDim : yDim;
  const { startYear, endYear, countries } = params;

  if (countries.length === 0) {
    setStatus('Please select at least one country.', true);
    return;
  }

  const raw = await fetchIndicatorData(
    countries.map(c => c.id),
    indicatorDim.wbIndicator,
    startYear,
    endYear
  );

  if (!raw || raw.length === 0) {
    setStatus('No data available for the selected parameters.', true);
    return;
  }

  const latestByCountry = {};
  raw.forEach(entry => {
    if (entry.value === null) return;
    const code = entry.countryiso3code || entry.country.id;
    if (!latestByCountry[code] || entry.date > latestByCountry[code].date) {
      latestByCountry[code] = entry;
    }
  });

  const labels = countries.map(c => c.name);
  const values = countries.map(c => latestByCountry[c.id]?.value ?? null);

  const canvas = document.getElementById('chart-canvas');
  canvas.style.display = 'block';
  renderHorizontalBarChart(canvas, {
    labels,
    datasets: [{ label: indicatorDim.label, data: values }],
    xLabel: indicatorDim.label,
    yLabel: 'Country',
  });
}

/**
 * Table/heatmap: discrete × discrete (country × country or country × indicator).
 * For country × indicator we show a matrix of latest values.
 */
async function handleTable(xDim, yDim, params) {
  const { startYear, endYear, countries } = params;

  if (countries.length === 0) {
    setStatus('Please select at least one country.', true);
    return;
  }

  // Determine indicators to show
  const indicators = DIMENSIONS.filter(d => d.wbIndicator !== null);
  const canvas = document.getElementById('chart-canvas');
  canvas.style.display = 'none';

  // Fetch all indicators for all countries
  const allData = {};
  for (const ind of indicators) {
    const raw = await fetchIndicatorData(
      countries.map(c => c.id),
      ind.wbIndicator,
      startYear || 1990,
      endYear || new Date().getFullYear() - 1
    );
    allData[ind.id] = {};
    raw.forEach(entry => {
      if (entry.value === null) return;
      const code = entry.countryiso3code || entry.country.id;
      if (!allData[ind.id][code] || entry.date > allData[ind.id][code].date) {
        allData[ind.id][code] = entry;
      }
    });
  }

  const matrix = countries.map(c =>
    indicators.map(ind => allData[ind.id]?.[c.id]?.value ?? null)
  );

  renderTable(document.getElementById('chart-area'), {
    rowLabels: countries.map(c => c.name),
    colLabels: indicators.map(ind => ind.label),
    matrix,
    rowAxisLabel: 'Country',
    colAxisLabel: 'Indicator',
  });
}

/* ── Helpers ──────────────────────────────────────────── */
function clearChartArea() {
  // Remove any table wrappers
  document.querySelectorAll('.table-wrapper').forEach(el => el.remove());
  const canvas = document.getElementById('chart-canvas');
  if (canvas) {
    canvas.style.display = 'none';
    destroyChart();
  }
}

function setStatus(msg, isError) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg' + (isError ? ' error' : '');
}
