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
 * Usa a API getUnreadSupportCount do backend (badge confiável e fácil de invalidar).
 * Refetch ao reconectar WebSocket e ao voltar à aba.
 */
export function useSupportNotifications() {
  const [previousCount, setPreviousCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Contagem via API dedicada (badge atualiza ao invalidar getUnreadSupportCount)
  const {
    data: countData,
    refetch: refetchSupportCount,
  } = trpc.notifications.getUnreadSupportCount.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 1000 * 6,
  });
  const supportUnreadCount = countData?.count ?? 0;

  // Tickets: para refetch em tempo real e tocar som quando chegar mensagem
  const { refetch: refetchTickets } = trpc.support.getUserTickets.useQuery(undefined, {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });

  const { playSound } = useNotificationSound();

  const handleNewSupportNotification = useCallback(
    (notification: SupportNotificationPayload) => {
      if (notification.type !== "new_support_message") return;
      // User: atualizar quando admin responde (senderType === "admin")
      // Admin: atualizar quando usuário envia mensagem (senderType === "user")
      if (notification.senderType === "admin" || notification.senderType === "user") {
        refetchSupportCount();
        refetchTickets();
        playSound();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      }
    },
    [refetchSupportCount, refetchTickets, playSound]
  );

  useWebSocket({
    onNotification: (notification: unknown) => {
      const n = notification as SupportNotificationPayload;
      if (n.type === "new_support_message" || n.type === "ticket_status_changed") {
        handleNewSupportNotification(n);
      }
    },
    onConnected: () => {
      refetchSupportCount();
      refetchTickets();
    },
  });

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refetchSupportCount();
        refetchTickets();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refetchSupportCount, refetchTickets]);

  // Som e animação quando a contagem sobe (ex.: refetch trouxe nova notificação)
  useEffect(() => {
    if (supportUnreadCount > previousCount && supportUnreadCount > 0) {
      playSound();
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    setPreviousCount(supportUnreadCount);
  }, [supportUnreadCount, previousCount, playSound]);

  useEffect(() => {
    const interval = setInterval(() => refetchSupportCount(), 10000);
    return () => clearInterval(interval);
  }, [refetchSupportCount]);

  return {
    unreadCount: supportUnreadCount,
    isLoading: false,
    refetch: refetchSupportCount,
    isAnimating,
  };
}
