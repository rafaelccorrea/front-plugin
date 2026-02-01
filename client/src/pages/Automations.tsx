import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  ToggleRight,
  Loader2,
  Globe,
  Bot,
  ShieldCheck,
  Settings2,
  Copy,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const TRIGGER_LABELS: Record<string, string> = {
  novo_lead: "Novo Lead",
  mensagem_recebida: "Mensagem Recebida",
  lead_qualificado: "Lead Qualificado",
  lead_convertido: "Lead Convertido",
};
const ACTION_LABELS: Record<string, string> = {
  enviar_mensagem: "Enviar Mensagem",
  qualificar_lead: "Qualificar Lead",
  enviar_notificacao: "Enviar Notificação",
  atualizar_status: "Atualizar Status",
  criar_tarefa: "Criar Tarefa",
};

export default function Automations() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [isCopying, setIsCopying] = useState(false);
  const { data: userAutomations = [], isLoading: listLoading } = trpc.automations.list.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.automations.delete.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      toast.success("Automação removida.");
    },
    onError: (e) => toast.error(e.message),
  });

  const systemAutomations = [
    {
      id: "webhook_universal",
      name: "Webhook Universal de Leads",
      description: "Receba leads de Instagram, Facebook Ads e Landing Pages via Zapier ou Make.",
      trigger: "Requisição HTTP POST",
      action: "Criação de Lead + Análise IA",
      icon: Globe,
      color: "text-blue-400",
      bgColor: "bg-blue-500/15",
      borderColor: "border-blue-500/20",
    },
    {
      id: "ia_qualification",
      name: "Qualificação Automática via Groq",
      description: "Analisa conversas e preenche o checklist de qualificação automaticamente.",
      trigger: "Novo Lead Capturado",
      action: "Preenchimento de Checklist",
      icon: Bot,
      color: "text-purple-400",
      bgColor: "bg-purple-500/15",
      borderColor: "border-purple-500/20",
    },
    {
      id: "duplicate_prevention",
      name: "Prevenção de Duplicados (7 dias)",
      description: "Evita a criação de leads repetidos se já houver um contato aberto nos últimos 7 dias.",
      trigger: "Tentativa de Captura",
      action: "Atualização de Lead Existente",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/15",
      borderColor: "border-emerald-500/20",
    },
  ];

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/api/webhooks.externalLead`;
    navigator.clipboard.writeText(url);
    setIsCopying(true);
    toast.success("URL do Webhook copiada!");
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleCopyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      toast.success("Sua API Key foi copiada!");
    }
  };

  const totalActive = systemAutomations.length + userAutomations.length;

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8 pb-8 sm:pb-12">
        {/* Header — responsivo */}
        <header className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Automações
              </h1>
              <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg max-w-xl">
                Potencialize o CRM com fluxos inteligentes e automáticos.
              </p>
            </div>
            <Button
              className="w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
              onClick={() => navigate("/automations/new")}
            >
              <Plus className="h-5 w-5 mr-2 shrink-0" />
              Nova Automação
            </Button>
          </div>
        </header>

        {/* Stats — 1 col mobile, 3 cols desktop */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Automações Ativas
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{totalActive}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Leads via Webhook
                </p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400">Ativo</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Inteligência Groq
                </p>
                <p className="text-lg sm:text-xl font-bold text-purple-400">Ligada</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Doc CTA — responsivo, touch-friendly */}
        <Card
          className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-600/15 via-slate-800/50 to-purple-600/15 overflow-hidden cursor-pointer hover:border-blue-500/40 transition-all active:scale-[0.995]"
          onClick={() => navigate("/automations/docs")}
        >
          <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white">Documentação do Webhook</h3>
                <p className="text-slate-400 text-sm sm:text-base mt-0.5">
                  Integre o ChatLead Pro com Zapier, Make e outras ferramentas via API.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-400 font-medium text-sm sm:text-base shrink-0">
              Ver guia
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Webhook config — stack em mobile */}
        <Card className="rounded-2xl border border-slate-700/80 bg-slate-800/30 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Settings2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg text-white">Configuração do Webhook</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">
                  Instagram, Facebook Ads, Zapier ou Make
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider block">
                URL do Webhook
              </label>
              <div className="flex flex-col min-[400px]:flex-row gap-2">
                <div className="min-w-0 flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 font-mono text-xs sm:text-sm text-blue-400 break-all">
                  {typeof window !== "undefined" && `${window.location.origin}/api/webhooks.externalLead`}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10 sm:h-12 px-4 rounded-xl shrink-0 min-h-[44px]"
                  onClick={handleCopyWebhook}
                >
                  {isCopying ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Envie requisições POST para este endereço para capturar leads externos.
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider block">
                Sua API Key
              </label>
              <div className="flex flex-col min-[400px]:flex-row gap-2">
                <div className="min-w-0 flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 font-mono text-xs sm:text-sm text-purple-400 truncate">
                  {user?.apiKey || "••••••••••••••••••••"}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10 sm:h-12 px-4 rounded-xl shrink-0 min-h-[44px]"
                  onClick={handleCopyApiKey}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Inclua no campo <code className="text-slate-400">apiKey</code> do JSON de envio.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Suas automações */}
        {(listLoading || userAutomations.length > 0) && (
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 shrink-0" />
              Suas automações
            </h2>
            {listLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:gap-4">
                {userAutomations.map((automation) => (
                  <li key={automation.id}>
                    <Card className="rounded-2xl border border-slate-700/80 bg-slate-800/40 hover:border-slate-600 transition-all overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex gap-3 sm:gap-4 min-w-0">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                                  {automation.name}
                                </h3>
                                <Badge
                                  className={`text-[10px] font-semibold uppercase shrink-0 ${
                                    automation.isActive
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                      : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                  }`}
                                >
                                  {automation.isActive ? "Ativa" : "Pausada"}
                                </Badge>
                              </div>
                              {automation.description && (
                                <p className="text-slate-400 text-sm mt-0.5 line-clamp-2">
                                  {automation.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                                <span>
                                  Gatilho:{" "}
                                  <span className="text-slate-300">
                                    {TRIGGER_LABELS[automation.trigger] ?? automation.trigger}
                                  </span>
                                </span>
                                <span>
                                  Ação:{" "}
                                  <span className="text-slate-300">
                                    {ACTION_LABELS[automation.action] ?? automation.action}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-1 flex-wrap sm:flex-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                              onClick={() =>
                                toast.info("Edição em breve. Exclua e crie novamente.")
                              }
                            >
                              <ToggleRight className="h-4 w-4 sm:mr-1.5 text-emerald-500 shrink-0" />
                              <span className="hidden sm:inline">{automation.isActive ? "Ligada" : "Pausada"}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 shrink-0 min-w-[44px] min-h-[44px] sm:min-w-9 sm:min-h-9"
                              onClick={() => navigate("/automations/docs")}
                              title="Documentação"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 min-w-[44px] min-h-[44px] sm:min-w-9 sm:min-h-9"
                              onClick={() => {
                                if (window.confirm("Excluir esta automação?"))
                                  deleteMutation.mutate({ id: automation.id });
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Automações de Sistema */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
            Automações de Sistema
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:gap-4">
            {systemAutomations.map((automation) => (
              <li key={automation.id}>
                <Card
                  className={`rounded-2xl border ${automation.borderColor} bg-slate-800/40 overflow-hidden transition-all hover:border-opacity-50`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-3 sm:gap-4 min-w-0">
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${automation.bgColor} flex items-center justify-center shrink-0 ${automation.color}`}
                        >
                          <automation.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-white">
                              {automation.name}
                            </h3>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold uppercase shrink-0">
                              Ativa
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mt-0.5">{automation.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            <span>
                              Gatilho: <span className="text-slate-300">{automation.trigger}</span>
                            </span>
                            <span>
                              Ação: <span className="text-slate-300">{automation.action}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                          onClick={() => toast.info("Automações de sistema estão sempre ativas.")}
                        >
                          <ToggleRight className="h-4 w-4 sm:mr-1.5 text-emerald-500 shrink-0" />
                          <span className="hidden sm:inline">Ligada</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 min-w-[44px] min-h-[44px] sm:min-w-9 sm:min-h-9"
                          onClick={() => navigate("/automations/docs")}
                          title="Documentação"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
}
