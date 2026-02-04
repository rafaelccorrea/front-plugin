import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Check, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { STRIPE_PLANS } from "@shared/stripe-plans";
import { formatBRL } from "@/lib/utils";

export default function Checkout() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const planId = location.split("/").pop() || "starter";

  const createCheckoutMutation = trpc.checkout.createCheckoutSession.useMutation(
    {
      onSuccess: (result) => {
        if (result.data.url) {
          window.location.href = result.data.url;
        }
      },
      onError: (error) => {
        setIsLoading(false);
        toast.error(error.message || "Erro ao criar sessão de checkout");
      },
    }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const plan = STRIPE_PLANS[planId.toUpperCase() as keyof typeof STRIPE_PLANS];

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>Plano inválido</span>
            </div>
            <Button 
              onClick={() => navigate("/pricing")} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Voltar para Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsLoading(true);

    const currentUrl = window.location.origin;
    const successUrl = `${currentUrl}/checkout-success`;
    const cancelUrl = `${currentUrl}/pricing`;

    createCheckoutMutation.mutate({
      planId: planId as "starter" | "professional" | "enterprise",
      successUrl,
      cancelUrl,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-6 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => navigate("/pricing")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Planos
          </Button>
          
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Confirme seu Pedido</h1>
            <p className="text-slate-400">
              Você está prestes a fazer upgrade para o plano <span className="text-blue-400 font-semibold">{plan.name}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Details */}
                <div className="border-b border-slate-800 pb-6">
                  <h3 className="font-semibold text-white mb-4">Plano Selecionado</h3>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg text-white">{plan.name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {plan.description}
                      </p>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {plan.priceId ? `${formatBRL(plan.price!)}/mês` : "Grátis"}
                    </Badge>
                  </div>
                </div>

                {/* Features */}
                <div className="border-b border-slate-800 pb-6">
                  <h3 className="font-semibold text-white mb-4">O que está incluído</h3>
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing Info */}
                <div>
                  <h3 className="font-semibold text-white mb-4">Informações de Cobrança</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="font-medium text-white">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ciclo de Faturamento</span>
                      <span className="font-medium text-white">Mensal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Próxima Cobrança</span>
                      <span className="font-medium text-white">
                        {new Date(
                          Date.now() + 30 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="bg-slate-900/50 border-slate-800 sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">{plan.priceId ? formatBRL(plan.price!) : "Grátis"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Impostos</span>
                    <span className="text-white">Calculado no checkout</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-white">Total Mensal</span>
                    <span className="text-blue-400">{plan.priceId ? formatBRL(plan.price!) : "Grátis"}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Continuar para Pagamento"
                  )}
                </Button>

                <Button
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  variant="outline"
                  onClick={() => navigate("/pricing")}
                  disabled={isLoading}
                >
                  Voltar
                </Button>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
                  <div className="flex gap-2">
                    <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Pagamento Seguro</p>
                      <p>
                        Você será redirecionado para o Stripe para completar seu pagamento de forma segura.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
