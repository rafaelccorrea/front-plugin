import { useEffect, useRef } from "react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface UseWebSocketOptions {
  onNotification?: (notification: unknown) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook que usa a conexão WebSocket única do app (WebSocketContext).
 * Múltiplos componentes podem chamar useWebSocket sem abrir várias conexões.
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { isConnected, send, subscribe } = useWebSocketContext();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const unsubscribe = subscribe((notification) => {
      optionsRef.current.onNotification?.(notification);
    });
    return unsubscribe;
  }, [subscribe]);

  // Callbacks de estado (opcional; chamados quando isConnected muda)
  const prevConnectedRef = useRef<boolean | null>(null);
  useEffect(() => {
    const prev = prevConnectedRef.current;
    prevConnectedRef.current = isConnected;
    if (prev === null) {
      if (isConnected) optionsRef.current.onConnected?.();
      return;
    }
    if (prev && !isConnected) optionsRef.current.onDisconnected?.();
    if (!prev && isConnected) optionsRef.current.onConnected?.();
  }, [isConnected]);

  return {
    isConnected,
    send,
    disconnect: () => {}, // A desconexão é feita pelo provider (ex.: logout)
    reconnect: () => {}, // A reconexão é automática pelo provider
  };
}
