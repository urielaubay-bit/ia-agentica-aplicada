'use client';
import { Fragment, useEffect, useState } from "react";

// Panel de observabilidad: lo que tienes que poder ver en produccion.
// Tokens (incluido cache), latencia, costo, tools por turno y los fallos.
// Hace polling cada 2 s: suficiente para una clase y una linea de codigo. En
// produccion esto es un push o una query al servicio de trazas.

type Tokens = { entrada: number; salida: number; cacheLeido: number; cacheEscrito: number };
type Llamada = {
  etapa: string;
  modelo: string;
  tokens: Tokens;
  latenciaMs: number;
  costoUsd: number;
  costoSinCacheUsd: number;
  tools: string[];
  pasos: number;
};
type Traza = {
  id: string;
  ts: number;
  pregunta: string;
  llamadas: Llamada[];
  totalMs: number;
  enCurso: boolean;
  error?: string;
  decision?: string;
};
type Datos = {
  trazas: Traza[];
  resumen: {
    turnos: number;
    costoUsd: number;
    costoSinCacheUsd: number;
    ahorroCacheUsd: number;
    por1000Usd: number;
    tokensEntrada: number;
    tokensSalida: number;
    cacheLeido: number;
    cacheEscrito: number;
    latenciaP50: number;
    errores: number;
  };
  langsmith: boolean;
  proyecto: string;
};

const USD_MXN = 18.5;
const usd = (n: number) => `$${n.toFixed(4)}`;
const num = (n: number) => n.toLocaleString("es-MX");
const hora = (ts: number) =>
  new Date(ts).toLocaleTimeString("es-MX", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function ObservabilidadPanel() {
  const [d, setDatos] = useState<Datos | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const traer = async () => {
      try {
        const r = await fetch("/api/trazas", { cache: "no-store" });
        if (vivo) setDatos(await r.json());
      } catch {
        /* el panel nunca tumba la app */
      }
    };
    traer();
    const id = setInterval(traer, 2000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  if (!d) return null;
  const { resumen: r } = d;
  const ahorroPct = r.costoSinCacheUsd > 0 ? (r.ahorroCacheUsd / r.costoSinCacheUsd) * 100 : 0;

  const limpiar = async () => {
    await fetch("/api/trazas", { method: "DELETE" });
    setDatos({ ...d, trazas: [], resumen: { ...r, turnos: 0, costoUsd: 0, costoSinCacheUsd: 0, ahorroCacheUsd: 0, por1000Usd: 0, tokensEntrada: 0, tokensSalida: 0, cacheLeido: 0, cacheEscrito: 0, latenciaP50: 0, errores: 0 } });
  };

  return (
    <section className="card obs">
      <div className="card-head">
        <span className="card-title">
          Observabilidad y costo
          <span className={`badge ${d.langsmith ? "ok" : "warn"}`}>
            {d.langsmith ? `LangSmith · ${d.proyecto}` : "LangSmith apagado"}
          </span>
        </span>
        <button className="link-btn" onClick={limpiar} disabled={r.turnos === 0}>
          Reiniciar medicion
        </button>
      </div>

      {r.turnos === 0 ? (
        <p className="card-sub" style={{ margin: 0 }}>
          Preguntale algo al copiloto y cada turno aparece aqui con sus tokens, su latencia y su costo.
        </p>
      ) : (
        <>
          <div className="kpis kpis-wide">
            <div className="kpi">
              <div className="k-label">Costo acumulado</div>
              <div className="k-value">{usd(r.costoUsd)}</div>
              <div className="k-delta flat">
                {r.turnos} turno{r.turnos === 1 ? "" : "s"} · ${(r.costoUsd * USD_MXN).toFixed(2)} MXN
              </div>
            </div>
            <div className="kpi">
              <div className="k-label">Costo por 1,000 consultas</div>
              <div className="k-value">{usd(r.por1000Usd)}</div>
              <div className="k-delta flat">${(r.por1000Usd * USD_MXN).toFixed(2)} MXN · la cifra que cotizas</div>
            </div>
            <div className="kpi">
              <div className="k-label">Ahorro por cache</div>
              <div className={`k-value ${r.ahorroCacheUsd > 0 ? "up" : ""}`}>{ahorroPct.toFixed(0)}%</div>
              <div className="k-delta flat">
                {num(r.cacheLeido)} leidos · {num(r.cacheEscrito)} escritos
              </div>
            </div>
            <div className="kpi">
              <div className="k-label">Latencia p50</div>
              <div className="k-value">{(r.latenciaP50 / 1000).toFixed(1)}s</div>
              <div className={`k-delta ${r.errores ? "down" : "flat"}`}>
                {r.errores ? `${r.errores} con error` : "sin errores"}
              </div>
            </div>
          </div>

          <table className="mov obs-tabla">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Turno</th>
                <th>Modelo</th>
                <th>Tools</th>
                <th className="amount">Tokens</th>
                <th className="amount">Cache</th>
                <th className="amount">Latencia</th>
                <th className="amount">Costo</th>
              </tr>
            </thead>
            <tbody>
              {d.trazas.map((t) => {
                const copiloto = t.llamadas.find((l) => l.etapa === "copiloto");
                const tokens = t.llamadas.reduce((a, l) => a + l.tokens.entrada + l.tokens.salida, 0);
                const cache = t.llamadas.reduce((a, l) => a + l.tokens.cacheLeido, 0);
                const costo = t.llamadas.reduce((a, l) => a + l.costoUsd, 0);
                const tools = copiloto?.tools ?? [];
                return (
                  <Fragment key={t.id}>
                    <tr className={t.error ? "flag" : undefined} onClick={() => setAbierta(abierta === t.id ? null : t.id)} style={{ cursor: "pointer" }}>
                      <td className="card-sub">{hora(t.ts)}</td>
                      <td title={t.pregunta}>{t.pregunta.slice(0, 32) || "(sin texto)"}</td>
                      <td className="card-sub">{(copiloto?.modelo ?? "").replace("claude-", "")}</td>
                      <td className="card-sub">{tools.length ? tools.join(", ") : "-"}</td>
                      <td className="amount">{num(tokens)}</td>
                      <td className={`amount ${cache ? "up" : "flat"}`}>{cache ? num(cache) : "-"}</td>
                      <td className="amount">{t.enCurso ? "..." : `${(t.totalMs / 1000).toFixed(1)}s`}</td>
                      <td className="amount">{usd(costo)}</td>
                    </tr>
                    {abierta === t.id && (
                      <tr>
                        <td colSpan={8}>
                          <div className="obs-detalle">
                            {t.decision && <p className="card-sub">router: {t.decision}</p>}
                            {t.error && <p className="down">error: {t.error}</p>}
                            {t.llamadas.map((l, i) => (
                              <p key={i} className="card-sub tabular">
                                {l.etapa} · {l.modelo} · {l.pasos} paso{l.pasos === 1 ? "" : "s"} · in {num(l.tokens.entrada)} / out {num(l.tokens.salida)} / cache r {num(l.tokens.cacheLeido)} w {num(l.tokens.cacheEscrito)} · {l.latenciaMs} ms · {usd(l.costoUsd)} (sin cache {usd(l.costoSinCacheUsd)})
                              </p>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
