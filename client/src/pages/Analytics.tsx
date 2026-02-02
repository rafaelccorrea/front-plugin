import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageShimmer } from "@/components/PageShimmer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Target, CheckCircle, Calendar, Download, Loader, Clock, User, ExternalLink, FileText, Table } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6b7280", "#8b5cf6", "#ec4899"];

function UpcomingAppointments() {
  const { data: upcomingData, isLoading } = trpc.appointments.getUpcoming.useQuery();
  const appointments = upcomingData?.data || [];

  if (isLoading || appointments.length === 0) return null;

  return (
    <Card className="border-none shadow-xl bg-blue-500/5 border-blue-500/20 overflow-hidden mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
          <Calendar className="h-5 w-5" /> Próximos Agendamentos (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map(({ appointment, lead }) => (
            <div key={appointment.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-none mb-1 text-white">{appointment.title}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" /> {lead?.name} • {new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 group-hover:text-blue-400" onClick={() => window.location.href = `/leads/${lead?.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [isExporting, setIsExporting] = useState(false);

  const { data: analyticsData, isLoading: analyticsLoading } = trpc.analytics.getMetrics.useQuery({ period });

  const processedData = useMemo(() => {
    if (!analyticsData?.data) return null;

    const { metrics, timeline, bySource } = analyticsData.data;

    const leadsBySourceData = Object.entries(bySource || {}).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));

    const leadsByStatusData = [
      { status: "Novo", count: metrics.newLeads },
      { status: "Contatado", count: metrics.contactedLeads },
      { status: "Qualificado", count: metrics.qualifiedLeads },
      { status: "Convertido", count: metrics.convertedLeads },
    ].filter(item => item.count > 0);

    return {
      metrics: [
        {
          title: "Total de Leads",
          value: metrics.totalLeads.toString(),
          change: `${metrics.newLeads} novos`,
          icon: Users,
          color: "text-blue-400",
          trend: "up",
        },
        {
          title: "Taxa de Conversão",
          value: `${metrics.conversionRate}%`,
          change: `${metrics.convertedLeads} convertidos`,
          icon: Target,
          color: "text-green-400",
          trend: "up",
        },
        {
          title: "Leads Contatados",
          value: metrics.contactedLeads.toString(),
          change: `${metrics.qualifiedLeads} qualificados`,
          icon: CheckCircle,
          color: "text-purple-400",
          trend: "up",
        },
        {
          title: "Taxa de Engajamento",
          value: `${metrics.engagementRate}%`,
          change: "Últimos 7 dias",
          icon: TrendingUp,
          color: "text-yellow-400",
          trend: "up",
        },
      ],
      leadsBySource: leadsBySourceData,
      leadsByStatus: leadsByStatusData,
      timelineData: timeline || [],
    };
  }, [analyticsData]);

  const handleExportCSV = () => {
    if (!processedData) return;
    setIsExporting(true);
    try {
      const rows: string[][] = [
        ["Relatório de Desempenho - ChatLead Pro"],
        [`Período: ${period}`, `Data de Geração: ${new Date().toLocaleString('pt-BR')}`],
        [],
        ["Métrica", "Valor", "Observação"],
        ...processedData.metrics.map((m) => [m.title, m.value, m.change]),
        [],
        ["Distribuição por Status"],
        ["Status", "Quantidade"],
        ...processedData.leadsByStatus.map((s) => [s.status, s.count.toString()]),
      ];

      const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatlead-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (!processedData) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Cabeçalho do PDF
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Azul ChatLead
      doc.text("ChatLead Pro - Relatório de Analytics", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Período: ${period} | Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

      // Tabela de Métricas Principais
      autoTable(doc, {
        head: [["Métrica", "Valor", "Destaque"]],
        body: processedData.metrics.map((m) => [m.title, m.value, m.change]),
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Tabela de Status
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Distribuição por Status", 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        head: [["Status", "Quantidade de Leads"]],
        body: processedData.leadsByStatus.map((s) => [s.status, s.count.toString()]),
        startY: (doc as any).lastAutoTable.finalY + 20,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`chatlead-analytics-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (analyticsLoading) {
    return (
      <DashboardLayout>
        <PageShimmer page="analytics" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Analytics</h1>
            <p className="text-slate-400 mt-2 text-lg">Analise o desempenho dos seus leads em tempo real</p>
          </div>
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-white font-bold"
              onClick={handleExportCSV} 
              disabled={isExporting || !processedData}
            >
              <Table className="w-5 h-5 mr-2 text-green-400" /> Exportar CSV
            </Button>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
              onClick={handleExportPDF} 
              disabled={isExporting || !processedData}
            >
              <FileText className="w-5 h-5 mr-2" /> Exportar PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-800 text-white h-12 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <UpcomingAppointments />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {processedData?.metrics.map((metric, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-slate-800 border-2 hover:border-slate-700 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${metric.color.replace('text-', 'bg-').replace('-400', '-400/10')}`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{metric.title}</p>
                <h3 className="text-3xl font-black text-white mt-2">{metric.value}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-bold text-green-400">{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border-slate-800 border-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" /> Leads ao longo do tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData?.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }}
                    itemStyle={{ color: "#3b82f6", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 border-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" /> Leads por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData?.leadsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="status" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
