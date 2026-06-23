/* ============================================================
   Weather App — JavaScript
   Milestone 1: Theme system + UI state management
   Milestone 2: Will add Open-Meteo API integration here
   ============================================================ */

/* ── DOM refs ────────────────────────────────────────────── */
const html          = document.documentElement;
const themeToggle   = document.getElementById('themeToggle');
const iconSun       = document.getElementById('iconSun');
const iconMoon      = document.getElementById('iconMoon');
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const errorBanner   = document.getElementById('errorBanner');
const errorMsg      = document.getElementById('errorMsg');
const spinnerWrap   = document.getElementById('spinnerWrap');
const emptyState    = document.getElementById('emptyState');
const weatherCard   = document.getElementById('weatherCard');
const forecastStrip = document.getElementById('forecastStrip');
const hourlyCard    = document.getElementById('hourlyCard');
const clearCityBtn  = document.getElementById('clearCityBtn');

/* ── Theme system ────────────────────────────────────────── */
function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  iconSun.style.display  = theme === 'dark' ? 'block' : 'none';
  iconMoon.style.display = theme === 'dark' ? 'none'  : 'block';
}

const savedTheme = localStorage.getItem('wa-theme') || 'light';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('wa-theme', next);
});

/* ── UI state machine ────────────────────────────────────── */
// States: 'empty' | 'loading' | 'data' | 'error'
function showState(state) {
  emptyState.style.display    = state === 'empty'   ? 'block' : 'none';
  spinnerWrap.style.display   = state === 'loading' ? 'flex'  : 'none';
  errorBanner.style.display   = state === 'error'   ? 'flex'  : 'none';
  weatherCard.style.display   = state === 'data'    ? 'flex'  : 'none';
  forecastStrip.style.display = state === 'data'    ? 'grid'  : 'none';
  hourlyCard.style.display    = state === 'data'    ? 'block' : 'none';
}

function showError(message) {
  errorMsg.textContent = message;
  showState('error');
}

/* ── Search handlers ─────────────────────────────────────── */
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

clearCityBtn.addEventListener('click', () => {
  localStorage.removeItem('wa-last-city');
  searchInput.value = '';
  showState('empty');
});

function handleSearch() {
  const city = searchInput.value.trim();
  if (!city) return;
  localStorage.setItem('wa-last-city', city);
  loadWeather(city);
}

/* ── Weather loading ─────────────────────────────────────── */
// Milestone 1: shows placeholder UI so all panels are visible.
// Milestone 2: replace this with a real Open-Meteo API call.
function loadWeather(city) {
  showState('loading');

  // TODO (M2): geocode city → fetch Open-Meteo data → call renderWeather(data)
  // For now, show placeholder after a brief delay so the spinner is visible.
  setTimeout(() => {
    renderPlaceholder(city);
  }, 600);
}

/* ── Placeholder render (removed in M2) ─────────────────── */
function renderPlaceholder(city) {
  document.getElementById('cityName').textContent = city;
  document.getElementById('dateText').textContent =
    new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' });
  document.getElementById('tempValue').textContent   = '–';
  document.getElementById('conditionText').textContent = 'Loading…';
  document.getElementById('humidity').textContent    = '–';
  document.getElementById('windSpeed').textContent   = '–';
  document.getElementById('pressure').textContent    = '–';

  renderForecastPlaceholder();
  renderHourlyPlaceholder();
  showState('data');
}

/* ── SVG icon helpers ────────────────────────────────────── */
// These will be reused by M2 when rendering real WMO weather codes.
const SVG = {
  cloud: (size = 22) =>
    `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z"/>
    </svg>`,

  sun: (size = 22) =>
    `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`,

  rain: (size = 22) =>
    `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
      <line x1="8" y1="19" x2="8" y2="21"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="16" y1="19" x2="16" y2="21"/>
    </svg>`,

  snow: (size = 22) =>
    `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="m20 7-8 5-8-5"/>
      <path d="m20 17-8-5-8 5"/>
    </svg>`,

  thunder: (size = 22) =>
    `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/>
      <polyline points="13 11 9 17 15 17 11 23"/>
    </svg>`,
};

