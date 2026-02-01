import React from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook para gerenciar escalação inteligente
 */
export const useEscalation = () => {
  const checkEscalationMutation = trpc.escalation.checkEscalation.useMutation();
  const createAlertMutation = trpc.escalation.createAlert.useMutation();
  const getActiveAlertsQuery = trpc.escalation.getActiveAlerts.useQuery({});
  const getStatsQuery = trpc.escalation.getStats.useQuery({});
  const getAvailableAttendantsQuery =
    trpc.escalation.getAvailableAttendants.useQuery({});
  const getAllAttendantsQuery = trpc.escalation.getAllAttendants.useQuery({});
  const resolveAlertMutation = trpc.escalation.resolveAlert.useMutation();
  const updateAttendantStatusMutation =
    trpc.escalation.updateAttendantStatus.useMutation();
  const incrementConversationMutation =
    trpc.escalation.incrementConversation.useMutation();
  const decrementConversationMutation =
    trpc.escalation.decrementConversation.useMutation();

  return {
    // Verificar se deve escalar
    checkEscalation: checkEscalationMutation,

    // Criar alerta
    createAlert: createAlertMutation,

    // Obter alertas ativos
    activeAlerts: getActiveAlertsQuery.data || [],
    activeAlertsLoading: getActiveAlertsQuery.isLoading,

    // Obter estatísticas
    stats: getStatsQuery.data,
    statsLoading: getStatsQuery.isLoading,

    // Obter atendentes
    availableAttendants: getAvailableAttendantsQuery.data || [],
    allAttendants: getAllAttendantsQuery.data || [],
    attendantsLoading:
      getAvailableAttendantsQuery.isLoading ||
      getAllAttendantsQuery.isLoading,

    // Resolver alerta
    resolveAlert: resolveAlertMutation,

    // Gerenciar atendentes
    updateAttendantStatus: updateAttendantStatusMutation,
    incrementConversation: incrementConversationMutation,
    decrementConversation: decrementConversationMutation,

    // Estados combinados
    isLoading:
      checkEscalationMutation.isPending ||
      createAlertMutation.isPending ||
      resolveAlertMutation.isPending ||
      updateAttendantStatusMutation.isPending ||
      incrementConversationMutation.isPending ||
      decrementConversationMutation.isPending,

    isError:
      checkEscalationMutation.isError ||
      createAlertMutation.isError ||
      resolveAlertMutation.isError ||
      updateAttendantStatusMutation.isError ||
      incrementConversationMutation.isError ||
      decrementConversationMutation.isError,
  };
};

/**
 * Hook para gerenciar fila de espera
 */
export const useWaitingQueue = () => {
  const [queue, setQueue] = React.useState<string[]>([]);
  const [estimatedWaitTime, setEstimatedWaitTime] = React.useState(0);

  const addToQueue = (conversationId: string) => {
    setQueue((prev) => [...prev, conversationId]);
    // Calcular tempo estimado (5 minutos por pessoa na fila)
    setEstimatedWaitTime((queue.length + 1) * 5);
  };

  const removeFromQueue = (conversationId: string) => {
    setQueue((prev) => prev.filter((id) => id !== conversationId));
  };

  const getQueuePosition = (conversationId: string) => {
    return queue.indexOf(conversationId) + 1;
  };

  return {
    queue,
    estimatedWaitTime,
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    getQueuePosition,
  };
};
