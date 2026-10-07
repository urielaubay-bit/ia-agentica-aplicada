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
  - SMTP_*       : integración de correo (tool enviar_reporte_por_correo).
                   Por defecto apunta al buzón de prueba Mailpit (sin credenciales).
"""
from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage

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

# Integración de correo. Por defecto apunta a Mailpit (buzón de prueba en Docker,
# host 'mailpit', puerto 1025, sin credenciales). Para correo real, apunta estas
# variables a tu proveedor en .env (ej Gmail: smtp.gmail.com:587 con USER/PASS).
SMTP_HOST = os.environ.get("SMTP_HOST", "mailpit")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "1025"))
SMTP_USER = os.environ.get("SMTP_USER") or None
SMTP_PASS = os.environ.get("SMTP_PASS") or None
SMTP_FROM = os.environ.get("SMTP_FROM", "reportes@neuronbank.mx")


def resolve_cuenta(pedida: str) -> str:
    return ROL_CUENTA if ROL_CUENTA else pedida


def query(sql: str, params: tuple) -> list[dict]:
    """SELECT parametrizado (nada de SQL concatenado). Solo lectura."""
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            return cur.fetchall()


def cuenta_existe(cuenta: str) -> bool:
    """¿La cuenta está dada de alta en NeuronBank? (tabla cuentas)."""
    return bool(query("SELECT 1 FROM cuentas WHERE cuenta = %s", (cuenta,)))


def cuenta_tiene_movimientos(cuenta: str, mes: str | None = None) -> bool:
    """¿La cuenta tiene al menos un movimiento (opcionalmente en ese mes)?"""
    if mes:
        rows = query(
            "SELECT 1 FROM movimientos WHERE cuenta = %s AND mes = %s LIMIT 1",
            (cuenta, mes),
        )
    else:
        rows = query("SELECT 1 FROM movimientos WHERE cuenta = %s LIMIT 1", (cuenta,))
    return bool(rows)


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


def _reporte_texto(cuenta: str, mes: str | None) -> str:
    """Arma el cuerpo del reporte de saldo reutilizando los mismos SELECT que las
    otras tools (una sola fuente de verdad: Postgres). Solo lectura."""
    saldo = query("SELECT COALESCE(SUM(monto), 0) AS saldo FROM movimientos WHERE cuenta = %s", (cuenta,))[0]["saldo"]
    if mes:
        movs = query(
            "SELECT fecha, tipo, monto, descripcion FROM movimientos "
            "WHERE cuenta = %s AND mes = %s ORDER BY fecha",
            (cuenta, mes),
        )
    else:
        movs = query(
            "SELECT fecha, tipo, monto, descripcion FROM movimientos "
            "WHERE cuenta = %s ORDER BY fecha",
            (cuenta,),
        )
    periodo = f" · mes {mes}" if mes else ""
    lineas = [f"Reporte de NeuronBank — cuenta {cuenta}{periodo}", ""]
    lineas.append(f"Saldo total: {saldo}")
    lineas.append("")
    lineas.append(f"Movimientos ({len(movs)}):")
    for m in movs:
        fecha = m["fecha"].isoformat() if m.get("fecha") is not None else "?"
        lineas.append(f"  {fecha}  {m['tipo']:<9} {m['monto']:>8}  {m.get('descripcion') or ''}")
    return "\n".join(lineas)


@mcp.tool
def enviar_reporte_por_correo(cuenta: str, destinatario: str, mes: str | None = None) -> dict:
    """Envía por correo el reporte de saldo y movimientos de una cuenta de NeuronBank.
    Integración SMTP: por defecto entrega al buzón de prueba Mailpit (sin credenciales);
    con variables SMTP_* en .env entrega a un proveedor real. Respeta el scoping por rol. No envies correo si la cuenta no existe en base de datos. y da un mensaje de error si no se puede enviar el correo."""
    c = resolve_cuenta(cuenta)

    # Guardrail en el server (no en el prompt): no mandamos correos de cuentas
    # inexistentes o sin movimientos. El agente no se puede saltar esto.
    if not cuenta_existe(c):
        return {
            "cuenta": c,
            "destinatario": destinatario,
            "enviado": False,
            "razon": f"La cuenta {c} no existe en NeuronBank.",
        }
    if not cuenta_tiene_movimientos(c, mes):
        periodo = f" en el mes {mes}" if mes else ""
        return {
            "cuenta": c,
            "destinatario": destinatario,
            "enviado": False,
            "razon": f"La cuenta {c} no tiene movimientos{periodo}; no hay nada que reportar.",
        }

    cuerpo = _reporte_texto(c, mes)

    msg = EmailMessage()
    periodo = f" ({mes})" if mes else ""
    msg["Subject"] = f"Reporte de saldo — {c}{periodo}"
    msg["From"] = SMTP_FROM
    msg["To"] = destinatario
    msg.set_content(cuerpo)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
        # Con credenciales (proveedor real) negociamos TLS y autenticamos.
        # Mailpit no pide nada: sin USER/PASS, enviamos tal cual.
        if SMTP_USER and SMTP_PASS:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)

    return {
        "cuenta": c,
        "destinatario": destinatario,
        "enviado": True,
        "via": f"{SMTP_HOST}:{SMTP_PORT}",
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    # HTTP (streamable) para que un cliente remoto (el agente) lo alcance en /mcp.
    mcp.run(transport="http", host="0.0.0.0", port=port)