/* WMO weather code → { label, iconKey } mapping (used from M2 onwards) */
function wmoToCondition(code) {
  if (code === 0)               return { label: 'Clear Sky',         icon: 'sun' };
  if (code <= 2)                return { label: 'Partly Cloudy',     icon: 'cloud' };
  if (code === 3)               return { label: 'Overcast',          icon: 'cloud' };
  if (code <= 49)               return { label: 'Foggy',             icon: 'cloud' };
  if (code <= 59)               return { label: 'Drizzle',           icon: 'rain' };
  if (code <= 69)               return { label: 'Rain',              icon: 'rain' };
  if (code <= 79)               return { label: 'Snow',              icon: 'snow' };
  if (code <= 82)               return { label: 'Rain Showers',      icon: 'rain' };
  if (code <= 86)               return { label: 'Snow Showers',      icon: 'snow' };
  if (code <= 99)               return { label: 'Thunderstorm',      icon: 'thunder' };
  return                               { label: 'Unknown',           icon: 'cloud' };
}

/* ── Forecast strip ──────────────────────────────────────── */
function getDayLabel(offset) {
  if (offset === 0) return 'TODAY';
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
}

// M1 placeholder — M2 will call renderForecast(days) with real data
function renderForecastPlaceholder() {
  const icons = ['cloud', 'cloud', 'sun', 'sun', 'cloud'];
  forecastStrip.innerHTML = Array.from({ length: 5 }, (_, i) => `
    <div class="forecast-day ${i === 0 ? 'today' : ''}">
      <span class="forecast-label">${getDayLabel(i)}</span>
      <div class="forecast-icon">${SVG[icons[i]]()}</div>
      <span class="forecast-hi">–°</span>
      <span class="forecast-lo">–°</span>
    </div>
  `).join('');
}

// M2 will call this with real data: days = [{ label, iconKey, hi, lo }]
function renderForecast(days) {
  forecastStrip.innerHTML = days.map((d, i) => `
    <div class="forecast-day ${i === 0 ? 'today' : ''}">
      <span class="forecast-label">${d.label}</span>
      <div class="forecast-icon">${SVG[d.icon](22)}</div>
      <span class="forecast-hi">${d.hi}°</span>
      <span class="forecast-lo">${d.lo}°</span>
    </div>
  `).join('');
}

/* ── Hourly panel ────────────────────────────────────────── */
const HOURLY_PLACEHOLDER = [
  { time: '14:00', icon: 'sun',   cond: 'High UV Index',         temp: '–' },
  { time: '15:00', icon: 'cloud', cond: 'Developing Cumulus',    temp: '–' },
  { time: '16:00', icon: 'cloud', cond: 'Gust Peak Recorded',    temp: '–' },
  { time: '17:00', icon: 'cloud', cond: 'Stratus Coverage',      temp: '–' },
  { time: '18:00', icon: 'rain',  cond: 'Precipitation Expected',temp: '–' },
  { time: '19:00', icon: 'sun',   cond: 'Clear Dusk Horizon',    temp: '–' },
];

// M1 placeholder — M2 will call renderHourly(entries) with real data
function renderHourlyPlaceholder() {
  renderHourly(HOURLY_PLACEHOLDER);
}

// M2 will call this with real data: entries = [{ time, icon, cond, temp }]
function renderHourly(entries) {
  document.getElementById('hourlyList').innerHTML = entries.map(h => `
    <li class="hourly-item">
      <span class="hourly-time">${h.time}</span>
      <span class="hourly-cond-icon">${SVG[h.icon](16)}</span>
      <span class="hourly-cond">${h.cond}</span>
      <span class="hourly-temp">${h.temp}</span>
    </li>
  `).join('');
}

/* ── Init ────────────────────────────────────────────────── */
const lastCity = localStorage.getItem('wa-last-city');
if (lastCity) {
  searchInput.value = lastCity;
  loadWeather(lastCity);
} else {
  showState('empty');
}
