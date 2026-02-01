import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { StripeSync } from "@/components/StripeSync";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Eye, EyeOff, RefreshCw, AlertCircle, User, Lock, LogOut, Trash2, Volume2, VolumeX, Bell, Webhook, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { Switch } from "@/components/ui/switch";
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Configurações</h1>

        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Uso</TabsTrigger>
            {user?.role === "user" && (
              <TabsTrigger value="integrations">Integrações</TabsTrigger>
            )}
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Nome
                  </label>
                  <Input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    ID do Usuário
                  </label>
                  <Input
                    type="text"
                    value={user?.id || ""}
                    disabled
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <NotificationPreferences />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Chave de API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium">Informação Importante</p>
                    <p className="mt-1">
                      Use esta chave para autenticar requisições da extensão Chrome.
                      Mantenha-a segura e nunca a compartilhe.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Sua Chave de API
                  </label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey || user?.apiKey || ""}
                        disabled
                        className="pr-10 bg-slate-800 border-slate-700 text-white"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(apiKey || user?.apiKey || "")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Como usar a API Key</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                    <p>
                      <span className="text-muted-foreground">curl -X POST</span>{" "}
                      https://api.wa-sdr.com/api/analyze \
                    </p>
                    <p className="ml-4">
                      <span className="text-muted-foreground">-H</span>{" "}
                      "Authorization: Bearer YOUR_API_KEY" \
                    </p>
                    <p className="ml-4">
                      <span className="text-muted-foreground">-H</span>{" "}
                      "Content-Type: application/json" \
                    </p>
                    <p className="ml-4">
                      <span className="text-muted-foreground">-d</span> '{"{"}
                      "conversation": "...", "contactName": "..."{"}"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="text-destructive">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar Chave
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Isso invalidará a chave anterior. Use com cuidado!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : subscription ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Nome do Plano
                      </label>
                      <p className="font-medium mt-1">{subscription.planName}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Descrição
                      </label>
                      <p className="text-sm mt-1">
                        {subscription.planDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Leads por Mês
                        </label>
                        <p className="font-medium mt-1">
                          {subscription.monthlyLeadsQuota}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Chamadas de API
                        </label>
                        <p className="font-medium mt-1">
                          {subscription.monthlyApiCalls}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Preço
                      </label>
                      <p className="font-medium mt-1">
                        {(subscription.priceInCents / 100).toFixed(2)}{" "}
                        {subscription.currency}/mês
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            subscription.subscriptionStatus === "active"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {subscription.subscriptionStatus === "active"
                            ? "Ativo"
                            : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum plano ativo no momento
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">Atualizar Plano</Button>
                <Button variant="outline" className="w-full">
                  Cancelar Assinatura
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <StripeSync />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso do Mês Atual</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  A cota é mensal: ao virar o mês você pode criar mais leads (ex.: 10 no plano Free).
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {usageLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : usage ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">
                          Leads Criados
                        </label>
                        <span className="text-sm font-medium">
                          {usage.leadsCreated} / {usage.leadsQuota}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(usage.leadsUsagePercent, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {usage.leadsUsagePercent.toFixed(1)}% utilizado
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">
                          Chamadas de API
                        </label>
                        <span className="text-sm font-medium">
                          {usage.apiCallsMade} / {usage.apiCallsQuota}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(usage.apiCallsUsagePercent, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {usage.apiCallsUsagePercent.toFixed(1)}% utilizado
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum dado de uso disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações de Quota</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">Leads:</span> Número de leads que você pode criar por mês. Ao atingir o limite, não é possível criar mais até o próximo mês.
                </p>
                <p>
                  <span className="font-medium">Chamadas de API:</span> Número de requisições que você pode fazer para o endpoint /api/analyze por mês.
                </p>
                <p className="text-muted-foreground">
                  A cota é mensal: no primeiro dia do mês seguinte o contador zera e você pode usar a cota novamente.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações Tab - Webhook (apenas tipo user com plano Professional/Enterprise) */}
          {user?.role === "user" && (
            <TabsContent value="integrations" className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
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
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Webhook className="h-5 w-5 text-cyan-400" />
            Integrações (Webhook)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-200">Disponível apenas para planos Professional e Enterprise</p>
              <p className="text-sm text-slate-400 mt-1">
                Configure uma URL para receber eventos (novo lead, lead atualizado) em tempo real. Faça upgrade para usar.
              </p>
              <Button className="mt-3" variant="outline" size="sm" onClick={() => window.location.href = "/pricing"} asChild>
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
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Webhook className="h-5 w-5 text-cyan-400" />
          Webhook de integração
        </CardTitle>
        <p className="text-sm text-slate-400">
          Receba eventos (novo lead, lead atualizado) na sua URL. Todas as chamadas externas à API exigem sua API Key.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-300">URL do webhook</label>
          <Input
            type="url"
            placeholder="https://seu-sistema.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-2 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Eventos</label>
          <div className="space-y-2">
            {[
              { value: "lead.created", label: "Novo lead criado" },
              { value: "lead.updated", label: "Lead atualizado" },
              { value: "appointment.created", label: "Agendamento criado" },
              { value: "appointment.updated", label: "Agendamento atualizado" },
            ].map(({ value: ev, label }) => (
              <label key={ev} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={events.includes(ev)}
                  onChange={() => toggleEvent(ev)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        {hasConfig && (
          <div className="text-xs text-slate-500 space-y-1">
            {config?.lastTriggeredAt && <p>Último disparo: {new Date(config.lastTriggeredAt).toLocaleString("pt-BR")}</p>}
            {(config?.failureCount ?? 0) > 0 && <p className="text-amber-400">Falhas: {config.failureCount}</p>}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            disabled={setConfig.isPending || !url.trim() || events.length === 0}
            onClick={() => setConfig.mutate({ url: url.trim(), events: events as ("lead.created" | "lead.updated" | "appointment.created" | "appointment.updated")[] }, { onSuccess: () => { utils.integrations.getWebhookConfig.invalidate(); syncedFromConfig.current = false; } })}
          >
            {hasConfig ? "Atualizar" : "Salvar"}
          </Button>
          {hasConfig && (
            <Button
              variant="outline"
              disabled={disableWebhook.isPending}
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
