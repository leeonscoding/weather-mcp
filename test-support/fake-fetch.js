// A fake fetch that returns canned Open-Meteo responses, so tests never touch the network.

const DHAKA_GEOCODING = {
  results: [{ name: "Dhaka", country: "Bangladesh", latitude: 23.7104, longitude: 90.40744 }],
};

const DHAKA_FORECAST = {
  current_units: {
    temperature_2m: "°C",
    apparent_temperature: "°C",
    relative_humidity_2m: "%",
    precipitation: "mm",
    wind_speed_10m: "km/h",
  },
  current: {
    temperature_2m: 31.4,
    apparent_temperature: 36.1,
    relative_humidity_2m: 74,
    precipitation: 0.2,
    weather_code: 80,
    wind_speed_10m: 12.5,
  },
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Creates a fake fetch. `calls` records every URL requested. */
export function makeFakeFetch({ geocoding = DHAKA_GEOCODING, forecast = DHAKA_FORECAST, failWith } = {}) {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(String(url));
    if (failWith) return json({}, failWith);
    if (String(url).includes("geocoding-api")) return json(geocoding);
    if (String(url).includes("api.open-meteo.com")) return json(forecast);
    throw new Error(`Unexpected URL in test: ${url}`);
  };
  fakeFetch.calls = calls;
  return fakeFetch;
}
