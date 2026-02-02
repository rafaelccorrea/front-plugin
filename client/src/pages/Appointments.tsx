import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShimmer } from "@/components/PageShimmer";
import { 
  Calendar, Clock, User, Phone, 
  ExternalLink, AlertCircle, Loader2,
  CalendarDays, CheckCircle2, Video, PhoneCall, MapPin,
  RefreshCw, XCircle, MoreVertical
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const typeConfig = {
  visit: { label: "Visita ao Imóvel", icon: MapPin, color: "text-blue-500 bg-blue-500/10" },
  call: { label: "Chamada Telefônica", icon: PhoneCall, color: "text-green-500 bg-green-500/10" },
  meeting: { label: "Reunião Presencial", icon: User, color: "text-purple-500 bg-purple-500/10" },
  video: { label: "Vídeo Chamada", icon: Video, color: "text-orange-500 bg-orange-500/10" },
};

export default function Appointments() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: appointmentsData, isLoading } = trpc.appointments.list.useQuery({});
  
  const updateMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("Compromisso atualizado com sucesso!");
      utils.appointments.list.invalidate();
      setIsEditModalOpen(false);
    },
    onError: (err) => {
      toast.error("Erro ao atualizar compromisso: " + err.message);
    }
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const appointments = appointmentsData?.data || [];

  const handleOpenEdit = (appt: any) => {
    setEditingAppointment(appt);
    const date = new Date(appt.startTime);
    setNewDate(date.toISOString().split('T')[0]);
    setNewTime(date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = (id: number, status: string) => {
    updateMutation.mutate({ id, status });
  };

  const handleReschedule = () => {
    if (!editingAppointment) return;
    const startTime = `${newDate}T${newTime}:00`;
    updateMutation.mutate({ 
      id: editingAppointment.id, 
      startTime,
      status: "scheduled" 
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShimmer page="appointments" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <CalendarDays className="h-10 w-10 text-primary" />
              Agenda de Compromissos
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie suas visitas e reuniões agendadas com seus leads.
            </p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Você pode agendar novos compromissos diretamente na página de edição de cada lead.
              </p>
              <Button onClick={() => navigate("/leads")} className="mt-6 font-bold">
                Ver Meus Leads
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {appointments.map(({ appointment, lead }) => {
              const type = (appointment.type || "visit") as keyof typeof typeConfig;
              const Config = typeConfig[type] || typeConfig.visit;
              const Icon = Config.icon;
              const isCanceled = appointment.status === "canceled";
              const isCompleted = appointment.status === "completed";

              return (
                <Card key={appointment.id} className={`border-none shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all group ${isCanceled ? 'opacity-60' : ''}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className={`md:w-48 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r ${Config.color}`}>
                        <Icon className="h-8 w-8 mb-2" />
                        <span className="font-bold text-sm uppercase tracking-wider">{Config.label}</span>
                        {isCanceled && <Badge variant="destructive" className="mt-2">Cancelado</Badge>}
                        {isCompleted && <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-500">Concluído</Badge>}
                      </div>
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <h3 className={`text-xl font-bold group-hover:text-primary transition-colors ${isCanceled ? 'line-through' : ''}`}>
                              {appointment.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="h-4 w-4" /> 
                                {new Date(appointment.startTime).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-4 w-4" /> 
                                {new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="font-bold border-2" onClick={() => navigate(`/leads/${lead?.id}`)}>
                              <User className="h-4 w-4 mr-2" /> {lead?.name || "Lead"}
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {!isCanceled && !isCompleted && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenEdit(appointment)} className="font-bold text-primary">
                                      <RefreshCw className="h-4 w-4 mr-2" /> Reagendar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, "completed")} className="font-bold text-green-500">
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar Concluído
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, "canceled")} className="font-bold text-destructive">
                                      <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(isCanceled || isCompleted) && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, "scheduled")} className="font-bold">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Reativar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigate(`/leads/${lead?.id}/edit`)}>
                                  <ExternalLink className="h-4 w-4 mr-2" /> Ver Detalhes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {appointment.description && (
                          <p className="text-muted-foreground bg-muted/30 p-3 rounded-lg border italic">
                            "{appointment.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de Reagendamento */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Reagendar Compromisso</DialogTitle>
              <DialogDescription>
                Escolha uma nova data e hora para este agendamento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className="font-bold">Nova Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="font-medium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time" className="font-bold">Nova Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="font-medium"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="font-bold">
                Cancelar
              </Button>
              <Button onClick={handleReschedule} disabled={updateMutation.isPending} className="font-bold bg-primary hover:bg-primary/90">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Confirmar Reagendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
