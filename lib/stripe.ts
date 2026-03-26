import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  // Não explode build em dev, mas as rotas vão retornar erro se tentar usar.
  console.warn("⚠️ STRIPE_SECRET_KEY não definido em .env.local");
}

export const stripe = new Stripe(key || "sk_test_missing", {
  apiVersion: "2025-02-24.acacia" as any,
});
