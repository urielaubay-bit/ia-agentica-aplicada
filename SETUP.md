# Setup del curso · Checklist (Windows y Mac/Linux)

Hazlo **una sola vez, antes del primer día**. Al terminar, correr cualquier lab será solo `npm install` y `npx tsx archivo.ts`, sin archivos `.env`.

Tiempo: ~10 minutos.

---

## 1. Instala Node.js 20 o superior

- **Windows:** descarga el instalador LTS de https://nodejs.org y ejecútalo (Next, Next, Finish).
- **Mac:** descarga de https://nodejs.org, o `brew install node`.
- **Linux:** usa [nvm](https://github.com/nvm-sh/nvm) (`nvm install 20`) o el paquete de tu distro.

**Verifica** (en una terminal):
```
node -v
```
Debe imprimir `v20.x` o mayor. Si dice `v18` o menos, actualiza.

## 2. Instala un editor

**VS Code:** https://code.visualstudio.com (recomendado). Trae una terminal integrada que usarás en clase.

## 3. Consigue tu API key de Anthropic

Entra a https://console.anthropic.com, crea una **API key** y cópiala (empieza con `sk-ant-...`). Guárdala; se muestra una sola vez.

## 4. Configura la API key en tu sistema (una vez)

Así **no necesitas un `.env` en cada carpeta**: todos los scripts la leen de tu entorno.

### Windows (PowerShell o CMD)
```powershell
setx ANTHROPIC_API_KEY "sk-ant-..."
```
Importante: `setx` **solo aplica a terminales nuevas**. **Cierra y abre** tu terminal (o reinicia VS Code) después de correrlo.

### Mac / Linux
```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc
source ~/.bashrc
```
(Si usas zsh, cambia `~/.bashrc` por `~/.zshrc`. En Windows con Git Bash o WSL, usa esta misma opción.)

## 5. Verifica que la variable quedó configurada

Abre una terminal **nueva** y corre:

- **Windows (PowerShell):** `echo $env:ANTHROPIC_API_KEY`
- **Windows (CMD):** `echo %ANTHROPIC_API_KEY%`
- **Mac / Linux:** `echo $ANTHROPIC_API_KEY`

Debe imprimir tu key (`sk-ant-...`). Si sale vacío, repite el paso 4 y **abre una terminal nueva**.

## 6. Clona el repositorio del curso

```bash
git clone https://github.com/urielaubay-bit/ia-agentica-aplicada.git
cd ia-agentica-aplicada
```
(Si no tienes git: instálalo de https://git-scm.com, o descarga el ZIP desde el botón verde "Code" en GitHub.)

## 7. Prueba que todo funciona (tu primer agente)

```bash
cd semana-1/sesion-1
npm install
npx tsx paso3.ts
```

**Resultado esperado:** algo como
```
Pasos: 2
... una respuesta que incluye 5446 y 6446 ...
```
Si ves eso, estás listo para el curso. 🎉

---

## Si algo falla

| Síntoma | Causa | Solución |
|---|---|---|
| `ANTHROPIC_API_KEY is not set` (o `... is missing`) | La variable no está en esta terminal | Repite el paso 4 y **abre una terminal nueva** (en Windows `setx` no aplica a la terminal actual). |
| `node: command not found` / `no se reconoce node` | Node no instalado o terminal vieja | Instala Node (paso 1) y abre una terminal nueva. |
| `node -v` muestra v18 o menos | Versión vieja | Actualiza a Node 20+. |
| `npx` pregunta si instalar `tsx` la primera vez | Normal | Acepta (`y`); solo pasa una vez. |
| La primera corrida tarda | Descarga dependencias | Espera; las siguientes son rápidas. |
| Semana 4: `BOT_TOKEN is not set` | Falta el token del bot | Windows `setx BOT_TOKEN "..."` (abre terminal nueva); Mac/Linux `export BOT_TOKEN=...`. |

## Checklist final

- [ ] `node -v` dice v20 o mayor
- [ ] VS Code instalado
- [ ] API key configurada (paso 4) y verificada (paso 5)
- [ ] Repo clonado
- [ ] `npx tsx paso3.ts` imprime 5446 / 6446

Cualquier duda antes del día 1, escribe al instructor.
