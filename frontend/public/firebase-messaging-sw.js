const params = new URL(self.location.href).searchParams;
const firebaseConfig = JSON.parse(params.get('config') || '{}');

importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Informasi Bansos Ngrowo';
  self.registration.showNotification(title, {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: { url: '/dashboard' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/dashboard'));
});