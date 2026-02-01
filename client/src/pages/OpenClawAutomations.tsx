'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Zap,
  Plus,
  Brain,
  Loader2,
  Edit2,
  Trash2,
  Send,
  Eraser,
  Mail,
  MessageCircle,
  Calendar,
  Sparkles,
  User,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// Cores do projeto (Slate + Blue)
const COLORS = {
  primary: "bg-blue-600 hover:bg-blue-700",
  secondary: "bg-slate-900",
  accent: "text-blue-400",
  border: "border-slate-700",
  bg: "bg-slate-900/50",
  text: "text-white",
  muted: "text-slate-400",
};

const TRIGGER_OPTIONS = [
  { value: "new_lead", label: "Novo Lead" },
  { value: "lead_updated", label: "Lead Atualizado" },
  { value: "high_score", label: "Score Alto (IA)" },
];

const ACTION_OPTIONS = [
  { value: "send_email", label: "Enviar E-mail" },
  { value: "send_whatsapp", label: "Enviar WhatsApp" },
  { value: "create_appointment", label: "Agendar Visita" },
];

const QUICK_QUESTIONS = [
  {
    icon: TrendingUp,
    question: "Quais leads estão prontos para fechar?",
    description: "Análise de leads qualificados",
  },
  {
    icon: Target,
    question: "Como aumentar minhas conversões?",
    description: "Estratégias de vendas",
  },
  {
    icon: Zap,
    question: "Quais automações devo criar?",
    description: "Recomendações de IA",
  },
  {
    icon: Calendar,
    question: "Próximos agendamentos?",
    description: "Agenda do mês",
  },
];

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  action?: any;
};

