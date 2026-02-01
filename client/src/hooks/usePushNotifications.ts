import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  const subscribeMutation = trpc.notifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribe.useMutation();

  // Verificar suporte a Web Push API
  useEffect(() => {
    const isSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported && "serviceWorker" in navigator) {
      // Registrar service worker
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[Push] Service Worker registered:", registration);
          checkSubscriptionStatus(registration);
        })
        .catch((error) => {
          console.error("[Push] Service Worker registration failed:", error);
          setState((prev) => ({
            ...prev,
            error: "Falha ao registrar Service Worker",
          }));
        });
    }
  }, []);

  // Verificar status de subscrição
  const checkSubscriptionStatus = async (
    registration: ServiceWorkerRegistration
  ) => {
    try {
      const subscription = await registration.pushManager.getSubscription();
      setState((prev) => ({ ...prev, isSubscribed: !!subscription }));
    } catch (error) {
      console.error("[Push] Error checking subscription status:", error);
    }
  };

  // Solicitar permissão de notificação
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Notificações push não são suportadas neste navegador",
      }));
      return false;
    }

    try {
      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }

      return false;
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
      setState((prev) => ({
        ...prev,
        error: "Erro ao solicitar permissão de notificações",
      }));
      return false;
    }
  }, [state.isSupported]);

  // Subscrever a notificações push
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Notificações push não são suportadas",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Solicitar permissão
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Permissão de notificações negada",
        }));
        return false;
      }

      // Obter service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Gerar VAPID public key (você precisa gerar isso no backend)
      // Por enquanto, usamos um placeholder
      const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || "";

      if (!vapidPublicKey) {
        console.warn("[Push] VAPID public key not configured");
      }

      // Subscrever ao push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
          ? (urlBase64ToUint8Array(vapidPublicKey) as any)
          : undefined,
      });

      // Enviar subscrição para o backend
      const authKey = subscription.getKey("auth");
      const p256dhKey = subscription.getKey("p256dh");
      
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        auth: authKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey as any))))
          : "",
        p256dh: p256dhKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey as any))))
          : "",
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("[Push] Error subscribing to push notifications:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erro ao subscrever a notificações push",
      }));
      return false;
    }
  }, [state.isSupported, requestPermission, subscribeMutation]);

  // Desinscrever de notificações push
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });

        await subscription.unsubscribe();

        setState((prev) => ({
          ...prev,
          isSubscribed: false,
          isLoading: false,
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error("[Push] Error unsubscribing from push notifications:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erro ao desinscrever de notificações push",
      }));
      return false;
    }
  }, [unsubscribeMutation]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Converter VAPID public key de base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): any {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray as any;
}
