<template>
  <div class="pos-app">
    <header class="pos-header">
      <router-link to="/cash-register" class="back-btn">← Kasa</router-link>
      <span class="pos-brand">🧾 Kasa POS</span>
      <div class="header-right">
        <button class="btn-select-table" @click="showTablePicker = true">
          🪑 {{ selectedTable ? `Masa ${selectedTable}` : 'Masa Seç' }}
        </button>
        <input v-model="searchQuery" type="text" placeholder="🔍 Ürün ara..." class="search-box" />
      </div>
    </header>

    <div class="pos-body">
      <aside class="cat-sidebar">
        <button
          v-for="cat in ['Tümü', ...menuCategories]"
          :key="cat"
          :class="['cat-btn', { active: activeCategory === cat }]"
          @click="activeCategory = cat"
        >
          {{ getCatIcon(cat) }}<br /><span>{{ cat }}</span>
        </button>
      </aside>

      <section class="product-area">
        <div v-if="loadingMenu" class="loading-msg">
          <div class="spinner"></div><span>Menü yükleniyor...</span>
        </div>
        <div v-else-if="filteredProducts.length === 0" class="empty-msg">Ürün bulunamadı</div>
        <div v-else class="product-grid">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            class="product-card"
            @click="addProduct(p)"
          >
            <div class="product-img">
              <img v-if="p.image" :src="p.image" :alt="p.name"
                @error="e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }" />
              <span class="product-emoji-fb" style="display:none">{{ getCatIcon(p.category) }}</span>
            </div>
            <div class="product-info">
              <div class="product-name">{{ p.name }}</div>
              <div class="product-price">{{ formatMoney(p.price) }}</div>
            </div>
          </button>
        </div>
      </section>
    </div>

    <footer class="pos-footer">
      <div class="footer-top">
        <div class="bill-title">
          <span v-if="selectedTable">🪑 Masa {{ selectedTable }} — Hesap</span>
          <span v-else>Masa seçin veya ürün ekleyin</span>
        </div>
        <button v-if="selectedTable" class="reload-btn" @click="loadTableBill">🔄</button>
      </div>

      <div class="bill-lines-wrap">
        <div v-if="billLines.length === 0" class="bill-empty">Hesap boş</div>
        <label v-for="line in billLines" :key="line.key" class="bill-line">
          <input v-model="line.selected" type="checkbox" />
          <span class="line-qty">{{ line.quantity }}x</span>
          <span class="line-name">{{ line.name }}</span>
          <span v-if="line.notes" class="line-note">📝 {{ line.notes }}</span>
          <span class="line-price">{{ formatMoney(line.price * line.quantity) }}</span>
        </label>
      </div>

      <div class="footer-actions">
        <button class="pay-btn" :disabled="!selectedTable || payableAmount <= 0" @click="openPayment">
          💳 Ödeme Al — {{ formatMoney(payableAmount) }}
        </button>
        <button class="clear-btn" @click="clearSelection">✕ Temizle</button>
        <button class="print-btn" :disabled="!billLines.length" @click="printBillOnly">🖨️</button>
      </div>
    </footer>

    <!-- MASA SEÇİCİ -->
    <div v-if="showTablePicker" class="modal-overlay" @click.self="showTablePicker = false">
      <div class="table-picker-modal">
        <div class="modal-head">
          <h3>🪑 Masa Seç</h3>
          <button class="close-x" @click="showTablePicker = false">✕</button>
        </div>
        <div class="table-picker-grid">
          <button
            v-for="n in 24" :key="n"
            :class="['table-cell', { occupied: activeTables.includes(n), selected: selectedTable === n }]"
            @click="selectTable(n)"
          >
            <span class="table-num">{{ n }}</span>
            <span v-if="activeTables.includes(n)" class="table-dot">●</span>
          </button>
        </div>
        <div class="table-legend">
          <span><span class="dot-active">●</span> Dolu masa</span>
          <span><span class="dot-empty">○</span> Boş masa</span>
        </div>
        <button class="modal-close-btn" @click="showTablePicker = false">Kapat</button>
      </div>
    </div>

    <!-- ÖDEME MODALİ -->
    <div v-if="showPayment" class="modal-overlay payment-overlay" @click.self="closePayment">
      <div class="payment-modal">
        <button class="pay-close-btn" @click="closePayment">✕</button>
        <div class="pay-header">
          <div class="pay-icon">💰</div>
          <h2>Masa {{ selectedTable }}</h2>
          <p class="pay-sub">Toplam: <strong>{{ formatMoney(selectedSubtotal) }}</strong></p>
        </div>

        <div class="pay-amount-display">{{ formatMoney(payableAmount) }}</div>

        <!-- KDV gösterimi -->
        <div v-if="taxConfig.enabled && taxConfig.rate > 0" class="kdv-info-box">
          <div class="kdv-row">
            <span>Ara Toplam</span>
            <span>{{ formatMoney(payableAmount) }}</span>
          </div>
          <div class="kdv-row">
            <span>{{ taxConfig.label || 'KDV' }} (%{{ taxConfig.rate }})</span>
            <span>{{ formatMoney(kdvAmount) }}</span>
          </div>
          <div class="kdv-row kdv-total">
            <span>Genel Toplam</span>
            <strong>{{ formatMoney(totalWithKdv) }}</strong>
          </div>
        </div>

        <input v-model.number="cashReceived" type="number" min="0" step="1"
          class="pay-input" placeholder="Müşteri verdi (para üstü için)" />
        <div v-if="cashReceived > payableAmount" class="change-display">
          Para üstü: <strong>{{ formatMoney(cashReceived - payableAmount) }}</strong>
        </div>

        <input v-model="paymentNote" type="text" class="pay-input" placeholder="Ödeme notu (opsiyonel)" />

        <div class="discount-row">
          <span class="discount-label">İndirim:</span>
          <button v-for="p in [5,10,15,20]" :key="p"
            :class="['disc-btn', { active: discountPercent === p }]"
            @click="discountPercent = discountPercent === p ? 0 : p">%{{ p }}</button>
          <button class="disc-btn custom-disc" @click="askCustomDiscount">x%</button>
          <button v-if="discountPercent > 0" class="disc-clear" @click="discountPercent = 0">✕</button>
        </div>
        <div v-if="discountPercent > 0" class="disc-applied">
          %{{ discountPercent }} indirim — −{{ formatMoney(discountValue) }}
        </div>

        <div class="split-row">
          <button :class="['split-toggle', { active: splitMode }]" @click="splitMode = !splitMode">✂️ Böl</button>
          <template v-if="splitMode">
            <button @click="splitParts = Math.max(2, splitParts - 1)" class="split-qty-btn">−</button>
            <span class="split-num">{{ splitParts }} kişi</span>
            <button @click="splitParts++" class="split-qty-btn">+</button>
            <span class="split-hint">Kişi başı: {{ formatMoney(payableAmount) }}</span>
          </template>
        </div>

        <div class="pay-methods">
          <button class="btn-cash" :disabled="processing" @click="startCashPayment">💵 Nakit</button>
          <button class="btn-card" :disabled="processing" @click="startCardPayment">💳 Kart</button>
        </div>

        <div v-if="cashConfirmStep" class="confirm-box">
          <p>💵 Nakit: <strong>{{ formatMoney(payableAmount) }}</strong></p>
          <button class="btn-confirm" :disabled="processing" @click="confirmCashPaid">✅ Ödendi — Kapat</button>
        </div>

        <div v-if="cardSentToPos" class="confirm-box">
          <p>💳 POS'a gönderildi: <strong>{{ formatMoney(payableAmount) }}</strong></p>
          <p class="confirm-hint">POS cihazından ödemeyi onaylayın, ardından aşağıya basın:</p>
          <button class="btn-confirm" :disabled="processing" @click="confirmCardPaid">✅ POS Onaylandı — Kapat</button>
        </div>
      </div>
    </div>

    <!-- ÖDEME BAŞARILI -->
    <div v-if="paymentSuccess" class="modal-overlay" @click.self="paymentSuccess = false">
      <div class="payment-success-modal">
        <div class="ps-icon">✅</div>
        <h3>Ödeme Alındı!</h3>
        <p>{{ paymentSuccessMsg }}</p>
        <button @click="paymentSuccess = false" class="ps-close-btn">Tamam</button>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import socketService from '@/services/socket.js'

