import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { STRIPE_PLANS } from "@shared/stripe-plans";
import { formatBRL } from "@/lib/utils";

export default function BillingSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { data: billingInfo, isLoading: isLoadingBilling } =
    trpc.checkout.getBillingInfo.useQuery();

  const createPortalMutation = trpc.checkout.createBillingPortalSession.useMutation(
    {
      onSuccess: (result) => {
        if (result.data.url) {
          window.location.href = result.data.url;
        }
      },
      onError: (error) => {
        setIsLoading(false);
        toast.error(error.message || "Erro ao abrir portal de billing");
      },
    }
  );

  const handleManageBilling = () => {
    setIsLoading(true);
    const returnUrl = `${window.location.origin}/settings`;
    createPortalMutation.mutate({ returnUrl });
  };

  if (isLoadingBilling) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const plan = billingInfo?.data.plan || STRIPE_PLANS.FREE;
  const activeSubscription = billingInfo?.data.activeSubscription;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{plan.name}</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <Badge className="bg-primary text-lg px-4 py-2">
              {plan.priceId ? `${formatBRL(plan.price!)}/mês` : "Grátis"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Leads/Mês</p>
              <p className="text-lg font-semibold">
                {plan.monthlyLeadsQuota === 999999
                  ? "Ilimitado"
                  : plan.monthlyLeadsQuota}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chamadas de API</p>
              <p className="text-lg font-semibold">
                {plan.monthlyApiCalls.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {activeSubscription ? (
                  <Badge className="bg-green-600">Ativo</Badge>
                ) : (
                  <Badge className="bg-blue-600">Gratuito</Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => (window.location.href = "/pricing")}>
              Ver Outros Planos
            </Button>
            {activeSubscription && (
              <Button variant="outline" onClick={handleManageBilling} disabled={isLoading}>
                {isLoading ? "Carregando..." : "Gerenciar assinatura"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Incluídos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 text-xs">✓</span>
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {activeSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Próxima Cobrança</p>
              <p className="text-sm text-muted-foreground">
                {activeSubscription && (activeSubscription as any).current_period_end
                  ? new Date(
                      ((activeSubscription as any).current_period_end as number) * 1000
                    ).toLocaleDateString("pt-BR")
                  : "N/D"}
              </p>
                </div>
                <Badge className="bg-blue-600">
                  {plan.priceId ? formatBRL(plan.price!) : "Grátis"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Data de Início</p>
              <p className="text-sm text-muted-foreground">
                {activeSubscription && (activeSubscription as any).start_date
                  ? new Date(
                      ((activeSubscription as any).start_date as number) * 1000
                    ).toLocaleDateString("pt-BR")
                  : "N/D"}
              </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "Carregando..." : "Acessar Portal de Billing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Quotas Mensais</p>
              <p>
                Suas quotas são resetadas no primeiro dia de cada mês. Você pode
                acompanhar seu uso no dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Leads Utilizados</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">0</span>
                <span className="text-sm text-muted-foreground">
                  / {plan.monthlyLeadsQuota === 999999 ? "∞" : plan.monthlyLeadsQuota}
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Chamadas de API Utilizadas
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">0</span>
                <span className="text-sm text-muted-foreground">
                  / {plan.monthlyApiCalls.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSubscription ? (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-slate-600" />
                <div>
                  <p className="font-medium">Cartão de Crédito</p>
                  <p className="text-sm text-muted-foreground">
                    Gerenciado pelo Stripe
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={isLoading}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum método de pagamento configurado
              </p>
              <Button onClick={() => (window.location.href = "/pricing")}>
                Fazer Upgrade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
