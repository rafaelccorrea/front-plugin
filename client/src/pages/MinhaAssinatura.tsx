import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, LogOut, Receipt, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { STRIPE_PLANS } from "@shared/stripe-plans";
import { formatBRL } from "@/lib/utils";

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  past_due: {
    title: "Pagamento pendente",
    description:
      "Sua assinatura está com pagamento pendente. Atualize seu método de pagamento para reativar o acesso e sua API Key.",
  },
  canceled: {
    title: "Assinatura cancelada",
    description:
      "Sua assinatura foi cancelada. Escolha um plano para voltar a usar o ChatLead Pro.",
  },
  unpaid: {
    title: "Assinatura em atraso",
    description:
      "Há pagamentos em atraso. Regularize sua situação para reativar o acesso e sua API Key.",
  },
};

export default function MinhaAssinaturaPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <DashboardLayout>
        <MinhaAssinaturaContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function MinhaAssinaturaContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const { data: subscriptionData, isLoading: loadingSubscription } = trpc.billing.getSubscription.useQuery();
  const { data: usageData, isLoading: loadingUsage } = trpc.billing.getUsage.useQuery();

  const sub = subscriptionData?.data;
  const usage = usageData?.data;
  const status = (sub?.subscriptionStatus ?? user?.subscriptionStatus ?? "") as string;
  const isActive = status === "active";
  const message = STATUS_MESSAGES[status] ?? {
    title: "Assinatura indisponível",
    description:
      "Sua assinatura não está ativa. Escolha um plano ou regularize seu pagamento para continuar.",
  };

  const planId = (sub?.planId ?? user?.plan ?? "free") as string;
  const planKey = planId in STRIPE_PLANS ? (planId.toUpperCase() as keyof typeof STRIPE_PLANS) : "FREE";
  const planFromStripe = STRIPE_PLANS[planKey] ?? STRIPE_PLANS.FREE;
  const plan = sub
    ? {
        name: sub.planName,
        description: sub.planDescription,
        monthlyLeadsQuota: sub.monthlyLeadsQuota,
        monthlyApiCalls: sub.monthlyApiCalls,
        priceInCents: sub.priceInCents,
        features: sub.features ?? planFromStripe.features,
      }
    : {
        name: planFromStripe.name,
        description: planFromStripe.description,
        monthlyLeadsQuota: planFromStripe.monthlyLeadsQuota,
        monthlyApiCalls: planFromStripe.monthlyApiCalls,
        priceInCents: planFromStripe.price ?? 0,
        features: planFromStripe.features,
      };

  const createPortalMutation = trpc.checkout.createBillingPortalSession.useMutation({
    onSuccess: (result) => {
      if (result.data.url) window.location.href = result.data.url;
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(error.message || "Erro ao abrir portal de pagamento");
    },
  });

  const handleAbrirPortal = () => {
    setIsLoading(true);
    createPortalMutation.mutate({ returnUrl: `${window.location.origin}/minha-assinatura` });
  };

  const handleVerPlanos = () => setLocation("/pricing");

  const leadsUsed = usage?.leadsCreated ?? 0;
  const leadsQuota = usage?.leadsQuota ?? plan.monthlyLeadsQuota;
  const apiCallsUsed = usage?.apiCallsMade ?? 0;
  const apiCallsQuota = usage?.apiCallsQuota ?? plan.monthlyApiCalls;

  if (loadingSubscription) {
    return (
      <div className="w-full space-y-8 pb-12">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Minha Assinatura</h1>
              <p className="text-sm text-muted-foreground">Gerencie seu plano, pagamento e faturas.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-slate-800/50 lg:col-span-2" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Minha Assinatura</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu plano, pagamento e faturas.</p>
          </div>
        </div>
      </div>

      {isActive ? (
        /* Layout ativo: grid 2 colunas em lg */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card status + plano */}
          <Card className="border-slate-700/80 bg-card/60 shadow-lg lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Assinatura ativa</CardTitle>
                    <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-600/90 px-3 py-1 text-sm font-medium text-white">
                  {plan.priceInCents > 0 ? `${formatBRL(plan.priceInCents)}/mês` : "Grátis"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Leads no mês</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {leadsUsed.toLocaleString("pt-BR")}
                    <span className="text-sm font-normal text-slate-400">
                      /{plan.monthlyLeadsQuota === 999999 ? "∞" : leadsQuota.toLocaleString("pt-BR")}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Chamadas API</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {apiCallsUsed.toLocaleString("pt-BR")}
                    <span className="text-sm font-normal text-slate-400">/{apiCallsQuota.toLocaleString("pt-BR")}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Limite leads/mês</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {plan.monthlyLeadsQuota === 999999 ? "Ilimitado" : plan.monthlyLeadsQuota.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Plano</p>
                  <p className="mt-1 text-xl font-semibold text-white">{plan.name}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-primary hover:bg-primary/90"
                  size="lg"
                  onClick={handleAbrirPortal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Gerenciar assinatura
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={handleVerPlanos}
                >
                  Ver planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card ações rápidas + recursos */}
          <div className="space-y-6">
            <Card className="border-slate-700/80 bg-card/60 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">Ações rápidas</CardTitle>
                <CardDescription className="text-slate-400">
                  Portal seguro Stripe para faturas e pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={handleAbrirPortal}
                  disabled={isLoading}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Atualizar cartão
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={handleVerPlanos}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Comparar planos
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-700/80 bg-card/60 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">Recursos do plano</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(plan.features ?? []).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Layout inativo: destaque no alerta + CTA */
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-amber-900/50 bg-card/60 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                  <AlertCircle className="h-6 w-6 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg text-white">{message.title}</CardTitle>
                  <CardDescription className="mt-1 text-slate-400">{message.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-lg border border-slate-700/80 bg-slate-800/50 px-4 py-3 text-sm text-slate-400">
                Enquanto a assinatura não estiver ativa, o acesso às demais páginas e o uso da API Key ficam
                bloqueados.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  size="lg"
                  onClick={handleAbrirPortal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pagar ou atualizar pagamento
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={handleVerPlanos}
                >
                  Ver planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="pt-3 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-400"
                  onClick={async () => {
                    await logout();
                    setLocation("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da conta
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700/80 bg-card/60 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Por que ativar?</CardTitle>
              <CardDescription className="text-slate-400">
                Com assinatura ativa você desbloqueia todo o ChatLead Pro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Acesso completo ao dashboard e leads",
                  "API Key liberada para extensão e integrações",
                  "Faturas e histórico no portal Stripe",
                  "Suporte e recursos do plano contratado",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-4 w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={handleVerPlanos}
              >
                Ver planos e preços
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
