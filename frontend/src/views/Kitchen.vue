<template>
  <div class="kitchen-view">

    <div class="kitchen-header">
      <h1>🍳 Mutfak Ekranı</h1>
      <div class="kitchen-stats">
        <div class="stat-item">
          <span class="stat-number">{{ pendingOrders.length }}</span>
          <span class="stat-label">Bekleyen</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ preparingOrders.length }}</span>
          <span class="stat-label">Hazırlanıyor</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ readyOrders.length }}</span>
          <span class="stat-label">Hazır</span>
        </div>
      </div>
      <div class="kitchen-actions">
        <!-- Ses toggle -->
        <button @click="toggleSound" :class="['sound-btn', { muted: !soundOn }]" :title="soundOn ? 'Sesi Kapat' : 'Sesi Aç'">
          {{ soundOn ? '🔊' : '🔇' }}
        </button>
        <button @click="loadOrders" :disabled="loading" class="refresh-btn">
          {{ loading ? '⏳' : '🔄' }} Yenile
        </button>
        <span class="last-update">Son güncelleme: {{ lastUpdate }}</span>
      </div>
    </div>

    <!-- Yeni sipariş banner -->
    <transition name="banner">
      <div v-if="newOrderBanner" class="new-order-banner">
        🔔 YENİ SİPARİŞ — Masa {{ newOrderBanner }}
      </div>
    </transition>

    <div v-if="loading && orders.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Siparişler yükleniyor...</p>
    </div>

    <div v-else-if="orders.length === 0" class="empty-state">
      <div class="empty-icon">🍽️</div>
      <h3>Bekleyen sipariş yok</h3>
      <p>Yeni siparişler burada görünecek</p>
    </div>

    <div v-else class="kitchen-columns">

      <!-- Bekleyen -->
      <div class="kitchen-column pending-col">
        <div class="column-header pending">
          <h3>⏳ Bekleyen</h3>
          <span class="col-count">{{ pendingOrders.length }}</span>
        </div>
        <div class="orders-list">
          <div v-for="order in pendingOrders" :key="order.id" class="kitchen-card pending-card">
            <div class="card-header">
              <span class="table-badge">🪑 Masa {{ order.tableNumber || order.tableId }}</span>
              <span class="order-time">{{ getElapsed(order.createdAt || order.timestamp) }}</span>
            </div>
            <div class="card-items">
              <div v-for="item in order.items" :key="item.name" class="item-row">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
                <span v-if="item.notes" class="item-note">📝 {{ item.notes }}</span>
              </div>
            </div>
            <div v-if="order.notes" class="card-note">📝 {{ order.notes }}</div>
            <button @click="updateStatus(order.id, 'preparing')" class="action-btn preparing-btn">
              🔥 Hazırlamaya Başla
            </button>
          </div>
        </div>
      </div>

      <!-- Hazırlanıyor -->
      <div class="kitchen-column preparing-col">
        <div class="column-header preparing">
          <h3>🔥 Hazırlanıyor</h3>
          <span class="col-count">{{ preparingOrders.length }}</span>
        </div>
        <div class="orders-list">
          <div v-for="order in preparingOrders" :key="order.id" class="kitchen-card preparing-card">
            <div class="card-header">
              <span class="table-badge">🪑 Masa {{ order.tableNumber || order.tableId }}</span>
              <span class="order-time">{{ getElapsed(order.createdAt || order.timestamp) }}</span>
            </div>
            <div class="card-items">
              <div v-for="item in order.items" :key="item.name" class="item-row">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
                <span v-if="item.notes" class="item-note">📝 {{ item.notes }}</span>
              </div>
            </div>
            <div v-if="order.notes" class="card-note">📝 {{ order.notes }}</div>
            <button @click="updateStatus(order.id, 'ready')" class="action-btn ready-btn">
              ✅ Hazır
            </button>
          </div>
        </div>
      </div>

      <!-- Hazır -->
      <div class="kitchen-column ready-col">
        <div class="column-header ready">
          <h3>✅ Hazır</h3>
          <span class="col-count">{{ readyOrders.length }}</span>
        </div>
        <div class="orders-list">
          <div v-for="order in readyOrders" :key="order.id" class="kitchen-card ready-card">
            <div class="card-header">
              <span class="table-badge">🪑 Masa {{ order.tableNumber || order.tableId }}</span>
              <span class="order-time">{{ getElapsed(order.createdAt || order.timestamp) }}</span>
            </div>
            <div class="card-items">
              <div v-for="item in order.items" :key="item.name" class="item-row">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
            </div>
            <button @click="updateStatus(order.id, 'completed')" class="action-btn served-btn">
              🚀 Servis Edildi
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '@/services/socket.js'

