<template>
  <div class="app-layout">
    <NavigationSidebar />
    <main class="main-content">

      <div class="content-header">
        <h1>🗺️ Masa Durumu Haritası</h1>
        <div class="header-actions">
          <div class="legend">
            <span class="legend-item available">⬜ Boş</span>
            <span class="legend-item occupied">🟥 Dolu</span>
            <span class="legend-item reserved">🟨 Rezerveli</span>
          </div>
          <button @click="loadStatus" class="refresh-btn">🔄 Yenile</button>
        </div>
      </div>

      <!-- Özet Kartlar -->
      <div class="summary-grid">
        <div class="summary-card available-card">
          <div class="summary-icon">⬜</div>
          <div class="summary-info">
            <div class="summary-num">{{ availableCount }}</div>
            <div class="summary-label">Boş Masa</div>
          </div>
        </div>
        <div class="summary-card occupied-card">
          <div class="summary-icon">🔴</div>
          <div class="summary-info">
            <div class="summary-num">{{ occupiedCount }}</div>
            <div class="summary-label">Dolu Masa</div>
          </div>
        </div>
        <div class="summary-card revenue-card">
          <div class="summary-icon">💰</div>
          <div class="summary-info">
            <div class="summary-num">₺{{ totalOpenRevenue.toFixed(0) }}</div>
            <div class="summary-label">Açık Hesap</div>
          </div>
        </div>
        <div class="summary-card orders-card">
          <div class="summary-icon">📋</div>
          <div class="summary-info">
            <div class="summary-num">{{ totalOpenOrders }}</div>
            <div class="summary-label">Aktif Sipariş</div>
          </div>
        </div>
      </div>

      <!-- Masa Haritası -->
      <div class="map-container">
        <div class="table-grid">
          <div
            v-for="n in tableCount"
            :key="n"
            :class="['table-cell', getTableStatus(n)]"
            @click="selectTable(n)"
          >
            <div class="table-number">{{ n }}</div>
            <div class="table-icon">🪑</div>
            <div v-if="tableData[n]" class="table-info">
              <span class="table-amount">₺{{ tableData[n].totalAmount.toFixed(0) }}</span>
              <span class="table-orders">{{ tableData[n].orders.length }} sipariş</span>
            </div>
            <div v-if="tableData[n]" class="table-time">
              {{ getOpenDuration(tableData[n].openedAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Masa Detay Panel -->
      <transition name="slide-up">
        <div v-if="selectedTableNum" class="table-detail-panel">
          <div class="panel-header">
            <h3>🪑 Masa {{ selectedTableNum }}</h3>
            <button @click="selectedTableNum = null" class="close-panel-btn">✕</button>
          </div>

          <div v-if="tableData[selectedTableNum]" class="panel-body">
            <div class="panel-stats">
              <div class="panel-stat">
                <span>Açılış</span>
                <strong>{{ formatTime(tableData[selectedTableNum].openedAt) }}</strong>
              </div>
              <div class="panel-stat">
                <span>Süre</span>
                <strong>{{ getOpenDuration(tableData[selectedTableNum].openedAt) }}</strong>
              </div>
              <div class="panel-stat">
                <span>Sipariş</span>
                <strong>{{ tableData[selectedTableNum].orders.length }}</strong>
              </div>
              <div class="panel-stat highlight">
                <span>Toplam</span>
                <strong>₺{{ tableData[selectedTableNum].totalAmount.toFixed(2) }}</strong>
              </div>
            </div>

            <div class="panel-actions">
              <button @click="goToOrders(selectedTableNum)" class="panel-btn orders-btn">
                📋 Siparişleri Gör
              </button>
            </div>
          </div>

          <div v-else class="panel-empty">
            <p>Bu masa şu an boş</p>
          </div>
        </div>
      </transition>

    </main>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'
import socketService from '@/services/socket.js'

export default {
  name: 'TableMap',
  components: { NavigationSidebar },
  data() {
    return {
      tableData: {},
      tableCount: 20,
      selectedTableNum: null,
      refreshTimer: null
    }
  },
  computed: {
    occupiedCount() {
      return Object.keys(this.tableData).length
    },
    availableCount() {
      return this.tableCount - this.occupiedCount
    },
    totalOpenRevenue() {
      return Object.values(this.tableData).reduce((s, t) => s + t.totalAmount, 0)
    },
    totalOpenOrders() {
      return Object.values(this.tableData).reduce((s, t) => s + t.orders.length, 0)
    }
  },
  async mounted() {
    await this.loadStatus()
    socketService.connect()
    // Yeni sipariş veya masa kapandı → anlık güncelle
    const u1 = socketService.onNewOrder(() => this.loadStatus())
    const u2 = socketService.onTableUpdate(() => this.loadStatus())
    this._socketUnsubs = [u1, u2]
    // Her 8 saniyede yenile — socket yoksa veya varsa da
    this.refreshTimer = setInterval(() => this.loadStatus(), 8000)
  },
  beforeUnmount() {
    clearInterval(this.refreshTimer)
    if (this._socketUnsubs) this._socketUnsubs.forEach(fn => fn())
  },
  methods: {
    async loadStatus() {
      try {
        const res = await axios.get('http://localhost:3000/api/tables/status')
        if (res.data.success) this.tableData = res.data.data
      } catch (e) {
        console.warn('Masa durumu yüklenemedi:', e.message)
      }
    },
    getTableStatus(n) {
      return this.tableData[n] ? 'occupied' : 'available'
    },
    selectTable(n) {
      this.selectedTableNum = this.selectedTableNum === n ? null : n
    },
    getOpenDuration(openedAt) {
      if (!openedAt) return ''
      const diff = Date.now() - new Date(openedAt).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 60) return `${mins}dk`
      return `${Math.floor(mins / 60)}s ${mins % 60}dk`
    },
    formatTime(dateStr) {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    },
    goToOrders(tableNum) {
      this.$router.push({ path: '/orders', query: { table: tableNum } })
    }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.main-content { margin-left: 280px; flex: 1; padding: 2rem; background: var(--gray-50); }

.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.content-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--gray-800); }
.header-actions { display: flex; align-items: center; gap: 12px; }

.legend { display: flex; gap: 12px; }
.legend-item { font-size: 0.85rem; color: #555; }

.refresh-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* Özet Kartlar */
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid var(--gray-200);
}
.available-card { border-left-color: #22c55e; }
.occupied-card { border-left-color: var(--danger); }
.revenue-card { border-left-color: var(--warning); }
.orders-card { border-left-color: var(--primary-light); }
.summary-icon { font-size: 1.8rem; }
.summary-num { font-size: 1.6rem; font-weight: 700; color: var(--gray-800); }
.summary-label { font-size: 0.8rem; color: #888; }

/* Masa Haritası */
.map-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.table-cell {
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.table-cell.available {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.table-cell.available:hover {
  background: var(--success-light);
  border-color: #22c55e;
  transform: translateY(-2px);
}

.table-cell.occupied {
  background: var(--danger-light);
  border-color: #fecaca;
}
.table-cell.occupied:hover {
  background: var(--danger-light);
  border-color: var(--danger);
  transform: translateY(-2px);
}

.table-number { font-size: 1.1rem; font-weight: 700; color: var(--gray-800); }
.table-icon { font-size: 1.5rem; }
.table-info { display: flex; flex-direction: column; gap: 2px; }
.table-amount { font-size: 0.85rem; font-weight: 700; color: var(--danger); }
.table-orders { font-size: 0.75rem; color: #888; }
.table-time { font-size: 0.72rem; color: #aaa; margin-top: 2px; }

/* Detay Panel */
.table-detail-panel {
  position: fixed;
  bottom: 0;
  left: 280px;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
  z-index: 100;
  padding: 20px 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.panel-header h3 { font-size: 1.1rem; font-weight: 700; }
.close-panel-btn {
  background: var(--gray-100);
  border: none;
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
}

.panel-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.panel-stat {
  background: var(--gray-50);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.panel-stat span { display: block; font-size: 0.75rem; color: #888; margin-bottom: 4px; }
.panel-stat strong { font-size: 1rem; font-weight: 700; color: var(--gray-800); }
.panel-stat.highlight strong { color: var(--success); font-size: 1.1rem; }

.panel-actions { display: flex; gap: 10px; }
.panel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}
.orders-btn { background: var(--primary); color: white; }

.panel-empty { text-align: center; color: #aaa; padding: 20px; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .table-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); }
  .panel-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
