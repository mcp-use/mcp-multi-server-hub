import {
  McpUseProvider,
  useWidget,
  type WidgetMetadata,
} from "mcp-use/react";
import React from "react";
import "../styles.css";
import { propSchema, type HubDashboardProps } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Multi-Server Hub dashboard showing proxied servers and audit log",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Loading status...",
    invoked: "Status ready",
  },
};

function DurationBadge({ ms }: { ms: number }) {
  const color =
    ms < 100
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : ms < 500
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {ms}ms
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isHttp = type === "http";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        isHttp
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
      }`}
    >
      {type}
    </span>
  );
}

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

const HubDashboard: React.FC = () => {
  const { props, isPending } = useWidget<HubDashboardProps>();

  if (isPending || !props) {
    return (
      <McpUseProvider autoSize>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading hub status...
            </span>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { proxiedServers, auditLog, totalCalls } = props;

  return (
    <McpUseProvider autoSize>
      <div className="p-5 space-y-5 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <span className="text-base">🔀</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              Multi-Server Hub
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total calls
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {totalCalls}
            </span>
          </div>
        </div>

        {/* Proxied Servers */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
            Proxied Servers
          </h3>
          {proxiedServers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                No servers configured yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Edit <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-xs">PROXY_CONFIG</code> in{" "}
                <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-xs">index.ts</code> to add
                remote or local MCP servers.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {proxiedServers.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-sm">
                      🖥
                    </div>
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <TypeBadge type={s.type} />
                    <span className="max-w-[200px] truncate text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {s.url}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audit Log */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
            Audit Log
          </h3>
          {auditLog.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tool calls yet. Call a tool to see it here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500">
                      Tool
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500">
                      Time
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 dark:text-gray-500">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-b-0 border-gray-100 dark:border-gray-700/50"
                    >
                      <td className="px-4 py-2 font-medium font-mono text-xs">
                        {entry.tool}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <DurationBadge ms={entry.duration} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </McpUseProvider>
  );
};

export default HubDashboard;