const API = 'http://localhost:3000/api'

export default {
  name: 'Kitchen',
  data() {
    return {
      orders: [],
      loading: false,
      lastUpdate: '-',
      refreshInterval: null,
      knownOrderIds: new Set(),
      soundOn: true,
      audioCtx: null,
      newOrderBanner: null,
      bannerTimer: null,
      socketConnected: false,
      unsubscribers: []
    }
  },
  computed: {
    pendingOrders()   { return this.orders.filter(o => o.status === 'pending') },
    preparingOrders() { return this.orders.filter(o => o.status === 'preparing') },
    readyOrders()     { return this.orders.filter(o => o.status === 'ready') }
  },
  async mounted() {
    const saved = localStorage.getItem('kitchen_sound')
    if (saved !== null) this.soundOn = saved === '1'

    await this.loadOrders(true)
    this.connectSocket()

    // Yedek polling — socket yokken 15 saniyede bir (daha seyrek)
    this.refreshInterval = setInterval(() => {
      if (!socketService.isConnected()) this.loadOrders(false)
    }, 15000)
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval)
    if (this.bannerTimer) clearTimeout(this.bannerTimer)
    this.unsubscribers.forEach(fn => fn())
    socketService.disconnect()
  },
  methods: {
    connectSocket() {
      socketService.connect()

      // Yeni sipariş geldi
      const u1 = socketService.onNewOrder((order) => {
        this.socketConnected = true
        if (!this.knownOrderIds.has(order.id)) {
          this.knownOrderIds.add(order.id)
          this.orders.unshift({ ...order })
          this.playAlarm()
          this.showBanner(order.tableNumber)
          this.lastUpdate = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })
        }
      })

      // Sipariş durumu güncellendi
      const u2 = socketService.onOrderUpdated(({ id, status }) => {
        this.socketConnected = true
        const idx = this.orders.findIndex(o => o.id === id)
        if (idx !== -1) {
          if (status === 'completed' || status === 'cancelled') {
            this.knownOrderIds.delete(id)
            this.orders.splice(idx, 1)
          } else {
            this.orders[idx].status = status
          }
        }
        this.lastUpdate = new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
      })

      this.unsubscribers = [u1, u2]
    },

    // ---- SES ----
    getAudioCtx() {
      if (!this.audioCtx) {
        try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)() }
        catch { return null }
      }
      return this.audioCtx
    },

    playAlarm() {
      if (!this.soundOn) return
      const ctx = this.getAudioCtx()
      if (!ctx) return
      const notes = [
        { freq: 1000, start: 0.0,  dur: 0.12 },
        { freq: 1000, start: 0.18, dur: 0.12 },
        { freq: 1200, start: 0.36, dur: 0.2  }
      ]
      const now = ctx.currentTime
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + start)
        gain.gain.setValueAtTime(0.4, now + start)
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
        osc.start(now + start); osc.stop(now + start + dur + 0.05)
      })
    },

    toggleSound() {
      this.soundOn = !this.soundOn
      localStorage.setItem('kitchen_sound', this.soundOn ? '1' : '0')
      if (this.soundOn) this.playAlarm()
    },

    showBanner(tableNum) {
      this.newOrderBanner = tableNum
      if (this.bannerTimer) clearTimeout(this.bannerTimer)
      this.bannerTimer = setTimeout(() => { this.newOrderBanner = null }, 4000)
    },

    async loadOrders(isBaseline = false) {
      this.loading = true
      try {
        const res = await axios.get(`${API}/orders`)
        if (res.data.success) {
          const fresh = (res.data.data || []).filter(
            o => !['completed', 'cancelled'].includes(o.status)
          )
          this.lastUpdate = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })

          if (isBaseline) {
            fresh.forEach(o => this.knownOrderIds.add(o.id))
          } else {
            const newOrders = fresh.filter(o => !this.knownOrderIds.has(o.id))
            if (newOrders.length > 0) {
              this.playAlarm()
              const latest = newOrders[newOrders.length - 1]
              this.showBanner(latest.tableNumber || latest.tableId)
              newOrders.forEach(o => this.knownOrderIds.add(o.id))
            }
            const freshIds = new Set(fresh.map(o => o.id))
            this.knownOrderIds.forEach(id => {
              if (!freshIds.has(id)) this.knownOrderIds.delete(id)
            })
          }
          this.orders = fresh
        }
      } catch { /* sessiz */ }
      finally { this.loading = false }
    },

    async updateStatus(orderId, newStatus) {
      try {
        await axios.put(`${API}/orders/${orderId}`, { status: newStatus })
        // Socket eventi gelecek ve listeyi güncelleyecek
        // Ama socket yoksa manuel güncelle
        if (!socketService.isConnected()) {
          const idx = this.orders.findIndex(o => o.id === orderId)
          if (idx !== -1) {
            if (newStatus === 'completed') {
              this.knownOrderIds.delete(orderId)
              this.orders.splice(idx, 1)
            } else {
              this.orders[idx].status = newStatus
            }
          }
        }
      } catch (e) {
        alert('Güncelleme hatası: ' + (e.response?.data?.message || e.message))
      }
    },

    getElapsed(dateStr) {
      if (!dateStr) return ''
      const diff = Date.now() - new Date(dateStr).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 60) return `${m}dk`
      return `${Math.floor(m / 60)}s ${m % 60}dk`
    }
  }
}
</script>

