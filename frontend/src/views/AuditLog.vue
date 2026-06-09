<template>
  <div class="app-layout">
    <NavigationSidebar />
    <main class="main-content">

      <div class="content-header">
        <h1>📋 Denetim Günlüğü</h1>
        <div class="header-actions">
          <button @click="loadLogs" class="refresh-btn">🔄 Yenile</button>
        </div>
      </div>

      <!-- Filtreler -->
      <div class="filter-bar">
        <input v-model="filterUser" type="text" placeholder="👤 Kullanıcı ara..." class="filter-input" @input="loadLogs" />
        <select v-model="filterAction" class="filter-select" @change="loadLogs">
          <option value="">Tüm İşlemler</option>
          <option value="GIRIS">Giriş</option>
          <option value="ODEME">Ödeme</option>
          <option value="KASA">Kasa</option>
          <option value="MENU">Menü</option>
          <option value="KULLANICI">Kullanıcı</option>
          <option value="MASA">Masa</option>
        </select>
        <input v-model="filterDate" type="date" class="filter-input" @change="loadLogs" />
        <button @click="clearFilters" class="clear-btn">✕ Temizle</button>
      </div>

      <!-- İstatistik Kartlar -->
      <div class="stats-row">
        <div class="stat-pill">
          <span>Toplam Kayıt</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="stat-pill">
          <span>Bugün</span>
          <strong>{{ todayCount }}</strong>
        </div>
        <div class="stat-pill">
          <span>Gösterilen</span>
          <strong>{{ logs.length }}</strong>
        </div>
      </div>

      <!-- Log Tablosu -->
      <div class="log-table-wrap">
        <div v-if="loading" class="loading-msg">⏳ Yükleniyor...</div>
        <div v-else-if="logs.length === 0" class="empty-msg">Kayıt bulunamadı</div>
        <table v-else class="log-table">
          <thead>
            <tr>
              <th>Zaman</th>
              <th>Kullanıcı</th>
              <th>Rol</th>
              <th>İşlem</th>
              <th>Detay</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" :class="getRowClass(log.action)">
              <td class="time-cell">{{ formatTime(log.timestamp) }}</td>
              <td class="user-cell">{{ log.userName }}</td>
              <td><span :class="['role-badge', log.userRole]">{{ getRoleLabel(log.userRole) }}</span></td>
              <td><span :class="['action-badge', getActionClass(log.action)]">{{ getActionLabel(log.action) }}</span></td>
              <td class="detail-cell">{{ log.details }}</td>
              <td class="ip-cell">{{ log.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sayfalama -->
      <div v-if="total > limit" class="pagination">
        <button @click="prevPage" :disabled="offset === 0" class="page-btn">‹ Önceki</button>
        <span class="page-info">{{ Math.floor(offset / limit) + 1 }} / {{ Math.ceil(total / limit) }}</span>
        <button @click="nextPage" :disabled="offset + limit >= total" class="page-btn">Sonraki ›</button>
      </div>

    </main>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'

export default {
  name: 'AuditLog',
  components: { NavigationSidebar },
  data() {
    return {
      logs: [],
      total: 0,
      todayCount: 0,
      loading: false,
      filterUser: '',
      filterAction: '',
      filterDate: '',
      limit: 50,
      offset: 0
    }
  },
  async mounted() {
    await this.loadLogs()
  },
  methods: {
    getToken() { return localStorage.getItem('token') },
    async loadLogs() {
      this.loading = true
      try {
        const params = new URLSearchParams({
          limit: this.limit,
          offset: this.offset
        })
        if (this.filterUser) params.append('user', this.filterUser)
        if (this.filterAction) params.append('action', this.filterAction)
        if (this.filterDate) params.append('date', this.filterDate)

        const res = await axios.get(`http://localhost:3000/api/audit-log?${params}`, {
          headers: { Authorization: `Bearer ${this.getToken()}` }
        })
        if (res.data.success) {
          this.logs = res.data.data
          this.total = res.data.total

          // Bugünkü kayıt sayısı
          const today = new Date().toISOString().split('T')[0]
          const todayRes = await axios.get(`http://localhost:3000/api/audit-log?limit=1&offset=0&date=${today}`, {
            headers: { Authorization: `Bearer ${this.getToken()}` }
          })
          this.todayCount = todayRes.data.total || 0
        }
      } catch (e) {
        console.warn('Denetim günlüğü yüklenemedi:', e.message)
      } finally {
        this.loading = false
      }
    },
    clearFilters() {
      this.filterUser = ''
      this.filterAction = ''
      this.filterDate = ''
      this.offset = 0
      this.loadLogs()
    },
    prevPage() {
      this.offset = Math.max(0, this.offset - this.limit)
      this.loadLogs()
    },
    nextPage() {
      this.offset += this.limit
      this.loadLogs()
    },
    formatTime(ts) {
      return new Date(ts).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    },
    getRoleLabel(role) {
      const m = { ceo: 'CEO', yonetici: 'Yönetici', calisan: 'Çalışan', system: 'Sistem' }
      return m[role] || role
    },
    getActionLabel(action) {
      const m = {
        GIRIS: '🔐 Giriş', CIKIS: '🚪 Çıkış',
        ODEME: '💳 Ödeme', KASA_ACILIS: '🔓 Kasa Açılış', KASA_KAPANIS: '🔒 Kasa Kapanış',
        MENU_GUNCELLEME: '✏️ Menü Güncelleme', MENU_SILME: '🗑️ Menü Silme',
        KULLANICI_OLUSTURMA: '👤 Kullanıcı Oluşturma', MASA_TRANSFER: '🔄 Masa Transfer',
        SIPARIS_IPTAL: '❌ Sipariş İptal'
      }
      return m[action] || action
    },
    getActionClass(action) {
      if (action.includes('SILME') || action.includes('IPTAL')) return 'danger'
      if (action.includes('KASA')) return 'warning'
      if (action.includes('ODEME')) return 'success'
      if (action.includes('GIRIS')) return 'info'
      return 'default'
    },
    getRowClass(action) {
      if (action.includes('SILME') || action.includes('IPTAL')) return 'row-danger'
      if (action.includes('KASA_KAPANIS')) return 'row-warning'
      return ''
    }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.main-content { margin-left: 280px; flex: 1; padding: 2rem; background: var(--gray-50); }
.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.content-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--gray-800); }
.refresh-btn { padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

/* Filtreler */
.filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-input { padding: 8px 12px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 0.88rem; outline: none; min-width: 160px; }
.filter-input:focus { border-color: var(--primary); }
.filter-select { padding: 8px 12px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 0.88rem; outline: none; background: white; }
.clear-btn { padding: 8px 14px; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 8px; cursor: pointer; font-size: 0.85rem; }

/* İstatistikler */
.stats-row { display: flex; gap: 12px; margin-bottom: 16px; }
.stat-pill { background: white; border-radius: 20px; padding: 8px 18px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); font-size: 0.85rem; }
.stat-pill span { color: #888; }
.stat-pill strong { font-weight: 700; color: var(--gray-800); }

/* Tablo */
.log-table-wrap { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.loading-msg, .empty-msg { text-align: center; padding: 40px; color: #aaa; }
.log-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.log-table thead tr { background: var(--gray-50); }
.log-table th { padding: 12px 14px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid var(--gray-200); white-space: nowrap; }
.log-table td { padding: 10px 14px; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
.log-table tr:last-child td { border-bottom: none; }
.log-table tr:hover td { background: #fafafa; }
.row-danger td { background: #fff5f5 !important; }
.row-warning td { background: var(--warning-light) !important; }

.time-cell { white-space: nowrap; color: #888; font-size: 0.8rem; }
.user-cell { font-weight: 600; }
.detail-cell { max-width: 300px; color: #555; }
.ip-cell { font-family: monospace; font-size: 0.78rem; color: #aaa; }

/* Badge'ler */
.role-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
.role-badge.ceo { background: var(--warning-light); color: var(--accent-gold-dark); }
.role-badge.yonetici { background: var(--primary-xlight); color: var(--primary-dark); }
.role-badge.calisan { background: var(--success-light); color: var(--success); }
.role-badge.system { background: var(--gray-100); color: var(--gray-500); }

.action-badge { padding: 3px 10px; border-radius: 10px; font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
.action-badge.danger { background: var(--danger-light); color: var(--danger); }
.action-badge.warning { background: var(--warning-light); color: var(--accent-gold-dark); }
.action-badge.success { background: var(--success-light); color: var(--success); }
.action-badge.info { background: var(--primary-xlight); color: var(--primary-dark); }
.action-badge.default { background: var(--gray-100); color: var(--gray-500); }

/* Sayfalama */
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.page-btn { padding: 8px 18px; background: white; border: 1.5px solid var(--gray-200); border-radius: 8px; cursor: pointer; font-weight: 600; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.88rem; color: #555; }
</style>
