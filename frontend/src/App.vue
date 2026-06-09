<template>
  <div id="app">
    <router-view />
    <!-- Bildirim İzni İsteği (giriş yapıldıktan sonra görünür) -->
    <div v-if="showNotifBanner" class="notif-banner">
      <span>🔔 Garson çağrıları ve siparişler için bildirim izni ister misiniz?</span>
      <div class="notif-banner-actions">
        <button @click="allowNotifs" class="notif-allow">İzin Ver</button>
        <button @click="denyNotifs" class="notif-deny">Şimdi Değil</button>
      </div>
    </div>
  </div>
</template>

<script>
import notifService from '@/services/notifications.js'

export default {
  name: 'App',
  data() {
    return {
      showNotifBanner: false
    }
  },
  mounted() {
    // Giriş yapılmışsa bildirimleri başlat
    const token = localStorage.getItem('token')
    if (token) {
      this.initNotifications()
    }

    // Router değişikliğinde de kontrol et (login sonrası)
    this.$router.afterEach(() => {
      const t = localStorage.getItem('token')
      if (t && !notifService.pollTimer) {
        this.initNotifications()
      }
    })
  },
  beforeUnmount() {
    notifService.stopPolling()
  },
  methods: {
    async initNotifications() {
      if (!('Notification' in window)) return

      if (Notification.permission === 'granted') {
        notifService.permission = 'granted'
        notifService.startPolling()
      } else if (Notification.permission === 'default') {
        // Banner göster
        const dismissed = localStorage.getItem('notif_banner_dismissed')
        if (!dismissed) {
          this.showNotifBanner = true
        }
      }
      // 'denied' ise sessiz devam — ses yine çalar
      notifService.startPolling()
    },

    async allowNotifs() {
      this.showNotifBanner = false
      const granted = await notifService.requestPermission()
      if (granted) {
        notifService.show('✅ Bildirimler Açık', 'Garson çağrıları ve siparişler için bildirim alacaksınız.', { type: 'info' })
      }
    },

    denyNotifs() {
      this.showNotifBanner = false
      localStorage.setItem('notif_banner_dismissed', '1')
      // Ses bildirimleri yine çalışır, sadece popup gelmez
    }
  }
}
</script>

<style>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

/* Bildirim izin banner'ı */
.notif-banner {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1e293b;
  color: white;
  padding: 14px 20px;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 480px;
  font-size: 0.88rem;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.notif-banner-actions { display: flex; gap: 8px; flex-shrink: 0; }

.notif-allow {
  padding: 7px 14px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.82rem;
  white-space: nowrap;
}

.notif-deny {
  padding: 7px 14px;
  background: rgba(255,255,255,0.15);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  white-space: nowrap;
}
</style>
