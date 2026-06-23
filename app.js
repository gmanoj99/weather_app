/* ============================================================
   Weather App — JavaScript
   Milestone 2: Open-Meteo API integration
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
const recentCityContainer = document.getElementById('recentCityContainer');
const recentCityBtn = document.getElementById('recentCityBtn');
const clearStoredCityBtn = document.getElementById('clearStoredCityBtn');

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
searchInput.addEventListener('focus', () => {
  const lastCity = localStorage.getItem('wa-last-city');

  if (lastCity) {
    recentCityBtn.textContent = lastCity;
    recentCityContainer.style.display = 'flex';
  }
});
recentCityBtn.addEventListener('click', () => {
  const city = localStorage.getItem('wa-last-city');

  if (city) {
    loadWeather(city);
    recentCityContainer.style.display = 'none';
  }
});
clearStoredCityBtn.addEventListener('click', () => {
  localStorage.removeItem('wa-last-city');

  recentCityContainer.style.display = 'none';
  searchInput.value = '';

  showState('empty');
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

clearCityBtn.addEventListener('click', () => {
  localStorage.removeItem('wa-last-city');

  searchInput.value = '';
  recentCityContainer.style.display = 'none';

  showState('empty');
});

function handleSearch() {
  const city = searchInput.value.trim();
  if (!city) return;
  loadWeather(city);
}

/* ── API layer ───────────────────────────────────────────── */
const GEO_URL      = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Step 1 — Geocode city name → { name, country, latitude, longitude }
 */
async function geocodeCity(city) {
  const url = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding service unavailable. Please try again.');

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found. Check the spelling and try again.`);
  }

  const { name, country, latitude, longitude } = data.results[0];
  return { name, country, latitude, longitude };
}

/**
 * Step 2 — Fetch forecast for given coordinates
 * Returns raw Open-Meteo response.
 */
async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'surface_pressure',
      'weather_code',
    ].join(','),
    hourly: [
      'temperature_2m',
      'weather_code',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
    ].join(','),
    timezone: 'auto',
    forecast_days: 5,
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error('Weather service unavailable. Please try again.');
  return res.json();
}

/* ── Main load function ──────────────────────────────────── */
async function loadWeather(city) {
  showState('loading');

  try {
    // 1. Resolve city → coordinates
    const location = await geocodeCity(city);

    // 2. Fetch forecast data
    const forecast = await fetchForecast(location.latitude, location.longitude);

    // 3. Persist and render
    localStorage.setItem('wa-last-city', city);
    renderWeather(location, forecast);
    showState('data');

    console.log('[WeatherApp] Location:', location);
    console.log('[WeatherApp] Forecast:', forecast);

  } catch (err) {
    console.error('[WeatherApp] Error:', err);
    showError(err.message || 'Something went wrong. Please try again.');
  }
}

/* ── Data transform + render ─────────────────────────────── */
function renderWeather(location, data) {
  const { current, hourly, daily } = data;

  // ── Current weather card ──
  const condition = wmoToCondition(current.weather_code);

  // Use API time for accurate local date
  const now = current.time
    ? new Date(current.time)
    : new Date();

  document.getElementById('cityName').textContent =
    `${location.name}, ${location.country}`;

  document.getElementById('dateText').textContent =
    now.toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

  document.getElementById('tempValue').textContent =
    Math.round(current.temperature_2m);

  document.getElementById('conditionText').textContent =
    condition.label;

  document.getElementById('humidity').textContent =
    `${current.relative_humidity_2m}%`;

  document.getElementById('windSpeed').textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  document.getElementById('pressure').textContent =
    `${Math.round(current.surface_pressure)} hPa`;

  // ── Temperature accent color system ──
  weatherCard.classList.remove(
    'temp-cold',
    'temp-mild',
    'temp-warm'
  );

  const temp = current.temperature_2m;

  if (temp <= 5) {
    weatherCard.classList.add('temp-cold');
  } else if (temp >= 21) {
    weatherCard.classList.add('temp-warm');
  } else {
    weatherCard.classList.add('temp-mild');
  }

  // ── Weather icon ──
  document.getElementById('conditionIcon').outerHTML = `
    <svg
      id="conditionIcon"
      class="condition-icon"
      viewBox="0 0 24 24">
      ${SVG_PATHS[condition.icon]}
    </svg>
  `;

  // ── 5-day forecast strip ──
  const days = daily.time.slice(0, 5).map((dateStr, i) => ({
    label:
      i === 0
        ? 'TODAY'
        : new Date(dateStr + 'T00:00:00')
            .toLocaleDateString('en-GB', {
              weekday: 'short',
            })
            .toUpperCase(),

    icon: wmoToCondition(daily.weather_code[i]).icon,

    hi: Math.round(daily.temperature_2m_max[i]),

    lo: Math.round(daily.temperature_2m_min[i]),
  }));

  renderForecast(days);

  // ── Hourly panel — next 6 hours ──
  const currentHour = now.getHours();
  const hourlyEntries = [];

  for (
    let i = 0;
    i < hourly.time.length && hourlyEntries.length < 6;
    i++
  ) {
    const hour = new Date(hourly.time[i]).getHours();
    const date = new Date(hourly.time[i]);

    if (date.toDateString() !== now.toDateString()) continue;
    if (hour <= currentHour) continue;

    const cond = wmoToCondition(hourly.weather_code[i]);

    hourlyEntries.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      icon: cond.icon,
      cond: cond.label,
      temp: `${Math.round(hourly.temperature_2m[i])}°C`,
    });
  }

  // Pad from tomorrow if needed
  if (hourlyEntries.length < 6) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (
      let i = 0;
      i < hourly.time.length && hourlyEntries.length < 6;
      i++
    ) {
      const date = new Date(hourly.time[i]);

      if (
        date.toDateString() !== tomorrow.toDateString()
      ) continue;

      const cond = wmoToCondition(hourly.weather_code[i]);

      hourlyEntries.push({
        time: `${String(date.getHours()).padStart(2, '0')}:00`,
        icon: cond.icon,
        cond: cond.label,
        temp: `${Math.round(hourly.temperature_2m[i])}°C`,
      });
    }
  }

  renderHourly(hourlyEntries);
}

/* ── SVG icon helpers ────────────────────────────────────── */
// Inner path strings — reused in both inline card icon and HTML template
const SVG_PATHS = {
  sun:     `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
  cloud:   `<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z"/>`,
  rain:    `<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="19" x2="16" y2="21"/>`,
  snow:    `<line x1="12" y1="2" x2="12" y2="22"/><path d="m20 7-8 5-8-5"/><path d="m20 17-8-5-8 5"/>`,
  thunder: `<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/>`,
};

