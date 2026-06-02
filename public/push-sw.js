self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizePushPayload(event) {
  if (!event.data) {
    return {
      title: "🐄 माझी डेअरी",
      body: "नवीन सूचना आली आहे.",
      url: "/notifications"
    };
  }

  const text = event.data.text();
  const parsed = safeJsonParse(text);
  const payload = parsed || { body: text };
  const notification = payload.notification || {};
  const data = payload.data || {};

  return {
    id: payload.id || payload.notificationId || data.id || data.notificationId || payload.tag || `${Date.now()}`,
    title: payload.title || notification.title || data.title || "🐄 माझी डेअरी",
    body: payload.body || payload.message || notification.body || data.body || data.message || "नवीन सूचना आली आहे.",
    tag: payload.tag || data.tag || payload.id || payload.notificationId || "majhi-dairy-notification",
    url: payload.url || data.url || "/notifications",
    icon: payload.icon || notification.icon || data.icon || "/icons/icon-192x192.png",
    badge: payload.badge || notification.badge || data.badge || "/icons/icon-192x192.png"
  };
}

async function postNotificationToClients(notification) {
  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  });

  clientsList.forEach((client) => {
    client.postMessage({
      type: "MAJHI_DAIRY_PUSH_NOTIFICATION",
      notification
    });
  });
}

self.addEventListener("push", (event) => {
  const notification = normalizePushPayload(event);
  const options = {
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    tag: notification.tag,
    renotify: false,
    data: {
      id: notification.id,
      url: notification.url
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notification.title, options),
      postNotificationToClients(notification)
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/notifications";
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) {
          client.postMessage({
            type: "MAJHI_DAIRY_NOTIFICATION_CLICK",
            url: targetUrl
          });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTargetUrl);
      }

      return undefined;
    })
  );
});
