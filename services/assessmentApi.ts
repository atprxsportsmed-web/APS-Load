/**
 * Assessment API client — talks to the api-server backend.
 * Uses customFetch which automatically attaches the Clerk bearer token
 * (set up via setAuthTokenGetter in the root layout).
 */
import { customFetch } from "@/lib/api-client";
import type { Assessment } from "@/types/assessment";

const BASE = "/api/assessments";

export async function apiListAssessments(): Promise<Assessment[]> {
  return customFetch<Assessment[]>(BASE);
}

export async function apiUpsertAssessment(assessment: Assessment): Promise<void> {
  await customFetch(`${BASE}/${assessment.id}`, {
    method: "PUT",
    body: JSON.stringify(assessment),
    headers: { "Content-Type": "application/json" },
  });
}

export async function apiDeleteAssessment(id: string): Promise<void> {
  await customFetch(`${BASE}/${id}`, { method: "DELETE" });
}

export async function apiDeleteAllAssessments(): Promise<void> {
  await customFetch(BASE, { method: "DELETE" });
}
