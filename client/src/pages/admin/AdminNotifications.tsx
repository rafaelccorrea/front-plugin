import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("all");

  const sendNotificationMutation = trpc.notifications.sendNotification.useMutation({
    onSuccess: (result) => {
      toast.success(`Notificação enviada para ${result.sentCount} usuário(s)`);
      setTitle("");
      setMessage("");
      setRecipients("all");
    },
    onError: (error: any) => {
      console.error("Erro ao enviar notificação:", error);
      const isForbidden = error?.data?.code === "FORBIDDEN" || error?.message?.includes("permissão");
      if (isForbidden) {
        toast.error(
          "Acesso negado. Esta ação é restrita a administradores. Verifique se sua conta possui permissão de admin."
        );
      } else {
        toast.error(error.message || "Erro ao enviar notificação");
      }
    },
  });

  const sendNotification = async () => {
    if (!title.trim()) {
      toast.error("Por favor, preencha o título");
      return;
    }

    if (!message.trim()) {
      toast.error("Por favor, preencha a mensagem");
      return;
    }

    try {
      await sendNotificationMutation.mutateAsync({
        title,
        message,
        recipients,
      });
    } catch (error) {
      // Erro já é tratado no onError
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Notificações</h1>
          <p className="text-slate-400 mt-1">Envie notificações para usuários</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-400" />
              Enviar Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Título</label>
              <Input 
                placeholder="Título da notificação"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Mensagem</label>
              <Textarea 
                placeholder="Mensagem da notificação"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Destinatários</label>
              <select 
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2"
              >
                <option value="all">Todos os usuários</option>
                <option value="free">Usuários com plano Gratis</option>
                <option value="pro">Usuários com plano Pro</option>
                <option value="enterprise">Usuários com plano Enterprise</option>
              </select>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={sendNotification}
              disabled={sendNotificationMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendNotificationMutation.isPending ? "Enviando..." : "Enviar Notificação"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
