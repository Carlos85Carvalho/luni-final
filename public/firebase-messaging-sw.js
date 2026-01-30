/* eslint-disable no-undef */
// Importa os scripts do Firebase (CDN)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// --- SUAS CHAVES ---
const firebaseConfig = {
  apiKey: "AIzaSyC_guHL2uIHNLOfLCTTFP7infHgddQt8hM",
  authDomain: "luni-app.firebaseapp.com",
  projectId: "luni-app",
  storageBucket: "luni-app.firebasestorage.app",
  messagingSenderId: "432340761734",
  appId: "1:432340761734:web:e8d6c2853e5c2d0f7fe507",
  measurementId: "G-GVS65WPJ5Z"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificação em background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-luni.png',
    badge: '/logo-luni.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});