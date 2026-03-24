import { z } from "zod";

export const propSchema = z.object({
  proxiedServers: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        url: z.string(),
      })
    )
    .describe("Proxied server list"),
  auditLog: z
    .array(
      z.object({
        tool: z.string(),
        timestamp: z.string(),
        duration: z.number(),
      })
    )
    .describe("Recent audit log entries"),
  totalCalls: z.number().describe("Total tool calls"),
});

export type HubDashboardProps = z.infer<typeof propSchema>;
