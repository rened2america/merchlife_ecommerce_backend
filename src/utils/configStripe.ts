import Stripe from "stripe";

export const connectionStripe = () => {
  //@ts-ignore
  return new Stripe(process.env.STRIPE_KEY, {
    //@ts-ignore
    apiVersion: process.env.STRIPE_API_VERSION,
  });
};
