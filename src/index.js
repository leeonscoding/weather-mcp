#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

serveStdio(() => createServer());

// stdout is reserved for protocol messages, so log to stderr only.
console.error("Weather MCP server running on stdio");
