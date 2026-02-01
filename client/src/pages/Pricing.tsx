import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, AlertCircle, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { STRIPE_PLANS } from "@shared/stripe-plans";
import { DowngradeWarningDialog } from "@/components/DowngradeWarningDialog";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { toast } from "sonner";

const PLAN_ORDER = ["free", "starter", "professional", "enterprise"];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { validateDowngrade } = usePlanValidation();
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<string>("");
  const [downgradeValidation, setDowngradeValidation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = (user?.plan ?? 'free') as string;
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      const target = planId === "free" ? "/pricing" : `/checkout/${planId}`;
      navigate(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    // Se é o plano atual, não fazer nada
    if (planId === currentPlan) {
      toast.info("Você já está usando este plano");
      return;
    }

    const selectedPlanIndex = PLAN_ORDER.indexOf(planId);

    // Se é upgrade
    if (selectedPlanIndex > currentPlanIndex) {
      if (planId === "free") {
        navigate("/leads");
      } else {
        navigate(`/checkout/${planId}`);
      }
      return;
    }

    // Se é downgrade - validar
    const stats = {
      leadsCount: 0, // Será preenchido com dados reais
      automationsCount: 0,
      teamMembersCount: 1,
    };

    const validation = validateDowngrade(currentPlan as any, planId as any, stats);
    setSelectedDowngradePlan(planId);
    setDowngradeValidation(validation);
    setShowDowngradeWarning(true);
  };

  const handleConfirmDowngrade = async () => {
    setIsLoading(true);
    try {
      // Chamar API para fazer downgrade
      const response = await fetch("/api/checkout/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId: selectedDowngradePlan }),
      });

      if (response.ok) {
        toast.success("Plano atualizado com sucesso!");
        setShowDowngradeWarning(false);
        // Recarregar página para atualizar dados
        window.location.reload();
      } else {
        toast.error("Erro ao atualizar plano");
      }
    } catch (error) {
      toast.error("Erro ao processar downgrade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Header – barra com altura fixa (h-16); logo maior, ultrapassa a barra sem aumentar sua altura */}
      <header className="relative border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center h-16">
            <img src="/chatlead-pro-logo.png" alt="ChatLead Pro" width={144} height={144} className="h-[7.5rem] w-auto object-contain object-left sm:h-36" />
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800" onClick={() => navigate("/leads")}>
                  Meus Leads
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white" onClick={() => navigate("/settings")}>
                  Configurações
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800" onClick={() => navigate("/")}>
                  Home
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white" onClick={() => navigate("/login")}>Entrar</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 px-6 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300">
          <Zap className="w-4 h-4 mr-2" />
          Planos Flexíveis
        </Badge>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Preços Simples e
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
            Transparentes
          </span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Escolha o plano perfeito para sua imobiliária. Sem taxas ocultas, sem surpresas. Cancele quando quiser.
        </p>

        {/* Current Plan Badge */}
        {isAuthenticated && (
          <div className="mt-8 flex justify-center">
            <Badge className="bg-green-500/20 border-green-500/30 text-green-300 px-4 py-2">
              <Check className="w-4 h-4 mr-2" />
              Plano Atual: <span className="font-semibold capitalize ml-1">{currentPlan}</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="relative max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
            const planId = key.toLowerCase();
            const isCurrentPlan = planId === currentPlan;
            const isUpgrade = PLAN_ORDER.indexOf(planId) > currentPlanIndex;
            const isDowngrade = PLAN_ORDER.indexOf(planId) < currentPlanIndex;

            return (
              <Card
                key={planId}
                className={`relative flex flex-col transition-all ${
                  isCurrentPlan
                    ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                    : "bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Seu Plano
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                      {plan.priceId ? `R$ ${plan.id === 'starter' ? '29' : plan.id === 'professional' ? '99' : '299'}/mês` : 'Grátis'}
                    </div>
                    <p className="text-sm text-slate-400">{plan.priceId ? 'Cobrado mensalmente' : 'Sempre grátis'}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button
                    onClick={() => handleSelectPlan(planId)}
                    className={`w-full ${
                      isCurrentPlan
                        ? "bg-slate-700 hover:bg-slate-600 text-white cursor-default"
                        : isUpgrade
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        : isDowngrade
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Seu Plano Atual
                      </>
                    ) : isUpgrade ? (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Fazer Upgrade
                      </>
                    ) : isDowngrade ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Fazer Downgrade
                      </>
                    ) : (
                      "Escolher Plano"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Downgrade Warning Dialog */}
      {downgradeValidation && (
        <DowngradeWarningDialog
          isOpen={showDowngradeWarning}
          currentPlan={currentPlan}
          targetPlan={selectedDowngradePlan}
          validation={downgradeValidation}
          onConfirm={handleConfirmDowngrade}
          onCancel={() => setShowDowngradeWarning(false)}
          isLoading={isLoading}
        />
      )}

      {/* FAQ Section */}
      <div className="relative max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Posso mudar de plano a qualquer momento?",
              a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor imediatamente.",
            },
            {
              q: "O que acontece se eu fizer downgrade?",
              a: "Se você tiver mais recursos do que o novo plano permite, será solicitado que você remova o excesso antes de confirmar o downgrade.",
            },
            {
              q: "Há taxa de cancelamento?",
              a: "Não! Você pode cancelar sua assinatura a qualquer momento sem penalidades.",
            },
            {
              q: "Posso voltar para o plano Gratis?",
              a: "Sim, mas você precisará remover qualquer recurso que exceda os limites do plano Gratis.",
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-slate-400 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
