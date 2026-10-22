import { limpiarTrazas, listarTrazas, resumen } from "../../lib/trazas";
import { por1000 } from "../../lib/precios";

// Endpoint que alimenta el panel de observabilidad. Lo que en produccion seria
// la API de tu servicio de trazas, aqui son 20 lineas sobre un arreglo.
export const dynamic = "force-dynamic";

export async function GET() {
  const trazas = listarTrazas();
  const r = resumen(trazas);
  return Response.json({
    trazas,
    resumen: {
      ...r,
      ahorroCacheUsd: r.costoSinCacheUsd - r.costoUsd,
      por1000Usd: por1000(r.costoUsd, r.turnos),
    },
    langsmith: process.env.LANGSMITH_TRACING === "true" && !!process.env.LANGSMITH_API_KEY,
    proyecto: process.env.LANGSMITH_PROJECT ?? "default",
  });
}

export async function DELETE() {
  limpiarTrazas();
  return Response.json({ ok: true });
}
