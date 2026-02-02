import { useState, useRef, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  MessageCircle,
  Plus,
  Send,
  User,
  Headphones,
  Inbox,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import { PageShimmer } from '@/components/PageShimmer';

function UserSupportContent() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: userTickets, isLoading: ticketsLoading, refetch: refetchTickets } = trpc.support.getUserTickets.useQuery(
    undefined,
    { refetchOnWindowFocus: true }
  );
  const createTicketMutation = trpc.support.createTicket.useMutation();
  const addMessageMutation = trpc.support.addMessage.useMutation();
  const markSupportRepliesReadMutation = trpc.notifications.markSupportRepliesAsReadForTicket.useMutation({
    onSuccess: async () => {
      await utils.notifications.list.invalidate();
      await utils.notifications.list.prefetch({ limit: 100, onlyUnread: true });
    },
  });

  useWebSocket({
    onNotification: useCallback((n: unknown) => {
      const data = n as { type?: string };
      if (data?.type === 'new_support_message' || data?.type === 'support_reply') {
        refetchTickets();
        // Não mostrar toast quando já está na página de suporte
      }
    }, [refetchTickets]),
  });

  useEffect(() => {
    const list = Array.isArray(userTickets?.data) ? userTickets.data : [];
    setTickets(list);
  }, [userTickets]);

  useEffect(() => {
    if (!selectedTicket?.id || !userTickets?.data?.length) return;
    const list = userTickets.data as { id: string }[];
    const updated = list.find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  }, [userTickets?.data, selectedTicket?.id]);

  useEffect(() => {
    if (selectedTicket) {
      const list = Array.isArray(selectedTicket.messages) ? selectedTicket.messages : [];
      setMessages(list);
      const ticketId = Number(selectedTicket.id);
      if (Number.isFinite(ticketId)) {
        markSupportRepliesReadMutation.mutate({ ticketId });
      }
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTicket = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (title.trim().length < 3) {
      toast.error('Assunto deve ter pelo menos 3 caracteres');
      return;
    }
    if (description.trim().length < 5) {
      toast.error('Descrição deve ter pelo menos 5 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const newTicket = await createTicketMutation.mutateAsync({
        title,
        description,
      });

      setTickets([...tickets, newTicket]);
      setTitle('');
      setDescription('');
      setIsOpen(false);

      toast.success('Ticket criado com sucesso');
    } catch (error: unknown) {
      const err = error as { message?: string; data?: { code?: string } };
      let msg = 'Falha ao criar ticket';
      if (typeof err?.message === 'string') {
        try {
          const issues = JSON.parse(err.message);
          if (Array.isArray(issues) && issues.length > 0) {
            msg = issues.map((i: { message?: string }) => i.message).filter(Boolean).join('. ') || msg;
          }
        } catch {
          if (err.message && err.message.length < 200) msg = err.message;
        }
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    if (addMessageMutation.isPending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    try {
      await addMessageMutation.mutateAsync({
        ticketId: selectedTicket.id,
        message: textToSend,
      });

      setMessages((prev) => [
        ...prev,
        {
          content: textToSend,
          message: textToSend,
          isAdmin: false,
          senderType: 'user',
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.success('Mensagem enviada');
    } catch {
      setNewMessage(textToSend);
      toast.error('Falha ao enviar mensagem');
    }
  };

  const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    open: {
      label: 'Aberto',
      icon: Clock,
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    pending: {
      label: 'Pendente',
      icon: Loader2,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    resolved: {
      label: 'Resolvido',
      icon: CheckCircle2,
      className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    },
  };
  const getStatus = (status: string) => statusConfig[status] || statusConfig.open;

  if (ticketsLoading) {
    return <PageShimmer page="userSupport" />;
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            Meus Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe suas conversas com o suporte
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo ticket
        </Button>
      </div>

      {/* Layout: lista + chat */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 rounded-2xl overflow-hidden border border-border/50 bg-card/30 backdrop-blur-sm">
        {/* Lista de tickets */}
        <aside className="lg:col-span-1 flex flex-col border-r border-border/50 bg-muted/20 min-h-[420px] lg:min-h-0">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              Conversas
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {ticketsLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-2xl bg-muted/50 p-6 mb-4">
                  <MessageCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhum ticket ainda</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Crie um ticket para falar com o suporte
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tickets.map((ticket) => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  const status = getStatus(ticket.status);
                  const StatusIcon = status.icon;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        'group w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3',
                        isSelected
                          ? 'bg-primary/15 border border-primary/30 shadow-sm'
                          : 'hover:bg-muted/50 border border-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
                          isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium truncate text-sm',
                            isSelected ? 'text-foreground' : 'text-foreground/90'
                          )}
                        >
                          {ticket.subject ?? ticket.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ticket.lastMessage
                            ? `${ticket.messageCount ?? 0} mensagens · ${new Date(ticket.updatedAt ?? ticket.createdAt).toLocaleDateString('pt-BR')}`
                            : new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn('mt-2 text-[10px] font-medium', status.className)}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0 transition-opacity',
                          isSelected ? 'text-primary opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Área do chat – mesma altura que a lista */}
        <section className="lg:col-span-2 flex flex-col min-h-0 bg-card/50 overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Cabeçalho do chat */}
              <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border/50 bg-muted/10">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground truncate">
                    {selectedTicket.subject ?? selectedTicket.title}
                  </h2>
                  {selectedTicket.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {selectedTicket.lastMessage}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0', getStatus(selectedTicket.status).className)}
                >
                  {getStatus(selectedTicket.status).label}
                </Badge>
              </div>

              {/* Mensagens - área com altura fixa e scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col scroll-smooth">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="rounded-2xl bg-muted/30 p-8 mb-4">
                      <Sparkles className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                      Envie a primeira mensagem e nossa equipe responderá em breve.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const sorted = [...messages].sort((a, b) => {
                      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return dateA - dateB;
                    });
                    return sorted.map((msg, idx) => {
                      const isReceived = msg.senderType === 'admin' || msg.isAdmin;
                      const isSent = !isReceived;
                      const prevMsg = sorted[idx - 1];
                      const prevFromOther = prevMsg
                        ? (prevMsg.senderType === 'admin' || prevMsg.isAdmin) !== isReceived
                        : true;
                      const extraTop = prevFromOther ? 'mt-5' : 'mt-2';
                      return (
                        <div
                          key={`msg-${idx}-${msg.id ?? 'n'}`}
                          className={cn(
                            'flex gap-3',
                            isReceived ? 'justify-start' : 'justify-end',
                            extraTop
                          )}
                        >
                          {isReceived && (
                            <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Headphones className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div
                            className={cn(
                              'flex flex-col max-w-[85%] sm:max-w-md',
                              isReceived ? 'items-start' : 'items-end',
                              isReceived && 'bg-muted/40 rounded-2xl rounded-tl-md px-3 py-2'
                            )}
                          >
                            <span
                              className={cn(
                                'text-xs font-semibold mb-1.5',
                                isSent ? 'text-primary' : 'text-muted-foreground'
                              )}
                            >
                              {isSent ? 'Você' : (msg.name ?? 'Suporte')}
                            </span>
                            <div
                              className={cn(
                                'px-4 py-2.5 rounded-2xl shadow-sm',
                                isReceived
                                  ? 'rounded-tl-md bg-muted/80 text-foreground border border-border/50'
                                  : 'rounded-tr-md bg-primary text-primary-foreground'
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.text ?? msg.content ?? msg.message}
                              </p>
                              <p className="text-[10px] opacity-80 mt-1.5">
                                {msg.time ||
                                  (msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '')}
                              </p>
                            </div>
                          </div>
                          {isSent && (
                            <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 p-4 border-t border-border/50 bg-muted/10">
                <div className="flex gap-2 rounded-xl bg-background border border-border p-2 shadow-sm">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (addMessageMutation.isPending) return;
                        handleSendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || addMessageMutation.isPending}
                    className="shrink-0 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90"
                  >
                    {addMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="rounded-2xl bg-muted/30 p-10 mb-6">
                <MessageCircle className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Selecione um ticket</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                Escolha uma conversa na lista ao lado para ver as mensagens e continuar o atendimento.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal: novo ticket */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </span>
              Novo ticket
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário para criar um novo ticket de suporte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Assunto</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Dúvida sobre integração"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva seu problema ou dúvida..."
                className="bg-background min-h-[120px] resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar ticket'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function UserSupport() {
  return (
    <DashboardLayout>
      <UserSupportContent />
    </DashboardLayout>
  );
}
