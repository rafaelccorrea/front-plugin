import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits, Plan } from "./usePlanLimits";

export interface DowngradeValidation {
  canDowngrade: boolean;
  warnings: string[];
  errors: string[];
  affectedResources: {
    leadsToDelete: number;
    automationsToDelete: number;
    teamMembersToRemove: number;
  };
}

const planHierarchy: Record<Plan, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function usePlanValidation() {
  const { user } = useAuth();
  const { limits } = usePlanLimits();

  const validateDowngrade = (
    currentPlan: Plan,
    targetPlan: Plan,
    currentStats: {
      leadsCount: number;
      automationsCount: number;
      teamMembersCount: number;
    }
  ): DowngradeValidation => {
    const validation: DowngradeValidation = {
      canDowngrade: true,
      warnings: [],
      errors: [],
      affectedResources: {
        leadsToDelete: 0,
        automationsToDelete: 0,
        teamMembersToRemove: 0,
      },
    };

    // Verificar se é realmente um downgrade
    if (planHierarchy[targetPlan] >= planHierarchy[currentPlan]) {
      return validation; // Não é downgrade
    }

    // Buscar limites do plano alvo
    const targetLimits = {
      free: { maxLeads: 5, maxAutomations: 0, maxTeamMembers: 1 },
      starter: { maxLeads: 500, maxAutomations: 5, maxTeamMembers: 3 },
      professional: { maxLeads: 5000, maxAutomations: 50, maxTeamMembers: 10 },
      enterprise: { maxLeads: Infinity, maxAutomations: Infinity, maxTeamMembers: Infinity },
    }[targetPlan];

    // Validar Leads
    if (currentStats.leadsCount > targetLimits.maxLeads) {
      const excess = currentStats.leadsCount - targetLimits.maxLeads;
      validation.errors.push(
        `Você tem ${excess} leads acima do limite do plano ${targetPlan}. Será necessário deletar ${excess} leads.`
      );
      validation.affectedResources.leadsToDelete = excess;
      validation.canDowngrade = false;
    } else if (currentStats.leadsCount > targetLimits.maxLeads * 0.8) {
      const percentage = Math.round((currentStats.leadsCount / targetLimits.maxLeads) * 100);
      validation.warnings.push(
        `Você está usando ${percentage}% do limite de leads do novo plano. Recomendamos arquivar alguns leads antes de fazer downgrade.`
      );
    }

    // Validar Automações
    if (currentStats.automationsCount > targetLimits.maxAutomations) {
      const excess = currentStats.automationsCount - targetLimits.maxAutomations;
      validation.errors.push(
        `Você tem ${excess} automações acima do limite do plano ${targetPlan}. Será necessário deletar ${excess} automações.`
      );
      validation.affectedResources.automationsToDelete = excess;
      validation.canDowngrade = false;
    } else if (currentStats.automationsCount > targetLimits.maxAutomations * 0.8 && targetLimits.maxAutomations > 0) {
      const percentage = Math.round((currentStats.automationsCount / targetLimits.maxAutomations) * 100);
      validation.warnings.push(
        `Você está usando ${percentage}% do limite de automações do novo plano.`
      );
    }

    // Validar Membros da Equipe
    if (currentStats.teamMembersCount > targetLimits.maxTeamMembers) {
      const excess = currentStats.teamMembersCount - targetLimits.maxTeamMembers;
      validation.errors.push(
        `Você tem ${excess} membros da equipe acima do limite do plano ${targetPlan}. Será necessário remover ${excess} membros.`
      );
      validation.affectedResources.teamMembersToRemove = excess;
      validation.canDowngrade = false;
    }

    // Avisos especiais por plano
    if (targetPlan === "free") {
      validation.warnings.push("O plano Gratis não inclui suporte prioritário ou integrações avançadas.");
      validation.warnings.push("Você perderá acesso à API Key e integração com WhatsApp.");
    }

    return validation;
  };

  const validateUpgrade = (currentPlan: Plan, targetPlan: Plan) => {
    // Upgrade é sempre permitido
    return {
      canUpgrade: true,
      benefits: [],
    };
  };

  return {
    validateDowngrade,
    validateUpgrade,
  };
}
