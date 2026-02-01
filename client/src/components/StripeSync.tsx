import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export function StripeSync() {
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  const syncMutation = trpc.stripeSync.syncSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      void utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Verificar status de pagamento
  const statusQuery = trpc.stripeSync.checkPaymentStatus.useQuery();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await syncMutation.mutateAsync();
      // Refetch status após sincronização
      statusQuery.refetch();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card de Status */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Status de Pagamento
          </CardTitle>
          <CardDescription>
            Informações da sua assinatura e histórico de pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : statusQuery.data?.data ? (
            <>
              {/* Plano Atual */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Plano Atual</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                    {(statusQuery.data.data.currentPlan === "free" || !statusQuery.data.data.currentPlan) ? "Gratis" : statusQuery.data.data.currentPlan.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-slate-300">
                    Status: {statusQuery.data.data.subscriptionStatus || "Inativo"}
                  </span>
                </div>
              </div>

              {/* Invoices Recentes */}
              {statusQuery.data.data.recentInvoices && statusQuery.data.data.recentInvoices.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Invoices Recentes</p>
                  <div className="space-y-2">
                    {statusQuery.data.data.recentInvoices.slice(0, 3).map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <div>
                          <p className="text-sm text-slate-300">
                            ${(invoice.amount / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(invoice.date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            invoice.status === "paid"
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma informação de pagamento disponível</p>
          )}
        </CardContent>
      </Card>

      {/* Card de Sincronização - só para usuários com plano pago */}
      {statusQuery.data?.data?.currentPlan && statusQuery.data.data.currentPlan !== "free" && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              Sincronizar com Stripe
            </CardTitle>
            <CardDescription>
              Sincronize sua assinatura com os dados mais recentes do Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSync}
              disabled={isLoading || syncMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading || syncMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Aviso de Sincronização */}
      {statusQuery.data?.data?.subscriptionStatus === "past_due" && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Pagamento Pendente</p>
              <p className="text-xs text-red-300 mt-1">
                Sua assinatura está com pagamento pendente. Por favor, atualize seu método de pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
