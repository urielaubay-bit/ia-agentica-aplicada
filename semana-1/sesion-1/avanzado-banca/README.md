# Ejemplo avanzado · Asistente de banca (NeuronBank)

Mismo stack del día 1 (AI SDK + Zod), pero en un caso de negocio real. Refuerza los conceptos del loop agéntico con algo que se parece a producción.

**Qué demuestra (más allá de `paso3`):**
- **Varias tools tipadas:** `consultarSaldo`, `listarMovimientos`, `validarTransferencia`.
- **El loop encadenando tools:** el agente consulta saldo, lista movimientos y valida la transferencia en un solo loop.
- **Guardrail de negocio forzado en código:** el modelo NUNCA autoriza una transferencia por su cuenta; `validarTransferencia` aplica fondos, límite diario y una regla anti-fraude, y el modelo debe respetar el resultado.
- **Structured output:** un `resumenBancario` validado con Zod, listo para una UI o un CRM.

## Correr
```bash
npm install
npx tsx banca.ts
```

## Resultado esperado
- El agente responde el saldo (18,450) y los últimos movimientos de CU-1001.
- Valida la transferencia de 15,000 a CU-1002: **permitida** (hay fondos y está dentro del límite de 20,000), pero **requiere confirmación** por ser un monto alto y redondo. El agente NO la ejecuta: solo informa.
- Al final imprime un JSON `resumenBancario` con `alertas` y `accionesSugeridas`.

## El patrón que se repite en NeuronBank
La misma estructura sostiene todo el agente de NeuronBank: tools de solo lectura + una tool de validación que impone las reglas de negocio en código + un resumen estructurado. El guardrail en código, no en el prompt, es lo que lo hace confiable — y es justo lo que endureces en la Semana 3 (MCP + guardrails) y llevas a producción en la Semana 5.
