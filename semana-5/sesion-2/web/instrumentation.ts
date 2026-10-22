// Registro de OpenTelemetry. Next.js llama a register() una vez, al arrancar.
//
// Asi entra Langfuse: no se toca ninguna tool ni ningun componente. Cada
// llamada del AI SDK que lleve `experimental_telemetry` emite spans de OTel y
// el exporter de Langfuse los manda a tu proyecto. Es el patron del POC de
// referencia (Pulse).
//
// Si no hay claves, esto no registra nada y la app corre igual: el panel de
// observabilidad es nuestro y no depende de ningun servicio.
//
// En Next.js 14 este archivo necesita `experimental.instrumentationHook: true`
// en next.config.mjs (en Next 15+ ya es estable y no hace falta).

export async function register() {
  if (
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { registerOTel } = await import("@vercel/otel");
    const { LangfuseExporter } = await import("langfuse-vercel");

    // OJO, la trampa que nos costo media hora: el SDK de Langfuse lee la
    // variable LANGFUSE_BASEURL, SIN guion bajo entre BASE y URL. Si tu
    // proyecto esta en la nube de EE.UU. y pasas LANGFUSE_BASE_URL (el nombre
    // que parece correcto), el exporter no la ve, se va al default de Europa
    // con claves de EE.UU. y los traces NO LLEGAN. Sin error visible.
    // Aqui se pasa explicito y se aceptan los dos nombres.
    const baseUrl =
      process.env.LANGFUSE_BASEURL ??
      process.env.LANGFUSE_BASE_URL ??
      "https://cloud.langfuse.com";

    registerOTel({
      serviceName: "copiloto-neuronbank",
      traceExporter: new LangfuseExporter({
        baseUrl,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        // LANGFUSE_DEBUG=true imprime en la consola cada lote que se manda.
        // Util en clase para demostrar que los spans salen de verdad.
        debug: process.env.LANGFUSE_DEBUG === "true",
      }),
    });
  }
}
