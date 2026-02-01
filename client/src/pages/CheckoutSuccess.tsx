import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const { refresh: refreshUser } = useAuth();
  const utils = trpc.useUtils();

  useEffect(() => {
    void utils.auth.me.invalidate();
    refreshUser();
    const t2 = setTimeout(() => { void utils.auth.me.invalidate(); refreshUser(); }, 2000);
    const t5 = setTimeout(() => { void utils.auth.me.invalidate(); refreshUser(); }, 5000);
    return () => {
      clearTimeout(t2);
      clearTimeout(t5);
    };
  }, [refreshUser, utils.auth.me]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/command-center");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center py-20 px-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <Card className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center border border-green-500/30">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Pagamento Realizado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div>
            <p className="text-slate-300 mb-2">
              Obrigado por escolher ChatLead Pro. Sua assinatura foi ativada com sucesso.
            </p>
            <p className="text-sm text-slate-500">
              Redirecionando em <span className="text-cyan-400 font-semibold">{countdown}</span> segundos...
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Assinatura ativada</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Acesso ao dashboard liberado</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Quotas atualizadas</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-blue-500/25"
              onClick={() => navigate("/command-center")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ver Configurações de Billing
            </Button>
          </div>

          <div className="text-xs text-slate-500 pt-2">
            <p>Um email de confirmação foi enviado para seu endereço de email.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
