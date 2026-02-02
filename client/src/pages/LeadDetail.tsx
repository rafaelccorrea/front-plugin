import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShimmer } from "@/components/PageShimmer";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Copy, Phone, Mail, MapPin, 
  DollarSign, Edit, MessageSquare, Calendar, 
  User, Home, Zap, Clock, TrendingUp, Trash2,
  ListChecks, Target, FileText, CheckCircle2, Loader2
} from "lucide-react";
import { toast } from "sonner";

const urgencyConfig = {
  cold: { label: "❄️ Frio", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  warm: { label: "🌡️ Morno", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  hot: { label: "🔥 Quente", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const statusConfig = {
  new: { label: "Novo", color: "bg-purple-500/10 text-purple-500" },
  contacted: { label: "Contatado", color: "bg-blue-500/10 text-blue-500" },
  qualified: { label: "Qualificado", color: "bg-green-500/10 text-green-500" },
  converted: { label: "Convertido", color: "bg-emerald-500/10 text-emerald-500" },
  lost: { label: "Perdido", color: "bg-gray-500/10 text-gray-500" },
};

const objectiveLabels = {
  buy: "💎 Comprar",
  rent: "🔑 Alugar",
  sell: "🤝 Vender",
  unknown: "❓ Desconhecido",
};

const defaultChecklist = [
  { id: "contact_validated", label: "Contato Validado" },
  { id: "budget_confirmed", label: "Orçamento Confirmado" },
  { id: "property_type_defined", label: "Tipo de Imóvel Definido" },
  { id: "neighborhood_defined", label: "Bairro de Preferência" },
  { id: "visit_scheduled", label: "Visita Agendada" },
  { id: "documentation_sent", label: "Documentação Enviada" },
];

export default function LeadDetail() {
  const [location, navigate] = useLocation();
  const rawId = location.split("/").pop() || "";
  const leadId = parseInt(rawId, 10);
  const isValidId = Number.isFinite(leadId) && leadId > 0;
  const utils = trpc.useUtils();

  const { data: leadData, isLoading, error } = trpc.leads.getById.useQuery(
    { id: leadId },
    { enabled: isValidId }
  );

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.getById.invalidate({ id: leadId });
    }
  });

  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento salvo com sucesso!");
      setIsScheduleOpen(false);
      utils.appointments.getUpcoming.invalidate();
      utils.appointments.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao salvar agendamento: ${err.message}`);
    }
  });

  const [checklist, setChecklist] = useState<string[]>([]);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    type: "visit",
    description: ""
  });

  useEffect(() => {
    if (leadData?.data?.qualificationChecklist) {
      try {
        setChecklist(JSON.parse(leadData.data.qualificationChecklist));
      } catch (e) {
        setChecklist([]);
      }
    }
  }, [leadData]);

  const toggleChecklistItem = (itemId: string) => {
    const newChecklist = checklist.includes(itemId)
      ? checklist.filter(id => id !== itemId)
      : [...checklist, itemId];
    
    setChecklist(newChecklist);
    updateMutation.mutate({
      id: leadId,
      updates: { qualificationChecklist: JSON.stringify(newChecklist) }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado com sucesso!");
  };

  const handleWhatsApp = () => {
    if (!lead?.phone) return toast.error("Telefone não disponível");
    const cleanPhone = lead.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const handleScheduleSubmit = () => {
    if (!scheduleData.date || !scheduleData.time) {
      return toast.error("Por favor, selecione data e hora.");
    }
    
    const startDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hora de duração padrão

    const typeLabels = {
      visit: "Visita ao Imóvel",
      meeting: "Reunião Presencial",
      call: "Chamada de Vídeo/Voz"
    };

    createAppointmentMutation.mutate({
      leadId: leadId,
      title: `${typeLabels[scheduleData.type as keyof typeof typeLabels]} - ${lead.name}`,
      description: scheduleData.description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      type: scheduleData.type
    });
  };

  if (!isValidId || error || (!isLoading && !leadData?.data)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Lead não encontrado</h2>
          <Button onClick={() => navigate("/leads")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShimmer page="leadDetail" />
      </DashboardLayout>
    );
  }

  const lead = leadData!.data;
  const urgency = (lead.urgency || "cold") as keyof typeof urgencyConfig;
  const status = (lead.status || "new") as keyof typeof statusConfig;
  const scoreValue = parseFloat(lead.score || "0");
  const progressPercent = Math.round((checklist.length / defaultChecklist.length) * 100);

  return (
    <DashboardLayout>
      <div className="w-full pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="pl-0 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista
            </Button>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-black tracking-tight">{lead.name || "Lead sem nome"}</h1>
              <Badge className={`${urgencyConfig[urgency].color} border px-3 py-1 text-sm font-bold`}>
                {urgencyConfig[urgency].label}
              </Badge>
              <Badge variant="outline" className={`${statusConfig[status].color} border-none font-bold`}>
                {statusConfig[status].label}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground text-sm">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Criado em {new Date(lead.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Score: <strong>{scoreValue.toFixed(2)}</strong></span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 h-12">
              <MessageSquare className="h-5 w-5 mr-2" /> WhatsApp
            </Button>
            
            {/* Modal de Agendamento */}
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12 px-6 font-bold border-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                  <Calendar className="h-5 w-5 mr-2" /> Agendar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" /> Novo Agendamento
                  </DialogTitle>
                  <DialogDescription>
                    Marque uma visita ou reunião com <strong>{lead.name}</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input id="date" type="date" value={scheduleData.date} onChange={(e) => setScheduleData(prev => ({...prev, date: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Hora</Label>
                      <Input id="time" type="time" value={scheduleData.time} onChange={(e) => setScheduleData(prev => ({...prev, time: e.target.value}))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Compromisso</Label>
                    <Select value={scheduleData.type} onValueChange={(v) => setScheduleData(prev => ({...prev, type: v}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visit">🏠 Visita ao Imóvel</SelectItem>
                        <SelectItem value="meeting">🤝 Reunião Presencial</SelectItem>
                        <SelectItem value="call">📞 Chamada de Vídeo/Voz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Observações</Label>
                    <Textarea id="desc" placeholder="Ex: Mostrar o apartamento da Rua X..." value={scheduleData.description} onChange={(e) => setScheduleData(prev => ({...prev, description: e.target.value}))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleScheduleSubmit} 
                    className="w-full h-12 text-lg font-bold"
                    disabled={createAppointmentMutation.isPending}
                  >
                    {createAppointmentMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                    )}
                    Confirmar Agendamento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => navigate(`/leads/${leadId}/edit`)} className="h-12 px-6 font-bold border-2">
              <Edit className="h-5 w-5 mr-2" /> Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Checklist de Qualificação */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <ListChecks className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>Checklist de Qualificação</CardTitle>
                      <CardDescription>Acompanhe o progresso da negociação</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">{progressPercent}%</span>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Concluído</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaultChecklist.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        checklist.includes(item.id) 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-background hover:border-primary/20'
                      }`}
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      <Checkbox 
                        id={item.id} 
                        checked={checklist.includes(item.id)}
                        className="h-5 w-5 border-2"
                      />
                      <label
                        htmlFor={item.id}
                        className={`text-sm font-bold leading-none cursor-pointer transition-colors ${
                          checklist.includes(item.id) ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact & Interest Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <User className="h-4 w-4" /> Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="group">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Telefone</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-semibold">{lead.phone || "Não informado"}</span>
                      {lead.phone && (
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lead.phone!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="group">
                    <label className="text-xs font-bold text-muted-foreground uppercase">E-mail</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-semibold truncate mr-2">{lead.email || "Não informado"}</span>
                      {lead.email && (
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lead.email!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Target className="h-4 w-4" /> Interesse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="group">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Objetivo</label>
                    <div className="mt-1">
                      <span className="text-lg font-semibold">{objectiveLabels[lead.objective as keyof typeof objectiveLabels] || "Não definido"}</span>
                    </div>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="group">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Imóvel</label>
                    <div className="mt-1">
                      <span className="text-lg font-semibold">{lead.propertyType || "Não informado"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary / Notes */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Resumo da Conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed italic">
                  {lead.summary ? (
                    lead.summary.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))
                  ) : (
                    "Nenhum resumo disponível para este lead."
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Home className="h-4 w-4" /> Localização & Verba
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Bairro</label>
                    <p className="font-bold">{lead.neighborhood || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Orçamento</label>
                    <p className="font-bold text-lg text-green-600">{lead.budget || "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" /> Insights da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                  <p className="text-xs font-bold uppercase opacity-70 mb-1">Próximo Passo Recomendado</p>
                  <p className="font-bold">Agendar uma visita técnica para validar o interesse no bairro {lead.neighborhood || "de interesse"}.</p>
                </div>
                <p className="text-xs opacity-70 leading-relaxed italic">
                  Com base na análise da conversa, o lead demonstra alta urgência e perfil compatível com o ticket médio da região.
                </p>
              </CardContent>
            </Card>

            <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 font-bold h-12">
              <Trash2 className="h-5 w-5 mr-2" /> Excluir Lead permanentemente
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
