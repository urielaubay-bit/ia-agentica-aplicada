import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import { z } from "zod";

const db = new Database("ventas.db");
const server = new McpServer({ name: "ventas-server", version: "1.0.0" });

server.tool(
  "ventasPorCanal",
  "Trae las ventas de un mes por canal (email, paid_search, organic). Solo lectura.",
  { mes: z.string().describe("Mes, ej '2026-07'."), canal: z.string().optional() },
  async ({ mes, canal }) => {
    const rows = canal && canal !== "all"
      ? db.prepare("SELECT canal, monto FROM ventas WHERE mes=? AND canal=?").all(mes, canal)
      : db.prepare("SELECT canal, monto FROM ventas WHERE mes=?").all(mes);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  },
);

await server.connect(new StdioServerTransport());
