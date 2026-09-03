import React, { createContext, useContext } from "react";
import type { SubscriptionStatus } from "@/services/subscriptionApi";

interface SubscriptionContextValue {
  status: SubscriptionStatus["status"];
  isSubscribed: boolean;    // true when active or trialing
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// Open-access build: no accounts, no billing. Everyone is treated as
// subscribed so the paywall never appears.
const value: SubscriptionContextValue = {
  status: "active",
  isSubscribed: true,
  isLoading: false,
  refresh: async () => {},
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
