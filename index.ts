import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";

const server = new MCPServer({
  name: "multi-server-hub",
  title: "Multi-Server Hub",
  version: "1.0.0",
  description: "Server composition — aggregate multiple MCP servers with proxy()",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  icons: [
    { src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] },
  ],
});

// ── HTTP Middleware: request logging ─────────────────────────────────────────

server.use(async (c, next) => {
  const start = Date.now();
  console.log(`→ ${c.req.method} ${c.req.url}`);
  await next();
  console.log(`← ${c.req.method} ${c.req.url} [${Date.now() - start}ms]`);
});

// ── MCP Operation Middleware: audit log for all tool calls ──────────────────

const auditLog: { tool: string; timestamp: string; duration: number }[] = [];

server.use("mcp:tools/call", async (ctx, next) => {
  const start = Date.now();
  console.log(`🔧 Proxied tool call: ${ctx.params.name}`);
  const result = await next();
  const duration = Date.now() - start;
  auditLog.push({
    tool: ctx.params.name,
    timestamp: new Date().toISOString(),
    duration,
  });
  console.log(`🔧 ${ctx.params.name} completed in ${duration}ms`);
  return result;
});

// ── Server Proxy — the key feature ─────────────────────────────────────────
// In production, replace these with real MCP server URLs.
// For the demo, we provide example config that users can customize.

const PROXY_CONFIG: Record<string, { url?: string; command?: string; args?: string[] }> = {
  // Example: proxy a remote MCP server
  // weather: { url: "https://weather-mcp.example.com/mcp" },
  // Example: proxy a local stdio MCP server
  // local: { command: "node", args: ["./local-server.js"] },
};

if (Object.keys(PROXY_CONFIG).length > 0) {
  await server.proxy(PROXY_CONFIG);
}

// ── Local Tools (always available alongside proxied ones) ───────────────────

server.tool(
  {
    name: "hub-status",
    description:
      "Show the status of the multi-server hub, proxied servers, and audit log",
    schema: z.object({}),
    widget: {
      name: "hub-dashboard",
      invoking: "Loading status...",
      invoked: "Status ready",
    },
  },
  async () => {
    const proxiedServers = Object.keys(PROXY_CONFIG);
    return widget({
      props: {
        proxiedServers: proxiedServers.map((name) => ({
          name,
          type: PROXY_CONFIG[name].url ? "http" : "stdio",
          url:
            PROXY_CONFIG[name].url ??
            `stdio:${PROXY_CONFIG[name].command}`,
        })),
        auditLog: auditLog.slice(-20),
        totalCalls: auditLog.length,
      },
      output: text(
        `Hub has ${proxiedServers.length} proxied servers and ${auditLog.length} logged calls`
      ),
    });
  }
);

server.tool(
  {
    name: "hub-config-example",
    description: "Show example configuration for proxy servers",
    schema: z.object({}),
  },
  async () => {
    return text(
      `To proxy remote servers, edit PROXY_CONFIG in index.ts:\n\n` +
        `// HTTP remote server:\n` +
        `weather: { url: "https://weather-mcp.example.com/mcp" }\n\n` +
        `// Stdio local server:\n` +
        `calculator: { command: "node", args: ["./calc-server.js"] }\n\n` +
        `Proxied tools are namespaced: weather_get-forecast, calculator_add, etc.`
    );
  }
);

server.tool(
  {
    name: "audit-log",
    description: "View the audit log of recent tool calls through this hub",
    schema: z.object({
      limit: z.number().default(10).describe("Number of entries"),
    }),
  },
  async ({ limit }) => {
    const entries = auditLog.slice(-limit);
    if (entries.length === 0) return text("No tool calls recorded yet.");
    return text(
      entries
        .map((e) => `${e.timestamp} | ${e.tool} | ${e.duration}ms`)
        .join("\n")
    );
  }
);

server.listen().then(() => console.log("Multi-Server Hub running"));
