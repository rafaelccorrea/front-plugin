import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Activity, Zap, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageShimmer } from "@/components/PageShimmer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function UsageDashboard() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState("");

  const { data: quotaInfo, isLoading } = trpc.billing.getUsage.useQuery();

  useEffect(() => {
    const now = new Date();
    const month = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    setCurrentMonth(month.charAt(0).toUpperCase() + month.slice(1));
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShimmer page="usage" />
      </DashboardLayout>
    );
  }

  if (!quotaInfo?.data) {
    return (
      <DashboardLayout>
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">Erro ao carregar informações de uso</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const usage = quotaInfo.data;
  const leadsPercent = usage.leadsUsagePercent;
  const apiCallsPercent = usage.apiCallsUsagePercent;
  const leadsExceeded = usage.leadsCreated > usage.leadsQuota && usage.leadsQuota > 0;
  const apiCallsExceeded = usage.apiCallsMade > usage.apiCallsQuota && usage.apiCallsQuota > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Uso de Quotas</h1>
          <p className="text-slate-400 mt-2">
            Acompanhe seu uso mensal de leads e chamadas de API
          </p>
        </div>

        {/* Alertas */}
        {(leadsPercent >= 80 || apiCallsPercent >= 80) && !leadsExceeded && !apiCallsExceeded && (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              {leadsPercent >= 80 && "Você está usando 80% de sua quota de leads. "}
              {apiCallsPercent >= 80 && "Você está usando 80% de sua quota de API calls."}
            </AlertDescription>
          </Alert>
        )}

        {(leadsExceeded || apiCallsExceeded) && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {leadsExceeded && "Você atingiu o limite de leads. "}
              {apiCallsExceeded && "Você atingiu o limite de chamadas de API."}
              Considere fazer upgrade de plano.
            </AlertDescription>
          </Alert>
        )}

        {/* Plano Atual */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Plano Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">Plano Ativo</p>
                <p className="text-sm text-slate-400">Quotas e limites do seu plano</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-lg px-4 py-2">
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Uso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Uso de Leads */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Leads Capturados</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-bold text-white">{usage.leadsCreated}</span>
                <span className="text-sm text-slate-400">
                  de {usage.leadsQuota}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progresso</span>
                  <span className={`font-semibold ${leadsPercent >= 80 ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {leadsPercent.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(leadsPercent, 100)} 
                  className="h-2 bg-slate-800"
                />
              </div>

              {!leadsExceeded && usage.leadsQuota > usage.leadsCreated && (
                <p className="text-sm text-green-400">
                  ✓ Você ainda pode capturar {usage.leadsQuota - usage.leadsCreated} leads este mês
                </p>
              )}

              {leadsExceeded && (
                <p className="text-sm text-red-400">
                  ✗ Você atingiu o limite de leads para este mês
                </p>
              )}
            </CardContent>
          </Card>

          {/* Uso de API Calls */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Chamadas de API</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-bold text-white">{usage.apiCallsMade}</span>
                <span className="text-sm text-slate-400">
                  de {usage.apiCallsQuota.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progresso</span>
                  <span className={`font-semibold ${apiCallsPercent >= 80 ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {apiCallsPercent.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(apiCallsPercent, 100)} 
                  className="h-2 bg-slate-800"
                />
              </div>

              {!apiCallsExceeded && usage.apiCallsQuota > usage.apiCallsMade && (
                <p className="text-sm text-green-400">
                  ✓ Você ainda pode fazer {(usage.apiCallsQuota - usage.apiCallsMade).toLocaleString()} chamadas este mês
                </p>
              )}

              {apiCallsExceeded && (
                <p className="text-sm text-red-400">
                  ✗ Você atingiu o limite de chamadas de API para este mês
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações do Mês */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Período Atual</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Mês</p>
                <p className="text-lg font-semibold text-white">{currentMonth}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Dias Restantes</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
                    new Date().getDate()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dica de Upgrade */}
        {usage.leadsQuota <= 10 && (
          <Card className="border-blue-500/20 bg-blue-500/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-blue-300">Quer mais quotas?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-blue-200">
                Faça upgrade para um plano pago e desbloqueie quotas maiores de leads e chamadas de API.
              </p>
              <Link href="/pricing">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Ver Planos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
