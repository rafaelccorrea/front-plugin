import AdminLayout from "@/components/AdminLayout";
import { PageShimmer } from "@/components/PageShimmer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Loader2,
  Filter,
  Plus,
  X,
  MessageCircle,
  Headphones,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function AdminSupport() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const ticketsQuery = trpc.support.getTickets.useQuery(undefined, { refetchOnWindowFocus: true });
  const statsQuery = trpc.support.getStats.useQuery();
  const addMessageMutation = trpc.support.addMessage.useMutation();
  const updateStatusMutation = trpc.support.updateTicketStatus.useMutation();
  const createTicketMutation = trpc.support.createTicket.useMutation();
  const markSupportRepliesReadMutation = trpc.notifications.markSupportRepliesAsReadForTicket.useMutation();

  const tickets = ticketsQuery.data?.data || [];
  const stats = statsQuery.data?.data || {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: "0h",
    customerSatisfaction: 0,
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  useWebSocket({
    onNotification: useCallback((n: unknown) => {
      const data = n as { type?: string; message?: string; subject?: string; userName?: string };
      if (data?.type === "new_support_ticket") {
        ticketsQuery.refetch();
        // Não mostrar toast quando já está na página de suporte admin
      }
      if (data?.type === "new_support_message" && data?.senderType === "user") {
        ticketsQuery.refetch();
        // Não mostrar toast quando já está na página de suporte admin
      }
    }, [ticketsQuery]),
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, tickets]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  // Marcar notificações do ticket como lidas ao abrir (badge do Suporte no drawer some)
  const lastMarkedTicketRef = useRef<string | null>(null);
  useEffect(() => {
    const ticketIdStr = selectedTicket?.id != null ? String(selectedTicket.id) : null;
    if (!ticketIdStr || lastMarkedTicketRef.current === ticketIdStr) return;
    const ticketId = Number(selectedTicket.id);
    if (!Number.isFinite(ticketId)) return;
    lastMarkedTicketRef.current = ticketIdStr;
    markSupportRepliesReadMutation.mutate(
      { ticketId },
      {
        onSettled: () => {
          void utils.notifications.list.invalidate();
          void queryClient.refetchQueries({ queryKey: [["notifications", "list"]] });
        },
      }
    );
  }, [selectedTicket?.id, utils.notifications.list, queryClient]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Aberto
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolvido
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Média</Badge>;
      case "low":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Baixa</Badge>;
      default:
        return null;
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) {
      toast.error("Digite uma resposta");
      return;
    }
    if (isReplying || addMessageMutation.isPending) return;

    const textToSend = replyText.trim();
    setIsReplying(true);
    setReplyText("");

    try {
      await addMessageMutation.mutateAsync({
        ticketId: selectedTicket.id,
        message: textToSend,
      });
      toast.success("Resposta enviada");
      ticketsQuery.refetch();
      scrollToBottom();
    } catch (error: any) {
      setReplyText(textToSend);
      toast.error(error.message || "Erro ao enviar resposta");
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      await updateStatusMutation.mutateAsync({
        ticketId: selectedTicket.id,
        status: "resolved",
      });
      toast.success("Ticket marcado como resolvido");
      ticketsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar ticket");
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      await updateStatusMutation.mutateAsync({
        ticketId: selectedTicket.id,
        status: "open",
      });
      toast.success("Ticket reaberto");
      ticketsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar ticket");
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketTitle.trim() || !newTicketDescription.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      setIsCreatingTicket(true);
      await createTicketMutation.mutateAsync({
        title: newTicketTitle,
        description: newTicketDescription,
      });
      setNewTicketTitle("");
      setNewTicketDescription("");
      setIsDialogOpen(false);
      toast.success("Ticket criado com sucesso");
      ticketsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar ticket");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const isLoading = ticketsQuery.isLoading || statsQuery.isLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <PageShimmer page="adminSupport" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
              <Headphones className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Suporte ao Cliente</h1>
              <p className="text-slate-400 mt-0.5">
                Gerencie tickets e responda às dúvidas dos usuários em tempo real
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-red-400" />
                  Criar Novo Ticket
                </DialogTitle>
                <DialogDescription className="sr-only">Formulário para criar um novo ticket de suporte.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-slate-300">Assunto</label>
                  <Input
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    placeholder="Título do ticket..."
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Descrição</label>
                  <Textarea
                    value={newTicketDescription}
                    onChange={(e) => setNewTicketDescription(e.target.value)}
                    placeholder="Descreva o problema ou contexto..."
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1.5 rounded-lg"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={isCreatingTicket}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isCreatingTicket ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Ticket"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900/40 border-slate-800/80 rounded-xl overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-slate-300" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-yellow-500/20 rounded-xl overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-yellow-400/80 text-xs font-medium uppercase tracking-wider">Abertos</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.openTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-green-500/20 rounded-xl overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-green-400/80 text-xs font-medium uppercase tracking-wider">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-400">{stats.resolvedTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/80 rounded-xl overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Tempo Médio</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.avgResolutionTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-purple-500/20 rounded-xl overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-purple-400/80 text-xs font-medium uppercase tracking-wider">Satisfação</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.customerSatisfaction} ⭐</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tickets List */}
          <Card className="bg-slate-900/40 border-slate-800/80 rounded-xl lg:col-span-1 overflow-hidden">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-red-400" />
                Tickets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por assunto ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 text-sm rounded-lg"
                />
              </div>

              {/* Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white rounded-lg">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abertos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>

              {/* Tickets */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-red-400" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredTickets.map((ticket) => (
                    <button
                      type="button"
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full text-left p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                        selectedTicketId === ticket.id
                          ? "bg-red-500/15 border-red-500/40 shadow-sm shadow-red-500/10"
                          : "bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{ticket.subject}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{ticket.user}</p>
                        </div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(ticket.status)}
                        <span className="text-xs text-slate-500">{ticket.lastUpdate}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area - altura fixa e scrollável */}
          <Card className="bg-slate-900/40 border-slate-800/80 rounded-xl lg:col-span-2 flex flex-col h-[520px] lg:h-[580px] overflow-hidden">
            {selectedTicket ? (
              <>
                {/* Header */}
                <CardHeader className="shrink-0 border-b border-slate-800/80 bg-slate-900/60 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-white text-lg truncate">{selectedTicket.subject}</CardTitle>
                      <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500 shrink-0" />
                        {selectedTicket.user} • {selectedTicket.email}
                      </p>
                      <div className="mt-2">{getStatusBadge(selectedTicket.status)}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {selectedTicket.status === "resolved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleReopenTicket}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Reabrir
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleCloseTicket}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Chat - área de mensagens com altura fixa e scroll */}
                <CardContent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-6 flex flex-col">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    (() => {
                      const sorted = [...selectedTicket.messages].sort((a: any, b: any) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateA - dateB;
                      });
                      return (
                        <div className="flex flex-col pb-8">
                          {sorted.map((msg: any, idx: number) => {
                            const isFromAdmin = msg.sender === "admin" || msg.isAdmin;
                            const isFromUser = !isFromAdmin;
                            const timeStr = msg.time ?? (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");
                            return (
                              <div
                                key={`msg-${idx}-${msg.id ?? "n"}`}
                                className="mt-8 first:mt-0"
                              >
                                <div
                                  className={`flex items-start gap-3 ${isFromAdmin ? "justify-end" : "justify-start"}`}
                                >
                                  {isFromUser && (
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 mt-1">
                                      <User className="w-5 h-5 text-slate-300" />
                                    </div>
                                  )}
                                  <div
                                    className={`flex flex-col max-w-[80%] sm:max-w-md min-w-0 ${isFromAdmin ? "items-end" : "items-start"}`}
                                  >
                                    <span className={`text-xs font-semibold mb-2 block ${isFromAdmin ? "text-red-400" : "text-slate-400"}`}>
                                      {isFromAdmin ? "Você (Suporte)" : (msg.name ?? selectedTicket.user)}
                                    </span>
                                    <div
                                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                        isFromAdmin
                                          ? "rounded-tr-md bg-red-600/90 text-white border border-red-500/50"
                                          : "rounded-tl-md bg-slate-800 text-slate-100 border border-slate-600/80"
                                      }`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {msg.text ?? msg.content}
                                      </p>
                                      <p className="text-[10px] opacity-80 mt-1.5 block">
                                        {timeStr}
                                      </p>
                                    </div>
                                  </div>
                                  {isFromAdmin && (
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center border border-red-500/50 mt-1">
                                      <Headphones className="w-5 h-5 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="h-14 w-14 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Nenhuma mensagem ainda</p>
                        <p className="text-slate-500 text-sm mt-1">Envie a primeira resposta ao usuário</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Reply Input - área fixa no rodapé */}
                <div className="shrink-0 border-t border-slate-800/80 p-4 bg-slate-900/60">
                  <div className="flex gap-2 rounded-xl bg-slate-800/80 border border-slate-700 p-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (isReplying || addMessageMutation.isPending) return;
                          handleReply();
                        }
                      }}
                      placeholder="Digite sua resposta..."
                      className="bg-transparent border-0 text-white placeholder:text-slate-500 text-sm min-h-[44px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      rows={1}
                    />
                    <Button
                      onClick={handleReply}
                      disabled={isReplying || addMessageMutation.isPending || !replyText.trim()}
                      className="bg-red-600 hover:bg-red-700 shrink-0 rounded-lg"
                    >
                      {isReplying || addMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <MessageCircle className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-medium">Nenhum ticket selecionado</p>
                  <p className="text-slate-500 text-sm mt-1">Escolha um ticket na lista para ver e responder a conversa</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
