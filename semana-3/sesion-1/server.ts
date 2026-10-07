import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import { z } from "zod";

const db = new Database("banco.db");
const server = new McpServer({ name: "neuronbank-server", version: "1.0.0" });

server.tool(
  "movimientosPorCuenta",
  "Trae los movimientos de una cuenta de NeuronBank en un mes (tipo: deposito, cargo, retiro). Solo lectura.",
  { cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'."), mes: z.string().optional().describe("Mes, ej '2026-09'.") },
  async ({ cuenta, mes }) => {
    // Statements parametrizados: nada de SQL concatenado.
    const rows = mes
      ? db.prepare("SELECT tipo, monto, mes FROM movimientos WHERE cuenta=? AND mes=?").all(cuenta, mes)
      : db.prepare("SELECT tipo, monto, mes FROM movimientos WHERE cuenta=?").all(cuenta);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  },
);

// ── EJERCICIO: agrega tu segunda tool ───────────────────────────────────────
// Usando la tool de arriba como modelo, implementa `saldoCuenta`: recibe
// { cuenta } y devuelve el saldo (la suma de todos los montos de esa cuenta).
// Pista SQL: SELECT SUM(monto) AS saldo FROM movimientos WHERE cuenta = ?
// Pruébala en el inspector con { cuenta: "CU-1001" } (saldo esperado: 25950).
//
 server.tool(
   "saldoCuenta",
   "Devuelve el saldo (suma de montos) de una cuenta de NeuronBank. Solo lectura.",
   { cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'.") },
   async ({ cuenta }) => {
    const rows = db.prepare("SELECT SUM(monto) AS saldo FROM movimientos WHERE cuenta=?").get(cuenta);
  return { content: [{ type: "text", text: JSON.stringify(rows) }] };
   },
 );

await server.connect(new StdioServerTransport());
