/**
 * DIMENSIONS configuration.
 * Adding a new indicator requires only a new entry here — no other code changes needed.
 */
const DIMENSIONS = [
  {
    id: 'time',
    label: 'Time Period',
    type: 'continuous',
    wbIndicator: null, // meta-dimension, not a WB indicator
  },
  {
    id: 'country',
    label: 'Country',
    type: 'discrete',
    wbIndicator: null, // fetched from WB countries endpoint
  },
  {
    id: 'gdp_growth',
    label: 'GDP Growth (annual %)',
    type: 'continuous',
    wbIndicator: 'NY.GDP.MKTP.KD.ZG',
  },
  {
    id: 'inflation',
    label: 'Inflation Rate (%)',
    type: 'continuous',
    wbIndicator: 'FP.CPI.TOTL.ZG',
  },
  {
    id: 'unemployment',
    label: 'Unemployment Rate (%)',
    type: 'continuous',
    wbIndicator: 'SL.UEM.TOTL.ZS',
  },
];

// Chart type matrix based on axis types
// continuous × continuous → line
// discrete × continuous   → bar
// continuous × discrete   → horizontalBar
// discrete × discrete     → table
function getChartType(xDim, yDim) {
  const x = xDim.type;
  const y = yDim.type;
  if (x === 'continuous' && y === 'continuous') return 'line';
  if (x === 'discrete' && y === 'continuous') return 'bar';
  if (x === 'continuous' && y === 'discrete') return 'horizontalBar';
  return 'table';
}