const API = 'http://localhost:3000/api'

export default {
  name: 'CashierPOS',
  data() {
    return {
      menuItems: [],
      loadingMenu: true,
      activeCategory: 'Tümü',
      searchQuery: '',
      selectedTable: null,
      activeTables: [],
      showTablePicker: false,
      pendingProduct: null,
      billLines: [],
      showPayment: false,
      paymentNote: '',
      cashReceived: null,
      discountPercent: 0,
      splitMode: false,
      splitParts: 2,
      processing: false,
      cashConfirmStep: false,
      cardSentToPos: false,
      checkoutMethod: 'cash',
      posTransactionRef: null,
      paymentSuccess: false,
      paymentSuccessMsg: '',
      // KDV
      taxConfig: { enabled: false, rate: 10, label: 'KDV', inclusive: false }
    }
  },

  computed: {
    menuCategories() {
      return [...new Set(this.menuItems.map(p => p.category).filter(Boolean))]
    },
    filteredProducts() {
      let list = this.menuItems.filter(p => p.available !== false)
      if (this.activeCategory && this.activeCategory !== 'Tümü') {
        list = list.filter(p => p.category === this.activeCategory)
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase()
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        )
      }
      return list
    },
    selectedLines()    { return this.billLines.filter(l => l.selected) },
    selectedSubtotal() { return this.selectedLines.reduce((s, l) => s + l.price * l.quantity, 0) },
    discountValue()    { return this.selectedSubtotal * (this.discountPercent / 100) },
    payableAmount() {
      let amt = this.selectedSubtotal - this.discountValue
      if (this.splitMode && this.splitParts > 1) amt = amt / this.splitParts
      return Math.max(0, parseFloat(amt.toFixed(2)))
    },
    allLinesSelected() { return this.billLines.length > 0 && this.billLines.every(l => l.selected) },
    isFullPayment()    { return this.allLinesSelected && !this.splitMode },
    // KDV hesabı
    kdvAmount() {
      if (!this.taxConfig.enabled || this.taxConfig.rate <= 0) return 0
      return this.taxConfig.inclusive
        ? this.payableAmount - this.payableAmount / (1 + this.taxConfig.rate / 100)
        : this.payableAmount * this.taxConfig.rate / 100
    },
    totalWithKdv() {
      if (!this.taxConfig.enabled || this.taxConfig.rate <= 0) return this.payableAmount
      return this.taxConfig.inclusive
        ? this.payableAmount
        : this.payableAmount + this.kdvAmount
    }
  },

  async mounted() {
    await Promise.all([this.loadMenu(), this.loadActiveTables(), this.loadTaxConfig()])
    const q = this.$route.query.table
    if (q) { this.selectedTable = parseInt(q); await this.loadTableBill() }
    this.connectSocket()
  },

  beforeUnmount() {
    if (this._socketUnsubs) this._socketUnsubs.forEach(fn => fn())
  },

  methods: {
    getToken()   { return localStorage.getItem('token') || '' },
    authHeader() { return { Authorization: `Bearer ${this.getToken()}` } },
    formatMoney(n) {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0)
    },
    getCatIcon(cat) {
      const m = { 'Tümü':'🍽️','İçecekler':'☕','Yemekler':'🍔','Tatlılar':'🍰',
        'Atıştırmalıklar':'🍟','Salatalar':'🥗','Çorbalar':'🍲','Kahvaltı':'🥐',
        'Pizzalar':'🍕','Burgerler':'🍔','Makarnalar':'🍝' }
      return m[cat] || '🍴'
    },
    lineKey(item) { return `${item.name}|${item.notes||''}|${item.price}` },

    async loadMenu() {
      this.loadingMenu = true
      try {
        const res = await axios.get(`${API}/menu`)
        if (res.data.success) this.menuItems = res.data.data || []
      } catch (e) { /* sessiz */ }
      finally { this.loadingMenu = false }
    },

    async loadTaxConfig() {
      try {
        const res = await axios.get(`${API}/tax/config`)
        if (res.data.success) this.taxConfig = res.data.data
      } catch { /* sessiz */ }
    },

    connectSocket() {
      socketService.connect()

      // Yeni sipariş POS üzerinden eklendi → aktif masaları güncelle
      const u1 = socketService.onNewOrder((order) => {
        const tNum = parseInt(order.tableNumber)
        if (!isNaN(tNum) && !this.activeTables.includes(tNum)) {
          this.activeTables.push(tNum)
        }
        // Seçili masa ise hesabı yenile
        if (this.selectedTable === tNum) this.loadTableBill()
      })

      // Masa ödendi → aktif listeden kaldır
      const u2 = socketService.onTableUpdate(({ tableNum, action }) => {
        if (action === 'checkout') {
          this.activeTables = this.activeTables.filter(n => n !== tableNum)
          if (this.selectedTable === tableNum) {
            this.selectedTable = null
            this.billLines = []
          }
        }
      })

      this._socketUnsubs = [u1, u2]
    },

    async loadActiveTables() {
      try {
        const res = await axios.get(`${API}/tables/active-status`)
        if (res.data.success) this.activeTables = res.data.data.map(t => t.tableNum)
      } catch { this.activeTables = [] }
    },

    async selectTable(n) {
      this.selectedTable = n
      this.showTablePicker = false
      this.billLines = []
      await this.loadTableBill()
    },

    async loadTableBill() {
      if (!this.selectedTable) return
      try {
        const res = await axios.get(`${API}/tables/${this.selectedTable}/bill`)
        if (res.data.success && res.data.data?.items?.length) {
          this.billLines = res.data.data.items.map(item => ({
            key: this.lineKey(item),
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || '',
            selected: true
          }))
        } else {
          this.billLines = []
        }
      } catch { this.billLines = [] }
    },

    async addProduct(product) {
      if (!this.selectedTable) { this.pendingProduct = product; this.showTablePicker = true; return }
      await this.addProductToTable(product)
    },

    async addProductToTable(product) {
      try {
        await axios.post(`${API}/pos/orders`,
          { tableNumber: this.selectedTable, items: [{ name: product.name, quantity: 1, price: parseFloat(product.price), notes: '', category: product.category }], total: parseFloat(product.price), notes: 'Kasa POS' },
          { headers: this.authHeader() }
        )
        await this.loadTableBill()
        await this.loadActiveTables()
      } catch (e) { alert('Ürün eklenemedi: ' + (e.response?.data?.message || e.message)) }
    },

    clearSelection() {
      if (confirm('Hesap listesini temizlemek istiyor musunuz?')) {
        this.billLines = []; this.discountPercent = 0; this.splitMode = false
      }
    },

    openPayment() {
      if (!this.selectedTable || this.payableAmount <= 0) return
      this.showPayment = true; this.cashConfirmStep = false; this.cardSentToPos = false; this.cashReceived = null
    },

    closePayment() {
      this.showPayment = false; this.cashConfirmStep = false; this.cardSentToPos = false
    },

    askCustomDiscount() {
      const v = prompt('İndirim yüzdesi (0-100):', String(this.discountPercent))
      if (v === null) return
      this.discountPercent = Math.min(100, Math.max(0, parseFloat(v) || 0))
    },

    async startCashPayment() { this.checkoutMethod = 'cash'; this.cashConfirmStep = true; this.cardSentToPos = false },

    async startCardPayment() {
      this.checkoutMethod = 'card'; this.cardSentToPos = false; this.cashConfirmStep = false
      this.processing = true
      try {
        const res = await axios.post(`${API}/pos/send-to-terminal`,
          { amount: this.payableAmount, tableNum: this.selectedTable },
          { headers: this.authHeader() }
        )
        if (res.data.success) { this.cardSentToPos = true; this.posTransactionRef = res.data.data?.transactionRef }
      } catch (e) { alert('POS: ' + (e.response?.data?.message || e.message)) }
      finally { this.processing = false }
    },

    async confirmCashPaid() { await this.completePayment('cash') },
    async confirmCardPaid() { await this.completePayment('card') },

    async completePayment(paymentMethod) {
      if (!this.selectedTable || this.processing) return
      this.processing = true
      try {
        let res
        if (this.isFullPayment) {
          res = await axios.post(`${API}/tables/${this.selectedTable}/checkout`,
            { paymentMethod, discountPercent: this.discountPercent, discount: 0, notes: this.paymentNote, shouldPrint: true },
            { headers: this.authHeader() }
          )
        } else {
          res = await axios.post(`${API}/tables/${this.selectedTable}/split-payment`,
            { customAmount: this.payableAmount, paymentMethod, notes: this.paymentNote || `Kasa POS — ${paymentMethod}`, splitCount: this.splitMode ? this.splitParts : 1, paidCount: 1 },
            { headers: this.authHeader() }
          )
        }

        if (res.data.success) {
          this.paymentSuccessMsg = res.data.message || '✅ Ödeme alındı'
          this.paymentSuccess = true
          this.closePayment()
          this.discountPercent = 0; this.splitMode = false; this.cashReceived = null
          await this.loadActiveTables()
          if (res.data.data?.isFullyPaid !== false) {
            this.selectedTable = null; this.billLines = []
          } else {
            await this.loadTableBill()
          }
        }
      } catch (e) {
        alert('❌ ' + (e.response?.data?.message || e.message))
      } finally {
        this.processing = false
      }
    },

    async printBillOnly() {
      if (!this.selectedTable || !this.billLines.length) return
      try {
        await axios.post(`${API}/printer/print-data`,
          { order: { tableNumber: this.selectedTable, items: this.billLines.map(l => ({ name: l.name, quantity: l.quantity, price: l.price, notes: l.notes })), total: this.selectedSubtotal, notes: 'Adisyon', paidAt: new Date().toISOString() } },
          { headers: this.authHeader() }
        )
        alert('🖨️ Adisyon gönderildi')
      } catch (e) { alert('Yazdırma hatası: ' + (e.response?.data?.message || e.message)) }
    }
  },

  watch: {
    async selectedTable(val) {
      if (val && this.pendingProduct) {
        const p = this.pendingProduct; this.pendingProduct = null
        await this.addProductToTable(p)
      }
    }
  }
}
</script>

