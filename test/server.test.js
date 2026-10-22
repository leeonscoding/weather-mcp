import { test } from "node:test";
import assert from "node:assert/strict";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createServer } from "../src/server.js";
import { makeFakeFetch } from "../test-support/fake-fetch.js";

// Connects a real MCP client to our server in memory (no processes, no network).
async function connect(fetchImpl) {
  const server = createServer({ fetchImpl });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, close: () => Promise.all([client.close(), server.close()]) };
}

test("server advertises the get_weather tool with a schema", async () => {
  const { client, close } = await connect(makeFakeFetch());
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, "get_weather");
    assert.match(tools[0].description, /current weather/i);
    assert.equal(tools[0].inputSchema.type, "object");
    assert.deepEqual(tools[0].inputSchema.required, ["city"]);
    assert.equal(tools[0].inputSchema.properties.city.type, "string");
  } finally {
    await close();
  }
});

test("get_weather returns formatted weather for a known city", async () => {
  const { client, close } = await connect(makeFakeFetch());
  try {
    const result = await client.callTool({ name: "get_weather", arguments: { city: "Dhaka" } });
    assert.notEqual(result.isError, true);
    assert.equal(result.content[0].type, "text");
    assert.match(result.content[0].text, /Current weather in Dhaka, Bangladesh/);
    assert.match(result.content[0].text, /31\.4°C/);
  } finally {
    await close();
  }
});

test("get_weather reports an unknown city as a tool error", async () => {
  const { client, close } = await connect(makeFakeFetch({ geocoding: {} }));
  try {
    const result = await client.callTool({ name: "get_weather", arguments: { city: "Nowhereville" } });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Could not find a city named "Nowhereville"/);
  } finally {
    await close();
  }
});

test("get_weather reports upstream API failures as a tool error", async () => {
  const { client, close } = await connect(makeFakeFetch({ failWith: 503 }));
  try {
    const result = await client.callTool({ name: "get_weather", arguments: { city: "Dhaka" } });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Weather lookup failed: Geocoding request failed \(HTTP 503\)/);
  } finally {
    await close();
  }
});

test("get_weather rejects invalid input before running the handler", async () => {
  const fakeFetch = makeFakeFetch();
  const { client, close } = await connect(fakeFetch);
  try {
    // The SDK validates arguments against the zod schema and returns a tool error.
    const result = await client.callTool({ name: "get_weather", arguments: { city: 42 } });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Input validation error/);
    assert.match(result.content[0].text, /city/);
    assert.equal(fakeFetch.calls.length, 0, "handler must not run for invalid input");
  } finally {
    await close();
  }
});

test("get_weather rejects an empty city name", async () => {
  const fakeFetch = makeFakeFetch();
  const { client, close } = await connect(fakeFetch);
  try {
    const result = await client.callTool({ name: "get_weather", arguments: { city: "" } });
    assert.equal(result.isError, true);
    assert.equal(fakeFetch.calls.length, 0);
  } finally {
    await close();
  }
});
