import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "./supabase"; 

// --- SUAS CHAVES DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC_guHL2uIHNLOfLCTTFP7infHgddQt8hM",
  authDomain: "luni-app.firebaseapp.com",
  projectId: "luni-app",
  storageBucket: "luni-app.firebasestorage.app",
  messagingSenderId: "432340761734",
  appId: "1:432340761734:web:e8d6c2853e5c2d0f7fe507",
  measurementId: "G-GVS65WPJ5Z"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// --- SUA CHAVE VAPID ---
const VAPID_KEY = "BPS_ZlghFTXBmTCKJJLgzH8SJ5PN-Om2gk5368h2j0r6yTqc3lffNBwOM_EZY5sVf3_fhDY60ufqkZZ20vXJOc4"; 

export const requestNotificationPermission = async (userId) => {
  try {
    // 1. Pede permissão ao navegador
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permissão de notificação concedida!');
      
      // 2. Pega o Token único deste dispositivo
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (currentToken) {
        console.log('Token gerado:', currentToken);
        
        // 3. Salva no Supabase para podermos enviar msg depois
        const { error } = await supabase
          .from('user_push_tokens')
          .upsert({ 
             user_id: userId, 
             token: currentToken,
             platform: 'web',
             last_used_at: new Date()
          }, { onConflict: 'user_id, token' });

        if (error) {
          console.error('Erro ao salvar token:', error);
        } else {
          alert("🔔 Notificações ativadas! Você receberá avisos sobre seus agendamentos.");
        }
        
      } else {
        console.log('Nenhum token disponível. Talvez precise instalar o PWA.');
      }
    } else {
      alert('Você precisa permitir as notificações no navegador para receber alertas.');
    }
  } catch (error) {
    console.error('Erro ao ativar notificações:', error);
  }
};

// Função para ouvir mensagens enquanto o app está aberto
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });