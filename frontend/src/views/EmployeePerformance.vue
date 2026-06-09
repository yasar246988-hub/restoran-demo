<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <NavigationSidebar />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1>👥 Çalışan Takibi</h1>
        <div class="header-actions">
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            {{ loading ? '🔄 Yenileniyor...' : '🔄 Yenile' }}
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="card">
          <div class="card-header">
            <h3>⚡ Hızlı İşlemler</h3>
          </div>
          <div class="card-body">
            <div class="action-grid">
              <div class="action-item">
                <input 
                  v-model="quickEmployeeName" 
                  type="text" 
                  placeholder="Çalışan adı" 
                  class="quick-input"
                  @keyup.enter="quickStartShift"
                />
                <button @click="quickStartShift" class="action-btn start" :disabled="!quickEmployeeName || loading">
                  🕐 Vardiya Başlat
                </button>
              </div>
              <div class="action-item">
                <input 
                  v-model="quickEmployeeNameEnd" 
                  type="text" 
                  placeholder="Çalışan adı" 
                  class="quick-input"
                  @keyup.enter="quickEndShift"
                />
                <button @click="quickEndShift" class="action-btn end" :disabled="!quickEmployeeNameEnd || loading">
                  🕐 Vardiya Bitir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Overview -->
      <div class="overview-section">
        <div class="card">
          <div class="card-header">
            <h3>📊 Bugünkü Durum</h3>
            <span class="date">{{ formatDate(today) }}</span>
          </div>
          <div class="card-body">
            <div class="overview-grid">
              <div class="overview-item">
                <div class="overview-icon">👥</div>
                <div class="overview-content">
                  <div class="overview-value">{{ todayStats.totalEmployees }}</div>
                  <div class="overview-label">Aktif Çalışan</div>
                </div>
              </div>
              <div class="overview-item">
                <div class="overview-icon">📋</div>
                <div class="overview-content">
                  <div class="overview-value">{{ todayStats.totalOrders }}</div>
                  <div class="overview-label">Toplam Sipariş</div>
                </div>
              </div>
              <div class="overview-item">
                <div class="overview-icon">📞</div>
                <div class="overview-content">
                  <div class="overview-value">{{ todayStats.totalWaiterCalls }}</div>
                  <div class="overview-label">Garson Çağrısı</div>
                </div>
              </div>
              <div class="overview-item">
                <div class="overview-icon">💰</div>
                <div class="overview-content">
                  <div class="overview-value">₺{{ todayStats.totalRevenue.toLocaleString() }}</div>
                  <div class="overview-label">Toplam Ciro</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Status -->
      <div class="employee-status">
        <div class="card">
          <div class="card-header">
            <h3>👤 Çalışan Durumları</h3>
          </div>
          <div class="card-body">
            <div v-if="employees.length === 0" class="empty-state">
              <div class="empty-icon">👥</div>
              <div class="empty-text">Henüz çalışan bulunmuyor</div>
              <div class="empty-subtext">Çalışanlar vardiya başlattığında burada görünecek</div>
            </div>
            <div v-else class="status-grid">
              <div 
                v-for="employee in employees" 
                :key="employee.employeeId" 
                class="status-card"
                :class="{ 'active': employee.isActive }"
              >
                <div class="status-header">
                  <div class="status-name">{{ employee.employeeName }}</div>
                  <div class="status-indicator" :class="{ 'active': employee.isActive }">
                    {{ employee.isActive ? '🟢 Çalışıyor' : '🔴 Kapalı' }}
                  </div>
                </div>
                <div class="status-details">
                  <div class="detail-row">
                    <span class="detail-label">Sipariş:</span>
                    <span class="detail-value">{{ employee.totalOrders }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Garson Çağrısı:</span>
                    <span class="detail-value">{{ employee.totalWaiterCalls }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Ciro:</span>
                    <span class="detail-value">₺{{ employee.totalRevenue.toLocaleString() }}</span>
                  </div>
                  <div v-if="employee.averageOrderTime" class="detail-row">
                    <span class="detail-label">Ort. Süre:</span>
                    <span class="detail-value">{{ employee.averageOrderTime.toFixed(1) }}dk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-section">
        <div class="card">
          <div class="card-header">
            <h3>📈 Son İşlemler</h3>
          </div>
          <div class="card-body">
            <div v-if="recentActivities.length === 0" class="empty-state">
              <div class="empty-icon">📈</div>
              <div class="empty-text">Henüz işlem bulunmuyor</div>
              <div class="empty-subtext">Siparişler ve garson çağrıları burada görünecek</div>
            </div>
            <div v-else class="activity-list">
              <div 
                v-for="activity in recentActivities" 
                :key="activity.id" 
                class="activity-item"
              >
                <div class="activity-icon">
                  {{ activity.type === 'order' ? '📋' : '📞' }}
                </div>
                <div class="activity-info">
                  <div class="activity-name">{{ activity.employeeName }}</div>
                  <div class="activity-action">
                    {{ activity.type === 'order' ? 'Sipariş tamamladı' : 'Garson çağrısı yanıtladı' }}
                    <span v-if="activity.duration" class="activity-time">
                      ({{ activity.duration }}dk)
                    </span>
                  </div>
                  <div class="activity-timestamp">
                    {{ formatTime(activity.timestamp) }}
                  </div>
                </div>
                <div v-if="activity.revenue" class="activity-amount">
                  ₺{{ activity.revenue }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'
import axios from 'axios'

export default {
  name: 'EmployeePerformance',
  components: {
    NavigationSidebar
  },
  data() {
    return {
      loading: false,
      quickEmployeeName: '',
      quickEmployeeNameEnd: '',
      today: new Date().toISOString().split('T')[0],
      todayStats: {
        totalEmployees: 0,
        totalOrders: 0,
        totalWaiterCalls: 0,
        totalRevenue: 0
      },
      employees: [],
      recentActivities: [],
      employeeShifts: [] // Yeni eklenen veri
    }
  },
  mounted() {
    this.loadData()
    // Her 30 saniyede bir otomatik yenile
    this.autoRefresh = setInterval(() => {
      this.loadData()
    }, 30000)
  },
  beforeUnmount() {
    if (this.autoRefresh) {
      clearInterval(this.autoRefresh)
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadTodayStats(),
          this.loadEmployees(),
          this.loadRecentActivities()
        ])
      } catch (error) {
        console.error('❌ Veri yükleme hatası:', error)
      } finally {
        this.loading = false
      }
    },

    async loadTodayStats() {
      try {
        const response = await axios.get(`http://localhost:3000/api/employee/performance/daily/${this.today}`)
        if (response.data.success) {
          this.todayStats = response.data.data
        }
      } catch (error) {
        console.error('❌ Günlük istatistik yükleme hatası:', error)
      }
    },

    async loadEmployees() {
      try {
        // Önce tüm kullanıcıları al (çalışanlar için)
        const usersResponse = await axios.get('http://localhost:3000/api/users')
        const allUsers = usersResponse.data.data || []
        
        // Sadece çalışan rolündeki kullanıcıları filtrele
        const employeeUsers = allUsers.filter(user => 
          user.role === 'calisan' || user.role === 'yonetici'
        )
        
        // Performans verilerini al
        const performanceResponse = await axios.get('http://localhost:3000/api/employee/performance')
        let performanceData = { employees: [], shifts: [] }
        
        if (performanceResponse.data.success) {
          performanceData = performanceResponse.data.data
        }
        
        // Vardiya verilerini al
        this.employeeShifts = performanceData.shifts || []
        
        // Çalışan listesini oluştur (kullanıcı + performans verisi)
        this.employees = employeeUsers.map(user => {
          const employeeId = user.id.toString()
          const existingEmployee = performanceData.employees.find(emp => emp.employeeId === employeeId)
          
          return {
            employeeId: employeeId,
            employeeName: user.name,
            role: user.role,
            email: user.email,
            isActive: this.isEmployeeActive(employeeId),
            totalOrders: existingEmployee ? existingEmployee.totalOrders : 0,
            totalRevenue: existingEmployee ? existingEmployee.totalRevenue : 0,
            totalWaiterCalls: existingEmployee ? existingEmployee.totalWaiterCalls : 0,
            averageOrderTime: existingEmployee ? existingEmployee.averageOrderTime : 0
          }
        })
        
        console.log('👥 Çalışan listesi güncellendi:', this.employees.length, 'çalışan')
      } catch (error) {
        console.error('❌ Çalışan listesi yükleme hatası:', error)
        this.employees = []
        this.employeeShifts = []
      }
    },

    async loadRecentActivities() {
      try {
        // Gerçek performans kayıtlarını al
        const response = await axios.get('http://localhost:3000/api/employee/performance')
        if (response.data.success) {
          // Backend'den gelen gerçek performans verilerini kullan
          const performanceData = response.data.data.performance || [];
          
          // Performans verilerini aktivite formatına dönüştür
          this.recentActivities = performanceData.map(perf => ({
            id: perf.id,
            employeeName: perf.employeeName,
            type: perf.type,
            duration: perf.duration,
            revenue: perf.revenue || 0,
            timestamp: perf.timestamp
          }));

          // Son aktivitelere göre sırala
          this.recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          
          // Son 10 aktiviteyi göster
          this.recentActivities = this.recentActivities.slice(0, 10)
        }
      } catch (error) {
        console.error('❌ Son aktiviteler yükleme hatası:', error)
        this.recentActivities = []
      }
    },

    isEmployeeActive(employeeId) {
      // Gerçek aktif kontrol - backend'den gelen verileri kullan
      const activeShift = this.employeeShifts?.find(shift => 
        shift.employeeId === employeeId && shift.endTime === null
      )
      return !!activeShift
    },

    async quickStartShift() {
      if (!this.quickEmployeeName.trim()) {
        alert('❌ Lütfen çalışan adını girin')
        return
      }

      try {
        this.loading = true
        const employeeId = 'EMP_' + this.quickEmployeeName.replace(/\s+/g, '_').toUpperCase() + '_' + Date.now().toString().slice(-6)
        
        const response = await axios.post('http://localhost:3000/api/employee/shift/start', {
          employeeId: employeeId,
          employeeName: this.quickEmployeeName
        })

        if (response.data.success) {
          alert('✅ Vardiya başlatıldı!')
          this.quickEmployeeName = ''
          this.loadData()
        }
      } catch (error) {
        console.error('❌ Vardiya başlatma hatası:', error)
        alert('❌ ' + (error.response?.data?.message || 'Vardiya başlatılamadı'))
      } finally {
        this.loading = false
      }
    },

    async quickEndShift() {
      if (!this.quickEmployeeNameEnd.trim()) {
        alert('❌ Lütfen çalışan adını girin')
        return
      }

      try {
        this.loading = true
        const employeeId = 'EMP_' + this.quickEmployeeNameEnd.replace(/\s+/g, '_').toUpperCase() + '_' + Date.now().toString().slice(-6)
        
        const response = await axios.post('http://localhost:3000/api/employee/shift/end', {
          employeeId: employeeId
        })

        if (response.data.success) {
          alert('✅ Vardiya bitirildi!')
          this.quickEmployeeNameEnd = ''
          this.loadData()
        }
      } catch (error) {
        console.error('❌ Vardiya bitirme hatası:', error)
        alert('❌ ' + (error.response?.data?.message || 'Vardiya bitirilemedi'))
      } finally {
        this.loading = false
      }
    },

    refreshData() {
      this.loadData()
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })
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
  overflow-y: auto;
  max-height: 100vh;
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
  font-size: 2rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}

