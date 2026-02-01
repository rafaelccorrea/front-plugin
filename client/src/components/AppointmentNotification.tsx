import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, BellOff, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export function AppointmentNotification() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("appointment_sound_enabled");
    return saved === null ? true : saved === "true";
  });
  const notifiedIds = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: upcomingData } = trpc.appointments.getUpcoming.useQuery(undefined, {
    refetchInterval: 60000, // Verificar a cada minuto
  });

  useEffect(() => {
    localStorage.setItem("appointment_sound_enabled", soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    if (!upcomingData?.data) return;

    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    upcomingData.data.forEach(({ appointment, lead }) => {
      const startTime = new Date(appointment.startTime);
      
      // Se faltarem exatamente entre 14 e 16 minutos para o agendamento
      const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (diffMinutes > 0 && diffMinutes <= 15.5 && !notifiedIds.current.has(appointment.id)) {
        // Notificação Visual
        toast.info(`Lembrete: ${appointment.title}`, {
          description: `Com ${lead?.name} em 15 minutos (${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
          duration: 10000,
          action: {
            label: "Ver Lead",
            onClick: () => window.location.href = `/leads/${lead?.id}`
          }
        });

        // Alerta Sonoro
        if (soundEnabled) {
          playNotificationSound();
        }

        notifiedIds.current.add(appointment.id);
      }
    });
  }, [upcomingData, soundEnabled]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      }
      audioRef.current.play().catch(e => console.error("Erro ao reproduzir som:", e));
    } catch (error) {
      console.error("Erro ao carregar áudio:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0 shrink bg-card/50 backdrop-blur-sm border px-2 sm:px-3 py-1.5 rounded-full shadow-sm">
      <div className="flex items-center gap-1.5 min-w-0">
        {soundEnabled ? (
          <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse shrink-0" />
        ) : (
          <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        )}
        <Label htmlFor="sound-toggle" className="text-[10px] sm:text-xs font-bold cursor-pointer truncate max-w-[4.5rem] sm:max-w-none hidden sm:block">
          Alertas 15min
        </Label>
      </div>
      <Switch
        id="sound-toggle"
        checked={soundEnabled}
        onCheckedChange={setSoundEnabled}
        className="data-[state=checked]:bg-primary shrink-0 scale-90 sm:scale-100"
      />
    </div>
  );
}
