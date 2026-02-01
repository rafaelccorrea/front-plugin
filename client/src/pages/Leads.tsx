import { useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlanLimitBanner } from "@/components/PlanLimitBanner";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  Download,
  Plus,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const urgencyConfig = {
  cold: { label: "❄️ Frio", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  warm: { label: "🌡️ Morno", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  hot: { label: "🔥 Quente", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const statusConfig = {
  new: { label: "Novo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  contacted: { label: "Contatado", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  qualified: { label: "Qualificado", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  lost: { label: "Perdido", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  converted: { label: "Convertido", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

export default function Leads() {
  const [, navigate] = useLocation();
  const { limits, getLeadsPercentage } = usePlanLimits();
  const [filter, setFilter] = useState({
    status: "all",
    search: "",
  });

  const { data: leadsData, isLoading, error } = trpc.leads.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const leads = leadsData?.data || [];
  const leadsPercentage = getLeadsPercentage(leads.length);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filter.status !== "all" && lead.status !== filter.status) {
        return false;
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          (lead.name?.toLowerCase().includes(searchLower) || false) ||
          (lead.phone?.includes(filter.search) || false) ||
          (lead.email?.toLowerCase().includes(searchLower) || false)
        );
      }
      return true;
    });
  }, [leads, filter]);

  const [isExporting, setIsExporting] = useState(false);

  const escapeCsvValue = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }, []);

  const handleExportLeads = useCallback(() => {
    if (filteredLeads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }
    setIsExporting(true);
    try {
      const headers = [
        "Nome", "Email", "Telefone", "Status", "Urgência", 
        "Objetivo", "Tipo de Imóvel", "Bairro", "Orçamento", 
        "Pontuação", "Data de criação"
      ];
      const rows = filteredLeads.map((lead) => [
        escapeCsvValue(lead.name),
        escapeCsvValue(lead.email),
        escapeCsvValue(lead.phone),
        escapeCsvValue(lead.status),
        escapeCsvValue(lead.urgency),
        escapeCsvValue(lead.objective),
        escapeCsvValue(lead.propertyType),
        escapeCsvValue(lead.neighborhood),
        escapeCsvValue(lead.budget),
        escapeCsvValue(lead.score),
        lead.createdAt ? new Date(lead.createdAt).toLocaleString("pt-BR") : "",
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filteredLeads.length} lead(s) exportado(s) com sucesso`);
    } catch (e) {
      toast.error("Erro ao exportar leads");
    } finally {
      setIsExporting(false);
    }
  }, [filteredLeads, escapeCsvValue]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Carregando seus leads...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Users className="h-10 w-10 text-primary" />
              Gestão de Leads
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe, qualifique e converta seus contatos do WhatsApp.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 px-6 font-bold border-2"
              onClick={handleExportLeads}
              disabled={isExporting || filteredLeads.length === 0}
            >
              {isExporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
              Exportar CSV
            </Button>
            <Button
              className="h-12 px-6 font-bold shadow-lg shadow-primary/20"
              onClick={() => navigate("/leads/new")}
            >
              <Plus className="h-5 w-5 mr-2" /> Novo Lead
            </Button>
          </div>
        </div>

        {/* Plan Limit Banner */}
        {limits.maxLeads !== Infinity && (
          <PlanLimitBanner
            title="Capacidade de Leads"
            current={leads.length}
            limit={limits.maxLeads}
            unit=" leads"
          />
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-2xl font-black">{leads.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Novos</p>
                <p className="text-2xl font-black text-blue-500">{leads.filter(l => l.status === "new").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-500/10 p-3 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Qualificados</p>
                <p className="text-2xl font-black text-green-500">{leads.filter(l => l.status === "qualified").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-red-500/10 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quentes 🔥</p>
                <p className="text-2xl font-black text-red-500">{leads.filter(l => l.urgency === "hot").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-primary w-full opacity-50" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Busque por nome, email ou telefone..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="pl-12 h-12 text-lg border-none bg-muted/50 focus-visible:ring-primary"
                />
              </div>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className="h-12 w-full md:w-[200px] font-bold border-2">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="new">🆕 Novo</SelectItem>
                  <SelectItem value="contacted">📞 Contatado</SelectItem>
                  <SelectItem value="qualified">⭐ Qualificado</SelectItem>
                  <SelectItem value="lost">❌ Perdido</SelectItem>
                  <SelectItem value="converted">💰 Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-bold py-5 px-6">Lead</TableHead>
                    <TableHead className="font-bold">Informações</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Urgência</TableHead>
                    <TableHead className="font-bold">Score IA</TableHead>
                    <TableHead className="font-bold text-right px-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="h-12 w-12 text-muted-foreground opacity-20" />
                          <p className="text-xl font-bold text-muted-foreground">Nenhum lead encontrado.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => {
                      const urgency = (lead.urgency || "cold") as keyof typeof urgencyConfig;
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
                                  {lead.name || "Sem Nome"}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {new Date(lead.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold flex items-center gap-1">
                                <Phone className="h-3 w-3 text-primary" /> {lead.phone || "---"}
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
                            <Badge className={`${urgencyConfig[urgency].color} border px-3 py-1 font-bold`}>
                              {urgencyConfig[urgency].label}
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
                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 hover:bg-primary/10 hover:text-primary"
                                onClick={() => navigate(`/leads/${lead.id}`)}
                              >
                                <Eye className="h-5 w-5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 hover:bg-blue-500/10 hover:text-blue-500"
                                onClick={() => navigate(`/leads/${lead.id}/edit`)}
                              >
                                <Edit className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
