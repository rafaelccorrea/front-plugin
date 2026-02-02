import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, Calendar, Bell, Clock, User, Users,
  CheckCircle2, AlertCircle, ArrowRight, ExternalLink,
  MessageSquare, Star, Zap, Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CommandCenter() {
  const [, navigate] = useLocation();
  
  // Buscar agendamentos próximos
  const { data: upcomingData, isLoading: loadingAppointments } = trpc.appointments.getUpcoming.useQuery();
  
  const utils = trpc.useUtils();
  // Buscar notificações pendentes
  const { data: notificationsData, isLoading: loadingNotifications } = trpc.notifications.list.useQuery(
    { limit: 20, onlyUnread: true },
    { refetchOnWindowFocus: true }
  );
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notificação marcada como lida");
      void utils.notifications.list.invalidate();
      void utils.notifications.getUnreadSupportCount.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const appointments = upcomingData?.data || [];
  const notifications = notificationsData?.data || [];

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Zap className="h-10 w-10 text-primary" />
              Centro de Comando
            </h1>
            <p className="text-muted-foreground text-lg">
              Sua central de controle para agendamentos e alertas urgentes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna de Agendamentos (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>Próximos Compromissos</CardTitle>
                      <CardDescription>Suas visitas e reuniões para as próximas 24h</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="font-bold" onClick={() => navigate("/appointments")}>
                    Ver Agenda Completa <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingAppointments ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Tudo em dia! Sem compromissos próximos.</p>
                  </div>
                ) : (
                  <div className="divide-y border-t-0">
                    {appointments.map(({ appointment, lead }) => (
                      <div key={appointment.id} className="p-6 hover:bg-primary/5 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center bg-background border rounded-xl p-3 min-w-[70px] shadow-sm">
                            <span className="text-xs font-bold text-primary uppercase">
                              {new Date(appointment.startTime).toLocaleDateString('pt-BR', { month: 'short' })}
                            </span>
                            <span className="text-xl font-black">
                              {new Date(appointment.startTime).getDate()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg leading-none mb-2 group-hover:text-primary transition-colors">
                              {appointment.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {lead?.name}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="font-bold" onClick={() => navigate(`/leads/${lead?.id}`)}>
                          Ver Lead
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Atalhos Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer" onClick={() => navigate("/leads")}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8" />
                    <div>
                      <h4 className="font-bold text-lg">Gerenciar Leads</h4>
                      <p className="text-blue-100 text-sm">Acesse sua base completa</p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6" />
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer" onClick={() => navigate("/conversations")}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="h-8 w-8" />
                    <div>
                      <h4 className="font-bold text-lg">Ver Conversas</h4>
                      <p className="text-purple-100 text-sm">Responda seus clientes agora</p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coluna de Notificações (1/3) */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>Alertas e novidades pendentes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                {loadingNotifications ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma notificação nova.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 hover:bg-muted/50 transition-colors relative group"
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {notif.type === "new_lead" ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ) : notif.type === "support_reply" ? (
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-tight mb-1">{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notif.message}</p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                {new Date(notif.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <div className="flex items-center gap-1">
                                {notif.type === "support_reply" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs font-medium shrink-0"
                                    onClick={() => {
                                      handleMarkAsRead(notif.id);
                                      navigate("/support");
                                    }}
                                  >
                                    Ver ticket
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => handleMarkAsRead(notif.id)}>
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t bg-muted/20">
                <Button variant="outline" className="w-full font-bold text-xs h-9" onClick={() => navigate("/settings")}>
                  Configurar Alertas
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
