# Weather MCP Server

A minimal [Model Context Protocol](https://modelcontextprotocol.io) server in Node.js that
exposes one tool, `get_weather`, backed by the free [Open-Meteo](https://open-meteo.com) API
(no API key required).

Built with the official MCP TypeScript SDK **v2** (`@modelcontextprotocol/server`), plain JavaScript (ESM).

## Requirements

- Node.js 20 or newer

## Setup

```bash
npm install
```

## Run

```bash
npm start          # starts the server on stdio (waits for an MCP client)
npm run inspect    # opens MCP Inspector to call the tool by hand
npm test           # runs the test suite (no network needed)
```

## Project structure

```
src/
  index.js     # entry point: serves the server over stdio
  server.js    # creates the MCP server and registers the get_weather tool
  weather.js   # Open-Meteo calls + formatting (accepts an injectable fetch)
test/
  weather.test.js  # unit tests for the weather logic
  server.test.js   # MCP client <-> server tests, in memory
  stdio.test.js    # end-to-end test over real stdio
test-support/
  fake-fetch.js    # fake fetch with canned Open-Meteo responses
```

## Use with Claude Code

```bash
claude mcp add weather -- node /absolute/path/to/weather-mcp/src/index.js
```

Then ask: "Do I need an umbrella in Dhaka today?"

## Note

`console.log` must not be used in this server: with stdio, stdout carries protocol
messages, so logs go to stderr (`console.error`).
