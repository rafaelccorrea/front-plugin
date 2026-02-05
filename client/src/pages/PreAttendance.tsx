import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones,
  MessageSquare,
  Send,
  User,
  Bot,
  UserCircle,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_TYPE_LABEL: Record<string, { label: string; icon: typeof Bot; color: string }> = {
  conversation_read: { label: "Conversa lida", icon: MessageSquare, color: "bg-slate-500/20 text-slate-400" },
  lead_captured: { label: "Lead capturado", icon: UserCircle, color: "bg-green-500/20 text-green-400" },
  ai_reply_sent: { label: "Resposta da IA", icon: Bot, color: "bg-violet-500/20 text-violet-400" },
  manual_reply_sent: { label: "Resposta manual", icon: User, color: "bg-blue-500/20 text-blue-400" },
};

export default function PreAttendance() {
  const [contactPhone, setContactPhone] = useState("");
  const [messageText, setMessageText] = useState("");
  const [contactFilter, setContactFilter] = useState<string | undefined>(undefined);

  const { data: eventsData, isLoading: loadingEvents, refetch: refetchEvents } = trpc.preAttendance.listEvents.useQuery(
    { limit: 80, contactPhone: contactFilter },
    { refetchInterval: 6000 }
  );
  const { data: pendingData, isLoading: loadingPending, refetch: refetchPending } = trpc.preAttendance.listPending.useQuery(
    undefined,
    { refetchInterval: 8000 }
  );

  const utils = trpc.useUtils();
  const enqueueMutation = trpc.preAttendance.enqueueMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enfileirada. Será enviada quando você abrir o chat no WhatsApp.");
      setMessageText("");
      void utils.preAttendance.listPending.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const removePendingMutation = trpc.preAttendance.removePending.useMutation({
    onSuccess: () => {
      toast.success("Mensagem removida da fila.");
      void utils.preAttendance.listPending.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const events = eventsData?.items ?? [];
  const pending = pendingData?.items ?? [];

  const handleEnqueue = () => {
    const phone = contactPhone.replace(/\D/g, "").trim();
    if (!phone || phone.length < 10) {
      toast.error("Informe um telefone válido (com DDD).");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Digite a mensagem.");
      return;
    }
    enqueueMutation.mutate({
      contactPhone: phone,
      messageText: messageText.trim(),
    });
  };

  const uniqueContacts = Array.from(
    new Map(
      events
        .filter((e) => e.contactPhone || e.contactName)
        .map((e) => [e.contactPhone || e.contactName || "", { phone: e.contactPhone, name: e.contactName }])
    ).values()
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Headphones className="h-10 w-10 text-primary" />
              Pré-atendimento
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe o atendimento da IA em tempo quase real e envie mensagens pelo dashboard.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchEvents();
              refetchPending();
              toast.success("Atualizado");
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna: eventos em tempo (cronologia) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Atividade recente
                </CardTitle>
                <CardDescription>
                  Conversas lidas, leads capturados e respostas (IA ou manual) enviadas pela extensão.
                </CardDescription>
                {uniqueContacts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant={contactFilter === undefined ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setContactFilter(undefined)}
                    >
                      Todos
                    </Button>
                    {uniqueContacts.slice(0, 8).map((c) => {
                      const key = c.phone || c.name || "";
                      const label = (c.name || c.phone || key).slice(0, 20);
                      const active = contactFilter === (c.phone || key);
                      return (
                        <Button
                          key={key}
                          variant={active ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setContactFilter(c.phone || key)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loadingEvents ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Nenhum evento ainda. Ative o pré-atendimento na extensão e use o WhatsApp Web.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y max-h-[480px] overflow-y-auto">
                    {events.map((ev) => {
                      const config = EVENT_TYPE_LABEL[ev.eventType] ?? {
                        label: ev.eventType,
                        icon: MessageSquare,
                        color: "bg-muted text-muted-foreground",
                      };
                      const Icon = config.icon;
                      return (
                        <li key={ev.id} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-md ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">
                                  {ev.contactName || ev.contactPhone || "Contato"}
                                </span>
                                <Badge variant="secondary" className={config.color}>
                                  {config.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                              {ev.messageText && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.messageText}</p>
                              )}
                              {ev.conversationSnippet && !ev.messageText && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.conversationSnippet}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna: enviar mensagem + fila pendente */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Enviar mensagem
                </CardTitle>
                <CardDescription>
                  A mensagem será enviada quando você abrir o chat desse contato no WhatsApp Web (com a extensão).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Telefone (com DDD)</label>
                  <Input
                    placeholder="Ex: 5511999999999"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Mensagem</label>
                  <Textarea
                    placeholder="Digite a mensagem que será enviada no WhatsApp..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleEnqueue}
                  disabled={enqueueMutation.isPending || !contactPhone.trim() || !messageText.trim()}
                >
                  {enqueueMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enfileirar mensagem
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b bg-primary/5">
                <CardTitle className="text-base">Fila de envio</CardTitle>
                <CardDescription>Mensagens aguardando a abertura do chat na extensão.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingPending ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : pending.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem na fila.</p>
                  </div>
                ) : (
                  <ul className="divide-y max-h-[240px] overflow-y-auto">
                    {pending.map((p) => (
                      <li key={p.id} className="p-4 flex items-center justify-between gap-2 hover:bg-muted/30">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-medium truncate">{p.contactPhone}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.messageText}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removePendingMutation.mutate({ id: p.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Como funciona</p>
              <p>
                Com a extensão instalada e o pré-atendimento ativado, a IA lê novas conversas e pode responder
                automaticamente. Aqui você acompanha os eventos (conversa lida, lead capturado, resposta enviada) e
                pode enfileirar mensagens: ao abrir o chat desse contato no WhatsApp Web, a extensão envia a
                mensagem em fila e remove da lista.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