export default function OpenClawAutomations() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const { canAccessOpenClawAutomations } = usePlanFeatures();
  const [activeTab, setActiveTab] = useState("automations");
  const [form, setForm] = useState({
    name: "",
    description: "",
    triggerEvent: "new_lead",
    actionType: "send_email",
    minScore: "0.7",
    executionMode: "manual_approval" as "automatic" | "manual_approval",
    emailTemplate: "welcome",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [copilotMessages, setCopilotMessages] = useState<Message[]>([]);
  const [copilotInput, setCopilotInput] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCopilotTabRef = useRef(false);

  // Queries
  const utils = trpc.useUtils();
  const { data: automations = [], isLoading: automationsLoading } =
    trpc.openClawAutomations.list.useQuery();

  const { data: conversationsList = [] } = trpc.aiAssistant.listConversations.useQuery(undefined, {
    enabled: activeTab === "copilot",
    refetchOnWindowFocus: false,
  });
  const { data: historyData, isFetching: historyFetching } = trpc.aiAssistant.getHistory.useQuery(
    { conversationId: currentConversationId! },
    {
      enabled: activeTab === "copilot" && currentConversationId != null,
      refetchOnWindowFocus: false,
    }
  );
  const createNewConversationMutation = trpc.aiAssistant.createNewConversation.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      setCopilotMessages([]);
      setCopilotInput("");
      utils.aiAssistant.getHistory.invalidate();
      utils.aiAssistant.listConversations.invalidate();
    },
  });
  const clearHistoryMutation = trpc.aiAssistant.clearHistory.useMutation({
    onSuccess: () => {
      setCopilotMessages([]);
      setCopilotInput("");
      if (currentConversationId != null) {
        utils.aiAssistant.getHistory.invalidate();
        utils.aiAssistant.listConversations.invalidate();
      }
    },
  });
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const deleteConversationMutation = trpc.aiAssistant.deleteConversation.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Histórico excluído.");
      utils.aiAssistant.listConversations.invalidate();
      if (currentConversationId === variables.conversationId) {
        setCurrentConversationId(null);
        setCopilotMessages([]);
        setCopilotInput("");
      }
    },
    onSettled: () => setDeletingConversationId(null),
  });

  const isNewEmptyChat = currentConversationId == null && copilotMessages.length === 0;

  const handleNewChat = () => {
    if (isNewEmptyChat) return;
    createNewConversationMutation.mutate();
  };

  const handleClearCurrentChat = () => {
    if (currentConversationId != null) {
      clearHistoryMutation.mutate({ conversationId: currentConversationId });
    } else {
      setCopilotMessages([]);
      setCopilotInput("");
    }
  };

  const handleDeleteConversation = (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConversationMutation.isPending) return;
    deleteConversationMutation.mutate({ conversationId });
  };

  const createMutation = trpc.openClawAutomations.create.useMutation({
    onSuccess: () => {
      toast.success("Automação criada com sucesso!");
      utils.openClawAutomations.list.invalidate();
      setForm({
        name: "",
        description: "",
        triggerEvent: "new_lead",
        actionType: "send_email",
        minScore: "0.7",
        executionMode: "manual_approval",
        emailTemplate: "welcome",
      });
      setEditingId(null);
      setActiveTab("automations");
    },
  });

  const updateMutation = trpc.openClawAutomations.update.useMutation({
    onSuccess: () => {
      toast.success("Automação atualizada!");
      utils.openClawAutomations.list.invalidate();
      setEditingId(null);
      setForm({
        name: "",
        description: "",
        triggerEvent: "new_lead",
        actionType: "send_email",
        minScore: "0.7",
        executionMode: "manual_approval",
        emailTemplate: "welcome",
      });
    },
  });

  const deleteMutation = trpc.openClawAutomations.delete.useMutation({
    onSuccess: () => {
      toast.success("Automação removida");
      utils.openClawAutomations.list.invalidate();
    }
  });

  const copilotMutation = trpc.aiAssistant.chat.useMutation({
    onSuccess: (data) => {
      setCopilotMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content, action: data.action },
      ]);
      if (data.conversationId != null) setCurrentConversationId(data.conversationId);
      utils.aiAssistant.getHistory.invalidate();
    },
  });

  // Ao entrar na aba Copiloto: sempre começar em chat novo (só ao mudar de aba)
  useEffect(() => {
    const isCopilot = activeTab === "copilot";
    if (isCopilot && !prevCopilotTabRef.current) {
      setCurrentConversationId(null);
      setCopilotMessages([]);
    }
    prevCopilotTabRef.current = isCopilot;
  }, [activeTab]);

  // Carregar mensagens quando selecionar uma conversa da lista
  useEffect(() => {
    if (activeTab !== "copilot" || currentConversationId == null || historyData === undefined || copilotMutation.isPending) return;
    const list = (historyData.messages ?? []).filter((m) => m.role !== "system") as { role: "user" | "assistant"; content: string }[];
    setCopilotMessages(list.map((m) => ({ role: m.role, content: m.content })));
  }, [activeTab, historyData, currentConversationId, copilotMutation.isPending]);

  const executeActionMutation = trpc.aiAssistant.executeAction.useMutation({
    onSuccess: (res) => {
      toast.success(res.message || "Ação executada com sucesso!");
      const data = res as { message?: string; data?: { whatsappUrl?: string } };
      if (data.data?.whatsappUrl) {
        window.open(data.data.whatsappUrl, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao executar a ação.");
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [copilotMessages]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccessOpenClawAutomations) {
    return (
      <DashboardLayout>
        <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className={`border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 ${COLORS.bg}`}>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-amber-900 mb-3">Recurso Premium</h2>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Automações OpenClaw estão disponíveis apenas para planos Professional e Enterprise.
                </p>
                <Button
                  className="mt-8 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Ver Planos
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const handleEdit = (automation: any) => {
    setForm({
      name: automation.name,
      description: automation.description,
      triggerEvent: automation.triggerEvent,
      actionType: automation.actionType,
      minScore: automation.minScore.toString(),
      executionMode: automation.executionMode,
      emailTemplate: automation.emailTemplate || "welcome",
    });
    setEditingId(automation.id);
    setActiveTab("create");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta automação?")) {
      deleteMutation.mutate({ id: Number(id) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          name: form.name,
          description: form.description,
          triggerEvent: form.triggerEvent,
          actionType: form.actionType,
          executionMode: form.executionMode,
          minScore: form.minScore
        }
      });
    } else {
      createMutation.mutate({
        name: form.name,
        description: form.description,
        triggerEvent: form.triggerEvent,
        actionType: form.actionType,
        executionMode: form.executionMode,
        minScore: form.minScore,
        actionConfig: "{}"
      });
    }
  };

  const handleCopilotSend = async () => {
    if (!copilotInput.trim()) return;

    const userMessage = copilotInput;
    const newUserMsg: Message = { role: "user", content: userMessage };
    setCopilotMessages((prev) => [...prev, newUserMsg]);
    setCopilotInput("");

    const msgs = [...copilotMessages, newUserMsg].map(m => ({
      role: m.role,
      content: m.content
    }));
    copilotMutation.mutate({ conversationId: currentConversationId ?? undefined, messages: msgs });
  };

  const handleExecuteAction = (action: any) => {
    executeActionMutation.mutate({ type: action.type, data: action.data });
  };

  const handleQuickQuestion = (question: string) => {
    const newUserMsg: Message = { role: "user", content: question };
    setCopilotMessages((prev) => [...prev, newUserMsg]);
    const msgs = [...copilotMessages, newUserMsg].map(m => ({
      role: m.role,
      content: m.content
    }));
    copilotMutation.mutate({ conversationId: currentConversationId ?? undefined, messages: msgs });
  };

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/30">
                  <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    OpenClaw <span className="text-blue-500">Automations</span>
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium">IA Generativa para qualificação e conversão de leads</p>
                </div>
              </div>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <TabsList className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl h-auto flex-wrap gap-2">
              <TabsTrigger value="automations" className="rounded-xl px-4 sm:px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-xs sm:text-sm">
                Minhas Automações
              </TabsTrigger>
              <TabsTrigger value="create" className="rounded-xl px-4 sm:px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-xs sm:text-sm">
                {editingId ? "Editar Automação" : "Nova Automação"}
              </TabsTrigger>
              <TabsTrigger value="copilot" className="rounded-xl px-4 sm:px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold text-xs sm:text-sm">
                IA Copiloto
              </TabsTrigger>
            </TabsList>

            {/* Automations Tab */}
            <TabsContent value="automations" className="space-y-6">
              {automationsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                </div>
              ) : automations.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-2 border-slate-800 bg-slate-900/30 py-20">
                  <CardContent className="text-center">
                    <Zap className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma automação ativa</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">Crie sua primeira regra de IA para automatizar o acompanhamento dos seus leads.</p>
                    <Button onClick={() => setActiveTab("create")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-6 h-auto text-lg font-bold">
                      <Plus className="mr-2 h-5 w-5" /> Criar Primeira Automação
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {automations.map((automation: any) => (
                    <motion.div key={automation.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <Card className="rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-all group shadow-lg hover:shadow-blue-500/5">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Zap className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(automation)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(automation.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{automation.name}</h3>
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{automation.description || "Sem descrição."}</p>
                          <div className="space-y-3 pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Gatilho:</span>
                              <Badge variant="outline" className="border-slate-700 text-slate-300">{TRIGGER_OPTIONS.find(o => o.value === automation.triggerEvent)?.label}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Ação:</span>
                              <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/20">{ACTION_OPTIONS.find(o => o.value === automation.actionType)?.label}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Modo:</span>
                              <Badge variant="secondary" className="bg-slate-800 text-slate-300">{automation.executionMode === 'automatic' ? 'Automático' : 'Aprovação Manual'}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Create/Edit Tab */}
            <TabsContent value="create">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="rounded-2xl border-slate-800 bg-slate-900/50 shadow-2xl">
                  <CardContent className="p-6 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-white font-bold">Nome da Automação</Label>
                          <Input
                            placeholder="Ex: Boas-vindas Lead Quente"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-white rounded-xl h-12 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white font-bold">Gatilho (Trigger)</Label>
                          <Select value={form.triggerEvent} onValueChange={(v) => setForm({ ...form, triggerEvent: v })}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              {TRIGGER_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-white font-bold">Descrição</Label>
                        <Textarea
                          placeholder="O que esta automação faz?"
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="bg-slate-950 border-slate-800 text-white rounded-xl min-h-[100px] focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                          <Label className="text-white font-bold">Ação</Label>
                          <Select value={form.actionType} onValueChange={(v) => setForm({ ...form, actionType: v })}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              {ACTION_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white font-bold">Score Mínimo (IA)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={form.minScore}
                            onChange={(e) => setForm({ ...form, minScore: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white font-bold">Modo de Execução</Label>
                          <Select value={form.executionMode} onValueChange={(v: any) => setForm({ ...form, executionMode: v })}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              <SelectItem value="manual_approval">Aprovação Manual</SelectItem>
                              <SelectItem value="automatic">Totalmente Automático</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="pt-6 flex gap-4">
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 py-6 h-auto text-lg font-bold flex-1 sm:flex-none" disabled={createMutation.isPending || updateMutation.isPending}>
                          {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          {editingId ? "Salvar Alterações" : "Criar Automação"}
                        </Button>
                        {editingId && (
                          <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setActiveTab("automations"); }} className="text-slate-400 hover:text-white rounded-xl px-10 py-6 h-auto text-lg font-bold">
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Copiloto Tab */}
            <TabsContent value="copilot">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl border-0 shadow-2xl bg-slate-900 overflow-hidden flex flex-row h-[650px] sm:h-[750px]">
                  {/* Sidebar - lista de conversas */}
                  <div className="shrink-0 w-64 sm:w-72 bg-slate-950 border-r border-slate-700 flex flex-col">
                    <div className="shrink-0 p-4 border-b border-slate-700 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-400" />
                      <h3 className="text-sm font-black text-white">Copiloto</h3>
                    </div>
                    <Button
                      onClick={handleNewChat}
                      disabled={isNewEmptyChat || createNewConversationMutation.isPending}
                      className="m-3 rounded-xl h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {createNewConversationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Nova conversa
                    </Button>
                    <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Conversas</p>
                      {conversationsList.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-slate-500">Nenhuma conversa ainda</p>
                      ) : (
                        <div className="space-y-1">
                          {conversationsList.map((c) => {
                            const date = c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
                            const hasTitle = !!(c.title && c.title.trim());
                            const label = hasTitle ? c.title!.trim() : (date || `Conversa #${c.id}`);
                            const isActive = currentConversationId === c.id;
                            return (
                              <div
                                key={c.id}
                                className={`group flex items-center gap-1 w-full rounded-lg border ${isActive ? "bg-blue-600/20 border-blue-500/40" : "border-transparent hover:bg-slate-800"}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setCurrentConversationId(c.id)}
                                  className={`flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "text-blue-300" : "text-slate-400 hover:text-slate-200"}`}
                                  title={date ? `${label} · ${date}` : label}
                                >
                                  <span className="block truncate">{label}</span>
                                  {hasTitle && date && <span className="block text-[10px] text-slate-500 mt-0.5 truncate">{date}</span>}
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => handleDeleteConversation(c.id, e)}
                                  disabled={deletingConversationId != null}
                                  title="Excluir histórico"
                                >
                                  {deletingConversationId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Área do chat - sempre começa vazia (chat novo) */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900/80">
                      <h2 className="text-sm font-bold text-slate-300">
                        {currentConversationId == null ? "Nova conversa" : "Conversa"}
                      </h2>
                      {currentConversationId != null && (
                        <Button
                          onClick={handleClearCurrentChat}
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-white text-xs"
                          disabled={clearHistoryMutation.isPending}
                        >
                          {clearHistoryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eraser className="h-3 w-3" />}
                          Limpar
                        </Button>
                      )}
                    </div>
                  <CardContent className="flex-1 min-h-0 flex flex-col p-0 bg-slate-900/50 relative">
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-8">
                      <div className="space-y-8 max-w-4xl mx-auto pb-4">
                        {copilotMessages.length === 0 && !historyFetching ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <Lightbulb className="h-8 w-8 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-black text-white mb-4">Bem-vindo ao Copiloto de Vendas</h3>
                            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
                              Faça perguntas sobre seus leads, estratégias de vendas ou automações. A IA analisará seus dados em tempo real.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {QUICK_QUESTIONS.map((q, idx) => (
                                <motion.button
                                  key={idx}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => handleQuickQuestion(q.question)}
                                  className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-all text-left group"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all">
                                      <q.icon className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                      <p className="text-white text-sm font-bold mb-1">{q.question}</p>
                                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-tighter">{q.description}</p>
                                    </div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          copilotMessages.map((m, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                                <div className={`flex items-center gap-2 mb-1 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                  <div className={`p-1.5 rounded-lg ${m.role === "user" ? "bg-blue-600" : "bg-slate-800"}`}>
                                    {m.role === "user" ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-blue-400" />}
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {m.role === "user" ? "Você" : "Copiloto Sales"}
                                  </span>
                                </div>
                                <div className={`p-4 sm:p-6 rounded-2xl shadow-xl leading-relaxed text-sm sm:text-base ${
                                  m.role === "user" 
                                    ? "bg-blue-600 text-white rounded-tr-none" 
                                    : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                                }`}>
                                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:m-0 prose-strong:text-blue-400 prose-strong:font-black prose-em:text-slate-300 prose-li:m-0 prose-ul:m-0 prose-ul:p-0 prose-ul:pl-4 prose-ol:m-0 prose-ol:p-0 prose-ol:pl-4">
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="text-blue-300 font-black">{children}</strong>,
                                      em: ({ children }) => <em className="text-slate-300">{children}</em>,
                                      ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
                                      li: ({ children }) => <li className="text-slate-200">{children}</li>,
                                    }}
                                  >
                                    {m.content}
                                  </ReactMarkdown>
                                  </div>

                                  {/* Botão de Ação Dinâmica - Só aparece na última mensagem da IA se houver ação */}
                                  {m.role === "assistant" && m.action && idx === copilotMessages.length - 1 && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }} 
                                      animate={{ opacity: 1, y: 0 }} 
                                      className="mt-6 pt-6 border-t border-slate-700/50"
                                    >
                                      <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-4 w-4 text-amber-400" />
                                        <span className="text-xs font-black uppercase tracking-tighter text-amber-400">Ação Sugerida pela IA – você pode executar agora</span>
                                      </div>
                                      <Button
                                        onClick={() => handleExecuteAction(m.action)}
                                        disabled={executeActionMutation.isPending}
                                        className={`w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black py-6 rounded-xl shadow-lg shadow-blue-500/20 group transition-all`}
                                      >
                                        {executeActionMutation.isPending ? (
                                          <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                          <>
                                            <CheckCircle2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                            {m.action.type === "create_lead" ? "Criar Lead" : m.action.type === "create_appointment" ? "Agendar Agora" : m.action.type === "update_lead_status" ? "Atualizar Status" : "Confirmar & Executar Agora"}
                                          </>
                                        )}
                                      </Button>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                        {copilotMutation.isPending && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              <span className="text-xs font-bold text-slate-400 animate-pulse">Analisando dados e preparando estratégias...</span>
                            </div>
                          </motion.div>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    </div>

                    {/* Input Area - fixo embaixo */}
                    <div className="shrink-0 p-4 sm:p-8 bg-slate-950 border-t border-slate-800">
                      <div className="max-w-4xl mx-auto relative">
                        <Input
                          placeholder="Pergunte qualquer coisa ao seu Copiloto..."
                          value={copilotInput}
                          onChange={(e) => setCopilotInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCopilotSend()}
                          disabled={copilotMutation.isPending}
                          className="w-full bg-slate-900 border-slate-700 text-white rounded-2xl pl-6 pr-16 py-8 h-auto focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600 font-medium"
                        />
                        <Button
                          onClick={handleCopilotSend}
                          disabled={copilotMutation.isPending || !copilotInput.trim()}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 w-12 p-0 shadow-lg shadow-blue-500/20"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                      <p className="text-center text-[10px] text-slate-600 mt-4 font-bold uppercase tracking-widest">O Copiloto pode cometer erros. Sempre valide ações críticas.</p>
                    </div>
                  </CardContent>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
