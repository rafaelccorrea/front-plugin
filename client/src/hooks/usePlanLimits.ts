import { useAuth } from "@/hooks/useAuth";

export type Plan = "free" | "starter" | "professional" | "enterprise";

export interface PlanLimits {
  maxLeads: number;
  maxAutomations: number;
  maxTeamMembers: number;
  hasAdvancedAnalytics: boolean;
  hasCustomBranding: boolean;
  hasPrioritySuppor: boolean;
  hasApiAccess: boolean;
  hasWhatsAppIntegration: boolean;
}

const planLimits: Record<Plan, PlanLimits> = {
  free: {
    maxLeads: 5,
    maxAutomations: 0,
    maxTeamMembers: 1,
    hasAdvancedAnalytics: false,
    hasCustomBranding: false,
    hasPrioritySuppor: false,
    hasApiAccess: false,
    hasWhatsAppIntegration: false,
  },
  starter: {
    maxLeads: 500,
    maxAutomations: 5,
    maxTeamMembers: 3,
    hasAdvancedAnalytics: false,
    hasCustomBranding: false,
    hasPrioritySuppor: false,
    hasApiAccess: true,
    hasWhatsAppIntegration: true,
  },
  professional: {
    maxLeads: 5000,
    maxAutomations: 50,
    maxTeamMembers: 10,
    hasAdvancedAnalytics: true,
    hasCustomBranding: true,
    hasPrioritySuppor: true,
    hasApiAccess: true,
    hasWhatsAppIntegration: true,
  },
  enterprise: {
    maxLeads: Infinity,
    maxAutomations: Infinity,
    maxTeamMembers: Infinity,
    hasAdvancedAnalytics: true,
    hasCustomBranding: true,
    hasPrioritySuppor: true,
    hasApiAccess: true,
    hasWhatsAppIntegration: true,
  },
};

export function usePlanLimits() {
  const { user } = useAuth();

  const plan = (user?.plan ?? 'free') as Plan;
  const limits = planLimits[plan];

  const canAddLead = (currentLeads: number) => {
    return currentLeads < limits.maxLeads;
  };

  const canAddAutomation = (currentAutomations: number) => {
    return currentAutomations < limits.maxAutomations;
  };

  const canAddTeamMember = (currentMembers: number) => {
    return currentMembers < limits.maxTeamMembers;
  };

  const getLeadsPercentage = (currentLeads: number) => {
    if (limits.maxLeads === Infinity) return 0;
    return (currentLeads / limits.maxLeads) * 100;
  };

  const getAutomationsPercentage = (currentAutomations: number) => {
    if (limits.maxAutomations === Infinity) return 0;
    return (currentAutomations / limits.maxAutomations) * 100;
  };

  return {
    plan,
    limits,
    canAddLead,
    canAddAutomation,
    canAddTeamMember,
    getLeadsPercentage,
    getAutomationsPercentage,
  };
}
