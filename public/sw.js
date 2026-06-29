self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'New Tip Available!';
    const options = {
      body: data.body || 'Check out the latest football predictions.',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'tipster-notification',
      renotify: true,
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const title = 'New Tip Available!';
    const options = {
      body: event.data.text(),
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'tipster-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
