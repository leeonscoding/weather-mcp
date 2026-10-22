import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { geocodeCity, fetchCurrentWeather, formatWeather } from "./weather.js";

// A factory function, so tests can inject a fake fetch.
export function createServer({ fetchImpl = fetch } = {}) {
  const server = new McpServer({ name: "weather", version: "1.0.0" });

  server.registerTool(
    "get_weather",
    {
      title: "Get weather",
      description:
        "Get the current weather (temperature, conditions, humidity, wind) for a city. " +
        "Use this whenever the user asks about the weather or whether they need an umbrella or jacket.",
      inputSchema: z.object({
        city: z.string().min(1).describe("City name, e.g. 'Dhaka' or 'Paris'"),
      }),
    },
    async ({ city }) => {
      try {
        const place = await geocodeCity(city, fetchImpl);
        if (!place) {
          // isError tells the model the call failed, so it can recover or explain.
          return {
            isError: true,
            content: [{ type: "text", text: `Could not find a city named "${city}".` }],
          };
        }
        const weather = await fetchCurrentWeather(place, fetchImpl);
        return { content: [{ type: "text", text: formatWeather(place, weather) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Weather lookup failed: ${error.message}` }],
        };
      }
    },
  );

  return server;
}
