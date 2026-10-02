"""NeuronBank MCP server en Python con FastMCP, respaldado por Postgres.

Diferencias con las sesiones 1 y 2 (TypeScript + SQLite):
  - FastMCP (Python) en vez de @modelcontextprotocol/sdk (TS).
  - Postgres real (pool de conexiones) en vez de un archivo SQLite.
  - Transporte HTTP (no stdio): el servidor queda en una URL que un agente
    remoto (el agente TS de esta práctica) consume como cliente MCP.

Config por entorno (nunca en el código):
  - DATABASE_URL : cadena de conexión a Postgres.
  - CUENTA       : scoping por rol (igual que la sesión 2). Vacío = analista
                   (ve todo); con valor = cajero (forzado a esa cuenta).
  - PORT         : puerto HTTP (default 8000).
"""
from __future__ import annotations

import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from fastmcp import FastMCP
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://neuron:neuron@localhost:5432/neuronbank")

# Un pool de conexiones: patrón de producción (reusa conexiones, aguanta carga).
pool = ConnectionPool(conninfo=DATABASE_URL, min_size=1, max_size=5, open=True)

# Guardrail de scoping por rol, forzado en el server (no se salta desde el prompt).
ROL_CUENTA = os.environ.get("CUENTA") or None  # None = analista; valor = cajero


def resolve_cuenta(pedida: str) -> str:
    return ROL_CUENTA if ROL_CUENTA else pedida


def query(sql: str, params: tuple) -> list[dict]:
    """SELECT parametrizado (nada de SQL concatenado). Solo lectura."""
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            return cur.fetchall()


mcp = FastMCP("neuronbank-postgres")


@mcp.tool
def movimientos_por_cuenta(cuenta: str, mes: str | None = None) -> dict:
    """Movimientos de una cuenta de NeuronBank, opcionalmente filtrados por mes
    (ej '2026-09'). Solo lectura. Respeta el scoping por rol (CUENTA)."""
    c = resolve_cuenta(cuenta)
    if mes:
        rows = query(
            "SELECT fecha, tipo, monto, descripcion FROM movimientos "
            "WHERE cuenta = %s AND mes = %s ORDER BY fecha",
            (c, mes),
        )
    else:
        rows = query(
            "SELECT fecha, mes, tipo, monto, descripcion FROM movimientos "
            "WHERE cuenta = %s ORDER BY fecha",
            (c,),
        )
    # fecha es date -> serializar a texto
    for r in rows:
        if r.get("fecha") is not None:
            r["fecha"] = r["fecha"].isoformat()
    return {"cuenta": c, "movimientos": rows}


@mcp.tool
def saldo_cuenta(cuenta: str) -> dict:
    """Saldo (suma de montos) de una cuenta de NeuronBank. Solo lectura."""
    c = resolve_cuenta(cuenta)
    rows = query("SELECT COALESCE(SUM(monto), 0) AS saldo FROM movimientos WHERE cuenta = %s", (c,))
    return {"cuenta": c, "saldo": rows[0]["saldo"]}


@mcp.tool
def resumen_por_tipo(cuenta: str, mes: str | None = None) -> dict:
    """Totales agrupados por tipo (deposito/cargo/retiro) de una cuenta,
    opcionalmente por mes. Solo lectura."""
    c = resolve_cuenta(cuenta)
    if mes:
        rows = query(
            "SELECT tipo, SUM(monto) AS total, COUNT(*) AS n FROM movimientos "
            "WHERE cuenta = %s AND mes = %s GROUP BY tipo ORDER BY tipo",
            (c, mes),
        )
    else:
        rows = query(
            "SELECT tipo, SUM(monto) AS total, COUNT(*) AS n FROM movimientos "
            "WHERE cuenta = %s GROUP BY tipo ORDER BY tipo",
            (c,),
        )
    return {"cuenta": c, "por_tipo": rows}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    # HTTP (streamable) para que un cliente remoto (el agente) lo alcance en /mcp.
    mcp.run(transport="http", host="0.0.0.0", port=port)