<style scoped>
.pos-app { display:flex; flex-direction:column; height:100vh; background:var(--bg-app); overflow:hidden; font-family:'Inter',sans-serif; }

/* HEADER */
.pos-header { display:flex; align-items:center; gap:12px; padding:10px 16px; background:white; border-bottom:2px solid var(--primary-border); flex-shrink:0; box-shadow:var(--shadow-sm); }
.back-btn { color:var(--primary); text-decoration:none; font-weight:700; font-size:0.85rem; white-space:nowrap; }
.pos-brand { font-weight:800; font-size:1rem; color:var(--primary-dark); flex:1; }
.header-right { display:flex; align-items:center; gap:8px; }
.btn-select-table { padding:8px 16px; background:var(--gradient-primary); color:white; border:none; border-radius:var(--radius-md); font-weight:700; font-size:0.88rem; cursor:pointer; white-space:nowrap; }
.search-box { padding:8px 12px; border:1.5px solid var(--gray-300); border-radius:var(--radius-md); font-size:0.88rem; min-width:160px; outline:none; }
.search-box:focus { border-color:var(--primary-light); }

/* BODY */
.pos-body { display:flex; flex:1; min-height:0; overflow:hidden; }

/* KATEGORİ SIDEBAR */
.cat-sidebar { width:90px; flex-shrink:0; overflow-y:auto; background:white; border-right:1px solid var(--gray-200); padding:8px 4px; display:flex; flex-direction:column; gap:4px; }
.cat-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px 4px; border:1.5px solid transparent; border-radius:var(--radius-md); background:transparent; font-size:0.7rem; font-weight:600; color:var(--gray-600); cursor:pointer; text-align:center; line-height:1.4; transition:all 0.15s; gap:2px; }
.cat-btn:hover { background:var(--primary-xlight); color:var(--primary); }
.cat-btn.active { background:var(--primary); color:white; border-color:var(--primary-dark); }