.quick-actions {
  margin-bottom: 2rem;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.action-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-input {
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.quick-input:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.action-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.start {
  background: var(--success);
  color: white;
}

.action-btn.start:hover:not(:disabled) {
  background: var(--success);
}

.action-btn.end {
  background: var(--danger);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.overview-section {
  margin-bottom: 2rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.overview-item:hover {
  border-color: var(--primary-light);
  transform: translateY(-2px);
}

.overview-icon {
  font-size: 2rem;
}

.overview-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--gray-800);
}

.overview-label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.date {
  font-size: 0.875rem;
  color: var(--gray-500);
  font-weight: 500;
}

.employee-status {
  margin-bottom: 2rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.status-card {
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.status-card:hover {
  border-color: var(--primary-light);
  transform: translateY(-2px);
}

.status-card.active {
  border-color: var(--success);
  background: #f0fdf4;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
}

.status-indicator {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: var(--danger-light);
  color: var(--danger);
}

.status-indicator.active {
  background: var(--success-light);
  color: #065f46;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.detail-value {
  font-weight: 600;
  color: var(--gray-800);
}

.activity-section {
  margin-bottom: 2rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  border-left: 3px solid var(--gray-200);
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: #f1f5f9;
  border-left-color: var(--primary-light);
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-info {
  flex: 1;
}

.activity-name {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
}

.activity-action {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: 0.25rem;
}

.activity-time {
  color: var(--primary-light);
  font-weight: 500;
}

.activity-timestamp {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.activity-amount {
  font-weight: 600;
  color: var(--success);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gray-500);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-subtext {
  font-size: 0.875rem;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-light);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 