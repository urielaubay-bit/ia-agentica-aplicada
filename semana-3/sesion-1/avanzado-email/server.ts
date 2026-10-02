import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildReporte, enviarReporte } from "./report.js";

const server = new McpServer({ name: "neuronbank-reportes", version: "1.0.0" });

// Compose only (no send): useful to preview the report text in the inspector.
server.tool(
  "generarReportePortafolio",
  "Genera el reporte de portafolio de una cuenta de NeuronBank (saldo, resumen por tipo y movimientos). No envía correo.",
  { cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'.") },
  async ({ cuenta }) => {
    const r = buildReporte(cuenta);
    return {
      content: [
        { type: "text", text: JSON.stringify({ cuenta: r.cuenta, saldo: r.saldo, porTipo: r.porTipo }) },
        { type: "text", text: r.text },
      ],
    };
  },
);

// Compose + send by email. Ethereal by default (preview URL), real SMTP if SMTP_* env set.
server.tool(
  "enviarReportePortafolio",
  "Envía por correo el reporte de portafolio de una cuenta de NeuronBank. Sin SMTP_* usa una cuenta de prueba (Ethereal) y devuelve una URL para ver el correo.",
  {
    cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'."),
    email: z.string().describe("Destinatario, ej 'cliente@ejemplo.com'."),
  },
  async ({ cuenta, email }) => {
    const res = await enviarReporte(cuenta, email);
    return { content: [{ type: "text", text: JSON.stringify(res) }] };
  },
);

await server.connect(new StdioServerTransport());
