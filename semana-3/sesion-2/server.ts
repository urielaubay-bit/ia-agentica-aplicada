import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import { z } from "zod";

const db = new Database("ventas.db");
const server = new McpServer({ name: "ventas-server", version: "1.0.0" });

// El rol del usuario define su alcance. En produccion viene de tu auth.
const ROL = { canalPermitido: process.env.CANAL ?? "all" };

// Guardrail de scoping por rol forzado en el server (como resolveChannel en el POC).
function resolveCanal(pedido?: string): string | undefined {
  if (ROL.canalPermitido === "all") return pedido;
  return ROL.canalPermitido; // forzado
}

server.tool(
  "ventasPorCanal",
  "Trae las ventas de un mes por canal (email, paid_search, organic). Solo lectura.",
  { mes: z.string().describe("Mes, ej '2026-07'."), canal: z.string().optional() },
  async ({ mes, canal }) => {
    const canalFinal = resolveCanal(canal);
    const rows = canalFinal && canalFinal !== "all"
      ? db.prepare("SELECT canal, monto FROM ventas WHERE mes=? AND canal=?").all(mes, canalFinal)
      : db.prepare("SELECT canal, monto FROM ventas WHERE mes=?").all(mes);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  },
);

await server.connect(new StdioServerTransport());
