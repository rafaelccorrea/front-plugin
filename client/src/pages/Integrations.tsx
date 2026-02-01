import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Webhook,
  Copy,
  Code2,
  Globe,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  BookOpen,
  Send,
  Link2,
  Lock,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

const EXTERNAL_LEAD_PATH = "/api/webhooks.externalLead";

const EVENT_OPTIONS = [
  { value: "lead.created", label: "Novo lead", short: "lead.created" },
  { value: "lead.updated", label: "Lead atualizado", short: "lead.updated" },
  { value: "appointment.created", label: "Agendamento criado", short: "appointment.created" },
  { value: "appointment.updated", label: "Agendamento atualizado", short: "appointment.updated" },
] as const;

export default function Integrations() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["lead.created", "lead.updated"]);
  const [secret, setSecret] = useState("");
  const syncedFromConfig = useRef(false);
  const { data: canUse, isLoading: canUseLoading } = trpc.integrations.canUseIntegrations.useQuery();
  const { data: config, isLoading: configLoading } = trpc.integrations.getWebhookConfig.useQuery(undefined, {
    enabled: canUse?.allowed ?? false,
  });

  useEffect(() => {
    if (!canUseLoading && canUse && !canUse.allowed) {
      setLocation("/pricing");
      return;
    }
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
  }, [canUseLoading, canUse, canUse?.allowed, configLoading, config, setLocation]);

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
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const docBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const endpointUrl = `${docBaseUrl}${EXTERNAL_LEAD_PATH}`;
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (canUseLoading || !canUse?.allowed || configLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 w-64 bg-slate-800 rounded-lg animate-pulse" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  const hasConfig = config?.url && config.isActive;
  const exampleLeadPayload = {
    apiKey: "SUA_CHAVE_AQUI",
    name: "João Silva",
    phone: "11999999999",
    email: "joao@email.com",
    source: "site_vendas",
    notes: "Observações",
    conversation: "Lead: Olá, gostaria de saber sobre o imóvel...",
  };
  const exampleOutgoingPayload = {
    event: "lead.created",
    timestamp: new Date().toISOString(),
    data: { leadId: 123, name: "João", phone: "11999999999", email: "joao@email.com", source: "external_webhook", summary: null },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12 px-1 sm:px-0 max-w-full overflow-hidden">
        {/* Hero – foco em webhook */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-blue-500/10 border border-slate-700/50 p-4 sm:p-6 md:p-8">
          <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <Webhook className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight break-words">
                  Integrações via Webhook
                </h1>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm md:text-base">
                  Receba eventos em tempo real na sua URL. Configure abaixo e use a documentação para enviar leads.
                </p>
              </div>
            </div>
            {hasConfig && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium text-xs sm:text-sm">
                  <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 shrink-0" /> Ativo
                </Badge>
                {config?.lastTriggeredAt && (
                  <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                    Último: {new Date(config.lastTriggeredAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Coluna principal – Webhook de saída (config) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-700/50 bg-slate-900/50 shadow-xl shadow-black/10 overflow-hidden">
              <CardHeader className="border-b border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                      <Link2 className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">Webhook de saída</CardTitle>
                      <CardDescription className="text-slate-400 text-sm mt-0.5">
                        URL que receberá os eventos (lead criado, lead atualizado, agendamentos)
                      </CardDescription>
                    </div>
                  </div>
                  {config != null && (config.failureCount ?? 0) > 0 && (
                    <Badge variant="destructive" className="shrink-0">
                      {config.failureCount} falha(s)
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-cyan-400" />
                    URL do endpoint
                  </label>
                  <Input
                    type="url"
                    placeholder="https://sua-api.com/webhook"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-11 w-full min-w-0 bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 font-mono text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    Eventos a enviar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleEvent(value)}
                        className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all shrink-0 ${
                          events.includes(value)
                            ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                            : "border-slate-600 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {events.includes(value) && <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />}
                        <span className="truncate max-w-[140px] sm:max-w-none">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-cyan-400" />
                    Secret (opcional)
                  </label>
                  <Input
                    type="password"
                    placeholder={config?.hasSecret ? "•••••••• (deixe em branco para manter)" : "Assine as requisições com HMAC-SHA256"}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="h-11 bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/30"
                    autoComplete="off"
                  />
                  <p className="text-xs text-slate-500">
                    Header <code className="text-cyan-400/90 bg-slate-800 px-1 rounded">X-Webhook-Signature: sha256=&lt;hmac&gt;</code>
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-xs text-slate-400 space-y-2">
                  <p className="font-medium text-slate-300">Segurança (obrigatório)</p>
                  <p>
                    Antes dos dados, enviamos um <strong>challenge</strong>: <code className="text-cyan-400/90">{"{ type: \"webhook_challenge\", nonce, timestamp }"}</code>.
                    Responda com status 2xx e <code className="text-cyan-400/90">X-Webhook-Ack: &lt;nonce&gt;</code> ou body <code className="text-cyan-400/90">{"{ \"ack\": true, \"nonce\": \"&lt;nonce&gt;\" }"}</code>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    disabled={setConfig.isPending || !url.trim() || events.length === 0}
                    onClick={() =>
                      setConfig.mutate(
                        {
                          url: url.trim(),
                          events: events as ("lead.created" | "lead.updated" | "appointment.created" | "appointment.updated")[],
                          secret: secret.trim() || undefined,
                        },
                        {
                          onSuccess: () => {
                            utils.integrations.getWebhookConfig.invalidate();
                            syncedFromConfig.current = false;
                          },
                        }
                      )
                    }
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {hasConfig ? "Atualizar webhook" : "Ativar webhook"}
                  </Button>
                  {hasConfig && (
                    <Button
                      variant="outline"
                      disabled={disableWebhook.isPending}
                      onClick={() =>
                        disableWebhook.mutate(undefined, {
                          onSuccess: () => utils.integrations.getWebhookConfig.invalidate(),
                        })
                      }
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Desativar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral – Enviar leads (webhook entrada) */}
          <div className="space-y-6">
            <Card className="border-slate-700/50 bg-slate-900/50 overflow-hidden">
              <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                    <Send className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">Enviar leads (entrada)</CardTitle>
                    <CardDescription className="text-slate-400 text-xs mt-0.5">
                      POST para capturar leads na sua conta
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-3 font-mono text-xs text-slate-300 break-all">
                  {endpointUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => copyToClipboard(endpointUrl)}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar URL
                </Button>
                <p className="text-xs text-slate-500">
                  Autenticação: <code className="text-cyan-400/90">Authorization: Bearer &lt;apiKey&gt;</code> ou body <code className="text-cyan-400/90">apiKey</code>.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-900/50">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-white text-xs sm:text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" /> Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400 text-[11px] sm:text-xs space-y-2 px-4 pb-4 break-words">
                <p>Use a API Key por header no servidor. Webhook de saída: responda ao challenge com o nonce antes de receber os dados.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentação para desenvolvedores */}
        <section className="border-t border-slate-700/50 pt-6 sm:pt-8 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 mb-4 sm:mb-6">
            <BookOpen className="h-5 w-5 text-cyan-400 shrink-0" />
            Documentação para desenvolvedores
          </h2>
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-w-0">
              <div className="lg:col-span-2 space-y-6 min-w-0">
                <Card className="border-slate-700/50 bg-slate-900/50">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                      <Globe className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">Webhook de entrada</span>
                    </div>
                    <CardTitle className="text-white text-base">POST – Capturar lead</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Campos: apiKey (obrigatório), name, phone, email, source, notes, conversation (IA).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
                      <Badge className="bg-blue-600 text-white shrink-0">POST</Badge>
                      <code className="text-xs font-mono text-slate-200 truncate flex-1">{endpointUrl}</code>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(endpointUrl)}>
                        <Copy className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                    <Tabs defaultValue="curl-doc" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-9 bg-slate-800 border border-slate-700">
                        <TabsTrigger value="curl-doc" className="text-xs data-[state=active]:bg-slate-700">cURL</TabsTrigger>
                        <TabsTrigger value="json-doc" className="text-xs data-[state=active]:bg-slate-700">JSON</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl-doc" className="mt-3">
                        <pre className="p-3 bg-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">{`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SUA_CHAVE_AQUI" \\
  -d '{"name":"João Silva","phone":"11999999999","email":"joao@email.com","source":"site_vendas"}'`}</pre>
                      </TabsContent>
                      <TabsContent value="json-doc" className="mt-3">
                        <pre className="p-3 bg-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">{JSON.stringify(exampleLeadPayload, null, 2)}</pre>
                        <Button variant="outline" size="sm" className="mt-2 border-slate-600 text-slate-300 text-xs" onClick={() => copyToClipboard(JSON.stringify(exampleLeadPayload, null, 2))}>
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                      </TabsContent>
                    </Tabs>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-green-400 mb-1">Sucesso (200)</p>
                        <pre className="bg-slate-800 rounded p-2 font-mono text-slate-400 text-[10px]">{`{ "success": true, "message": "Lead captured successfully", "leadId": 123 }`}</pre>
                      </div>
                      <div>
                        <p className="font-medium text-red-400 mb-1">401</p>
                        <pre className="bg-slate-800 rounded p-2 font-mono text-slate-400 text-[10px]">{`{ "error": { "message": "Invalid API Key", "code": "UNAUTHORIZED" } }`}</pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 bg-slate-900/50 min-w-0 overflow-hidden">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Webhook de saída</span>
                    </div>
                    <CardTitle className="text-white text-sm sm:text-base">Payload que você recebe</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm break-words">
                      event, timestamp, data. Eventos: lead.created, lead.updated, appointment.created, appointment.updated.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                    <p className="text-[11px] sm:text-xs text-slate-400 break-words">
                      Challenge primeiro: <code className="text-cyan-400/90 break-all">{"{ type: \"webhook_challenge\", nonce, timestamp }"}</code> → responda 2xx + <code className="text-cyan-400/90 break-all">X-Webhook-Ack: &lt;nonce&gt;</code>.
                    </p>
                    <pre className="p-2 sm:p-3 bg-slate-800 rounded-lg font-mono text-[10px] sm:text-xs text-slate-300 overflow-x-auto max-w-full">{JSON.stringify(exampleOutgoingPayload, null, 2)}</pre>
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 text-[10px] sm:text-xs" onClick={() => copyToClipboard(JSON.stringify(exampleOutgoingPayload, null, 2))}>
                      <Copy className="h-3 w-3 mr-1 shrink-0" /> Copiar exemplo
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4 min-w-0">
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-white text-xs sm:text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-400 shrink-0" /> conversation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 text-[11px] sm:text-xs space-y-1 px-4 pb-4 break-words">
                    <p>Se enviar <code className="text-cyan-300 bg-slate-800/50 px-1 rounded break-all">conversation</code>, a IA extrai dados, qualifica e gera score.</p>
                    <ul className="space-y-1 pt-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" /> Nome, telefone, email</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" /> Qualificação e score</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-slate-700/50 bg-slate-900/50">
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-white text-xs sm:text-sm flex items-center gap-2">
                      <Info className="h-4 w-4 text-cyan-400 shrink-0" /> Resumo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-400 text-[11px] sm:text-xs space-y-2 px-4 pb-4 break-words">
                    <p><strong className="text-slate-300">Entrada:</strong> POST com API Key (header ou body) para criar lead.</p>
                    <p><strong className="text-slate-300">Saída:</strong> Configure a URL acima; responda ao challenge; receba event + data.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