/* ÜRÜN ALANI */
.product-area { flex:1; overflow-y:auto; padding:12px; background:var(--gray-50); }
.loading-msg { display:flex; align-items:center; justify-content:center; gap:12px; padding:60px 20px; color:var(--gray-500); }
.spinner { width:28px; height:28px; border:3px solid var(--gray-200); border-top-color:var(--primary); border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-msg { text-align:center; padding:60px 20px; color:var(--gray-400); font-size:0.95rem; }
.product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; }
.product-card { background:white; border:1.5px solid var(--gray-200); border-radius:var(--radius-md); padding:0; cursor:pointer; text-align:center; transition:all 0.15s; overflow:hidden; display:flex; flex-direction:column; }
.product-card:hover { border-color:var(--primary); box-shadow:0 4px 12px rgba(15,45,92,0.12); transform:translateY(-1px); }
.product-card:active { transform:scale(0.97); }
.product-img { height:80px; background:var(--gray-100); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.product-img img { width:100%; height:100%; object-fit:cover; }
.product-emoji-fb { font-size:2.2rem; }
.product-info { padding:8px 6px; }
.product-name { font-size:0.75rem; font-weight:600; color:var(--gray-800); line-height:1.3; margin-bottom:4px; }
.product-price { font-size:0.82rem; font-weight:700; color:var(--primary); }

/* FOOTER */
.pos-footer { background:white; border-top:2px solid var(--primary-border); flex-shrink:0; max-height:40vh; display:flex; flex-direction:column; padding:10px 16px 12px; }
.footer-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.bill-title { font-size:0.9rem; font-weight:700; color:var(--primary-dark); }
.reload-btn { background:var(--gray-100); border:1px solid var(--gray-200); border-radius:var(--radius-sm); padding:4px 8px; cursor:pointer; font-size:0.9rem; }
.bill-lines-wrap { flex:1; overflow-y:auto; max-height:120px; margin-bottom:8px; border:1px solid var(--gray-200); border-radius:var(--radius-md); background:var(--gray-50); }
.bill-empty { text-align:center; padding:16px; color:var(--gray-400); font-size:0.85rem; }
.bill-line { display:flex; align-items:center; gap:8px; padding:7px 12px; border-bottom:1px solid var(--gray-200); font-size:0.84rem; cursor:pointer; }
.bill-line:last-child { border-bottom:none; }
.bill-line:hover { background:var(--primary-xlight); }
.line-qty { font-weight:700; color:var(--primary); min-width:28px; flex-shrink:0; }
.line-name { flex:1; color:var(--gray-800); }
.line-note { font-size:0.75rem; color:var(--gray-500); }
.line-price { font-weight:600; color:var(--gray-700); min-width:64px; text-align:right; }
.footer-actions { display:flex; gap:8px; }
.pay-btn { flex:1; padding:14px; background:linear-gradient(135deg,#22c55e,#15803d); color:white; border:none; border-radius:var(--radius-md); font-weight:800; font-size:1rem; cursor:pointer; }
.pay-btn:disabled { opacity:0.4; cursor:not-allowed; }
.clear-btn { padding:14px 20px; background:var(--danger-light); color:var(--danger); border:none; border-radius:var(--radius-md); font-weight:700; cursor:pointer; }
.print-btn { width:48px; height:48px; border:1.5px solid var(--gray-200); border-radius:var(--radius-md); background:white; font-size:1.2rem; cursor:pointer; }
.print-btn:disabled { opacity:0.4; }

/* MODAL OVERLAY */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:500; display:flex; align-items:center; justify-content:center; padding:16px; }

/* MASA SEÇİCİ */
.table-picker-modal { background:white; border-radius:var(--radius-xl); padding:20px; max-width:420px; width:100%; box-shadow:var(--shadow-lg); }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.modal-head h3 { font-size:1rem; font-weight:700; color:var(--primary-dark); margin:0; }
.close-x { background:var(--gray-100); border:none; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:0.9rem; }
.table-picker-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin-bottom:12px; }
.table-cell { position:relative; padding:14px 0; border:2px solid var(--gray-200); border-radius:var(--radius-md); background:white; font-weight:700; font-size:0.9rem; cursor:pointer; text-align:center; transition:all 0.15s; color:var(--gray-700); }
.table-cell:hover { border-color:var(--primary); background:var(--primary-xlight); }
.table-cell.occupied { border-color:#f59e0b; background:#fef3c7; color:#92400e; }
.table-cell.selected { border-color:var(--primary); background:var(--primary); color:white; }
.table-dot { position:absolute; top:2px; right:4px; font-size:0.55rem; color:#f59e0b; }
.table-cell.selected .table-dot { color:#fbbf24; }
.table-legend { display:flex; gap:16px; font-size:0.78rem; color:var(--gray-500); margin-bottom:12px; }
.dot-active { color:#f59e0b; }
.dot-empty { color:var(--gray-300); }
.modal-close-btn { width:100%; padding:11px; background:var(--gray-100); border:none; border-radius:var(--radius-md); font-weight:600; cursor:pointer; color:var(--gray-700); }

/* ÖDEME MODALİ */
.payment-overlay { align-items:flex-end; }
.payment-modal { background:white; border-radius:20px 20px 0 0; width:100%; max-width:480px; padding:24px 20px 32px; text-align:center; position:relative; max-height:92vh; overflow-y:auto; box-shadow:var(--shadow-lg); }
.pay-close-btn { position:absolute; top:12px; right:12px; background:var(--gray-100); border:none; width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:0.85rem; }
.pay-header { margin-bottom:16px; }
.pay-icon { font-size:2.5rem; margin-bottom:6px; }
.pay-header h2 { font-size:1.3rem; font-weight:700; margin:0 0 4px; color:var(--primary-dark); }
.pay-sub { color:var(--gray-500); font-size:0.9rem; margin:0; }
.pay-amount-display { background:var(--primary-xlight); border:2px solid var(--primary-border); border-radius:var(--radius-lg); padding:20px; font-size:2rem; font-weight:800; color:var(--primary-dark); margin-bottom:14px; }
.kdv-info-box { background:var(--gray-50); border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:10px 14px; margin-bottom:12px; font-size:0.85rem; }
.kdv-row { display:flex; justify-content:space-between; padding:3px 0; color:var(--gray-600); }
.kdv-row.kdv-total { border-top:1px solid var(--gray-200); margin-top:6px; padding-top:6px; color:var(--primary-dark); font-size:0.95rem; }
.pay-input { width:100%; padding:11px 14px; border:1.5px solid var(--gray-300); border-radius:var(--radius-md); font-size:0.9rem; outline:none; margin-bottom:8px; text-align:center; }
.pay-input:focus { border-color:var(--primary-light); }
.change-display { background:var(--success-light); color:var(--success); border-radius:var(--radius-md); padding:8px 14px; font-size:0.9rem; margin-bottom:8px; }
.discount-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:center; margin:12px 0 6px; }
.discount-label { font-size:0.82rem; font-weight:600; color:var(--gray-600); }
.disc-btn { padding:7px 12px; background:var(--success-light); decolor:var(--success); border:1.5px solid #a7f3d0; border-radius:var(--radius-md); font-size:0.82rem; font-weight:700; cursor:pointer; transition:all 0.15s; }
.disc-btn.active { background:var(--success); color:white; border-color:var(--success); }
.custom-disc { background:var(--info-light); color:var(--info); border-color:#bae6fd; }
.disc-clear { background:var(--danger-light); color:var(--danger); border:1.5px solid #fca5a5; border-radius:var(--radius-md); padding:7px 10px; cursor:pointer; font-weight:700; }
.disc-applied { font-size:0.82rem; color:var(--success); font-weight:600; margin-bottom:8px; }
.split-row { display:flex; align-items:center; gap:8px; justify-content:center; margin:10px 0; flex-wrap:wrap; }
.split-toggle { padding:8px 14px; background:var(--warning-light); color:var(--warning); border:1.5px solid #fde68a; border-radius:var(--radius-md); font-weight:700; font-size:0.85rem; cursor:pointer; }
.split-toggle.active { background:var(--warning); color:white; }
.split-qty-btn { width:30px; height:30px; border-radius:50%; border:1.5px solid var(--gray-300); background:white; font-size:1.1rem; cursor:pointer; font-weight:700; }
.split-num { font-weight:700; font-size:0.9rem; min-width:50px; text-align:center; }
.split-hint { font-size:0.8rem; color:var(--gray-500); }
.pay-methods { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:16px 0 0; }
.btn-cash { padding:18px; background:linear-gradient(135deg,#22c55e,#15803d); color:white; border:none; border-radius:var(--radius-md); font-size:1.05rem; font-weight:800; cursor:pointer; }
.btn-card { padding:18px; background:var(--gradient-primary); color:white; border:none; border-radius:var(--radius-md); font-size:1.05rem; font-weight:800; cursor:pointer; }
.btn-cash:disabled, .btn-card:disabled { opacity:0.5; cursor:not-allowed; }
.confirm-box { background:var(--primary-xlight); border:1.5px solid var(--primary-border); border-radius:var(--radius-md); padding:14px; margin-top:12px; font-size:0.88rem; }
.confirm-hint { color:var(--gray-500); font-size:0.8rem; margin:4px 0 8px; }
.btn-confirm { width:100%; padding:14px; background:linear-gradient(135deg,#22c55e,#15803d); color:white; border:none; border-radius:var(--radius-md); font-weight:800; font-size:0.95rem; cursor:pointer; margin-top:8px; }
.btn-confirm:disabled { opacity:0.5; }

/* ÖDEME BAŞARILI */
.payment-success-modal { background:white; border-radius:var(--radius-xl); padding:36px 28px; max-width:320px; width:100%; text-align:center; box-shadow:var(--shadow-lg); }
.ps-icon { font-size:3.5rem; margin-bottom:12px; }
.payment-success-modal h3 { font-size:1.3rem; font-weight:800; color:var(--primary-dark); margin-bottom:8px; }
.payment-success-modal p { color:var(--gray-500); font-size:0.9rem; margin-bottom:20px; }
.ps-close-btn { padding:12px 32px; background:var(--gradient-primary); color:white; border:none; border-radius:var(--radius-md); font-weight:700; cursor:pointer; }
</style>