const SVG = {
  sun:     (size = 22) => svgWrap(SVG_PATHS.sun,     size),
  cloud:   (size = 22) => svgWrap(SVG_PATHS.cloud,   size),
  rain:    (size = 22) => svgWrap(SVG_PATHS.rain,    size),
  snow:    (size = 22) => svgWrap(SVG_PATHS.snow,    size),
  thunder: (size = 22) => svgWrap(SVG_PATHS.thunder, size),
};

function svgWrap(inner, size) {
  return `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;">${inner}</svg>`;
}

/* ── WMO code → condition ────────────────────────────────── */
function wmoToCondition(code) {
  if (code === 0)        return { label: 'Clear Sky',      icon: 'sun' };
  if (code <= 2)         return { label: 'Partly Cloudy',  icon: 'cloud' };
  if (code === 3)        return { label: 'Overcast',       icon: 'cloud' };
  if (code <= 49)        return { label: 'Foggy',          icon: 'cloud' };
  if (code <= 59)        return { label: 'Drizzle',        icon: 'rain' };
  if (code <= 69)        return { label: 'Rain',           icon: 'rain' };
  if (code <= 79)        return { label: 'Snow',           icon: 'snow' };
  if (code <= 82)        return { label: 'Rain Showers',   icon: 'rain' };
  if (code <= 86)        return { label: 'Snow Showers',   icon: 'snow' };
  if (code <= 99)        return { label: 'Thunderstorm',   icon: 'thunder' };
  return                        { label: 'Unknown',        icon: 'cloud' };
}

/* ── Forecast strip render ───────────────────────────────── */
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

/* ── Hourly panel render ─────────────────────────────────── */
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
  loadWeather(lastCity);
} else {
  showState('empty');
}