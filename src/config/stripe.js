import Stripe from "stripe";

let instancia = null;

export function getStripe() {
  const chave = process.env.STRIPE_SECRET_KEY?.trim();
  if (!chave) return null;

  if (!instancia) {
    instancia = new Stripe(chave);
  }
  return instancia;
}
