// Transporter de e-mail compartilhado (Gmail via nodemailer) — usado por
// lib/checkout-fulfillment.ts e lib/lembrete-dia10.ts. Extraído pra não
// duplicar a configuração de credenciais em cada lugar que manda e-mail.

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export function emailConfigurado(): boolean {
  return !!process.env.GMAIL_USER && !!process.env.GMAIL_PASS;
}
