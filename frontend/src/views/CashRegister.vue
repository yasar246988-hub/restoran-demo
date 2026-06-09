<template>
  <div class="app-layout">
    <NavigationSidebar />
    <main class="main-content">

      <div class="content-header">
        <h1>💰 Kasa Yönetimi</h1>
        <div class="header-actions">
          <router-link to="/cashier-pos" class="pos-link-btn">🧾 Kasa Ödeme Ekranı</router-link>
          <div :class="['kasa-status-badge', isOpen ? 'open' : 'closed']">
            {{ isOpen ? '🟢 Kasa Açık' : '🔴 Kasa Kapalı' }}
          </div>
        </div>
      </div>

      <!-- Kasa Kapalı -->
      <div v-if="!isOpen" class="kasa-card">
        <div class="kasa-icon">🔒</div>
        <h2>Kasa Kapalı</h2>
        <p>Günü başlatmak için kasayı açın. Başlangıç para miktarını girin.</p>
        <div class="open-form">
          <div class="form-group">
            <label>Başlangıç Nakit (₺)</label>
            <input v-model.number="openingCash" type="number" min="0" step="0.01" class="cash-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>Not (opsiyonel)</label>
            <input v-model="openNotes" type="text" class="cash-input" placeholder="Kasa açılış notu..." />
          </div>
          <button @click="openCash" :disabled="opening" class="open-btn">
            {{ opening ? '⏳ Açılıyor...' : '🔓 Kasayı Aç' }}
          </button>
        </div>
      </div>

      <!-- Kasa Açık -->
      <div v-else>

        <!-- Özet Kartlar -->
        <div class="summary-grid">
          <div class="summary-card green">
            <div class="summary-icon">💵</div>
            <div>
              <div class="summary-num">₺{{ activeSession.openingCash.toFixed(2) }}</div>
              <div class="summary-label">Başlangıç Nakit</div>
            </div>
          </div>
          <div class="summary-card blue">
            <div class="summary-icon">📋</div>
            <div>
              <div class="summary-num">{{ todayStats.orderCount }}</div>
              <div class="summary-label">Sipariş Sayısı</div>
            </div>
          </div>
          <div class="summary-card purple">
            <div class="summary-icon">💰</div>
            <div>
              <div class="summary-num">₺{{ todayStats.total.toFixed(2) }}</div>
              <div class="summary-label">Toplam Satış</div>
            </div>
          </div>
          <div class="summary-card orange">
            <div class="summary-icon">⏱️</div>
            <div>
              <div class="summary-num">{{ openDuration }}</div>
              <div class="summary-label">Açık Süre</div>
            </div>
          </div>
        </div>

        <!-- Ödeme Dağılımı -->
        <div class="payment-breakdown-card">
          <h3>💳 Ödeme Dağılımı</h3>
          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span class="breakdown-icon">💵</span>
              <span class="breakdown-label">Nakit</span>
              <span class="breakdown-amount">₺{{ todayStats.cash.toFixed(2) }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-icon">💳</span>
              <span class="breakdown-label">Kart</span>
              <span class="breakdown-amount">₺{{ todayStats.card.toFixed(2) }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-icon">📱</span>
              <span class="breakdown-label">Havale</span>
              <span class="breakdown-amount">₺{{ todayStats.transfer.toFixed(2) }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-icon">🔀</span>
              <span class="breakdown-label">Karma</span>
              <span class="breakdown-amount">₺{{ todayStats.mixed.toFixed(2) }}</span>
            </div>
          </div>
          <div class="expected-cash">
            <span>Kasada Olması Gereken Nakit:</span>
            <strong>₺{{ expectedCash.toFixed(2) }}</strong>
          </div>
        </div>

        <!-- Kasa Kapanış -->
        <div class="close-card">
          <h3>🔒 Kasa Kapanışı</h3>
          <p>Kasayı kapatmadan önce fiziksel nakit sayımı yapın.</p>
          <div class="close-form">
            <div class="form-group">
              <label>Kasadaki Gerçek Nakit (₺)</label>
              <input v-model.number="closingCash" type="number" min="0" step="0.01" class="cash-input" placeholder="0.00" />
              <div v-if="closingCash !== null" :class="['diff-badge', cashDiff >= 0 ? 'positive' : 'negative']">
                {{ cashDiff >= 0 ? '+' : '' }}₺{{ cashDiff.toFixed(2) }} fark
              </div>
            </div>
            <div class="form-group">
              <label>Kapanış Notu</label>
              <input v-model="closeNotes" type="text" class="cash-input" placeholder="Kapanış notu..." />
            </div>
            <button @click="closeCash" :disabled="closing || closingCash === null" class="close-btn">
              {{ closing ? '⏳ Kapatılıyor...' : '🔒 Kasayı Kapat' }}
            </button>
          </div>
        </div>

      </div>

      <!-- Aktif Masalar -->
      <div class="active-tables-card">
        <div class="active-tables-header">
          <h3>🪑 Aktif Masalar</h3>
          <button @click="loadActiveTables" class="refresh-small-btn">🔄</button>
        </div>
        <div v-if="activeTables.length === 0" class="empty-tables">Şu an açık masa yok</div>
        <div v-else class="active-tables-grid">
          <div v-for="table in activeTables" :key="table.tableNum" class="active-table-card">
            <div class="active-table-header">
              <span class="table-num-badge">🪑 Masa {{ table.tableNum }}</span>
              <span class="table-duration">{{ getTableDuration(table.openedAt) }}</span>
            </div>
            <div class="active-table-items">
              <div v-for="item in table.items.slice(0, 4)" :key="item.name" class="table-item-row">
                <span>{{ item.quantity }}x {{ item.name }}</span>
                <span v-if="item.notes" class="item-note-small">📝 {{ item.notes }}</span>
              </div>
              <div v-if="table.items.length > 4" class="more-items-small">+{{ table.items.length - 4 }} ürün daha</div>
            </div>
            <div v-if="table.notes" class="table-notes-small">📝 {{ table.notes }}</div>
            <div class="active-table-footer">
              <span class="table-total">₺{{ table.total.toFixed(2) }}</span>
              <div class="table-actions">
                <button @click="printTableBill(table)" class="bill-btn">🖨️ Adisyon</button>
                <button @click="openCheckout(table)" class="checkout-btn">💳 Hesap Al</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hesap Alma Modalı -->
      <div v-if="checkoutTable" class="modal-overlay" @click.self="checkoutTable = null">
        <div class="checkout-modal">
          <div class="checkout-header">
            <h2>💳 Masa {{ checkoutTable.tableNum }} — Hesap</h2>
            <button @click="checkoutTable = null" class="close-x">✕</button>
          </div>
          <div class="checkout-body">
            <div class="checkout-items">
              <div v-for="item in checkoutTable.items" :key="item.name" class="checkout-item">
                <span>{{ item.quantity }}x {{ item.name }}</span>
                <span v-if="item.notes" class="item-note-small">📝 {{ item.notes }}</span>
                <span class="checkout-item-price">₺{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
            <div class="checkout-summary">
              <div class="checkout-row">
                <span>Ara Toplam</span>
                <strong>₺{{ checkoutTable.total.toFixed(2) }}</strong>
              </div>
              <div v-if="checkoutMode === 'full'" class="checkout-row">
                <span>İndirim (₺)</span>
                <input v-model.number="checkoutDiscount" type="number" min="0" class="discount-small-input" />
              </div>
              <div v-if="checkoutMode === 'split'" class="split-checkout-section">
                <div class="checkout-row">
                  <span>Kaç kişiye bölünsün?</span>
                  <div class="split-qty-inline">
                    <button @click="splitCount = Math.max(2, splitCount - 1)" class="qty-btn-sm">−</button>
                    <span>{{ splitCount }}</span>
                    <button @click="splitCount++" class="qty-btn-sm">+</button>
                  </div>
                </div>
                <div class="checkout-row">
                  <span>Şimdi kaç kişi ödüyor?</span>
                  <div class="split-qty-inline">
                    <button @click="splitPaying = Math.max(1, splitPaying - 1)" class="qty-btn-sm">−</button>
                    <span>{{ splitPaying }}</span>
                    <button @click="splitPaying = Math.min(splitCount, splitPaying + 1)" class="qty-btn-sm">+</button>
                  </div>
                </div>
              </div>
              <div class="checkout-row total-row">
                <span>{{ checkoutMode === 'split' ? 'Bu ödeme' : 'Ödenecek' }}</span>
                <strong class="checkout-final">₺{{ checkoutMode === 'split' ? splitPayAmount : checkoutFinal }}</strong>
              </div>
            </div>
            <div class="checkout-mode-tabs">
              <button @click="checkoutMode = 'full'" :class="['mode-tab', { active: checkoutMode === 'full' }]">💳 Tam Ödeme</button>
              <button @click="checkoutMode = 'split'" :class="['mode-tab', { active: checkoutMode === 'split' }]">👥 Parçalı Ödeme</button>
            </div>
            <div class="checkout-methods">
              <button v-for="m in paymentMethods" :key="m.value"
                @click="checkoutMethod = m.value"
                :class="['method-btn-small', { active: checkoutMethod === m.value }]">
                {{ m.icon }} {{ m.label }}
              </button>
            </div>
            <div class="form-group" style="margin-top:12px">
              <input v-model="checkoutNote" type="text" class="cash-input" placeholder="Ödeme notu..." />
            </div>
          </div>
          <div class="checkout-footer">
            <button @click="checkoutMode === 'split' ? confirmSplitCheckout() : confirmCheckout()" :disabled="!checkoutMethod || checkingOut" class="confirm-checkout-btn">
              {{ checkingOut ? '⏳...' : checkoutMode === 'split'
                ? `✅ ₺${splitPayAmount} Parçalı Tahsil Et`
                : `✅ ₺${checkoutFinal} Tahsil Et — Masayı Kapat` }}
            </button>
            <button @click="checkoutTable = null" class="cancel-checkout-btn">İptal</button>
          </div>
        </div>
      </div>

      <!-- Kasa Geçmişi -->
      <div class="history-card">
        <h3>📋 Kasa Geçmişi</h3>
        <div v-if="history.length === 0" class="empty-history">Henüz kasa kaydı yok</div>
        <div v-else class="history-list">
          <div v-for="s in history" :key="s.id" class="history-item">
            <div class="history-left">
              <span :class="['history-status', s.status]">{{ s.status === 'open' ? '🟢 Açık' : '⚫ Kapalı' }}</span>
              <div class="history-info">
                <strong>{{ formatDate(s.openedAt) }}</strong>
                <span>{{ s.openedBy }}</span>
              </div>
            </div>
            <div class="history-right">
              <div class="history-stat">
                <span>Başlangıç</span>
                <strong>₺{{ s.openingCash?.toFixed(2) }}</strong>
              </div>
              <div v-if="s.status === 'closed'" class="history-stat">
                <span>Toplam Satış</span>
                <strong>₺{{ s.totalSales?.total?.toFixed(2) }}</strong>
              </div>
              <div v-if="s.status === 'closed'" :class="['history-stat', s.cashDifference >= 0 ? 'pos' : 'neg']">
                <span>Fark</span>
                <strong>{{ s.cashDifference >= 0 ? '+' : '' }}₺{{ s.cashDifference?.toFixed(2) }}</strong>
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

export default {
  name: 'CashRegister',
  components: { NavigationSidebar },
  data() {
    return {
      isOpen: false,
      activeSession: null,
      history: [],
      activeTables: [],
      openingCash: 0,
      openNotes: '',
      closingCash: null,
      closeNotes: '',
      opening: false,
      closing: false,
      todayStats: { cash: 0, card: 0, transfer: 0, mixed: 0, total: 0, orderCount: 0 },
      timer: null,
      // Hesap alma
      checkoutTable: null,
      checkoutDiscount: 0,
      checkoutMethod: 'cash',
      checkoutNote: '',
      checkingOut: false,
      checkoutMode: 'full',
      splitCount: 2,
      splitPaying: 1,
      paymentMethods: [
        { value: 'cash', icon: '💵', label: 'Nakit' },
        { value: 'card', icon: '💳', label: 'Kart' },
        { value: 'transfer', icon: '📱', label: 'Havale' },
        { value: 'mixed', icon: '🔀', label: 'Karma' }
      ]
    }
  },
  computed: {
    expectedCash() {
      if (!this.activeSession) return 0
      return this.activeSession.openingCash + this.todayStats.cash
    },
    cashDiff() {
      if (this.closingCash === null) return 0
      return this.closingCash - this.expectedCash
    },
    openDuration() {
      if (!this.activeSession) return '-'
      const diff = Date.now() - new Date(this.activeSession.openedAt).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      return `${h}s ${m}dk`
    },
    checkoutFinal() {
      if (!this.checkoutTable) return '0.00'
      return Math.max(0, this.checkoutTable.total - (this.checkoutDiscount || 0)).toFixed(2)
    },
    splitPayAmount() {
      if (!this.checkoutTable) return '0.00'
      return ((this.checkoutTable.total / this.splitCount) * this.splitPaying).toFixed(2)
    }
  },
  async mounted() {
    await this.loadStatus()
    await this.loadHistory()
    await this.loadTodayStats()
    await this.loadActiveTables()
    this.timer = setInterval(() => {
      this.loadActiveTables()
      this.$forceUpdate()
    }, 15000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    getToken() { return localStorage.getItem('token') },
    async loadStatus() {
      try {
        const res = await axios.get('http://localhost:3000/api/cash-register/status', {
          headers: { Authorization: `Bearer ${this.getToken()}` }
        })
        this.isOpen = res.data.isOpen
        this.activeSession = res.data.data
      } catch (e) { console.warn(e.message) }
    },
    async loadHistory() {
      try {
        const res = await axios.get('http://localhost:3000/api/cash-register/history', {
          headers: { Authorization: `Bearer ${this.getToken()}` }
        })
        this.history = res.data.data || []
      } catch (e) { console.warn(e.message) }
    },
    async loadTodayStats() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const res = await axios.get(`http://localhost:3000/api/reports/daily?date=${today}`)
        if (res.data.success) {
          const d = res.data.data
          this.todayStats = {
            cash: d.paymentBreakdown?.cash || 0,
            card: d.paymentBreakdown?.card || 0,
            transfer: d.paymentBreakdown?.transfer || 0,
            mixed: d.paymentBreakdown?.mixed || 0,
            total: d.summary?.totalRevenue || 0,
            orderCount: d.summary?.totalOrders || 0
          }
        }
      } catch (e) { console.warn(e.message) }
    },
    async openCash() {
      this.opening = true
      try {
        const res = await axios.post('http://localhost:3000/api/cash-register/open',
          { openingCash: this.openingCash, notes: this.openNotes },
          { headers: { Authorization: `Bearer ${this.getToken()}` } }
        )
        if (res.data.success) {
          this.isOpen = true
          this.activeSession = res.data.data
          this.openNotes = ''
          alert('✅ Kasa açıldı!')
        }
      } catch (e) {
        alert('❌ ' + (e.response?.data?.message || e.message))
      } finally {
        this.opening = false
      }
    },
    async closeCash() {
      if (this.closingCash === null) return
      if (!confirm(`Kasayı kapatmak istediğinize emin misiniz?\nFark: ₺${this.cashDiff.toFixed(2)}`)) return
      this.closing = true
      try {
        const res = await axios.post('http://localhost:3000/api/cash-register/close',
          { closingCash: this.closingCash, notes: this.closeNotes },
          { headers: { Authorization: `Bearer ${this.getToken()}` } }
        )
        if (res.data.success) {
          this.isOpen = false
          this.activeSession = null
          this.closingCash = null
          this.closeNotes = ''
          await this.loadHistory()
          alert('✅ Kasa kapatıldı!')
        }
      } catch (e) {
        alert('❌ ' + (e.response?.data?.message || e.message))
      } finally {
        this.closing = false
      }
    },
    formatDate(d) {
      return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },

    async loadActiveTables() {
      try {
        const res = await axios.get('http://localhost:3000/api/tables/active-status')
        if (res.data.success) this.activeTables = res.data.data
      } catch (e) { console.warn(e.message) }
    },

    getTableDuration(openedAt) {
      if (!openedAt) return ''
      const diff = Date.now() - new Date(openedAt).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      return h > 0 ? `${h}s ${m}dk` : `${m}dk`
    },

    printTableBill(table) {
      const items = table.items || []
      const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
        <title>Adisyon - Masa ${table.tableNum}</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 10px; font-size: 13px; }
          h2 { text-align: center; font-size: 15px; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .note { font-size: 11px; color: #555; padding-left: 8px; }
          .total { font-weight: bold; font-size: 15px; }
          @media print { @page { margin: 5mm; } }
        </style></head><body>
        <h2>ADİSYON</h2>
        <div style="text-align:center">Masa ${table.tableNum}</div>
        <div style="text-align:center;font-size:11px">${new Date().toLocaleString('tr-TR')}</div>
        <div class="line"></div>
        ${items.map(i => `
          <div class="row"><span>${i.quantity}x ${i.name}</span><span>₺${(i.price * i.quantity).toFixed(2)}</span></div>
          ${i.notes ? `<div class="note">📝 ${i.notes}</div>` : ''}
        `).join('')}
        ${table.notes ? `<div class="line"></div><div class="note">Not: ${table.notes}</div>` : ''}
        <div class="line"></div>
        <div class="row total"><span>TOPLAM</span><span>₺${table.total.toFixed(2)}</span></div>
        <div class="line"></div>
        <div style="text-align:center;margin-top:8px">Teşekkür ederiz!</div>
        </body></html>`
      const w = window.open('', '_blank', 'width=400,height=600')
      w.document.write(html)
      w.document.close()
      w.onload = () => { w.focus(); w.print(); w.onafterprint = () => w.close() }
    },

    openCheckout(table) {
      this.checkoutTable = table
      this.checkoutDiscount = 0
      this.checkoutMethod = 'cash'
      this.checkoutNote = ''
      this.checkoutMode = 'full'
      this.splitCount = 2
      this.splitPaying = 1
    },

    async confirmSplitCheckout() {
      if (!this.checkoutMethod || !this.checkoutTable) return
      this.checkingOut = true
      try {
        const res = await axios.post(
          `http://localhost:3000/api/tables/${this.checkoutTable.tableNum}/split-payment`,
          {
            splitCount: this.splitCount,
            paidCount: this.splitPaying,
            paymentMethod: this.checkoutMethod,
            notes: this.checkoutNote
          }
        )
        if (res.data.success) {
          await this.loadActiveTables()
          await this.loadTodayStats()
          if (res.data.data.isFullyPaid) {
            this.checkoutTable = null
          }
          alert(`✅ ${res.data.message}`)
        }
      } catch (e) {
        alert('❌ ' + (e.response?.data?.message || e.message))
      } finally {
        this.checkingOut = false
      }
    },

    async confirmCheckout() {
      if (!this.checkoutMethod || !this.checkoutTable) return
      this.checkingOut = true
      try {
        const res = await axios.post(
          `http://localhost:3000/api/tables/${this.checkoutTable.tableNum}/checkout`,
          { paymentMethod: this.checkoutMethod, discount: this.checkoutDiscount, notes: this.checkoutNote }
        )
        if (res.data.success) {
          await this.loadActiveTables()
          await this.loadTodayStats()
          this.checkoutTable = null
          alert(`✅ ${res.data.message}`)
        }
      } catch (e) {
        alert('❌ ' + (e.response?.data?.message || e.message))
      } finally {
        this.checkingOut = false
      }
    }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.main-content { margin-left: 280px; flex: 1; padding: 2rem; background: var(--gray-50); }
.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.pos-link-btn {
  padding: 8px 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
}
.content-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--gray-800); }
.kasa-status-badge { padding: 8px 18px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; }
.kasa-status-badge.open { background: var(--success-light); color: var(--success); }
.kasa-status-badge.closed { background: var(--danger-light); color: var(--danger); }

/* Kasa Kapalı */
.kasa-card { background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); max-width: 480px; margin: 0 auto; }
.kasa-icon { font-size: 4rem; margin-bottom: 16px; }
.kasa-card h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
.kasa-card p { color: #888; margin-bottom: 24px; }
.open-form { text-align: left; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 6px; }
.cash-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: 10px; font-size: 1rem; outline: none; }
.cash-input:focus { border-color: var(--primary); }
.open-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--success), var(--success)); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 8px; }
.open-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Özet */
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.summary-card { background: white; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid; }
.summary-card.green { border-left-color: #22c55e; }
.summary-card.blue { border-left-color: var(--primary-light); }
.summary-card.purple { border-left-color: #8b5cf6; }
.summary-card.orange { border-left-color: var(--warning); }
.summary-icon { font-size: 1.8rem; }
.summary-num { font-size: 1.4rem; font-weight: 700; color: var(--gray-800); }
.summary-label { font-size: 0.78rem; color: #888; }

/* Ödeme Dağılımı */
.payment-breakdown-card { background: white; border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.payment-breakdown-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 16px; }
.breakdown-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.breakdown-item { background: var(--gray-50); border-radius: 10px; padding: 12px; text-align: center; }
.breakdown-icon { font-size: 1.4rem; display: block; margin-bottom: 4px; }
.breakdown-label { font-size: 0.78rem; color: #888; display: block; }
.breakdown-amount { font-size: 1rem; font-weight: 700; color: var(--primary); display: block; margin-top: 4px; }
.expected-cash { display: flex; justify-content: space-between; align-items: center; background: var(--primary-xlight); border-radius: 10px; padding: 12px 16px; font-size: 0.9rem; }
.expected-cash strong { font-size: 1.1rem; color: var(--primary); }

/* Kapanış */
.close-card { background: white; border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.close-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
.close-card p { color: #888; font-size: 0.88rem; margin-bottom: 16px; }
.close-form { max-width: 400px; }
.diff-badge { display: inline-block; margin-top: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; }
.diff-badge.positive { background: var(--success-light); color: var(--success); }
.diff-badge.negative { background: var(--danger-light); color: var(--danger); }
.close-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, var(--danger), var(--danger)); color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 8px; }
.close-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Aktif Masalar */
.active-tables-card { background: white; border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.active-tables-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.active-tables-header h3 { font-size: 1rem; font-weight: 700; }
.refresh-small-btn { background: var(--gray-100); border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.empty-tables { text-align: center; color: #aaa; padding: 20px; }
.active-tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.active-table-card { background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 12px; padding: 14px; }
.active-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.table-num-badge { font-weight: 700; font-size: 0.95rem; color: var(--primary); }
.table-duration { font-size: 0.78rem; color: #888; background: var(--primary-xlight); padding: 2px 8px; border-radius: 10px; }
.active-table-items { margin-bottom: 8px; }
.table-item-row { font-size: 0.82rem; color: #555; padding: 2px 0; display: flex; flex-direction: column; }
.item-note-small { font-size: 0.75rem; color: var(--warning); padding-left: 8px; }
.more-items-small { font-size: 0.78rem; color: #aaa; font-style: italic; }
.table-notes-small { font-size: 0.78rem; color: #888; background: var(--warning-light); border-radius: 6px; padding: 4px 8px; margin-bottom: 8px; }
.active-table-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gray-200); padding-top: 10px; }
.table-total { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
.table-actions { display: flex; gap: 6px; }
.bill-btn { padding: 5px 10px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600; }
.checkout-btn { padding: 5px 10px; background: var(--success); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600; }

/* Hesap Alma Modalı */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.checkout-modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.checkout-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px 14px; border-bottom: 1px solid #f0f0f0; }
.checkout-header h2 { font-size: 1.05rem; font-weight: 700; }
.close-x { background: var(--gray-100); border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; }
.checkout-body { padding: 16px 20px; }
.checkout-items { background: var(--gray-50); border-radius: 10px; padding: 12px; margin-bottom: 14px; max-height: 200px; overflow-y: auto; }
.checkout-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 4px 0; font-size: 0.88rem; flex-wrap: wrap; }
.checkout-item-price { font-weight: 600; color: var(--primary); }
.checkout-summary { margin-bottom: 14px; }
.checkout-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.9rem; border-bottom: 1px solid var(--gray-100); }
.checkout-row.total-row { font-size: 1rem; border-bottom: none; }
.checkout-final { font-size: 1.3rem; color: var(--success); }
.discount-small-input { width: 80px; padding: 4px 8px; border: 1.5px solid var(--gray-200); border-radius: 6px; text-align: right; }
.checkout-methods { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
.method-btn-small { padding: 8px 4px; border: 1.5px solid var(--gray-200); border-radius: 8px; background: white; cursor: pointer; font-size: 0.78rem; font-weight: 500; text-align: center; }
.method-btn-small.active { border-color: var(--success); background: var(--success-light); color: var(--success); font-weight: 700; }
.checkout-footer { padding: 14px 20px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; }
.confirm-checkout-btn { flex: 1; padding: 12px; background: linear-gradient(135deg, var(--success), var(--success)); color: white; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
.confirm-checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cancel-checkout-btn { padding: 12px 18px; background: var(--gray-100); border: none; border-radius: 10px; cursor: pointer; font-weight: 600; }
.checkout-mode-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.mode-tab { padding: 8px; border: 1.5px solid var(--gray-200); background: white; border-radius: 8px; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
.mode-tab.active { border-color: var(--primary); background: var(--primary-xlight); color: var(--primary); }
.split-checkout-section { margin: 8px 0; }
.split-qty-inline { display: flex; align-items: center; gap: 8px; }
.qty-btn-sm { width: 28px; height: 28px; border: 1px solid var(--gray-200); background: white; border-radius: 6px; cursor: pointer; }

/* Geçmiş */
.history-card { background: white; border-radius: 14px; padding: 20px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.history-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 16px; }
.empty-history { text-align: center; color: #aaa; padding: 24px; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.history-item:last-child { border-bottom: none; }
.history-left { display: flex; align-items: center; gap: 12px; }
.history-status { font-size: 0.82rem; font-weight: 600; }
.history-info strong { display: block; font-size: 0.9rem; }
.history-info span { font-size: 0.78rem; color: #888; }
.history-right { display: flex; gap: 20px; }
.history-stat { text-align: right; }
.history-stat span { display: block; font-size: 0.75rem; color: #888; }
.history-stat strong { font-size: 0.9rem; font-weight: 700; }
.history-stat.pos strong { color: var(--success); }
.history-stat.neg strong { color: var(--danger); }
</style>
