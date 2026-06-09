<template>
  <div class="app-layout">
    <NavigationSidebar />
    <main class="main-content">

      <!-- HEADER -->
      <div class="content-header">
        <h1>📊 Raporlar</h1>
        <div class="header-actions">
          <div class="period-tabs">
            <button :class="['period-tab', { active: period === 'today' }]"     @click="setPeriod('today')">Bugün</button>
            <button :class="['period-tab', { active: period === 'yesterday' }]" @click="setPeriod('yesterday')">Dün</button>
            <button :class="['period-tab', { active: period === 'week' }]"      @click="setPeriod('week')">Bu Hafta</button>
            <button :class="['period-tab', { active: period === 'month' }]"     @click="setPeriod('month')">Bu Ay</button>
            <button :class="['period-tab', { active: period === 'custom' }]"    @click="setPeriod('custom')">Özel</button>
          </div>
          <div v-if="period === 'custom'" class="custom-range">
            <input v-model="customStart" type="date" class="date-input" />
            <span>—</span>
            <input v-model="customEnd" type="date" class="date-input" />
            <button @click="loadReport" class="btn-refresh">Uygula</button>
          </div>
          <button @click="loadReport" :disabled="loading" class="btn-refresh">
            {{ loading ? '⏳' : '🔄' }} Yenile
          </button>
          <button @click="exportExcel" class="btn-export">📊 Excel</button>
          <button @click="showDailyClose = true" class="btn-close-day">🔒 Günü Kapat</button>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Rapor yükleniyor...</p>
      </div>

      <template v-else>

        <!-- METRİKLER -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">💰</div>
            <div class="metric-body">
              <div class="metric-value">₺{{ fmt(summary.totalRevenue) }}</div>
              <div class="metric-label">Toplam Ciro</div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">📋</div>
            <div class="metric-body">
              <div class="metric-value">{{ summary.totalOrders }}</div>
              <div class="metric-label">Tamamlanan Sipariş</div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">🧮</div>
            <div class="metric-body">
              <div class="metric-value">₺{{ fmt(summary.avgOrderValue) }}</div>
              <div class="metric-label">Ortalama Sepet</div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">🏷️</div>
            <div class="metric-body">
              <div class="metric-value">₺{{ fmt(summary.totalDiscount) }}</div>
              <div class="metric-label">Toplam İndirim</div>
            </div>
          </div>
          <div class="metric-card active-card">
            <div class="metric-icon">⏳</div>
            <div class="metric-body">
              <div class="metric-value">{{ summary.activeOrders || 0 }}</div>
              <div class="metric-label">Aktif Sipariş</div>
            </div>
          </div>
        </div>

        <div class="reports-grid">

          <!-- SAAT BAZLI GRAFİK -->
          <div class="report-card wide">
            <div class="report-card-head">⏰ Saatlik Satış Dağılımı</div>
            <div class="report-card-body">
              <div v-if="hourlyData.length === 0" class="no-data">Bu dönemde veri yok</div>
              <div v-else class="bar-chart">
                <div v-for="h in hourlyData" :key="h.hour" class="bar-col">
                  <div class="bar-label-top">{{ h.orders }}</div>
                  <div
                    class="bar-fill"
                    :style="{ height: barHeight(h.orders) + 'px' }"
                    :title="`${h.label}: ${h.orders} sipariş, ₺${h.revenue.toFixed(0)}`"
                  ></div>
                  <div class="bar-label-btm">{{ h.label }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ÖDEME YÖNTEMİ -->
          <div class="report-card">
            <div class="report-card-head">💳 Ödeme Yöntemleri</div>
            <div class="report-card-body">
              <div v-if="paymentTotal === 0" class="no-data">Veri yok</div>
              <div v-else class="payment-list">
                <div v-for="(amount, method) in paymentBreakdown" :key="method" v-show="amount > 0" class="payment-row">
                  <span class="payment-method">{{ paymentLabel(method) }}</span>
                  <div class="payment-bar-wrap">
                    <div class="payment-bar" :style="{ width: (amount / paymentTotal * 100) + '%' }"></div>
                  </div>
                  <span class="payment-amount">₺{{ fmt(amount) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- EN ÇOK SATANLAR -->
          <div class="report-card">
            <div class="report-card-head">🏆 En Çok Satan Ürünler</div>
            <div class="report-card-body">
              <div v-if="topProducts.length === 0" class="no-data">Veri yok</div>
              <div v-else class="rank-list">
                <div v-for="(p, i) in topProducts" :key="p.name" class="rank-row">
                  <span class="rank-num" :class="rankClass(i)">{{ i + 1 }}</span>
                  <span class="rank-name">{{ p.name }}</span>
                  <span class="rank-qty">{{ p.quantity }} adet</span>
                  <span class="rank-rev">₺{{ fmt(p.revenue) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- KATEGORİ DAĞILIMI -->
          <div class="report-card">
            <div class="report-card-head">🍽️ Kategori Bazlı Satışlar</div>
            <div class="report-card-body">
              <div v-if="categorySales.length === 0" class="no-data">Veri yok</div>
              <div v-else class="category-list">
                <div v-for="c in categorySales" :key="c.category" class="category-row">
                  <span class="cat-name">{{ c.category }}</span>
                  <div class="cat-bar-wrap">
                    <div class="cat-bar" :style="{ width: catBarWidth(c.revenue) + '%' }"></div>
                  </div>
                  <span class="cat-qty">{{ c.quantity }} adet</span>
                  <span class="cat-rev">₺{{ fmt(c.revenue) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- MASA BAZLI CİRO -->
          <div class="report-card">
            <div class="report-card-head">🪑 Masa Bazlı Ciro</div>
            <div class="report-card-body">
              <div v-if="tableSales.length === 0" class="no-data">Veri yok</div>
              <div v-else class="table-sales-list">
                <div v-for="t in tableSales.slice(0, 10)" :key="t.table" class="table-sale-row">
                  <span class="ts-table">Masa {{ t.table }}</span>
                  <span class="ts-orders">{{ t.orders }} sipariş</span>
                  <span class="ts-rev">₺{{ fmt(t.revenue) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- GÜN BAZLI TREND (haftalık/aylık) -->
          <div v-if="dailySummary.length > 1" class="report-card wide">
            <div class="report-card-head">📈 Günlük Trend</div>
            <div class="report-card-body">
              <div class="bar-chart">
                <div v-for="d in dailySummary" :key="d.date" class="bar-col">
                  <div class="bar-label-top">₺{{ d.revenue > 999 ? (d.revenue/1000).toFixed(1)+'k' : d.revenue.toFixed(0) }}</div>
                  <div class="bar-fill bar-fill-accent" :style="{ height: dailyBarH(d.revenue) + 'px' }" :title="d.date + ': ₺' + d.revenue.toFixed(2)"></div>
                  <div class="bar-label-btm">{{ shortDate(d.date) }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </template>

    </main>
  </div>

  <!-- GÜNLÜK KAPANIS MODALI -->
  <div v-if="showDailyClose" class="modal-overlay" @click.self="showDailyClose = false">
    <div class="modal close-modal">
      <div class="modal-header">
        <h2>🔒 Günlük Kapanış Raporu</h2>
        <button @click="showDailyClose = false" class="close-x">✕</button>
      </div>
      <div v-if="dailyLoading" class="modal-body" style="text-align:center;padding:40px">
        <div class="spinner"></div><p>Rapor hazırlanıyor...</p>
      </div>
      <div v-else-if="dailyReport" class="modal-body">
        <div class="daily-date">📅 {{ dailyReport.date }}</div>
        <div class="daily-stats">
          <div class="ds-item"><span>Toplam Sipariş</span><strong>{{ dailyReport.summary.totalOrders }}</strong></div>
          <div class="ds-item highlight"><span>Toplam Ciro</span><strong>₺{{ fmt(dailyReport.summary.totalRevenue) }}</strong></div>
          <div class="ds-item"><span>Ort. Sepet</span><strong>₺{{ fmt(dailyReport.summary.avgOrderValue) }}</strong></div>
          <div class="ds-item"><span>İndirim</span><strong>₺{{ fmt(dailyReport.summary.totalDiscount) }}</strong></div>
        </div>
        <h4>💳 Ödeme Dağılımı</h4>
        <div class="modal-payment-list">
          <div v-for="(amount, method) in dailyReport.paymentBreakdown" :key="method" v-show="amount > 0" class="mp-row">
            <span>{{ paymentLabel(method) }}</span><strong>₺{{ fmt(amount) }}</strong>
          </div>
        </div>
        <h4>🏆 En Çok Satanlar</h4>
        <div class="modal-top-list">
          <div v-for="(p, i) in (dailyReport.topProducts || []).slice(0, 5)" :key="p.name" class="mt-row">
            <span class="rank-num" :class="rankClass(i)">{{ i+1 }}</span>
            <span>{{ p.name }}</span>
            <span>{{ p.quantity }} adet</span>
            <strong>₺{{ fmt(p.revenue) }}</strong>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="printDailyReport" class="btn btn-primary">🖨️ Yazdır</button>
        <button @click="showDailyClose = false" class="btn btn-ghost">Kapat</button>
      </div>
    </div>
  </div>

</template>

<script>
import axios from 'axios'
import * as XLSX from 'xlsx'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'

const API = 'http://localhost:3000/api'

export default {
  name: 'Reports',
  components: { NavigationSidebar },
  data() {
    return {
      period: 'today',
      customStart: '',
      customEnd: '',
      loading: false,
      // Rapor verisi
      summary: { totalOrders: 0, totalRevenue: 0, totalDiscount: 0, avgOrderValue: 0, activeOrders: 0 },
      paymentBreakdown: {},
      hourlyData: [],
      topProducts: [],
      tableSales: [],
      categorySales: [],
      dailySummary: [],
      // Günlük kapanış
      showDailyClose: false,
      dailyLoading: false,
      dailyReport: null,
      // Yenileme
      refreshTimer: null
    }
  },

  computed: {
    paymentTotal() {
      return Object.values(this.paymentBreakdown).reduce((s, v) => s + v, 0)
    },
    maxHourlyOrders() {
      return Math.max(1, ...this.hourlyData.map(h => h.orders))
    },
    maxCatRevenue() {
      return Math.max(1, ...this.categorySales.map(c => c.revenue))
    },
    maxDailyRevenue() {
      return Math.max(1, ...this.dailySummary.map(d => d.revenue))
    }
  },

  async mounted() {
    // Varsayılan tarih aralığı
    const today = new Date().toISOString().split('T')[0]
    this.customStart = today
    this.customEnd = today
    await this.loadReport()
    this.refreshTimer = setInterval(this.loadReport, 60000)
  },

  beforeUnmount() {
    clearInterval(this.refreshTimer)
  },

  watch: {
    showDailyClose(val) {
      if (val) this.loadDailyReport()
    }
  },

  methods: {
    fmt(n) {
      return (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    paymentLabel(method) {
      const m = { cash: '💵 Nakit', card: '💳 Kart', transfer: '📱 Havale', mixed: '🔀 Karma', split: '✂️ Parçalı', other: '🔹 Diğer' }
      return m[method] || method
    },

    rankClass(i) {
      return i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
    },

    barHeight(orders) {
      return Math.max(4, (orders / this.maxHourlyOrders) * 120)
    },

    catBarWidth(rev) {
      return Math.max(2, (rev / this.maxCatRevenue) * 100)
    },

    dailyBarH(rev) {
      return Math.max(4, (rev / this.maxDailyRevenue) * 120)
    },

    shortDate(dateStr) {
      const d = new Date(dateStr)
      return `${d.getDate()}/${d.getMonth() + 1}`
    },

    setPeriod(p) {
      this.period = p
      this.loadReport()
    },

    getDateRange() {
      const today = new Date()
      const pad = n => String(n).padStart(2, '0')
      const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

      switch (this.period) {
        case 'today':
          return { start: fmt(today), end: fmt(today), single: fmt(today) }
        case 'yesterday': {
          const y = new Date(today); y.setDate(y.getDate() - 1)
          return { start: fmt(y), end: fmt(y), single: fmt(y) }
        }
        case 'week': {
          const w = new Date(today); w.setDate(w.getDate() - 6)
          return { start: fmt(w), end: fmt(today) }
        }
        case 'month': {
          const m = new Date(today.getFullYear(), today.getMonth(), 1)
          return { start: fmt(m), end: fmt(today) }
        }
        case 'custom':
          return { start: this.customStart, end: this.customEnd }
        default:
          return { start: fmt(today), end: fmt(today), single: fmt(today) }
      }
    },

    async loadReport() {
      this.loading = true
      try {
        const range = this.getDateRange()

        if (range.single || range.start === range.end) {
          // Günlük endpoint
          const res = await axios.get(`${API}/reports/daily`, { params: { date: range.start } })
          if (res.data.success) {
            const d = res.data.data
            this.summary = d.summary
            this.paymentBreakdown = d.paymentBreakdown
            this.hourlyData = d.hourlyData || []
            this.topProducts = d.topProducts || []
            this.tableSales = d.tableSales || []
            this.categorySales = d.categorySales || []
            this.dailySummary = []
          }
        } else {
          // Aralık endpoint
          const res = await axios.get(`${API}/reports/range`, {
            params: { startDate: range.start, endDate: range.end }
          })
          if (res.data.success) {
            const d = res.data.data
            this.summary = {
              totalOrders: d.totalOrders,
              totalRevenue: d.totalRevenue,
              avgOrderValue: d.avgOrderValue,
              totalDiscount: 0,
              activeOrders: 0
            }
            this.topProducts = d.topProducts || []
            this.dailySummary = d.dailySummary || []
            this.paymentBreakdown = {}
            this.hourlyData = []
            this.tableSales = []
            this.categorySales = []
          }
        }
      } catch (e) {
        console.warn('Rapor yüklenemedi:', e.message)
      } finally {
        this.loading = false
      }
    },

    async loadDailyReport() {
      this.dailyLoading = true
      this.dailyReport = null
      try {
        const today = new Date().toISOString().split('T')[0]
        const res = await axios.get(`${API}/reports/daily`, { params: { date: today } })
        if (res.data.success) this.dailyReport = res.data.data
      } catch (e) {
        console.warn('Günlük rapor yüklenemedi:', e.message)
      } finally {
        this.dailyLoading = false
      }
    },

    printDailyReport() {
      window.print()
    },

    exportExcel() {
      const wb = XLSX.utils.book_new()

      // Özet sayfası
      const summaryData = [
        ['Dönem', this.period === 'today' ? 'Bugün' : this.period],
        ['Toplam Sipariş', this.summary.totalOrders],
        ['Toplam Ciro (₺)', this.summary.totalRevenue],
        ['Ort. Sepet (₺)', this.summary.avgOrderValue],
        ['Toplam İndirim (₺)', this.summary.totalDiscount],
        [],
        ['Ödeme Yöntemi', 'Tutar (₺)'],
        ...Object.entries(this.paymentBreakdown)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => [this.paymentLabel(k), v])
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Özet')

      // En çok satanlar
      if (this.topProducts.length) {
        const prodData = [
          ['Sıra', 'Ürün', 'Adet', 'Ciro (₺)'],
          ...this.topProducts.map((p, i) => [i + 1, p.name, p.quantity, p.revenue.toFixed(2)])
        ]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodData), 'En Çok Satanlar')
      }

      // Masa bazlı
      if (this.tableSales.length) {
        const tableData = [
          ['Masa', 'Sipariş Sayısı', 'Ciro (₺)'],
          ...this.tableSales.map(t => [t.table, t.orders, t.revenue.toFixed(2)])
        ]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tableData), 'Masa Bazlı')
      }

      // Saatlik
      if (this.hourlyData.length) {
        const hourData = [
          ['Saat', 'Sipariş', 'Ciro (₺)'],
          ...this.hourlyData.map(h => [h.label, h.orders, h.revenue.toFixed(2)])
        ]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hourData), 'Saatlik')
      }

      const fname = `Rapor_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`
      XLSX.writeFile(wb, fname)
    }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.main-content {
  margin-left: 280px;
  flex: 1;
  padding: 1.75rem 2rem;
  background: var(--bg-app);
}

/* HEADER */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary-border);
}

.content-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.period-tabs {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}

.period-tab {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--gray-600);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.period-tab.active {
  background: var(--primary);
  color: white;
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input {
  padding: 6px 10px;
  border: 1.5px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  outline: none;
}

.date-input:focus { border-color: var(--primary-light); }

.btn-refresh, .btn-export, .btn-close-day {
  padding: 7px 14px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-refresh { background: var(--primary-xlight); color: var(--primary); }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-export { background: #dcfce7; color: #166534; }
.btn-close-day { background: var(--danger-light); color: var(--danger); }

/* LOADING */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--gray-500);
}

.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* METRİKLER */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 1.5rem;
}

@media (max-width: 1100px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px)  { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }

.metric-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  border-left: 4px solid var(--primary-border);
}

.metric-card.active-card { border-left-color: var(--warning); }

.metric-icon { font-size: 1.8rem; }
.metric-value { font-size: 1.3rem; font-weight: 800; color: var(--primary-dark); }
.metric-label { font-size: 0.78rem; color: var(--gray-500); margin-top: 2px; }

/* RAPOR GRID */
.reports-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.report-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.report-card.wide { grid-column: 1 / -1; }

.report-card-head {
  padding: 12px 18px;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
}

.report-card-body {
  padding: 16px 18px;
  max-height: 320px;
  overflow-y: auto;
}

.no-data {
  text-align: center;
  color: var(--gray-400);
  padding: 30px;
  font-size: 0.9rem;
}

/* BAR GRAFİK */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 160px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 36px;
  flex-shrink: 0;
}

.bar-label-top {
  font-size: 0.7rem;
  color: var(--gray-500);
  font-weight: 600;
}

.bar-fill {
  width: 28px;
  background: var(--gradient-primary);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 4px;
}

.bar-fill-accent { background: var(--gradient-accent); }

.bar-label-btm {
  font-size: 0.68rem;
  color: var(--gray-500);
  white-space: nowrap;
}

/* ÖDEME */
.payment-list { display: flex; flex-direction: column; gap: 10px; }

.payment-row {
  display: grid;
  grid-template-columns: 110px 1fr 80px;
  align-items: center;
  gap: 10px;
}

.payment-method { font-size: 0.85rem; font-weight: 600; color: var(--gray-700); }
.payment-bar-wrap { background: var(--gray-100); border-radius: 4px; height: 10px; overflow: hidden; }
.payment-bar { height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.4s; }
.payment-amount { font-size: 0.85rem; font-weight: 700; color: var(--primary); text-align: right; }

/* SIRALI LİSTE */
.rank-list { display: flex; flex-direction: column; gap: 8px; }

.rank-row {
  display: grid;
  grid-template-columns: 28px 1fr 70px 80px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--gray-50);
  font-size: 0.85rem;
}

.rank-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--gray-200);
  color: var(--gray-700);
}

.rank-num.gold   { background: #fef3c7; color: #92400e; }
.rank-num.silver { background: #f1f5f9; color: #475569; }
.rank-num.bronze { background: #fef2f2; color: #991b1b; }

.rank-name { font-weight: 600; color: var(--gray-800); }
.rank-qty  { color: var(--gray-500); font-size: 0.8rem; }
.rank-rev  { font-weight: 700; color: var(--primary); text-align: right; }

/* KATEGORİ */
.category-list { display: flex; flex-direction: column; gap: 10px; }

.category-row {
  display: grid;
  grid-template-columns: 100px 1fr 60px 80px;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
}

.cat-name { font-weight: 600; color: var(--gray-700); }
.cat-bar-wrap { background: var(--gray-100); border-radius: 4px; height: 8px; overflow: hidden; }
.cat-bar { height: 100%; background: var(--gradient-accent); border-radius: 4px; }
.cat-qty { color: var(--gray-500); font-size: 0.78rem; }
.cat-rev { font-weight: 700; color: var(--primary); text-align: right; }

/* MASA */
.table-sales-list { display: flex; flex-direction: column; gap: 6px; }

.table-sale-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 10px;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
}

.ts-table { font-weight: 700; color: var(--primary); }
.ts-orders { color: var(--gray-500); }
.ts-rev { font-weight: 700; color: var(--gray-800); }

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.close-modal { max-width: 560px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.modal-header h2 { font-size: 1.05rem; font-weight: 700; margin: 0; }

.close-x {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
}

.modal-body {
  padding: 20px;
}

.daily-date {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 14px;
}

.daily-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.ds-item {
  background: var(--gray-50);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ds-item span { font-size: 0.78rem; color: var(--gray-500); }
.ds-item strong { font-size: 1.1rem; font-weight: 700; color: var(--gray-800); }
.ds-item.highlight strong { color: var(--success); font-size: 1.2rem; }

.modal-body h4 { font-size: 0.9rem; font-weight: 700; color: var(--primary-dark); margin: 14px 0 8px; }

.modal-payment-list { display: flex; flex-direction: column; gap: 6px; }
.mp-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.modal-top-list { display: flex; flex-direction: column; gap: 6px; }
.mt-row {
  display: grid;
  grid-template-columns: 24px 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 5px 8px;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--gray-200);
}

.btn {
  padding: 9px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

.btn-primary { background: var(--gradient-primary); color: white; }
.btn-ghost   { background: var(--gray-100); color: var(--gray-700); }
</style>
