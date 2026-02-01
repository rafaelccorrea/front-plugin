import AdminLayout from "@/components/AdminLayout";
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

  // Queries do Stripe
  const ticketsQuery = trpc.support.getTickets.useQuery(undefined, { refetchOnWindowFocus: true });
  const statsQuery = trpc.support.getStats.useQuery();
  const addMessageMutation = trpc.support.addMessage.useMutation();
  const updateStatusMutation = trpc.support.updateTicketStatus.useMutation();
  const createTicketMutation = trpc.support.createTicket.useMutation();

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
        toast.info("Novo ticket aberto", { description: data.message ?? `${data.userName}: ${data.subject}` });
      }
      if (data?.type === "new_support_message" && data?.senderType === "user") {
        ticketsQuery.refetch();
        toast.info("Nova mensagem no ticket", { description: data.message ?? data.subject });
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Suporte ao Cliente</h1>
            <p className="text-slate-400 mt-1">
              Gerencie tickets de suporte e dúvidas dos usuários
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Novo Ticket</DialogTitle>
                <DialogDescription className="sr-only">Formulário para criar um novo ticket de suporte.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Assunto</label>
                  <Input
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    placeholder="Título do ticket..."
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Descrição</label>
                  <Textarea
                    value={newTicketDescription}
                    onChange={(e) => setNewTicketDescription(e.target.value)}
                    placeholder="Descreva o problema..."
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-700 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={isCreatingTicket}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreatingTicket ? "Criando..." : "Criar Ticket"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-4">
              <p className="text-slate-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalTickets}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-4">
              <p className="text-slate-400 text-sm">Abertos</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.openTickets}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-4">
              <p className="text-slate-400 text-sm">Resolvidos</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.resolvedTickets}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-4">
              <p className="text-slate-400 text-sm">Tempo Médio</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats.avgResolutionTime}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-4">
              <p className="text-slate-400 text-sm">Satisfação</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.customerSatisfaction}⭐</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tickets List */}
          <Card className="bg-slate-900/50 border-slate-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                />
              </div>

              {/* Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
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
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        selectedTicketId === ticket.id
                          ? "bg-blue-600/20 border border-blue-500"
                          : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{ticket.subject}</p>
                          <p className="text-xs text-slate-400 truncate">{ticket.user}</p>
                        </div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(ticket.status)}
                        <span className="text-xs text-slate-500">{ticket.lastUpdate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area - altura fixa e scrollável */}
          <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2 flex flex-col h-[520px] lg:h-[580px] overflow-hidden">
            {selectedTicket ? (
              <>
                {/* Header */}
                <CardHeader className="shrink-0 border-b border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{selectedTicket.subject}</CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        {selectedTicket.user} • {selectedTicket.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedTicket.status === "resolved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleReopenTicket}
                          className="border-slate-700 text-slate-300"
                        >
                          Reabrir
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleCloseTicket}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">{getStatusBadge(selectedTicket.status)}</div>
                </CardHeader>

                {/* Chat - área de mensagens com altura fixa e scroll */}
                <CardContent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    (() => {
                      const sorted = [...selectedTicket.messages].sort((a: any, b: any) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateA - dateB;
                      });
                      return sorted.map((msg: any, idx: number) => {
                        const isSent = msg.sender === "admin" || msg.isAdmin;
                        const isReceived = !isSent;
                        const prevMsg = sorted[idx - 1];
                        const prevFromOther = prevMsg
                          ? (prevMsg.sender === "admin" || prevMsg.isAdmin) !== isSent
                          : true;
                        const extraTop = prevFromOther ? "mt-5" : "mt-2";
                        return (
                          <div
                            key={msg.id ?? idx}
                            className={`flex gap-3 ${isSent ? "justify-start" : "justify-end"} ${extraTop}`}
                          >
                            {isSent && (
                              <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                <Headphones className="w-4 h-4 text-slate-300" />
                              </div>
                            )}
                            <div
                              className={`flex flex-col max-w-[75%] sm:max-w-md ${
                                isSent ? "items-start" : "items-end"
                              } ${isReceived ? "bg-slate-800/50 rounded-l-lg pr-2 pl-3 py-1.5 -mr-1" : ""}`}
                            >
                              <span
                                className={`text-xs font-semibold mb-1.5 px-0.5 ${
                                  isSent ? "text-slate-300" : "text-blue-300"
                                }`}
                              >
                                {isSent ? "Você" : (msg.name ?? selectedTicket.user)}
                              </span>
                              <div
                                className={`px-4 py-2.5 rounded-2xl ${
                                  isSent
                                    ? "rounded-tl-sm bg-slate-800 text-slate-100 border border-slate-600"
                                    : "rounded-tr-sm bg-blue-600 text-white"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text ?? msg.content}</p>
                                <p className="text-[10px] opacity-70 mt-1">{msg.time ?? msg.timestamp}</p>
                              </div>
                            </div>
                            {isReceived && (
                              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Nenhuma mensagem ainda. Envie a primeira!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Reply Input - área fixa no rodapé */}
                <div className="shrink-0 border-t border-slate-800 p-4 bg-slate-900/50">
                  <div className="flex gap-2">
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
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm min-h-[44px] resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleReply}
                      disabled={isReplying || addMessageMutation.isPending || !replyText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 shrink-0"
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
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Selecione um ticket para ver a conversa</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
