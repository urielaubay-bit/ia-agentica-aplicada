# Semana 3 · Sesión 1 · Tu primer MCP server

**30 min teoría + 90 min práctica.** Externalizas las tools de NeuronBank a un MCP server.

## Instalar
```bash
npm install
npx tsx seed.ts        # crea banco.db
```

## Probar con el inspector
```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```
> Abre el enlace con el token que imprime la terminal (`http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=...`). En la pestaña **Tools** → **List Tools**, elige la tool, llena los campos y pulsa **Run Tool**. Para clase puedes evitar el token con `DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector npx tsx server.ts`.

Invoca `movimientosPorCuenta({ cuenta: "CU-1001", mes: "2026-09" })` y observa las filas.

## Ejercicio: tu segunda tool (`saldoCuenta`)

Usando `movimientosPorCuenta` como modelo, agrega una tool `saldoCuenta` que reciba `{ cuenta }` y devuelva el **saldo** (la suma de los montos de esa cuenta). Hay un scaffold comentado al final de `server.ts`.

Pruébala en el inspector con `{ cuenta: "CU-1001" }`.
**Resultado esperado:** el saldo de CU-1001, `25950` con los datos del seed.

<details>
<summary>Solución (instructor)</summary>

```ts
server.tool(
  "saldoCuenta",
  "Devuelve el saldo (suma de montos) de una cuenta de NeuronBank. Solo lectura.",
  { cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'.") },
  async ({ cuenta }) => {
    const row = db.prepare("SELECT SUM(monto) AS saldo FROM movimientos WHERE cuenta=?").get(cuenta);
    return { content: [{ type: "text", text: JSON.stringify(row) }] };
  },
);
```
</details>

En la Sesión 2 le agregamos guardrails.
