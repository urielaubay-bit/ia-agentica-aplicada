// Agente NeuronBank (TypeScript, Vercel AI SDK) que consume el MCP server de
// Postgres como CLIENTE MCP sobre HTTP.
//
// El agente:
//   1. se conecta al FastMCP server (http://localhost:8000/mcp),
//   2. descubre sus tools automáticamente,
//   3. corre un loop de Claude: el modelo decide qué tools llamar para
//      responder la pregunta, encadena varias si hace falta, y responde.
//
// Nota sobre el "connector nativo" de Claude: la API de Anthropic tiene un
// connector MCP (mcp_servers) donde los servidores de Anthropic se conectan a tu
// MCP server; eso exige una URL pública (Anthropic no alcanza localhost). Para un
// lab local usamos el cliente MCP del AI SDK, que se conecta desde esta máquina a
// localhost. Para el connector nativo, expón el server con un túnel (ngrok) o
// despliégalo, y pásalo como mcp_servers (ver README).

import "dotenv/config";
import { generateText, stepCountIs } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { anthropic } from "@ai-sdk/anthropic";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:8000/mcp";
const MODEL = process.env.AGENT_MODEL ?? "claude-sonnet-5-5";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Falta ANTHROPIC_API_KEY. El agente llama a Claude (costo real).");
    process.exit(1);
  }

  const mcp = await createMCPClient({
    transport: { type: "http", url: MCP_URL },
  });

  try {
    // Descubre las tools del server (saldo_cuenta, movimientos_por_cuenta, ...).
    const tools = await mcp.tools();
    console.log("Tools disponibles:", Object.keys(tools).join(", "));

    const pregunta =
      process.argv.slice(2).join(" ") ||
      "¿Cuál es el saldo de la cuenta CU-1001 y cuáles fueron sus movimientos de septiembre de 2026? Resume el neto del mes.";

    const res = await generateText({
      model: anthropic(MODEL),
      tools,
      stopWhen: stepCountIs(8), // deja que encadene varias tool-calls
      system:
        "Eres un asistente de NeuronBank. Responde SOLO con datos que obtengas de " +
        "las tools; nunca inventes montos ni cuentas. Si una tool no devuelve datos, dilo.",
      prompt: pregunta,
    });

    console.log("\n--- Tools que llamó el agente ---");
    for (const step of res.steps) {
      for (const call of step.toolCalls ?? []) {
        const args = (call as { input?: unknown; args?: unknown }).input ??
          (call as { args?: unknown }).args;
        console.log(`• ${call.toolName}(${JSON.stringify(args)})`);
      }
    }

    console.log("\n--- Respuesta del agente ---\n" + res.text + "\n");
  } finally {
    await mcp.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
