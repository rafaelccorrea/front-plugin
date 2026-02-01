import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft, Save, Loader2, Phone, MessageSquare, 
  Mail, Calendar, Trash2, User, Home, MapPin, 
  DollarSign, Zap, Clock, CheckCircle2, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export default function LeadEdit() {
  const [location, navigate] = useLocation();
  const rawId = location.split("/").filter(Boolean)[1] || "";
  const leadId = parseInt(rawId, 10);
  const isValidId = Number.isFinite(leadId) && leadId > 0;
  const utils = trpc.useUtils();

  const { data: leadData, isLoading, error } = trpc.leads.getById.useQuery(
    { id: leadId },
    { enabled: isValidId }
  );

  const updateLeadMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso!");
      navigate(`/leads/${leadId}`);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar lead: ${err.message}`);
    },
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

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    objective: "unknown",
    propertyType: "",
    neighborhood: "",
    budget: "",
    urgency: "cold",
    status: "new",
    notes: "",
  });

  // Estado para o agendamento
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    type: "visit",
    description: ""
  });

  useEffect(() => {
    if (leadData?.data) {
      const lead = leadData.data;
      setFormData({
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        objective: (lead.objective as any) || "unknown",
        propertyType: lead.propertyType || "",
        neighborhood: lead.neighborhood || "",
        budget: lead.budget || "",
        urgency: (lead.urgency as any) || "cold",
        status: (lead.status as any) || "new",
        notes: lead.summary || "",
      });
    }
  }, [leadData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLeadMutation.mutate({
      id: leadId,
      updates: {
        ...formData,
        status: formData.status as "new" | "contacted" | "qualified" | "lost" | "converted",
        objective: formData.objective as "buy" | "rent" | "sell" | "unknown",
        urgency: formData.urgency as "cold" | "warm" | "hot",
      },
    });
  };

  const handleWhatsApp = () => {
    if (!formData.phone) return toast.error("Telefone não disponível");
    const cleanPhone = formData.phone.replace(/\D/g, "");
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
      title: `${typeLabels[scheduleData.type as keyof typeof typeLabels]} - ${formData.name}`,
      description: scheduleData.description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      type: scheduleData.type
    });
  };

  if (!isValidId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="p-4 bg-red-100 rounded-full text-red-600">
            <Trash2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">ID Inválido</h2>
          <p className="text-muted-foreground max-w-xs">Não conseguimos encontrar o lead com o ID fornecido.</p>
          <Button onClick={() => navigate("/leads")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full pb-12">
        {/* Top Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/leads/${leadId}`)}
              className="pl-0 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para detalhes
            </Button>
            <h1 className="text-4xl font-extrabold tracking-tight">Editar Perfil do Lead</h1>
            <p className="text-muted-foreground">Atualize as informações e gerencie as interações com o lead.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleWhatsApp} className="border-green-200 hover:bg-green-50 hover:text-green-700">
              <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            
            {/* Modal de Agendamento */}
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                  <Calendar className="h-4 w-4 mr-2" /> Agendar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" /> Novo Agendamento
                  </DialogTitle>
                  <DialogDescription>
                    Marque uma visita ou reunião com <strong>{formData.name}</strong>.
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

            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Info Principal */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Identificação</span>
                </div>
                <CardTitle className="text-2xl">Dados Pessoais</CardTitle>
                <CardDescription>Informações básicas de contato do cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} className="h-12 border-2 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground">Telefone / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="pl-10 h-12 border-2" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="pl-10 h-12 border-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Home className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Perfil Imobiliário</span>
                </div>
                <CardTitle className="text-2xl">Preferências de Imóvel</CardTitle>
                <CardDescription>O que o lead está buscando no mercado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Objetivo</Label>
                    <Select value={formData.objective} onValueChange={(v) => handleSelectChange("objective", v)}>
                      <SelectTrigger className="h-12 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">💎 Comprar</SelectItem>
                        <SelectItem value="rent">🔑 Alugar</SelectItem>
                        <SelectItem value="sell">🤝 Vender</SelectItem>
                        <SelectItem value="unknown">❓ Desconhecido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propertyType" className="text-xs font-bold uppercase text-muted-foreground">Tipo de Imóvel</Label>
                    <Input id="propertyType" name="propertyType" value={formData.propertyType} onChange={handleChange} placeholder="Ex: Apartamento, Casa de Rua..." className="h-12 border-2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-xs font-bold uppercase text-muted-foreground">Bairro de Interesse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="pl-10 h-12 border-2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-xs font-bold uppercase text-muted-foreground">Orçamento Estimado</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input id="budget" name="budget" value={formData.budget} onChange={handleChange} className="pl-10 h-12 border-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Zap className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Contexto</span>
                </div>
                <CardTitle className="text-2xl">Resumo e Notas</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  className="min-h-[200px] border-2 text-base leading-relaxed p-4"
                  placeholder="Detalhes da conversa, observações importantes e próximos passos..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Status & Ação */}
          <div className="space-y-8">
            <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-24 w-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Status da Negociação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase opacity-80">Temperatura</Label>
                  <Select value={formData.urgency} onValueChange={(v) => handleSelectChange("urgency", v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold">❄️ Frio</SelectItem>
                      <SelectItem value="warm">🌡️ Morno</SelectItem>
                      <SelectItem value="hot">🔥 Quente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase opacity-80">Fase do Funil</Label>
                  <Select value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="contacted">Contatado</SelectItem>
                      <SelectItem value="qualified">Qualificado</SelectItem>
                      <SelectItem value="converted">Convertido</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-white text-primary hover:bg-white/90 font-black h-14 text-lg shadow-xl"
                  disabled={updateLeadMutation.isPending}
                >
                  {updateLeadMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  ) : (
                    <Save className="h-6 w-6 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Lembrete
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Manter o status atualizado garante que os seus relatórios de analytics sejam precisos e que as notificações de agendamento funcionem corretamente.
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
