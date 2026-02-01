import { useAuth } from "@/hooks/useAuth";

export type PlanId = "free" | "starter" | "professional" | "enterprise";

const PLAN_ORDER: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

function planOrder(plan: string): number {
  return PLAN_ORDER[plan as PlanId] ?? 0;
}

export function usePlanFeatures() {
  const { user } = useAuth();
  const plan = (user?.plan ?? "free") as PlanId;
  const order = planOrder(plan);
  const isPaid = order >= planOrder("starter");

  const canAccessAnalytics = order >= planOrder("starter");
  const canAccessAutomations = order >= planOrder("starter");
  const canAccessIntegrations = order >= planOrder("professional");
  const canAccessOpenClawAutomations = order >= planOrder("professional");

  const hasMinimumPlan = (minimum: PlanId) => order >= planOrder(minimum);

  return {
    plan,
    isPaid,
    canAccessAnalytics,
    canAccessAutomations,
    canAccessIntegrations,
    canAccessOpenClawAutomations,
    hasMinimumPlan,
  };
}
