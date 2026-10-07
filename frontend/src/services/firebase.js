import { getApp, getApps, initializeApp } from '@firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from '@firebase/messaging';
import { authService } from './auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
export const isFcmConfigured = Object.values(firebaseConfig).every(Boolean);

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function enablePushNotifications() {
  if (!isFcmConfigured) throw new Error('Konfigurasi Firebase web belum diisi.');
  if (!('Notification' in window) || !(await isSupported())) {
    throw new Error('Browser ini belum mendukung notifikasi push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Izin notifikasi belum diberikan.');

  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?config=${encodeURIComponent(JSON.stringify(firebaseConfig))}`,
  );
  const tokenOptions = { serviceWorkerRegistration: registration };
  if (vapidKey) tokenOptions.vapidKey = vapidKey;
  const token = await getToken(getMessaging(getFirebaseApp()), tokenOptions);
  if (!token) throw new Error('Token notifikasi tidak berhasil dibuat.');

  await authService.registerFcmToken(token);
  return token;
}

export async function listenForPushMessages(onNotification) {
  if (!isFcmConfigured || !(await isSupported())) return () => {};
  return onMessage(getMessaging(getFirebaseApp()), (payload) => {
    onNotification({
      title: payload.notification?.title || 'Informasi Bansos Ngrowo',
      body: payload.notification?.body || '',
    });
  });
}