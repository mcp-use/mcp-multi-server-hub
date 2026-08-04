import { MCPServer } from "mcp-use";
import { z } from "zod";

const server = new MCPServer({
  name: "multi-server-hub",
  title: "Multi-Server Hub",
  version: "2.0.0",
  description: "Aggregate multiple MCP servers and audit tool calls.",
  instructions: "Use hub-status to inspect configured upstream MCP servers and the recent audit log.",
  icons: [{ src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] }],
});

server.use("*", async (c, next) => {
  const startedAt = Date.now();
  await next();
  console.log(`${c.req.method} ${c.req.path} [${Date.now() - startedAt}ms]`);
});

const auditLog: { tool: string; timestamp: string; duration: number }[] = [];

server.use("mcp:tools/call", async (ctx, next) => {
  const startedAt = Date.now();
  const result = await next();
  const duration = Date.now() - startedAt;
  auditLog.push({ tool: ctx.params.name, timestamp: new Date().toISOString(), duration });
  console.log(`${ctx.params.name} completed in ${duration}ms`);
  return result;
});

const proxyConfig: Record<string, { url: string }> = {};

if (Object.keys(proxyConfig).length > 0) {
  await server.proxy(proxyConfig);
}

const hubStatusOutput = z.object({
  proxiedServers: z.array(z.object({ name: z.string(), type: z.string(), url: z.string() })),
  auditLog: z.array(z.object({ tool: z.string(), timestamp: z.string(), duration: z.number() })),
  totalCalls: z.number(),
});

export const hubStatus = server.tool(
  {
    name: "hub-status",
    title: "Hub status",
    description: "Show configured upstream servers and the latest audit entries.",
    inputSchema: z.object({}),
    outputSchema: hubStatusOutput,
    view: { name: "hub-dashboard", description: "Multi-server status dashboard", prefersBorder: true },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  () => {
    const data = {
      proxiedServers: Object.entries(proxyConfig).map(([name, config]) => ({ name, type: "http", url: config.url })),
      auditLog: auditLog.slice(-20),
      totalCalls: auditLog.length,
    };
    return {
      content: [{ type: "text", text: `Hub has ${data.proxiedServers.length} proxied servers and ${data.totalCalls} logged calls.` }],
      structuredContent: data,
    };
  },
);

const configOutput = z.object({ example: z.string() });

export const hubConfigExample = server.tool(
  {
    name: "hub-config-example",
    title: "Hub configuration example",
    description: "Show an example configuration for remote MCP servers.",
    inputSchema: z.object({}),
    outputSchema: configOutput,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  () => {
    const example = `const proxyConfig = {\n  weather: { url: "https://weather-mcp.example.com/mcp" },\n};\n\nawait server.proxy(proxyConfig);\n\nProxied tools are namespaced, for example weather_get-forecast.`;
    return { content: [{ type: "text", text: example }], structuredContent: { example } };
  },
);

const auditOutput = z.object({ entries: z.array(z.object({ tool: z.string(), timestamp: z.string(), duration: z.number() })) });

export const auditLogTool = server.tool(
  {
    name: "audit-log",
    title: "Audit log",
    description: "View recent tool calls through the hub.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(10).describe("Number of entries") }),
    outputSchema: auditOutput,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  ({ limit }) => {
    const entries = auditLog.slice(-limit);
    return {
      content: [{ type: "text", text: entries.length === 0 ? "No tool calls recorded yet." : entries.map((entry) => `${entry.timestamp} | ${entry.tool} | ${entry.duration}ms`).join("\n") }],
      structuredContent: { entries },
    };
  },
);

export default server;
