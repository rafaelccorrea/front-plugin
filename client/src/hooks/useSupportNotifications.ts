import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "./useWebSocket";
import { useNotificationSound } from "./useNotificationSound";

interface SupportNotificationPayload {
  type: "new_support_message" | "ticket_status_changed";
  ticketId?: string;
  message?: string;
  senderType?: "user" | "admin";
}

/**
 * Hook para contar notificações não lidas de suporte.
 * Usa a lista de notificações do banco (support_reply) para garantir que o badge apareça
 * mesmo quando o WebSocket falhar ou o usuário estiver offline.
 * Refetch ao reconectar WebSocket e ao voltar à aba.
 */
export function useSupportNotifications() {
  const [previousCount, setPreviousCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Contagem confiável: notificações não lidas do tipo support_reply no banco
  const { data: notificationsData, refetch: refetchNotifications } = trpc.notifications.list.useQuery(
    { limit: 100, onlyUnread: true },
    { refetchOnWindowFocus: true, staleTime: 1000 * 30 }
  );
  const supportUnreadCount =
    notificationsData?.data?.filter((n) => n.type === "support_reply").length ?? 0;

  // Tickets: para refetch em tempo real e tocar som quando chegar mensagem
  const { refetch: refetchTickets } = trpc.support.getUserTickets.useQuery(undefined, {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });

  const { playSound } = useNotificationSound();

  const handleNewSupportNotification = useCallback(
    (notification: SupportNotificationPayload) => {
      if (
        notification.type === "new_support_message" &&
        notification.senderType === "admin"
      ) {
        refetchNotifications();
        refetchTickets();
        playSound();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      }
    },
    [refetchNotifications, refetchTickets, playSound]
  );

  useWebSocket({
    onNotification: (notification: unknown) => {
      const n = notification as SupportNotificationPayload;
      if (n.type === "new_support_message" || n.type === "ticket_status_changed") {
        handleNewSupportNotification(n);
      }
    },
    onConnected: () => {
      // Ao reconectar, buscar notificações e tickets para não perder nada
      refetchNotifications();
      refetchTickets();
    },
  });

  // Ao voltar à aba, atualizar contagem
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refetchNotifications();
        refetchTickets();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refetchNotifications, refetchTickets]);

  // Som e animação quando a contagem sobe (ex.: refetch trouxe nova notificação)
  useEffect(() => {
    if (supportUnreadCount > previousCount && supportUnreadCount > 0) {
      playSound();
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    setPreviousCount(supportUnreadCount);
  }, [supportUnreadCount, previousCount, playSound]);

  // Polling de fallback a cada 20s para garantir que não perca notificação
  useEffect(() => {
    const interval = setInterval(() => {
      refetchNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [refetchNotifications]);

  return {
    unreadCount: supportUnreadCount,
    isLoading: false,
    refetch: refetchNotifications,
    isAnimating,
  };
}
