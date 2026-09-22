import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import { z } from "zod";

const db = new Database("banco.db");
const server = new McpServer({ name: "neuronbank-server", version: "1.0.0" });

// El rol del usuario define su alcance. En produccion viene de tu auth.
// Ej. un cajero solo ve SU cuenta asignada; un analista ve todo (CUENTA vacio).
const ROL = { cuentaPermitida: process.env.CUENTA ?? "all" };

// Guardrail de scoping por rol FORZADO en el server (no se puede saltar desde el prompt).
function resolveCuenta(pedida: string): string {
  if (ROL.cuentaPermitida === "all") return pedida;
  return ROL.cuentaPermitida; // forzado: ignora lo que pida el modelo
}

server.tool(
  "movimientosPorCuenta",
  "Trae los movimientos de una cuenta de NeuronBank en un mes. Solo lectura.",
  { cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'."), mes: z.string().optional().describe("Mes, ej '2026-09'.") },
  async ({ cuenta, mes }) => {
    const cuentaFinal = resolveCuenta(cuenta);
    const rows = mes
      ? db.prepare("SELECT tipo, monto, mes FROM movimientos WHERE cuenta=? AND mes=?").all(cuentaFinal, mes)
      : db.prepare("SELECT tipo, monto, mes FROM movimientos WHERE cuenta=?").all(cuentaFinal);
    return { content: [{ type: "text", text: JSON.stringify({ cuenta: cuentaFinal, rows }) }] };
  },
);

await server.connect(new StdioServerTransport());
