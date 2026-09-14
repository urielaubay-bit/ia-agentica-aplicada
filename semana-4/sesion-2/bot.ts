import "dotenv/config";
import { Telegraf } from "telegraf";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { ingest, retrieve } from "./rag.ts";

await ingest("docs");
const bot = new Telegraf(process.env.BOT_TOKEN!);
const ALLOW = (process.env.ALLOWED_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

bot.on("text", async (ctx) => {
  const uid = String(ctx.from.id);
  // Guardrail CAaaS: solo usuarios autorizados (allowlist). Vacio = abierto (demo).
  if (ALLOW.length && !ALLOW.includes(uid)) {
    await ctx.reply("No estas autorizado para usar este asistente.");
    return;
  }
  await ctx.sendChatAction("typing");
  const contexto = await retrieve(ctx.message.text, 3);
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    system:
      "Eres el asistente de la empresa. Responde SOLO con base en el contexto. Si no esta en el contexto, dilo con honestidad. Se breve y claro.\n<contexto>\n" +
      contexto + "\n</contexto>",
    prompt: ctx.message.text,
  });
  await ctx.reply(text);
});

bot.launch();
console.log("Bot corriendo. Escribele en Telegram.");
process.once("SIGINT", () => bot.stop("SIGINT"));
