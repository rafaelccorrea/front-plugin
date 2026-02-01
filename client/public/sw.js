// Service Worker para Web Push Notifications

self.addEventListener("install", (event) => {
  console.log("[SW] Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker activating...");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received:", event.data);

  if (!event.data) {
    console.log("[SW] No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/logo.svg",
      badge: data.badge || "/logo.svg",
      tag: data.tag || "wa-sdr-notification",
      data: data.data || {},
      actions: [
        {
          action: "open",
          title: "Abrir",
        },
        {
          action: "close",
          title: "Fechar",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "WA-SDR", options)
    );
  } catch (error) {
    console.error("[SW] Error processing push notification:", error);
    event.waitUntil(
      self.registration.showNotification("WA-SDR Notificação", {
        body: event.data.text(),
        icon: "/logo.svg",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Abrir ou focar a janela da aplicação
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Procurar por uma janela já aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }

      // Se nenhuma janela está aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed");
});

// Sincronizar notificações em background
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Aqui você poderia fazer uma chamada para sincronizar notificações
    // quando o dispositivo voltar a estar online
    console.log("[SW] Syncing notifications...");
  } catch (error) {
    console.error("[SW] Error syncing notifications:", error);
  }
}
