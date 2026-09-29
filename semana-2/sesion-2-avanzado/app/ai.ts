import { createAI } from "@ai-sdk/rsc";
import { submitMessage } from "./actions";
import type { AIState, UIState } from "./types";

// El proveedor <AI> conecta las server actions con el estado del cliente. La
// pagina envuelve la app en <AI>; el cliente lee mensajes con useUIState y llama
// acciones con useActions. Este es el corazon del patron RSC de Vercel AI SDK.
type Actions = { submitMessage: typeof submitMessage };

export const AI = createAI<AIState, UIState, Actions>({
  actions: { submitMessage },
  initialAIState: [],
  initialUIState: [],
});

export type AIType = typeof AI;
