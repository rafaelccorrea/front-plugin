import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Bell, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NOTIFICATIONS_STORAGE_KEY = "notification_center_items";
const MAX_STORED = 100;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  sentAt: string;
  read?: boolean;
}

function loadStoredNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotifications(items: Notification[]) {
  try {
    const toStore = items.slice(0, MAX_STORED);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(loadStoredNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const { isConnected } = useWebSocket({
    onNotification: (notification: unknown) => {
      const n = notification as { title?: string; message?: string; type?: string; sentAt?: string };
      console.log("[NotificationCenter] Notificação recebida:", notification);

      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        title: n.title ?? "",
        message: n.message ?? "",
        type: n.type ?? "info",
        sentAt: n.sentAt ?? new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      toast.success(newNotification.title, {
        description: newNotification.message,
        duration: 5000,
      });

      // Reproduzir som (opcional)
      playNotificationSound();
    },
    onConnected: () => {
      console.log("[NotificationCenter] Conectado ao servidor de notificações");
    },
    onDisconnected: () => {
      console.log("[NotificationCenter] Desconectado do servidor de notificações");
    },
    onError: (error) => {
      console.error("[NotificationCenter] Erro WebSocket:", error);
    },
  });

  const playNotificationSound = () => {
    try {
      // Usar Web Audio API para criar um som simples
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("[NotificationCenter] Erro ao reproduzir som:", error);
    }
  };

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* Status de Conexão */}
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
        title={isConnected ? "Conectado" : "Desconectado"}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800 shrink-0"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="w-80 p-0 bg-slate-800 border-slate-700 rounded-lg shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">Notificações</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-700/50 transition-colors ${
                      !notification.read ? "bg-slate-700/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {notification.type === "admin_notification" ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                          <h4 className="font-semibold text-white text-sm">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {notification.sentAt
                            ? new Date(notification.sentAt).toLocaleTimeString("pt-BR")
                            : ""}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            Marcar como lida
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-slate-400 hover:text-white p-1 rounded"
                          aria-label="Remover"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={clearAll}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                Limpar Tudo
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
