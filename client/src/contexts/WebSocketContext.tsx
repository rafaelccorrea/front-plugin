import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface WebSocketMessage {
  type: string;
  data?: unknown;
  message?: string;
  timestamp?: string;
}

type NotificationHandler = (notification: unknown) => void;

interface WebSocketContextValue {
  isConnected: boolean;
  send: (message: unknown) => boolean;
  subscribe: (onNotification: NotificationHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_RECONNECT_DELAY = 30000;

function buildWsUrl(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  // Em dev o front pode estar em 5173 e o backend em 5000: usar VITE_API_URL para o WebSocket
  const apiUrl = import.meta.env.VITE_API_URL;
  let wsHost: string;
  let wsProtocol: string;

  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      wsHost = url.host;
      wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    } catch {
      wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsHost = window.location.host;
    }
  } else {
    wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsHost = window.location.host;
  }

  return `${wsProtocol}//${wsHost}/api/ws?token=${encodeURIComponent(token)}`;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const subscribersRef = useRef<Set<NotificationHandler>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const wsUrl = buildWsUrl();
    if (!wsUrl) {
      return;
    }

    // Evitar múltiplas conexões
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      if (typeof console !== "undefined" && console.log) {
        console.log("[WebSocket] Conectando (conexão única)...");
      }
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === "notification" && message.data !== undefined) {
            subscribersRef.current.forEach((cb) => {
              try {
                cb(message.data);
              } catch (e) {
                console.error("[WebSocket] Erro em subscriber:", e);
              }
            });
          }
        } catch (e) {
          console.error("[WebSocket] Erro ao processar mensagem:", e);
        }
      };

      ws.onerror = () => {
        // Log reduzido para não poluir; onclose também será chamado
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error("[WebSocket] Erro ao conectar:", error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Evitar reconexão
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((message: unknown) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((onNotification: NotificationHandler) => {
    subscribersRef.current.add(onNotification);
    return () => {
      subscribersRef.current.delete(onNotification);
    };
  }, []);

  // Conectar quando há token; reconectar quando token muda
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      connect();
    } else {
      disconnect();
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "auth_token") return;
      if (e.newValue) {
        connect();
      } else {
        disconnect();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      disconnect();
    };
  }, [connect, disconnect]);

  const value: WebSocketContextValue = {
    isConnected,
    send,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return ctx;
}
