// Talks to Open-Meteo (free, no API key needed).
// Every function takes an optional `fetchImpl` so tests can pass a fake fetch.

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather interpretation codes -> human-readable text
const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Light snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function describeWeatherCode(code) {
  return WEATHER_CODES[code] ?? `Unknown conditions (code ${code})`;
}

/** Turn a city name into coordinates. Returns null if nothing matches. */
export async function geocodeCity(city, fetchImpl = fetch) {
  const params = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });
  const response = await fetchImpl(`${GEOCODING_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Geocoding request failed (HTTP ${response.status})`);
  }
  const data = await response.json();
  const match = data.results?.[0];
  if (!match) return null;

  return {
    name: match.name,
    country: match.country,
    latitude: match.latitude,
    longitude: match.longitude,
  };
}

/** Fetch current conditions for a pair of coordinates. */
export async function fetchCurrentWeather({ latitude, longitude }, fetchImpl = fetch) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    timezone: "auto",
  });
  const response = await fetchImpl(`${FORECAST_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Forecast request failed (HTTP ${response.status})`);
  }
  const data = await response.json();
  return { current: data.current, units: data.current_units };
}

/** Build the text the model will read. */
export function formatWeather(place, { current, units }) {
  const location = place.country ? `${place.name}, ${place.country}` : place.name;
  return [
    `Current weather in ${location}:`,
    `- Conditions: ${describeWeatherCode(current.weather_code)}`,
    `- Temperature: ${current.temperature_2m}${units.temperature_2m} (feels like ${current.apparent_temperature}${units.apparent_temperature})`,
    `- Humidity: ${current.relative_humidity_2m}${units.relative_humidity_2m}`,
    `- Precipitation: ${current.precipitation}${units.precipitation}`,
    `- Wind: ${current.wind_speed_10m}${units.wind_speed_10m}`,
  ].join("\n");
}
