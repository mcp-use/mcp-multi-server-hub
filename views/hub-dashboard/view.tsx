import { ThemeProvider, useToolContext } from "mcp-use/react";

export default function HubDashboard() {
  const view = useToolContext<"hub-status">();
  if (view.status === "error") return <p>Unable to load hub status: {view.error.message}</p>;
  if (view.status === "pending") return <p>Loading hub status…</p>;
  const { proxiedServers, auditLog, totalCalls } = view.toolOutput;
  return (
    <ThemeProvider>
      <main style={{ padding: 20, fontFamily: "system-ui" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>🔀 Multi-Server Hub</h2><strong>Total calls: {totalCalls}</strong>
        </header>
        <section><h3>Proxied Servers</h3>{proxiedServers.length === 0 ? <p>No servers configured yet. Edit <code>proxyConfig</code> in <code>index.ts</code> to add a remote MCP server.</p> : <ul>{proxiedServers.map((server) => <li key={server.name}><strong>{server.name}</strong> ({server.type}) — <code>{server.url}</code></li>)}</ul>}</section>
        <section><h3>Audit Log</h3>{auditLog.length === 0 ? <p>No tool calls yet. Call a tool to see it here.</p> : <table><thead><tr><th>Tool</th><th>Time</th><th>Duration</th></tr></thead><tbody>{auditLog.map((entry, index) => <tr key={`${entry.timestamp}-${index}`}><td>{entry.tool}</td><td>{new Date(entry.timestamp).toLocaleTimeString()}</td><td>{entry.duration}ms</td></tr>)}</tbody></table>}</section>
      </main>
    </ThemeProvider>
  );
}
