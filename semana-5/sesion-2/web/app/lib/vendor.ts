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

// UN SOLO lugar que resuelve la URL de Langfuse, y lo usan tanto
// instrumentation.ts (que manda los spans) como el badge del panel. Cuando
// estaban separados, el badge decia "cloud.langfuse.com" mientras las trazas
// se iban a la region de EE.UU.: un panel que miente es peor que no tener
// panel. Se aceptan los dos nombres de variable porque el SDK solo lee
// LANGFUSE_BASEURL (sin guion bajo) y el nombre con guion bajo es el error
// natural.
export function langfuseBaseUrl(): string {
  return (
    process.env.LANGFUSE_BASEURL ??
    process.env.LANGFUSE_BASE_URL ??
    "https://cloud.langfuse.com"
  );
}

export type Vendor = { nombre: string; detalle: string } | null;

export function vendor(): Vendor {
  if (LANGFUSE) {
    return { nombre: "Langfuse", detalle: langfuseBaseUrl().replace(/^https?:\/\//, "") };
  }
  if (LANGSMITH) {
    return { nombre: "LangSmith", detalle: process.env.LANGSMITH_PROJECT ?? "default" };
  }
  return null;
}
