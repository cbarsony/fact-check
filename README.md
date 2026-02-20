# FACT CHECK — World Bank Data Visualizer

A single-page webapp for quick fact-checking in debates using live data from the **World Bank Open Data API**.

## Features

- **Two-axis dimension selection** — pick any two dimensions (Time Period, Country, GDP Growth, Inflation Rate, Unemployment Rate) for the X and Y axes
- **Smart chart auto-selection** — the right chart type is chosen automatically:
  - Continuous × Continuous → Line chart
  - Discrete × Continuous → Bar chart
  - Continuous × Discrete → Horizontal bar chart
  - Discrete × Discrete → Table / Heatmap
- **Multi-country comparison** — select multiple countries to compare them on the same chart
- **Live data** — all data fetched directly from the World Bank API; no API key required, no backend
- **Professional dark UI** — Bloomberg-terminal / financial dashboard aesthetic

## Tech Stack

- Pure HTML / CSS / JS — no frameworks, no build step
- [Chart.js 4](https://www.chartjs.org/) via CDN
- [World Bank Open Data API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation)

## Usage

Open `index.html` directly in a browser, or serve via any static server:

```bash
npx serve .
# or
python3 -m http.server
```

Then visit `http://localhost:3000` (or whichever port is used).

## Adding New Indicators

Edit `js/config.js` and add a new entry to the `DIMENSIONS` array:

```js
{
  id: 'my_indicator',
  label: 'My Indicator (%)',
  type: 'continuous',
  wbIndicator: 'WORLD.BANK.INDICATOR.CODE',
}
```

No other code changes are required.

## File Structure

```
index.html        Main HTML page
css/style.css     All styles
js/config.js      Dimension configuration (extensible DIMENSIONS array)
js/api.js         World Bank API fetching logic
js/chart.js       Chart rendering (Chart.js integration)
js/app.js         Main app logic and UI interaction
```

## Data Source

[World Bank Open Data](https://data.worldbank.org/) — free, no API key needed.