<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <NavigationSidebar />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1>Garson Çağrıları</h1>
        <div class="header-actions">
          <button @click="refreshCalls" class="refresh-btn" :disabled="loading">
            {{ loading ? '🔄 Yenileniyor...' : '🔄 Yenile' }}
          </button>
          <div class="status-filter">
            <select v-model="selectedStatus" @change="filterCalls" class="status-select">
              <option value="all">Tüm Çağrılar</option>
              <option value="pending">Bekleyenler</option>
              <option value="completed">Tamamlananlar</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingCalls.length }}</div>
            <div class="stat-label">Bekleyen Çağrı</div>
          </div>
        </div>
        
        <div class="stat-card completed">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ completedCalls.length }}</div>
            <div class="stat-label">Tamamlanan</div>
          </div>
        </div>
        
        <div class="stat-card total">
          <div class="stat-icon">📞</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalCalls.length }}</div>
            <div class="stat-label">Toplam Çağrı</div>
          </div>
        </div>
      </div>

      <!-- Calls List -->
      <div class="calls-container">
        <div v-if="filteredCalls.length === 0" class="empty-state">
          <div class="empty-icon">📞</div>
          <h3>Henüz garson çağrısı yok</h3>
          <p>Müşteriler garson çağırdığında burada görünecek.</p>
        </div>

        <div v-else class="calls-list">
          <div
            v-for="call in filteredCalls"
            :key="call.id"
            :class="['call-card', call.status]"
          >
            <div class="call-header">
              <div class="call-table">
                <span class="table-icon">🪑</span>
                <span class="table-number">Masa {{ call.tableNumber }}</span>
              </div>
              <div class="call-time">
                {{ formatTime(call.timestamp || call.created_at) }}
              </div>
              <div class="call-status">
                <span :class="['status-badge', call.status]">
                  {{ getStatusText(call.status) }}
                </span>
              </div>
            </div>

            <div class="call-body">
              <div class="call-message">
                <div class="message-icon">💬</div>
                <div class="message-text">{{ call.message || call.reason }}</div>
              </div>
            </div>

            <div class="call-footer">
              <div class="call-actions">
                <button
                  v-if="call.status === 'pending'"
                  @click="markAsCompleted(call.id)"
                  class="complete-btn"
                >
                  ✅ Tamamlandı
                </button>
                
                <button
                  v-if="call.status === 'completed'"
                  @click="markAsPending(call.id)"
                  class="reopen-btn"
                >
                  🔄 Yeniden Aç
                </button>
                
                <button
                  @click="deleteCall(call.id)"
                  class="delete-btn"
                >
                  🗑️ Sil
                </button>
              </div>
              
              <div class="call-duration">
                {{ getCallDuration(call.timestamp || call.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'
import notifService from '@/services/notifications.js'
import socketService from '@/services/socket.js'

const API = 'http://localhost:3000/api'

export default {
  name: 'WaiterCalls',
  components: {
    NavigationSidebar
  },
  data() {
    return {
      calls: [],
      loading: false,
      selectedStatus: 'all',
      refreshInterval: null,
      unsubscribe: null,
      // Yeni çağrı animasyonu
      newCallIds: new Set()
    }
  },
  
  computed: {
    filteredCalls() {
      if (this.selectedStatus === 'all') {
        return this.calls
      }
      return this.calls.filter(call => call.status === this.selectedStatus)
    },
    
    pendingCalls() {
      return this.calls.filter(call => call.status === 'pending')
    },
    
    completedCalls() {
      return this.calls.filter(call => call.status === 'completed')
    },
    
    totalCalls() {
      return this.calls
    }
  },
  
  mounted() {
    this.loadCalls()
    socketService.connect()

    // Yeni garson çağrısı — anlık ekle
    const u1 = socketService.onWaiterCall((call) => {
      if (!this.calls.find(c => c.id === call.id)) {
        this.calls.unshift({ ...call })
        notifService.playBeep('waiter')
      }
    })

    this._socketUnsubs = [u1]

    // Yedek polling 30sn
    this.refreshInterval = setInterval(() => {
      if (!socketService.isConnected()) this.loadCalls()
    }, 30000)
  },
  
  beforeUnmount() {
    if (this.refreshInterval) clearInterval(this.refreshInterval)
    if (this.unsubscribe) this.unsubscribe()
    if (this._socketUnsubs) this._socketUnsubs.forEach(fn => fn())
  },
  
  methods: {
    async loadCalls() {
      this.loading = true
      try {
        const response = await axios.get(`${API}/waiter-calls`)
        if (response.data.success) {
          const allCalls = response.data.data || []
          this.calls = allCalls.sort((a, b) => {
            const da = new Date(a.created_at || a.timestamp || 0)
            const db = new Date(b.created_at || b.timestamp || 0)
            return db - da
          })
        }
      } catch (error) {
        // sessiz fail
      } finally {
        this.loading = false
      }
    },
    
    async refreshCalls() {
      await this.loadCalls()
    },
    
    filterCalls() {
      // computed property otomatik filtreler
    },
    
    async markAsCompleted(callId) {
      try {
        const call = this.calls.find(c => c.id === callId)
        if (!call) return
        
        const endTime = new Date()
        const startTime = new Date(call.created_at || call.timestamp)
        const duration = Math.round((endTime - startTime) / 1000 / 60)
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        
        await axios.put(`${API}/waiter-calls/${callId}`, {
          status: 'completed',
          completedAt: endTime.toISOString(),
          duration,
          employeeId: currentUser.id,
          employeeName: currentUser.name
        })

        // Lokalde güncelle
        const idx = this.calls.findIndex(c => c.id === callId)
        if (idx > -1) this.calls[idx].status = 'completed'
        
        // Ses çal
        notifService.playBeep('info')
        
      } catch (error) {
        alert('Güncelleme hatası: ' + error.message)
      }
    },
    
    async markAsPending(callId) {
      try {
        await axios.put(`${API}/waiter-calls/${callId}`, { status: 'pending' })
        const call = this.calls.find(c => c.id === callId)
        if (call) call.status = 'pending'
      } catch (error) {
        alert('Güncelleme hatası: ' + error.message)
      }
    },
    
    async deleteCall(callId) {
      if (!confirm('Bu çağrıyı silmek istediğinizden emin misiniz?')) return
      try {
        await axios.delete(`${API}/waiter-calls/${callId}`)
        this.calls = this.calls.filter(c => c.id !== callId)
      } catch (error) {
        alert('Silme hatası: ' + error.message)
      }
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '-'
      
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      
      if (diffMins < 1) {
        return 'Az önce'
      } else if (diffMins < 60) {
        return `${diffMins} dakika önce`
      } else if (diffHours < 24) {
        return `${diffHours} saat önce`
      } else {
        return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    
    getCallDuration(timestamp) {
      if (!timestamp) return '-'
      
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffMins < 1) {
        return 'Yeni'
      } else if (diffMins < 60) {
        return `${diffMins}dk`
      } else {
        const hours = Math.floor(diffMins / 60)
        const remainingMins = diffMins % 60
        return `${hours}s ${remainingMins}dk`
      }
    },
    
    getStatusText(status) {
      const statusMap = {
        'pending': 'Bekliyor',
        'completed': 'Tamamlandı'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  margin-left: 280px;
  flex: 1;
  padding: 2rem;
  background: var(--gray-50);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.refresh-btn {
  background: var(--primary-light);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary);
}

.refresh-btn:disabled {
  background: var(--gray-400);
  cursor: not-allowed;
  opacity: 0.6;
}

.status-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-card.pending .stat-icon {
  background: var(--warning-light);
}

.stat-card.completed .stat-icon {
  background: var(--success-light);
}

.stat-card.total .stat-icon {
  background: var(--primary-xlight);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.calls-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.calls-list {
  max-height: 600px;
  overflow-y: auto;
}

.call-card {
  border-bottom: 1px solid #eee;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.call-card:hover {
  background: var(--gray-50);
}

.call-card:last-child {
  border-bottom: none;
}

.call-card.pending {
  border-left: 4px solid var(--warning);
}

.call-card.completed {
  border-left: 4px solid var(--success);
  opacity: 0.8;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.call-table {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-icon {
  font-size: 1.2rem;
}

.table-number {
  font-weight: 600;
  color: #333;
}

.call-time {
  color: #666;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending {
  background: var(--warning-light);
  color: #92400e;
}

.status-badge.completed {
  background: var(--success-light);
  color: #065f46;
}

.call-body {
  margin-bottom: 1rem;
}

.call-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 8px;
}

.message-icon {
  font-size: 1.2rem;
}

.message-text {
  flex: 1;
  color: #333;
  line-height: 1.5;
}

.call-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.call-actions {
  display: flex;
  gap: 0.5rem;
}

.complete-btn {
  background: var(--success);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.complete-btn:hover {
  background: var(--success);
}

.reopen-btn {
  background: var(--warning);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.reopen-btn:hover {
  background: var(--accent-gold-dark);
}

.delete-btn {
  background: var(--danger);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: var(--danger);
}

.call-duration {
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .main-content {
    margin-left: 0;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .content-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .call-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .call-footer {
    flex-direction: column;
    gap: 1rem;
  }
  
  .call-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
