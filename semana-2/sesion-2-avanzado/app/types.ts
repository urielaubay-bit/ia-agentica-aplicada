import type { ReactNode } from "react";
import type { ModelMessage } from "ai";

// AIState = historial para el modelo (texto). UIState = lo que ve el usuario,
// donde cada mensaje trae un `display` que es un COMPONENTE (server component),
// no texto. Ahi vive la diferencia con sesion-2 (que enviaba JSON al cliente).
export type ClientMessage = { id: string; role: "user" | "assistant"; display: ReactNode };
export type AIState = ModelMessage[];
export type UIState = ClientMessage[];
