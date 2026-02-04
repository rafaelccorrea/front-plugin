import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { StripeSync } from "@/components/StripeSync";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/utils";
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  User,
  KeyRound,
  Bell,
  CreditCard,
  BarChart2,
  Webhook,
  Wallet,
  ExternalLink,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { NotificationPreferences } from "@/components/NotificationPreferences";

export default function Settings() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { preferences, toggleSound, toggleAnimation, toggleToast } = useNotificationPreferences();

  const { data: subscriptionData, isLoading: subscriptionLoading } =
    trpc.billing.getSubscription.useQuery();

  const { data: usageData, isLoading: usageLoading } =
    trpc.billing.getUsage.useQuery();

  const subscription = subscriptionData?.data;
  const usage = usageData?.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/50 text-slate-300">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Configurações
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Gerencie sua conta, preferências e integrações
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="account" className="w-full space-y-0">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5">
            <TabsTrigger
              value="account"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4" />
              Conta
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger
              value="api-keys"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <KeyRound className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4" />
              Plano
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <BarChart2 className="h-4 w-4" />
              Uso
            </TabsTrigger>
            {user?.role === "user" && (
              <TabsTrigger
                value="integrations"
                className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Webhook className="h-4 w-4" />
                Integrações
              </TabsTrigger>
            )}
            <TabsTrigger
              value="payments"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Wallet className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="mt-6 space-y-6 outline-none">
            <Card className="border-slate-800 bg-slate-900/50 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5 text-slate-400" />
                  Informações da conta
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Dados do seu perfil no ChatLead Pro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome</Label>
                    <Input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">ID do usuário</Label>
                  <Input
                    type="text"
                    value={user?.id || ""}
                    disabled
                    className="max-w-md bg-slate-800/80 border-slate-700 font-mono text-sm text-slate-400"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6 outline-none">
            <NotificationPreferences />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="mt-6 space-y-6 outline-none">
            <Card className="border-slate-800 bg-slate-900/50 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                  Chave de API
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Use para autenticar requisições da extensão Chrome. Mantenha em segredo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-200/90">
                    <p className="font-medium text-blue-100">Informação importante</p>
                    <p className="mt-1 leading-relaxed">
                      Esta chave autentica requisições da extensão Chrome. Nunca compartilhe ou exponha em código público.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Sua chave de API</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey || user?.apiKey || ""}
                        disabled
                        className="pr-10 bg-slate-800/80 border-slate-700 font-mono text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                        aria-label={showApiKey ? "Ocultar chave" : "Mostrar chave"}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => copyToClipboard(apiKey || user?.apiKey || "")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Exemplo de uso (cURL)</h3>
                  <pre className="overflow-x-auto rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre">
{`curl -X POST https://api.wa-sdr.com/api/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"conversation": "...", "contactName": "..."}'`}
                  </pre>
                </div>

                <Separator className="bg-slate-800" />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <Button
                    variant="outline"
                    className="w-fit border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar chave
                  </Button>
                  <p className="text-xs text-slate-500">
                    A chave anterior será invalidada. Use com cuidado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="mt-6 space-y-6 outline-none">
            <Card className="border-slate-800 bg-slate-900/50 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  Plano atual
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Detalhes da sua assinatura e limites do plano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-40 rounded-lg" />
                    <Skeleton className="h-4 w-full max-w-md rounded" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Skeleton className="h-16 rounded-lg" />
                      <Skeleton className="h-16 rounded-lg" />
                    </div>
                  </div>
                ) : subscription ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Plano</Label>
                        <p className="mt-1 text-lg font-semibold text-white">{subscription.planName}</p>
                        <p className="mt-1 text-sm text-slate-400">{subscription.planDescription}</p>
                      </div>
                      <Badge
                        variant={subscription.subscriptionStatus === "active" ? "default" : "destructive"}
                        className={
                          subscription.subscriptionStatus === "active"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : ""
                        }
                      >
                        {subscription.subscriptionStatus === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    <Separator className="bg-slate-800" />

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Leads / mês</Label>
                        <p className="mt-1 text-xl font-semibold text-white">{subscription.monthlyLeadsQuota}</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Chamadas API / mês</Label>
                        <p className="mt-1 text-xl font-semibold text-white">{subscription.monthlyApiCalls}</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Preço</Label>
                        <p className="mt-1 text-xl font-semibold text-white">
                          {formatBRL(subscription.priceInCents)}/mês
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-12 text-center">
                    <CreditCard className="mx-auto h-10 w-10 text-slate-500" />
                    <p className="mt-3 text-slate-400">Nenhum plano ativo no momento</p>
                    <Button className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-90" asChild>
                      <a href="/pricing">Ver planos</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {subscription && (
              <Card className="border-slate-800 bg-slate-900/50 shadow-none">
                <CardHeader>
                  <CardTitle className="text-white">Gerenciar assinatura</CardTitle>
                  <CardDescription className="text-slate-400">
                    Alterar plano ou cancelar assinatura
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row">
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" asChild>
                    <a href="/pricing">Atualizar plano</a>
                  </Button>
                  <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Cancelar assinatura
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6 outline-none">
            <StripeSync />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="mt-6 space-y-6 outline-none">
            <Card className="border-slate-800 bg-slate-900/50 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart2 className="h-5 w-5 text-slate-400" />
                  Uso do mês atual
                </CardTitle>
                <CardDescription className="text-slate-400">
                  A cota é mensal; no início do próximo mês os contadores são zerados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {usageLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : usage ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Leads criados</Label>
                        <span className="text-sm font-medium text-slate-200">
                          {usage.leadsCreated} / {usage.leadsQuota}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(usage.leadsUsagePercent, 100)}
                        className="h-2.5 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500"
                      />
                      <p className="text-xs text-slate-500">{usage.leadsUsagePercent.toFixed(1)}% utilizado</p>
                    </div>

                    <Separator className="bg-slate-800" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Chamadas de API</Label>
                        <span className="text-sm font-medium text-slate-200">
                          {usage.apiCallsMade} / {usage.apiCallsQuota}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(usage.apiCallsUsagePercent, 100)}
                        className="h-2.5 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500"
                      />
                      <p className="text-xs text-slate-500">{usage.apiCallsUsagePercent.toFixed(1)}% utilizado</p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-12 text-center">
                    <BarChart2 className="mx-auto h-10 w-10 text-slate-500" />
                    <p className="mt-3 text-slate-400">Nenhum dado de uso disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 shadow-none">
              <CardHeader>
                <CardTitle className="text-white">Sobre as quotas</CardTitle>
                <CardDescription className="text-slate-400">
                  Entenda como funcionam os limites do seu plano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>
                  <span className="font-medium text-slate-200">Leads:</span> Quantidade de leads que você pode criar por mês. Ao atingir o limite, não é possível criar mais até o próximo ciclo.
                </p>
                <p>
                  <span className="font-medium text-slate-200">Chamadas de API:</span> Número de requisições ao endpoint /api/analyze por mês.
                </p>
                <p className="text-slate-500">
                  As quotas são mensais e reiniciam no primeiro dia de cada mês.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações Tab - Webhook (apenas tipo user com plano Professional/Enterprise) */}
          {user?.role === "user" && (
            <TabsContent value="integrations" className="mt-6 outline-none">
              <IntegrationsWebhookSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function IntegrationsWebhookSection() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["lead.created", "lead.updated"]);
  const syncedFromConfig = useRef(false);
  const { data: canUse, isLoading: canUseLoading } = trpc.integrations.canUseIntegrations.useQuery();
  const { data: config, isLoading: configLoading } = trpc.integrations.getWebhookConfig.useQuery(undefined, { enabled: canUse?.allowed ?? false });

  useEffect(() => {
    if (!canUse?.allowed || configLoading || !config) return;
    if (config.isActive && config.url && config.events?.length) {
      if (!syncedFromConfig.current) {
        setUrl(config.url);
        setEvents([...config.events]);
        syncedFromConfig.current = true;
      }
    } else {
      syncedFromConfig.current = false;
    }
  }, [canUse?.allowed, configLoading, config]);

  const setConfig = trpc.integrations.setWebhookConfig.useMutation({
    onSuccess: () => {
      toast.success("Webhook configurado com sucesso.");
    },
    onError: (e) => toast.error(e.message),
  });
  const disableWebhook = trpc.integrations.disableWebhook.useMutation({
    onSuccess: () => toast.success("Webhook desativado."),
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  const toggleEvent = (event: string) => {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  if (canUseLoading) return <Skeleton className="h-40 w-full" />;
  if (!canUse?.allowed) {
    return (
      <Card className="border-slate-800 bg-slate-900/50 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Webhook className="h-5 w-5 text-cyan-400" />
            Integrações (Webhook)
          </CardTitle>
          <CardDescription className="text-slate-400">
            Receba eventos em tempo real na sua URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-amber-200">Disponível apenas para planos Professional e Enterprise</p>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                Configure uma URL para receber eventos (novo lead, lead atualizado) em tempo real. Faça upgrade para usar.
              </p>
              <Button className="mt-4" variant="outline" size="sm" asChild>
                <a href="/pricing">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver planos
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (configLoading) return <Skeleton className="h-40 w-full" />;

  const hasConfig = config?.url && config.isActive;

  return (
    <Card className="border-slate-800 bg-slate-900/50 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Webhook className="h-5 w-5 text-cyan-400" />
          Webhook de integração
        </CardTitle>
        <CardDescription className="text-slate-400">
          Receba eventos (novo lead, lead atualizado) na sua URL. Chamadas externas exigem sua API Key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-300">URL do webhook</Label>
          <Input
            type="url"
            placeholder="https://seu-sistema.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-slate-300">Eventos</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: "lead.created", label: "Novo lead criado" },
              { value: "lead.updated", label: "Lead atualizado" },
              { value: "appointment.created", label: "Agendamento criado" },
              { value: "appointment.updated", label: "Agendamento atualizado" },
            ].map(({ value: ev, label }) => (
              <label key={ev} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-slate-300 cursor-pointer hover:bg-slate-800/80 transition-colors">
                <input
                  type="checkbox"
                  checked={events.includes(ev)}
                  onChange={() => toggleEvent(ev)}
                  className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/50"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        {hasConfig && (
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-xs text-slate-500 space-y-1">
            {config?.lastTriggeredAt && <p>Último disparo: {new Date(config.lastTriggeredAt).toLocaleString("pt-BR")}</p>}
            {(config?.failureCount ?? 0) > 0 && <p className="text-amber-400">Falhas: {config.failureCount}</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            disabled={setConfig.isPending || !url.trim() || events.length === 0}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
            onClick={() => setConfig.mutate({ url: url.trim(), events: events as ("lead.created" | "lead.updated" | "appointment.created" | "appointment.updated")[] }, { onSuccess: () => { utils.integrations.getWebhookConfig.invalidate(); syncedFromConfig.current = false; } })}
          >
            {hasConfig ? "Atualizar" : "Salvar"}
          </Button>
          {hasConfig && (
            <Button
              variant="outline"
              disabled={disableWebhook.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => disableWebhook.mutate(undefined, { onSuccess: () => utils.integrations.getWebhookConfig.invalidate() })}
            >
              Desativar webhook
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
