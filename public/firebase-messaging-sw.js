importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyClqeYZppD9tFaOa0BZKXmyJtasIxskwGQ',
  authDomain: 'leeman-5f05b.firebaseapp.com',
  projectId: 'leeman-5f05b',
  storageBucket: 'leeman-5f05b.firebasestorage.app',
  messagingSenderId: '738245772631',
  appId: '1:738245772631:web:d79b46e1b63e4181112a12'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Tip Available!';
  const notificationOptions = {
    body: payload.notification?.body || 'Check out the latest football predictions.',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'fhinktips-notification',
    renotify: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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
