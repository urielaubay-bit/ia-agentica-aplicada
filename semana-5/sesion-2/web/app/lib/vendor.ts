// Que servicio de trazas esta encendido. Se decide por las claves que haya en
// el entorno, no por una bandera que haya que recordar cambiar.
//
// La leccion de la sesion: la observabilidad tiene DOS capas.
//   1. La tuya (lib/trazas.ts + el panel): siempre funciona, no depende de
//      nadie, y es la que te salva cuando el proveedor se cae.
//   2. La del proveedor (Langfuse o LangSmith): persistente, compartida,
//      con historial. Es un INTERCAMBIABLE, no un cimiento.
//
// Langfuse entra por OpenTelemetry (instrumentation.ts + experimental_telemetry)
// y LangSmith por wrapAISDK. Las dos capturan lo mismo; usa la que tu cliente
// ya pague.

export const LANGFUSE =
  !!process.env.LANGFUSE_PUBLIC_KEY && !!process.env.LANGFUSE_SECRET_KEY;

export const LANGSMITH =
  process.env.LANGSMITH_TRACING === "true" && !!process.env.LANGSMITH_API_KEY;

export type Vendor = { nombre: string; detalle: string } | null;

export function vendor(): Vendor {
  if (LANGFUSE) {
    const url = process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com";
    return { nombre: "Langfuse", detalle: url.replace(/^https?:\/\//, "") };
  }
  if (LANGSMITH) {
    return { nombre: "LangSmith", detalle: process.env.LANGSMITH_PROJECT ?? "default" };
  }
  return null;
}
