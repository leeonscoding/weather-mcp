import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

// End-to-end: launch the real server as a child process, exactly like an MCP host would.
test("server starts over stdio and lists its tools", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("../src/index.js", import.meta.url))],
    stderr: "pipe",
  });
  const stderrChunks = [];
  transport.stderr?.on("data", (chunk) => stderrChunks.push(chunk.toString()));

  const client = new Client({ name: "stdio-test-client", version: "1.0.0" });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name), ["get_weather"]);

    // Startup log goes to stderr (stdout is reserved for protocol messages).
    assert.match(stderrChunks.join(""), /Weather MCP server running on stdio/);
  } finally {
    await client.close();
  }
});
