import { customFetch } from "@/lib/api-client";

export interface SubscriptionStatus {
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

export interface PriceRow {
  product_id: string;
  product_name: string;
  product_description: string | null;
  price_id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  trial_period_days: number | null;
}

export interface PriceResponse {
  data: PriceRow[];
  trial_period_days: number | null;
}

export async function apiGetSubscriptionStatus(): Promise<SubscriptionStatus> {
  return customFetch<SubscriptionStatus>("/api/subscription/status");
}

export async function apiGetSubscriptionPrice(): Promise<PriceResponse> {
  const res = await customFetch<PriceResponse>("/api/subscription/price");
  return { data: res.data ?? [], trial_period_days: res.trial_period_days ?? null };
}

export async function apiCreateCheckoutSession(priceId: string): Promise<string> {
  const res = await customFetch<{ url: string }>("/api/subscription/checkout", {
    method: "POST",
    body: JSON.stringify({ priceId }),
    headers: { "Content-Type": "application/json" },
  });
  return res.url;
}

export async function apiCreatePortalSession(): Promise<string> {
  const res = await customFetch<{ url: string }>("/api/subscription/portal", {
    method: "POST",
  });
  return res.url;
}
