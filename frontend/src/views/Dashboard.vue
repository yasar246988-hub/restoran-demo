<template>
  <div class="app-layout">
    <NavigationSidebar />
    <main class="main-content">

      <div class="content-header">
        <h1>📊 Dashboard</h1>
        <div class="header-right">
          <span class="datetime">{{ currentTime }}</span>
          <button @click="loadData" :disabled="loading" class="btn-refresh">
            {{ loading ? '⏳' : '🔄' }} Yenile
          </button>
        </div>
      </div>

      <!-- İSTATİSTİK KARTLARI -->
      <div class="stats-grid">
        <div class="stat-card" @click="$router.push('/orders')">
          <div class="stat-icon orders-icon">📋</div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.todayOrders }}</div>
            <div class="stat-label">Bugünkü Siparişler</div>
          </div>
        </div>
        <div class="stat-card" @click="$router.push('/table-map')">
          <div class="stat-icon tables-icon">🪑</div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.activeTables }}<span class="stat-of">/{{ stats.totalTables }}</span></div>
            <div class="stat-label">Dolu / Toplam Masa</div>
          </div>
        </div>
        <div class="stat-card revenue-card">
          <div class="stat-icon revenue-icon">💰</div>
          <div class="stat-info">
            <div class="stat-num">₺{{ fmtShort(stats.dailyRevenue) }}</div>
            <div class="stat-label">Günlük Ciro</div>
          </div>
        </div>
        <div class="stat-card" @click="$router.push('/kitchen')">
          <div class="stat-icon kitchen-icon">🍳</div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.kitchenOrders }}</div>
            <div class="stat-label">Mutfaktaki Sipariş</div>
          </div>
        </div>
        <div class="stat-card" @click="$router.push('/waiter-calls')">
          <div class="stat-icon waiter-icon" :class="{ 'pulse': stats.pendingWaiterCalls > 0 }">🔔</div>
          <div class="stat-info">
            <div class="stat-num" :class="{ danger: stats.pendingWaiterCalls > 0 }">{{ stats.pendingWaiterCalls }}</div>
            <div class="stat-label">Bekleyen Garson Çağrısı</div>
          </div>
        </div>
      </div>

      <!-- ANA İÇERİK GRİD -->
      <div class="dashboard-grid">

        <!-- SON SİPARİŞLER -->
        <div class="dash-card">
          <div class="dash-card-head">
            <span>📋 Son Aktif Siparişler</span>
            <router-link to="/orders" class="see-all">Tümü →</router-link>
          </div>
          <div class="dash-card-body">
            <div v-if="recentOrders.length === 0" class="empty-msg">Aktif sipariş yok</div>
            <div v-for="order in recentOrders" :key="order.id" class="order-row" @click="$router.push('/orders')">
              <div class="order-row-left">
                <span class="order-table">🪑 Masa {{ order.tableNumber }}</span>
                <span :class="['order-badge', 'status-' + order.status]">{{ statusLabel(order.status) }}</span>
              </div>
              <div class="order-row-right">
                <span class="order-total">₺{{ (order.total || 0).toFixed(2) }}</span>
                <span class="order-time">{{ timeAgo(order.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- HIZLI İŞLEMLER -->
        <div class="dash-card">
          <div class="dash-card-head">⚡ Hızlı İşlemler</div>
          <div class="dash-card-body actions-grid">
            <router-link to="/orders" class="quick-action">
              <div class="qa-icon">📋</div>
              <div class="qa-text">Sipariş Takibi</div>
            </router-link>
            <router-link to="/cashier-pos" class="quick-action">
              <div class="qa-icon">🧾</div>
              <div class="qa-text">Kasa POS</div>
            </router-link>
            <router-link to="/kitchen" class="quick-action">
              <div class="qa-icon">🍳</div>
              <div class="qa-text">Mutfak</div>
            </router-link>
            <router-link to="/table-map" class="quick-action">
              <div class="qa-icon">🗺️</div>
              <div class="qa-text">Masa Haritası</div>
            </router-link>
            <router-link to="/menu" class="quick-action">
              <div class="qa-icon">🍽️</div>
              <div class="qa-text">Menü Düzenle</div>
            </router-link>
            <router-link to="/reports" class="quick-action">
              <div class="qa-icon">📊</div>
              <div class="qa-text">Raporlar</div>
            </router-link>
            <router-link to="/cash-register" class="quick-action">
              <div class="qa-icon">💰</div>
              <div class="qa-text">Kasa Yönetimi</div>
            </router-link>
            <router-link to="/waiter-calls" class="quick-action" :class="{ 'qa-alert': stats.pendingWaiterCalls > 0 }">
              <div class="qa-icon">🔔</div>
              <div class="qa-text">Garson Çağrıları <span v-if="stats.pendingWaiterCalls > 0" class="qa-badge">{{ stats.pendingWaiterCalls }}</span></div>
            </router-link>
          </div>
        </div>

        <!-- GARSON ÇAĞRILARI -->
        <div v-if="waiterCalls.length > 0" class="dash-card waiter-alert-card">
          <div class="dash-card-head alert-head">
            🔔 Bekleyen Garson Çağrıları
            <span class="alert-count">{{ waiterCalls.length }}</span>
          </div>
          <div class="dash-card-body">
            <div v-for="call in waiterCalls.slice(0, 5)" :key="call.id" class="waiter-row">
              <div class="waiter-row-left">
                <span class="waiter-table">🪑 Masa {{ call.tableNumber }}</span>
                <span class="waiter-msg">{{ call.message || call.reason }}</span>
              </div>
              <div class="waiter-row-right">
                <span class="waiter-time">{{ timeAgo(call.createdAt || call.created_at) }}</span>
                <button @click="handleCall(call.id)" class="btn-handled">✅ Karşılandı</button>
              </div>
            </div>
            <router-link v-if="waiterCalls.length > 5" to="/waiter-calls" class="see-all-calls">
              Tüm çağrıları gör ({{ waiterCalls.length }}) →
            </router-link>
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'
import socketService from '@/services/socket.js'

const API = 'http://localhost:3000/api'

export default {
  name: 'Dashboard',
  components: { NavigationSidebar },
  data() {
    return {
      loading: false,
      currentTime: '',
      stats: {
        todayOrders: 0,
        activeTables: 0,
        totalTables: 20,
        dailyRevenue: 0,
        kitchenOrders: 0,
        activeOrders: 0,
        pendingWaiterCalls: 0
      },
      recentOrders: [],
      waiterCalls: [],
      timer: null,
      refreshTimer: null
    }
  },

  async mounted() {
    this.updateClock()
    this.timer = setInterval(this.updateClock, 1000)
    await this.loadData()
    // Socket — anlık güncelleme
    this.connectSocket()
    // Yedek polling 30sn
    this.refreshTimer = setInterval(() => {
      if (!socketService.isConnected()) this.loadData()
    }, 30000)
  },

  beforeUnmount() {
    clearInterval(this.timer)
    clearInterval(this.refreshTimer)
    if (this._socketUnsubs) this._socketUnsubs.forEach(fn => fn())
  },

  methods: {
    updateClock() {
      this.currentTime = new Date().toLocaleString('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    },

    async loadData() {
      this.loading = true
      try {
        const [summaryRes, callsRes] = await Promise.all([
          axios.get(`${API}/dashboard/summary`).catch(() => null),
          axios.get(`${API}/waiter-calls`).catch(() => null)
        ])

        if (summaryRes?.data?.success) {
          const d = summaryRes.data.data
          this.stats = {
            todayOrders: d.todayOrders,
            activeTables: d.activeTables,
            totalTables: d.totalTables,
            dailyRevenue: d.dailyRevenue,
            kitchenOrders: d.kitchenOrders,
            activeOrders: d.activeOrders,
            pendingWaiterCalls: d.pendingWaiterCalls
          }
          this.recentOrders = d.recentOrders || []
        }

        if (callsRes?.data?.success) {
          this.waiterCalls = (callsRes.data.data || []).filter(c => c.status === 'pending')
        }
      } catch (e) {
        // sessiz fail
      } finally {
        this.loading = false
      }
    },

    connectSocket() {
      socketService.connect()

      // Yeni sipariş — istatistikleri güncelle
      const u1 = socketService.onNewOrder((order) => {
        this.stats.activeOrders = (this.stats.activeOrders || 0) + 1
        this.recentOrders.unshift({
          id: order.id,
          tableNumber: order.tableNumber,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt
        })
        if (this.recentOrders.length > 5) this.recentOrders.pop()
      })

      // Garson çağrısı — listeye ekle
      const u2 = socketService.onWaiterCall((call) => {
        if (!this.waiterCalls.find(c => c.id === call.id)) {
          this.waiterCalls.unshift({ ...call })
          this.stats.pendingWaiterCalls = (this.stats.pendingWaiterCalls || 0) + 1
        }
      })

      // Masa kapandı — istatistikleri yenile
      const u3 = socketService.onTableUpdate(() => {
        this.loadData()
      })

      // Sipariş güncellendi
      const u4 = socketService.onOrderUpdated(({ status }) => {
        if (status === 'completed') {
          this.stats.activeOrders = Math.max(0, (this.stats.activeOrders || 1) - 1)
          this.stats.todayOrders = (this.stats.todayOrders || 0) + 1
        }
      })

      this._socketUnsubs = [u1, u2, u3, u4]
    },

    async handleCall(callId) {
      try {
        await axios.put(`${API}/waiter-calls/${callId}`, { status: 'completed' })
        this.waiterCalls = this.waiterCalls.filter(c => c.id !== callId)
        this.stats.pendingWaiterCalls = Math.max(0, this.stats.pendingWaiterCalls - 1)
      } catch (e) {
        // ignore
      }
    },

    fmtShort(n) {
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
      return (n || 0).toFixed(0)
    },

    statusLabel(s) {
      return { pending: 'Bekliyor', preparing: 'Hazırlanıyor', ready: 'Hazır', completed: 'Tamamlandı' }[s] || s
    },

    timeAgo(dateStr) {
      if (!dateStr) return ''
      const diff = Date.now() - new Date(dateStr).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1) return 'az önce'
      if (m < 60) return `${m}dk önce`
      return `${Math.floor(m / 60)}s önce`
    }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.main-content { margin-left: 280px; flex: 1; padding: 1.75rem 2rem; background: var(--bg-app); }

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary-border);
}

.content-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--primary-dark); margin: 0; }

.header-right { display: flex; align-items: center; gap: 12px; }

.datetime {
  background: white;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
  color: var(--gray-600);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.btn-refresh {
  padding: 7px 14px;
  background: var(--primary-xlight);
  color: var(--primary);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 1.5rem;
}

@media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px)  { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  border-left: 4px solid var(--primary-border);
  cursor: pointer;
  transition: all 0.2s;
}

.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat-card.revenue-card { border-left-color: #f59e0b; cursor: default; }

.stat-icon { font-size: 2rem; }
.stat-icon.pulse { animation: pulse 1.5s ease-in-out infinite; }

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.stat-num { font-size: 1.5rem; font-weight: 800; color: var(--primary-dark); }
.stat-num.danger { color: var(--danger); }
.stat-of { font-size: 0.9rem; font-weight: 400; color: var(--gray-400); }
.stat-label { font-size: 0.78rem; color: var(--gray-500); margin-top: 2px; }

/* DASHBOARD GRID */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dash-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.waiter-alert-card { grid-column: 1 / -1; }

.dash-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
}

.alert-head { background: linear-gradient(135deg, #dc2626, #b91c1c); }

.alert-count {
  background: white;
  color: var(--danger);
  width: 22px; height: 22px;
  border-radius: 50%;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.see-all {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
}

.see-all:hover { color: white; }

.dash-card-body { padding: 14px 18px; }

/* SON SİPARİŞLER */
.empty-msg { text-align: center; padding: 24px; color: var(--gray-400); font-size: 0.9rem; }

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 10px;
  margin-bottom: 6px;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}

.order-row:hover { background: var(--primary-xlight); }

.order-row-left, .order-row-right { display: flex; align-items: center; gap: 8px; }

.order-table { font-size: 0.85rem; font-weight: 700; color: var(--primary); }

.order-badge {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 600;
}

.status-pending   { background: var(--warning-light); color: #92400e; }
.status-preparing { background: var(--primary-xlight); color: var(--primary-dark); }
.status-ready     { background: var(--success-light); color: var(--success); }

.order-total { font-size: 0.88rem; font-weight: 700; color: var(--gray-800); }
.order-time  { font-size: 0.75rem; color: var(--gray-400); }

/* HIZLI İŞLEMLER */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: var(--gray-50);
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--gray-700);
  transition: all 0.15s;
  text-align: center;
}

.quick-action:hover {
  background: var(--primary-xlight);
  border-color: var(--primary-border);
  color: var(--primary);
  transform: translateY(-1px);
}

.quick-action.qa-alert {
  border-color: var(--danger);
  background: var(--danger-light);
  color: var(--danger);
}

.qa-icon { font-size: 1.5rem; margin-bottom: 5px; }
.qa-text { font-size: 0.75rem; font-weight: 600; line-height: 1.3; }

.qa-badge {
  display: inline-block;
  background: var(--danger);
  color: white;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 10px;
  margin-left: 3px;
  font-weight: 700;
}

/* GARSON ÇAĞRILARI */
.waiter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-left: 4px solid #f97316;
  border-radius: var(--radius-md);
}

.waiter-row-left { display: flex; align-items: center; gap: 10px; }
.waiter-row-right { display: flex; align-items: center; gap: 10px; }

.waiter-table { font-weight: 700; color: var(--primary); font-size: 0.88rem; }
.waiter-msg { color: var(--gray-600); font-size: 0.85rem; }
.waiter-time { font-size: 0.78rem; color: var(--gray-400); }

.btn-handled {
  padding: 5px 12px;
  background: var(--success);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.see-all-calls {
  display: block;
  text-align: center;
  margin-top: 6px;
  color: var(--primary);
  font-size: 0.83rem;
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .actions-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
