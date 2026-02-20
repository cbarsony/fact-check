const WB_BASE = 'https://api.worldbank.org/v2';

/**
 * Fetch list of countries from the World Bank API.
 * Returns an array of { id, name } objects sorted by name.
 */
async function fetchCountries() {
  const url = `${WB_BASE}/country?format=json&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Countries fetch failed: ${res.status}`);
  const data = await res.json();
  // data[0] = metadata, data[1] = array of country objects
  const countries = data[1] || [];
  // Filter out aggregates (region groupings) — they have a non-empty region.id but capitalCity is empty
  return countries
    .filter(c => c.capitalCity && c.capitalCity.trim() !== '')
    .map(c => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch indicator data for one or more countries over a date range.
 * @param {string[]} countryCodes  e.g. ['US', 'DE', 'CN']
 * @param {string}   indicator     e.g. 'NY.GDP.MKTP.KD.ZG'
 * @param {number}   startYear
 * @param {number}   endYear
 * @returns {Array}  Raw World Bank data entries
 */
async function fetchIndicatorData(countryCodes, indicator, startYear, endYear) {
  const codes = countryCodes.join(';');
  const url =
    `${WB_BASE}/country/${encodeURIComponent(codes)}/indicator/${encodeURIComponent(indicator)}` +
    `?date=${startYear}:${endYear}&format=json&per_page=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Indicator fetch failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2) return [];
  return data[1] || [];
}
