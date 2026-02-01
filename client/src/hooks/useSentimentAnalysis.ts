import React from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook para análise de sentimento em tempo real
 * Integra com a API de sentimento do backend
 */
export const useSentimentAnalysis = () => {
  const analyzeMutation = trpc.sentiment.analyze.useMutation();
  const analyzeBatchMutation = trpc.sentiment.analyzeBatch.useMutation();
  const suggestResponseMutation = trpc.sentiment.suggestResponse.useMutation();
  const checkAlertMutation = trpc.sentiment.checkAlert.useMutation();

  return {
    // Analisar uma única mensagem
    analyze: analyzeMutation,
    
    // Analisar múltiplas mensagens
    analyzeBatch: analyzeBatchMutation,
    
    // Obter sugestão de resposta
    suggestResponse: suggestResponseMutation,
    
    // Verificar se precisa alerta
    checkAlert: checkAlertMutation,

    // Estados combinados
    isLoading:
      analyzeMutation.isPending ||
      analyzeBatchMutation.isPending ||
      suggestResponseMutation.isPending ||
      checkAlertMutation.isPending,

    isError:
      analyzeMutation.isError ||
      analyzeBatchMutation.isError ||
      suggestResponseMutation.isError ||
      checkAlertMutation.isError,
  };
};

/**
 * Hook para análise em tempo real com WebSocket
 */
export const useLiveAnalysis = (conversationId: string) => {
  const [liveAnalysis, setLiveAnalysis] = React.useState(null);

  React.useEffect(() => {
    // Conectar a WebSocket para análise em tempo real
    const ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }/api/sentiment/live?conversationId=${conversationId}`
    );

    ws.onmessage = (event) => {
      const analysis = JSON.parse(event.data);
      setLiveAnalysis(analysis);
    };

    return () => ws.close();
  }, [conversationId]);

  return { liveAnalysis };
};