<style scoped>
.kitchen-view {
  min-height: 100vh;
  background: #111827;
  color: white;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

.kitchen-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: #1f2937;
  border-bottom: 2px solid #374151;
  flex-wrap: wrap;
}

.kitchen-header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fbbf24;
  margin: 0;
}

.kitchen-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-top: 2px;
}

.kitchen-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.refresh-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
}

.sound-btn {
  padding: 8px 12px;
  background: #374151;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background 0.2s;
}
.sound-btn:hover { background: #4b5563; }
.sound-btn.muted { background: #6b7280; opacity: 0.7; }

/* Yeni sipariş banner */
.new-order-banner {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  text-align: center;
  padding: 12px 20px;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 1px;
  animation: pulse-banner 0.5s ease-in-out 3;
}

@keyframes pulse-banner {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}

.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { transform: translateY(-100%); opacity: 0; }

.last-update {
  font-size: 0.78rem;
  color: #6b7280;
}

/* Loading / Empty */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px; height: 40px;
  border: 3px solid #374151;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon { font-size: 3.5rem; margin-bottom: 12px; }
.empty-state h3 { font-size: 1.1rem; color: #e5e7eb; margin-bottom: 6px; }
.empty-state p { font-size: 0.9rem; }

/* Kolonlar */
.kitchen-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  height: calc(100vh - 72px);
  overflow: hidden;
}

.kitchen-column {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #374151;
  overflow: hidden;
}

.kitchen-column:last-child { border-right: none; }

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-weight: 700;
  font-size: 0.95rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.column-header.pending   { background: #78350f; color: #fef3c7; }
.column-header.preparing { background: #7c2d12; color: #ffedd5; }
.column-header.ready     { background: #14532d; color: #dcfce7; }

.col-count {
  background: rgba(255,255,255,0.2);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.orders-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Kart */
.kitchen-card {
  background: #1f2937;
  border-radius: 12px;
  padding: 14px;
  border: 1.5px solid #374151;
}

.pending-card   { border-color: #f59e0b; }
.preparing-card { border-color: #f97316; }
.ready-card     { border-color: #22c55e; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.table-badge {
  background: var(--primary);
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
}

.order-time {
  font-size: 0.78rem;
  color: #9ca3af;
}

.card-items {
  margin-bottom: 10px;
}

.item-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid #374151;
  font-size: 0.88rem;
}

.item-row:last-child { border-bottom: none; }

.item-qty {
  font-weight: 700;
  color: #fbbf24;
  min-width: 24px;
}

.item-name { flex: 1; color: #e5e7eb; }

.item-note {
  font-size: 0.75rem;
  color: #f59e0b;
  font-style: italic;
}

.card-note {
  font-size: 0.8rem;
  color: #f59e0b;
  background: rgba(245,158,11,0.1);
  border-radius: 6px;
  padding: 4px 8px;
  margin-bottom: 10px;
}

.action-btn {
  width: 100%;
  padding: 9px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-btn:hover { opacity: 0.85; }

.preparing-btn { background: #f97316; color: white; }
.ready-btn     { background: #22c55e; color: white; }
.served-btn    { background: var(--primary); color: white; }

@media (max-width: 900px) {
  .kitchen-columns { grid-template-columns: 1fr; height: auto; }
  .kitchen-column { border-right: none; border-bottom: 1px solid #374151; }
}
</style>
