import { test } from "node:test";
import assert from "node:assert/strict";
import {
  describeWeatherCode,
  geocodeCity,
  fetchCurrentWeather,
  formatWeather,
} from "../src/weather.js";
import { makeFakeFetch } from "../test-support/fake-fetch.js";

test("describeWeatherCode maps known codes and falls back for unknown ones", () => {
  assert.equal(describeWeatherCode(0), "Clear sky");
  assert.equal(describeWeatherCode(95), "Thunderstorm");
  assert.match(describeWeatherCode(1234), /Unknown conditions \(code 1234\)/);
});

test("geocodeCity returns the first match with coordinates", async () => {
  const fakeFetch = makeFakeFetch();
  const place = await geocodeCity("Dhaka", fakeFetch);
  assert.deepEqual(place, {
    name: "Dhaka",
    country: "Bangladesh",
    latitude: 23.7104,
    longitude: 90.40744,
  });
  assert.match(fakeFetch.calls[0], /name=Dhaka/);
});

test("geocodeCity URL-encodes city names", async () => {
  const fakeFetch = makeFakeFetch();
  await geocodeCity("São Paulo & co", fakeFetch);
  assert.match(fakeFetch.calls[0], /name=S%C3%A3o\+Paulo\+%26\+co/);
});

test("geocodeCity returns null when nothing matches", async () => {
  const place = await geocodeCity("Nowhereville", makeFakeFetch({ geocoding: {} }));
  assert.equal(place, null);
});

test("geocodeCity throws on HTTP errors", async () => {
  await assert.rejects(
    geocodeCity("Dhaka", makeFakeFetch({ failWith: 503 })),
    /Geocoding request failed \(HTTP 503\)/,
  );
});

test("fetchCurrentWeather sends coordinates and returns current + units", async () => {
  const fakeFetch = makeFakeFetch();
  const result = await fetchCurrentWeather({ latitude: 23.7104, longitude: 90.40744 }, fakeFetch);
  assert.equal(result.current.temperature_2m, 31.4);
  assert.equal(result.units.temperature_2m, "°C");
  assert.match(fakeFetch.calls[0], /latitude=23\.7104/);
  assert.match(fakeFetch.calls[0], /longitude=90\.40744/);
});

test("fetchCurrentWeather throws on HTTP errors", async () => {
  await assert.rejects(
    fetchCurrentWeather({ latitude: 0, longitude: 0 }, makeFakeFetch({ failWith: 500 })),
    /Forecast request failed \(HTTP 500\)/,
  );
});

test("formatWeather produces readable text with units", async () => {
  const fakeFetch = makeFakeFetch();
  const place = await geocodeCity("Dhaka", fakeFetch);
  const weather = await fetchCurrentWeather(place, fakeFetch);
  const text = formatWeather(place, weather);
  assert.match(text, /Current weather in Dhaka, Bangladesh/);
  assert.match(text, /Light rain showers/);
  assert.match(text, /31\.4°C \(feels like 36\.1°C\)/);
  assert.match(text, /Humidity: 74%/);
  assert.match(text, /Wind: 12\.5km\/h/);
});
