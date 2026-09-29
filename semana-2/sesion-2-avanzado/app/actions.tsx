"use server";

import { Fragment, type ReactNode } from "react";
import { streamText, stepCountIs, tool, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createStreamableUI, getMutableAIState } from "@ai-sdk/rsc";
import { z } from "zod";
import { getCuenta, kpisDeCuenta } from "./cuentas";
import { KpiCards } from "./components/kpi-cards";
import { MovimientosTable } from "./components/movimientos-table";
import { AssistantText } from "./components/assistant-text";
import type { ClientMessage } from "./types";
import type { AI } from "./ai";

const genId = () => Math.random().toString(36).slice(2, 10);
const cuentaArg = z.object({ cuenta: z.string().optional().describe("Id de cuenta, ej 'CU-1001'.") });

// Mapea el resultado de una tool a un COMPONENTE DE SERVIDOR. Aqui se decide,
// en el servidor, que React renderizar; ese componente se transmite al cliente.
function renderToolResult(name: string, output: any): ReactNode {
  if (output?.error) return <p className="down">{output.error}</p>;
  if (name === "getKpisCuenta") return <KpiCards kpis={output.kpis} caption={`${output.titular} · ${output.cuenta}`} />;
  if (name === "listarMovimientos") return <MovimientosTable movimientos={output.movimientos} caption={`${output.titular} · ${output.cuenta}`} />;
  return null;
}

type Block = { type: "text"; content: string } | { type: "tool"; node: ReactNode };

// La server action: el agente razona con streamText y NOSOTROS vamos armando un
// arbol de React (createStreamableUI) que se transmite al cliente en fases:
// primero "pensando", luego texto, luego los componentes de cada tool.
export async function submitMessage(input: string): Promise<ClientMessage> {
  const aiState = getMutableAIState<typeof AI>();
  aiState.update([...aiState.get(), { role: "user", content: input }]);

  const tools = {
    getKpisCuenta: tool({
      description: "KPIs de una cuenta de NeuronBank. Renderiza tarjetas.",
      inputSchema: cuentaArg,
      execute: async ({ cuenta = "CU-1001" }) => {
        const c = getCuenta(cuenta);
        if (!c) return { error: `Cuenta ${cuenta} no encontrada` };
        return { cuenta, titular: c.titular, kpis: kpisDeCuenta(c) };
      },
    }),
    listarMovimientos: tool({
      description: "Lista los movimientos del mes de una cuenta. Renderiza una tabla.",
      inputSchema: cuentaArg,
      execute: async ({ cuenta = "CU-1001" }) => {
        const c = getCuenta(cuenta);
        if (!c) return { error: `Cuenta ${cuenta} no encontrada` };
        return { cuenta, titular: c.titular, movimientos: c.movimientos };
      },
    }),
  };

  const ui = createStreamableUI(<AssistantText content="" pending />);
  const blocks: Block[] = [];
  const render = (done = false) => {
    if (blocks.length === 0) { ui.update(<AssistantText content="" pending />); return; }
    ui.update(
      <div className="stack">
        {blocks.map((b, i) =>
          b.type === "text"
            ? <AssistantText key={i} content={b.content} done={done} />
            : <Fragment key={i}>{b.node}</Fragment>
        )}
      </div>
    );
  };

  (async () => {
    try {
      const result = streamText({
        model: anthropic("claude-sonnet-4-5"),
        system:
          "Eres el copiloto de NeuronBank. Usa las tools para datos reales; nunca inventes cifras. " +
          "NUNCA escribas HTML ni codigo; responde una frase breve en lenguaje natural. Cuentas: CU-1001, CU-1002, CU-1003.",
        messages: aiState.get() as ModelMessage[],
        tools,
        stopWhen: stepCountIs(5),
      });

      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          const last = blocks[blocks.length - 1];
          if (last && last.type === "text") last.content += part.text;
          else blocks.push({ type: "text", content: part.text });
          render(false);
        } else if (part.type === "tool-result") {
          blocks.push({ type: "tool", node: renderToolResult(part.toolName, part.output) });
          render(false);
        } else if (part.type === "error") {
          throw part.error;
        }
      }

      render(true);
      ui.done();

      const finalText =
        blocks.filter((b): b is { type: "text"; content: string } => b.type === "text").map((b) => b.content).join("\n").trim() ||
        "[respuesta generativa]";
      aiState.done([...aiState.get(), { role: "assistant", content: finalText }]);
    } catch (err) {
      blocks.push({ type: "tool", node: <p className="down">Error: {(err as Error).message}</p> });
      render(true);
      ui.done();
      aiState.done(aiState.get());
    }
  })();

  return { id: genId(), role: "assistant", display: ui.value };
}
