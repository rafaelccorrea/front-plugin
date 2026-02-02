import DashboardLayout from "@/components/DashboardLayout";
import { PageShimmer } from "@/components/PageShimmer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  MessageSquare, 
  Search,
  Send,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ExternalLink,
  User,
  Zap,
  Clock,
  Filter
} from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusConfig = {
  new: { label: "Novo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  contacted: { label: "Contatado", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  qualified: { label: "Qualificado", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  lost: { label: "Perdido", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  converted: { label: "Convertido", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

export default function Conversations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  
  const { data: leadsResponse, isLoading, error } = trpc.leads.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  const leads = leadsResponse?.data || [];

  const filteredConversations = useMemo(() => {
    return leads.filter(lead =>
      (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (lead.phone?.includes(searchTerm) ?? false) ||
      (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  }, [leads, searchTerm]);

  const handleReply = (phone: string, suggestedResponse?: string) => {
    if (!phone) return toast.error("Telefone não disponível");
    
    const cleanPhone = phone.replace(/\D/g, "");
    const message = suggestedResponse ? encodeURIComponent(suggestedResponse) : "";
    
    toast.success("Abrindo WhatsApp com a resposta sugerida...");
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShimmer page="conversations" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100 max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Erro ao carregar dados</h3>
            <p className="text-red-600 mb-4">Não foi possível sincronizar suas conversas no momento.</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-red-200 text-red-700 hover:bg-red-100">
              Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 pb-12">
        {/* Header Modernizado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <MessageSquare className="h-10 w-10 text-primary" />
              Central de Conversas
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie e responda aos seus leads qualificados em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-card p-2 rounded-xl border shadow-sm">
            <div className="px-4 py-2 text-center border-r">
              <p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
              <p className="text-xl font-black text-primary">{leads.length}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Filtrados</p>
              <p className="text-xl font-black text-primary">{filteredConversations.length}</p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/50 to-primary w-full" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Busque por nome, telefone ou email do lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-none bg-muted/50 focus-visible:ring-primary"
                />
              </div>
              <Button variant="outline" className="h-12 px-6 font-bold border-2">
                <Filter className="h-5 w-5 mr-2" /> Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Conversas */}
        {filteredConversations.length === 0 ? (
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Tente ajustar os termos da busca ou comece a capturar leads pelo WhatsApp Web.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="font-bold py-5 px-6">Lead</TableHead>
                      <TableHead className="font-bold">Informações</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Score IA</TableHead>
                      <TableHead className="font-bold">Última Atividade</TableHead>
                      <TableHead className="font-bold text-right px-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversations.map((lead) => {
                      const status = (lead.status || "new") as keyof typeof statusConfig;
                      return (
                        <TableRow key={lead.id} className="group border-b border-muted/50 hover:bg-primary/5 transition-colors">
                          <TableCell className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {lead.name?.[0] || "U"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-lg group-hover:text-primary transition-colors">
                                  {lead.name || "Lead Desconhecido"}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" /> ID: #{lead.id}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" /> {lead.phone || "---"}
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {lead.email || "Sem e-mail"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig[status].color} border px-3 py-1 font-bold`}>
                              {statusConfig[status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-muted rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-primary h-full"
                                  style={{ width: `${(Number(lead.score) || 0) * 100}%` }}
                                />
                              </div>
                              <span className="font-black text-sm">{(Number(lead.score) || 0).toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 border-2 font-bold hover:bg-primary hover:text-white transition-all"
                                onClick={() => navigate(`/leads/${lead.id}`)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" /> Detalhes
                              </Button>
                              <Button
                                size="sm"
                                className="h-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                                onClick={() => handleReply(lead.phone || "", lead.suggestedResponse || undefined)}
                              >
                                <Send className="h-4 w-4 mr-2" /> Responder
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
