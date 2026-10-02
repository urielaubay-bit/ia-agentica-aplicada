// Portfolio report: build it from NeuronBank data, and send it by email.
// Transport is swappable: real SMTP if SMTP_* env vars are set, otherwise a
// nodemailer Ethereal test account (no credentials, returns a preview URL).

import Database from "better-sqlite3";
import nodemailer from "nodemailer";

const db = new Database("banco.db");

export interface Reporte {
  cuenta: string;
  saldo: number;
  porTipo: { tipo: string; total: number; n: number }[];
  movimientos: { tipo: string; monto: number; mes: string }[];
  subject: string;
  html: string;
  text: string;
}

const money = (n: number) => `$${n.toLocaleString("es-MX")}`;

export function buildReporte(cuenta: string): Reporte {
  const saldoRow = db
    .prepare("SELECT COALESCE(SUM(monto),0) AS saldo FROM movimientos WHERE cuenta=?")
    .get(cuenta) as { saldo: number };
  const porTipo = db
    .prepare(
      "SELECT tipo, SUM(monto) AS total, COUNT(*) AS n FROM movimientos WHERE cuenta=? GROUP BY tipo ORDER BY tipo",
    )
    .all(cuenta) as { tipo: string; total: number; n: number }[];
  const movimientos = db
    .prepare("SELECT tipo, monto, mes FROM movimientos WHERE cuenta=? ORDER BY mes DESC")
    .all(cuenta) as { tipo: string; monto: number; mes: string }[];

  const saldo = saldoRow.saldo;
  const subject = `Reporte de portafolio NeuronBank — ${cuenta} (${money(saldo)})`;

  const filas = movimientos
    .map(
      (m) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${m.mes}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee">${m.tipo}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:${m.monto < 0 ? "#b00020" : "#0b7a3b"}">${money(m.monto)}</td></tr>`,
    )
    .join("");
  const resumen = porTipo
    .map((t) => `<li><b>${t.tipo}</b>: ${money(t.total)} (${t.n})</li>`)
    .join("");

  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0b3a52;max-width:560px">
    <h2 style="margin:0 0 4px">NeuronBank — Reporte de portafolio</h2>
    <p style="margin:0 0 16px;color:#567">Cuenta <b>${cuenta}</b></p>
    <div style="background:#eef6fb;border-radius:8px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:13px;color:#567">Saldo actual</div>
      <div style="font-size:26px;font-weight:700">${money(saldo)}</div>
    </div>
    <h3 style="margin:0 0 6px">Resumen por tipo</h3>
    <ul style="margin:0 0 16px">${resumen}</ul>
    <h3 style="margin:0 0 6px">Movimientos</h3>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #0b3a52">Mes</th>
          <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #0b3a52">Tipo</th>
          <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #0b3a52">Monto</th></tr>
      ${filas}
    </table>
    <p style="margin-top:20px;font-size:12px;color:#8aa">Generado automáticamente por el MCP de NeuronBank. Solo lectura.</p>
  </body></html>`;

  const text =
    `NeuronBank — Reporte de portafolio\nCuenta ${cuenta}\nSaldo: ${money(saldo)}\n\n` +
    `Resumen por tipo:\n` +
    porTipo.map((t) => `  - ${t.tipo}: ${money(t.total)} (${t.n})`).join("\n") +
    `\n\nMovimientos:\n` +
    movimientos.map((m) => `  ${m.mes}  ${m.tipo}  ${money(m.monto)}`).join("\n");

  return { cuenta, saldo, porTipo, movimientos, subject, html, text };
}

async function makeTransport() {
  // Real SMTP if configured (Gmail, SES SMTP, Resend SMTP, ...).
  if (process.env.SMTP_HOST) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      }),
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "neuronbank@example.com",
      ethereal: false,
    };
  }
  // Otherwise: a zero-setup Ethereal test account (real send, preview URL, no delivery).
  const acc = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: acc.user, pass: acc.pass },
    }),
    from: "NeuronBank <reportes@neuronbank.test>",
    ethereal: true,
  };
}

// Which transport to use. Explicit EMAIL_TRANSPORT wins; otherwise inferred.
function pickMode(): "ses" | "smtp" | "ethereal" {
  const t = process.env.EMAIL_TRANSPORT?.toLowerCase();
  if (t === "ses" || t === "smtp" || t === "ethereal") return t;
  if (process.env.SES_FROM || process.env.EMAIL_TRANSPORT === "ses") return "ses";
  if (process.env.SMTP_HOST) return "smtp";
  return "ethereal";
}

// Real delivery via Amazon SES using the AWS SDK + IAM (no SMTP credentials).
// Credentials come from the default AWS chain (env vars, shared profile, or role).
// The `from` must be an SES-verified identity; SES_FROM overrides the default.
async function sendViaSES(r: Reporte, email: string) {
  const region = process.env.AWS_REGION ?? "us-east-1";
  const from = process.env.SES_FROM ?? "NeuronBank <contact@neuronprocess.com>";
  // Lazy import so Ethereal/SMTP users don't need the AWS SDK installed.
  const { SESv2Client, SendEmailCommand } = await import("@aws-sdk/client-sesv2");
  const client = new SESv2Client({ region });
  const out = await client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [email] },
      Content: {
        Simple: {
          Subject: { Data: r.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: r.html, Charset: "UTF-8" },
            Text: { Data: r.text, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
  return {
    ok: true,
    cuenta: r.cuenta,
    to: email,
    saldo: r.saldo,
    messageId: out.MessageId,
    previewUrl: null,
    mode: `ses (${region})`,
  };
}

export async function enviarReporte(cuenta: string, email: string) {
  const r = buildReporte(cuenta);
  if (pickMode() === "ses") return sendViaSES(r, email);

  // nodemailer path: real SMTP if SMTP_HOST is set, otherwise Ethereal.
  const { transporter, from, ethereal } = await makeTransport();
  const info = await transporter.sendMail({
    from,
    to: email,
    subject: r.subject,
    text: r.text,
    html: r.html,
  });
  return {
    ok: true,
    cuenta,
    to: email,
    saldo: r.saldo,
    messageId: info.messageId,
    // Ethereal gives a URL to view the rendered email (no real delivery).
    previewUrl: ethereal ? nodemailer.getTestMessageUrl(info) : null,
    mode: ethereal ? "ethereal (demo)" : "smtp",
  };
}
