<template>
  <!-- TEMA YÜKLENİYOR -->
  <div v-if="themeLoading" class="theme-loading">
    <div class="loading-spinner"></div>
    <p>Tema yükleniyor...</p>
  </div>

  <!-- QR MENÜ -->
  <div v-else-if="themeConfig" class="qr-menu" :class="['theme-' + currentTheme, 'layout-' + themeConfig.layout, 'card-' + themeConfig.cardStyle, 'anim-' + themeConfig.animation]">

    <!-- Header -->
    <header class="qr-header">
      <div class="header-top">
        <div class="cafe-brand">
          <div v-if="cafeLogo" class="cafe-logo-img">
            <img :src="cafeLogo" :alt="cafeName" />
          </div>
          <div v-else class="cafe-logo">{{ themeConfig.icon }}</div>
          <div class="cafe-info">
            <h1>{{ cafeName }}</h1>
            <p>{{ cafeSlogan }}</p>
          </div>
        </div>
        <div class="header-right">
          <div class="table-badge">🪑 {{ t('table_label') }} {{ tableNumber || "?" }}</div>
          <!-- Dil seçici -->
          <div class="lang-picker">
            <button
              v-for="lang in LANGUAGES"
              :key="lang.code"
              :class="['lang-btn', { active: currentLang === lang.code }]"
              @click="setLang(lang.code)"
              :title="lang.label"
            >{{ lang.flag }}</button>
          </div>
          <button @click="loadBill(true)" class="bill-view-btn">{{ t('bill_btn') }}</button>
          <button @click="showWaiterModal = true" class="waiter-call-btn">{{ t('waiter_btn') }}</button>
        </div>
      </div>

      <!-- Arama -->
      <div class="search-bar">
        <span>🔍</span>
        <input v-model="searchQuery" type="text" :placeholder="t('search_placeholder')" class="search-input" />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
      </div>

      <!-- Kategori Sekmeleri -->
      <div class="category-scroll">
        <button
          v-for="cat in allCategories"
          :key="cat"
          @click="scrollToCategory(cat)"
          :class="['cat-tab', { active: activeCategory === cat }]"
        >
          {{ getCatEmoji(cat) }} {{ tCat(cat) }}
        </button>
      </div>
    </header>

    <!-- İçerik -->
    <main class="menu-main">

      <div v-if="loading" class="loading-screen">
        <div class="spinner"></div>
        <p>{{ t('loading') }}</p>
      </div>

      <!-- Arama Sonuçları -->
      <div v-else-if="searchQuery">
        <div class="section-header">
          <h2>🔍 "{{ searchQuery }}"</h2>
          <span class="count-badge">{{ searchResults.length }} ürün</span>
        </div>
        <div v-if="searchResults.length === 0" class="empty-msg">{{ t('no_results') }}</div>
        <div class="product-grid">
          <div v-for="p in searchResults" :key="p.id" class="product-card" @click="openProduct(p)">
            <div class="product-img-wrap">
              <img v-if="p.image" :src="getImgUrl(p.image)" :alt="p.name" @error="e => e.target.style.display='none'" />
              <div v-if="!p.image" class="product-emoji-fallback">{{ getCatEmoji(p.category) }}</div>
              <div v-if="getCartQty(p.id) > 0" class="qty-badge">{{ getCartQty(p.id) }}</div>
            </div>
            <div class="product-body">
              <h3>{{ p.name }}</h3>
              <p v-if="p.description" class="product-desc">{{ p.description }}</p>
              <div class="product-footer">
                <span class="price">{{ p.price }} ₺</span>
                <button @click.stop="quickAdd(p)" class="quick-add">{{ getCartQty(p.id) > 0 ? '✓ ' + getCartQty(p.id) : '+' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Kategoriler -->
      <div v-else>
        <div
          v-for="cat in allCategories"
          :key="cat"
          :id="'cat-' + cat"
          class="category-section"
          :class="['category-layout-' + selectedLayout]"
        >
          <div class="section-header">
            <h2>{{ getCatEmoji(cat) }} {{ tCat(cat) }}</h2>
            <span class="count-badge">{{ getByCategory(cat).length }}</span>
          </div>
          
          <!-- Grid Layout -->
          <div v-if="selectedLayout === 'grid'" class="product-grid layout-grid">
            <div v-for="p in getByCategory(cat)" :key="p.id" class="product-card card-grid" @click="openProduct(p)">
              <div class="product-img-wrap img-large">
                <img v-if="p.image" :src="getImgUrl(p.image)" :alt="p.name" @error="e => e.target.style.display='none'" />
                <div v-if="!p.image" class="product-emoji-fallback">{{ getCatEmoji(p.category) }}</div>
                <div v-if="getCartQty(p.id) > 0" class="qty-badge">{{ getCartQty(p.id) }}</div>
              </div>
              <div class="product-body">
                <h3>{{ p.name }}</h3>
                <p v-if="p.description" class="product-desc">{{ p.description }}</p>
                <div class="product-footer">
                  <span class="price price-badge">{{ p.price }} ₺</span>
                  <button @click.stop="quickAdd(p)" class="quick-add">{{ getCartQty(p.id) > 0 ? '✓ ' + getCartQty(p.id) : '+' }}</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- List Layout -->
          <div v-else-if="selectedLayout === 'list'" class="product-list layout-list">
            <div v-for="p in getByCategory(cat)" :key="p.id" class="product-card card-list" @click="openProduct(p)">
              <div class="product-img-wrap img-medium">
                <img v-if="p.image" :src="getImgUrl(p.image)" :alt="p.name" @error="e => e.target.style.display='none'" />
                <div v-if="!p.image" class="product-emoji-fallback">{{ getCatEmoji(p.category) }}</div>
              </div>
              <div class="product-body">
                <div class="product-title-row">
                  <h3>{{ p.name }}</h3>
                  <span class="price price-inline">{{ p.price }} ₺</span>
                </div>
                <p v-if="p.description" class="product-desc">{{ p.description }}</p>
              </div>
              <button @click.stop="quickAdd(p)" class="quick-add-list">
                {{ getCartQty(p.id) > 0 ? '✓ ' + getCartQty(p.id) : '+' }}
              </button>
            </div>
          </div>
          
          <!-- Masonry Layout -->
          <div v-else-if="selectedLayout === 'masonry'" class="product-masonry layout-masonry">
            <div v-for="p in getByCategory(cat)" :key="p.id" class="product-card card-masonry" @click="openProduct(p)">
              <div class="product-img-wrap img-auto">
                <img v-if="p.image" :src="getImgUrl(p.image)" :alt="p.name" @error="e => e.target.style.display='none'" />
                <div v-if="!p.image" class="product-emoji-fallback-masonry">{{ getCatEmoji(p.category) }}</div>
                <div v-if="getCartQty(p.id) > 0" class="qty-badge">{{ getCartQty(p.id) }}</div>
                <div class="product-overlay">
                  <h3>{{ p.name }}</h3>
                  <span class="price price-overlay">{{ p.price }} ₺</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Horizontal Layout -->
          <div v-else-if="selectedLayout === 'horizontal'" class="product-horizontal layout-horizontal">
            <div v-for="p in getByCategory(cat)" :key="p.id" class="product-card card-horizontal" @click="openProduct(p)">
              <div class="product-img-wrap img-square">
                <img v-if="p.image" :src="getImgUrl(p.image)" :alt="p.name" @error="e => e.target.style.display='none'" />
                <div v-if="!p.image" class="product-emoji-fallback">{{ getCatEmoji(p.category) }}</div>
                <div v-if="getCartQty(p.id) > 0" class="qty-badge">{{ getCartQty(p.id) }}</div>
              </div>
              <div class="product-body-center">
                <h3>{{ p.name }}</h3>
                <span class="price price-bottom">{{ p.price }} ₺</span>
                <button @click.stop="quickAdd(p)" class="quick-add-horizontal">
                  {{ getCartQty(p.id) > 0 ? '✓' : '+' }}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

    </main>

    <!-- Sepet Butonu -->
    <transition name="slide-up">
      <div v-if="cart.length > 0" class="cart-float" @click="showCartModal = true">
        <div class="cart-float-left">
          <div class="cart-count">{{ totalItems }}</div>
          <span>{{ t('cart_view') }}</span>
        </div>
        <strong>{{ totalPrice.toFixed(2) }} ₺ ›</strong>
      </div>
    </transition>

    <!-- Ürün Detay Modal -->
    <transition name="slide-up">
      <div v-if="activeProduct" class="modal-overlay" @click.self="activeProduct = null">
        <div class="product-modal">
          <div class="product-modal-img">
            <img v-if="activeProduct.image" :src="getImgUrl(activeProduct.image)" :alt="activeProduct.name" @error="e => e.target.style.display='none'" />
            <div class="product-modal-emoji">{{ getCatEmoji(activeProduct.category) }}</div>
            <button @click="activeProduct = null" class="close-btn">✕</button>
          </div>
          <div class="product-modal-body">
            <div class="product-modal-title-row">
              <h2>{{ activeProduct.name }}</h2>
              <span class="modal-price">{{ activeProduct.price }} ₺</span>
            </div>
            <p v-if="activeProduct.description" class="modal-desc">{{ activeProduct.description }}</p>
            <div class="modal-note-wrap">
              <label>Özel istek (opsiyonel)</label>
              <textarea v-model="productNote" placeholder="Az baharatlı, ekstra sos vb." rows="2"></textarea>
            </div>
            <div class="modal-action-row">
              <div class="qty-row">
                <button @click="modalQty = Math.max(1, modalQty - 1)" class="qty-btn">−</button>
                <span class="qty-num">{{ modalQty }}</span>
                <button @click="modalQty++" class="qty-btn">+</button>
              </div>
              <button @click="addFromModal" class="add-modal-btn">
                Sepete Ekle — {{ (activeProduct.price * modalQty).toFixed(2) }} ₺
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Sepet Modal -->
    <transition name="slide-up">
      <div v-if="showCartModal" class="modal-overlay" @click.self="showCartModal = false">
        <div class="cart-modal">
          <div class="cart-modal-header">
            <h2>{{ t('cart_title') }}</h2>
            <button @click="showCartModal = false" class="close-btn-sm">✕</button>
          </div>
          <div class="cart-modal-items">
            <div v-for="item in cart" :key="item.cartId" class="cart-item">
              <div class="cart-item-left">
                <span class="cart-emoji">{{ getCatEmoji(item.category) }}</span>
                <div>
                  <strong>{{ item.name }}</strong>
                  <div v-if="item.notes" class="cart-note">📝 {{ item.notes }}</div>
                  <div class="cart-unit-price">{{ item.price }} ₺ / adet</div>
                </div>
              </div>
              <div class="cart-item-right">
                <div class="cart-qty-ctrl">
                  <button @click="decreaseCart(item)" class="qty-btn-sm">−</button>
                  <span>{{ item.quantity }}</span>
                  <button @click="item.quantity++" class="qty-btn-sm">+</button>
                </div>
                <span class="cart-line-total">{{ (item.price * item.quantity).toFixed(2) }} ₺</span>
              </div>
            </div>
          </div>
          <div class="cart-modal-footer">
            <div class="order-note-wrap">
              <label>{{ t('order_note') }}</label>
              <textarea v-model="orderNote" :placeholder="t('order_note_ph')" rows="2"></textarea>
            </div>
            <div class="total-row">
              <span>{{ t('total') }}</span>
              <strong>{{ totalPrice.toFixed(2) }} ₺</strong>
            </div>
            <button @click="submitOrder" :disabled="submitting || !canOrder" class="order-confirm-btn">
              {{ submitting ? t('sending') : canOrder ? t('confirm_order') : t('qr_required') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Garson Modal -->
    <transition name="fade">
      <div v-if="showWaiterModal" class="modal-overlay" @click.self="showWaiterModal = false">
        <div class="waiter-modal">
          <h2>{{ t('waiter_title') }}</h2>
          <div class="waiter-options">
            <button v-for="opt in waiterOpts" :key="opt.id" @click="callWaiter(t(opt.msgKey))" class="waiter-opt">
              {{ opt.icon }} {{ t(opt.labelKey) }}
            </button>
          </div>
          <button @click="showWaiterModal = false" class="cancel-waiter-btn">{{ t('waiter_cancel') }}</button>
        </div>
      </div>
    </transition>

    <!-- Sipariş Başarılı -->
    <transition name="fade">
      <div v-if="orderSuccess" class="success-overlay">
        <div class="success-card">
          <div class="success-anim">✅</div>
          <h2>{{ t('order_success_title') }}</h2>
          <p>{{ t('table_label') }} {{ tableNumber }} — {{ t('preparing') }}</p>
          <p class="success-sub">{{ t('order_success_sub') }}</p>
          <button @click="orderSuccess = false; loadBill()" class="success-close-btn">{{ t('ok') }}</button>
        </div>
      </div>
    </transition>
    <transition name="slide-up">
      <div v-if="showBillModal" class="modal-overlay" @click.self="showBillModal = false">
        <div class="bill-modal">
          <div class="bill-modal-header">
            <h2>{{ t('bill_title') }} — {{ t('table_label') }} {{ tableNumber }}</h2>
            <button @click="showBillModal = false" class="close-btn-sm">✕</button>
          </div>
          <div v-if="billLoading" class="bill-loading">{{ t('loading_bill') }}</div>
          <div v-else-if="billData && billData.items.length > 0" class="bill-modal-body">
            <div class="bill-items">
              <div v-for="item in billData.items" :key="item.name + item.notes" class="bill-item">
                <span class="bill-item-qty">{{ item.quantity }}x</span>
                <span class="bill-item-name">{{ item.name }}</span>
                <span v-if="item.notes" class="bill-item-note">📝 {{ item.notes }}</span>
                <span class="bill-item-price">₺{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
            <div class="bill-total-section">
              <div class="bill-total-row">
                <span>TOPLAM</span>
                <strong>₺{{ billData.subtotal.toFixed(2) }}</strong>
              </div>
              <div class="bill-order-count">{{ t('bill_orders', { n: billData.orderCount }) }}</div>
            </div>
            <p class="bill-pay-note">{{ t('bill_pay_note') }}</p>
            <button type="button" @click="requestBillFromWaiter" class="request-bill-btn">
              {{ t('request_bill') }}
            </button>
          </div>
          <div v-else class="bill-empty">
            <p>{{ t('bill_empty') }}</p>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import axios from 'axios'
import { t, tCategory, LANGUAGES, getDir } from '@/utils/i18n.js'
import { getTheme } from '@/components/QRMenuThemes.js'

export default {
  name: 'QRMenu',
  data() {
    return {
      currentLang: localStorage.getItem('qr_lang') || 'tr',
      cafeName: localStorage.getItem('cafeName') || 'Kafe',
      cafeSlogan: localStorage.getItem('cafeAddress') || 'Lezzetli anlar için buradayız',
      tableNumber: null,
      menuItems: [],
      loading: true,
      searchQuery: '',
      activeCategory: null,
      activeProduct: null,
      productNote: '',
      modalQty: 1,
      cart: [],
      showCartModal: false,
      orderNote: '',
      submitting: false,
      orderSuccess: false,
      showWaiterModal: false,
      waiterOpts: [
        { id: 1, icon: '🧾', labelKey: 'waiter_bill',   msgKey: 'waiter_bill_msg' },
        { id: 2, icon: '💧', labelKey: 'waiter_water',  msgKey: 'waiter_water_msg' },
        { id: 3, icon: '🧻', labelKey: 'waiter_napkin', msgKey: 'waiter_napkin_msg' },
        { id: 4, icon: '❓', labelKey: 'waiter_help',   msgKey: 'waiter_help_msg' }
      ],
      sessionId: null,
      sessionToken: null,
      sessionValid: false,
      showBillModal: false,
      billLoading: false,
      billData: null,
      billPollInterval: null,
      LANGUAGES,
      // TEMA SİSTEMİ
      currentTheme: null,
      themeConfig: null,
      themeLoading: true,
      selectedLayout: 'grid', // Seçilen tek layout
      cafeLogo: null // Firma logosu
    }
  },

  computed: {
    canOrder() {
      return this.sessionValid && this.sessionId && this.sessionToken
    },
    allCategories() {
      return [...new Set(this.menuItems.filter(p => p.available !== false).map(p => p.category))]
    },
    searchResults() {
      if (!this.searchQuery) return []
      const q = this.searchQuery.toLowerCase()
      return this.menuItems.filter(p =>
        p.available !== false && (
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        )
      )
    },
    totalItems() {
      return this.cart.reduce((s, i) => s + i.quantity, 0)
    },
    totalPrice() {
      return this.cart.reduce((s, i) => s + i.price * i.quantity, 0)
    },
  },

  async mounted() {
    // ÖNCELİKLE TEMA YÜKLE
    await this.loadTheme()
    
    // Dil yönünü uygula
    this.applyDir()
    
    const params = new URLSearchParams(window.location.search)
    const tableParam = params.get('table')
    if (tableParam && !isNaN(parseInt(tableParam))) this.tableNumber = parseInt(tableParam)
    
    // Menü ve diğer verileri yükle
    await this.loadMenu()
    this.loadCart()
    this.loadBill()
    this.initializeSession()
    this.billPollInterval = setInterval(() => this.loadBill(), 15000)
    
    console.log('🚀 QR Menü hazır - Tema:', this.currentTheme)
  },

  beforeUnmount() {
    if (this.billPollInterval) clearInterval(this.billPollInterval)
  },

  methods: {
    // ---- i18n ----
    t(key, vars = {}) { return t(this.currentLang, key, vars) },
    
    // Kategori çevirisi
    tCat(categoryName) { 
      return tCategory(this.currentLang, categoryName)
    },

    setLang(code) {
      this.currentLang = code
      localStorage.setItem('qr_lang', code)
      this.applyDir()
    },

    applyDir() {
      const dir = getDir(this.currentLang)
      document.documentElement.dir = dir
      document.documentElement.lang = this.currentLang
    },

    // ---- SESSION ----
    async initializeSession() {
      if (!this.tableNumber) return
      try {
        // DEMO: Konum kontrolü YOK - isteğe bağlı
        let location = null
        
        try {
          location = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              console.log('📍 Demo: GPS desteklenmiyor - devam ediliyor')
              return reject()
            }
            navigator.geolocation.getCurrentPosition(
              p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
              () => {
                console.log('📍 Demo: Konum alınamadı - devam ediliyor')
                reject()
              },
              { timeout: 5000, enableHighAccuracy: false }
            )
          })
          console.log('📍 Demo: Konum alındı (kontrol edilmeyecek)')
        } catch (err) { 
          console.log('📍 Demo: Konum olmadan devam ediliyor', err.message || '')
        }
        
        const res = await axios.post('http://localhost:3000/api/table/session', {
          tableId: this.tableNumber,
          location
        })
        
        if (res.data.success) {
          this.sessionId = res.data.data.sessionId
          this.sessionToken = res.data.data.token
          this.sessionValid = true
          console.log('✅ Demo session başarıyla oluşturuldu (konum kontrolü YOK)')
        }
      } catch (e) {
        this.sessionValid = false
        console.error('Session hatası:', e.message)
        alert('❌ Session oluşturulamadı: ' + (e.response?.data?.message || e.message))
      }
    },

    clearSession() {
      this.sessionId = null
      this.sessionToken = null
      this.sessionValid = false
    },

    async loadBill(openModal = false) {
      if (!this.tableNumber) return
      if (openModal) { this.showBillModal = true; this.billLoading = true }
      try {
        const res = await axios.get(`http://localhost:3000/api/tables/${this.tableNumber}/bill`)
        if (res.data.success) this.billData = res.data.data
      } catch (e) { console.warn(e.message) }
      finally { this.billLoading = false }
    },

    async requestBillFromWaiter() {
      await this.callWaiter('Hesap istiyoruz')
      this.showBillModal = false
    },

    // TEMA SİSTEMİ
    async loadTheme() {
      this.themeLoading = true
      try {
        const res = await axios.get('http://localhost:3000/api/qr-menu/theme')
        if (res.data.success) {
          const themeData = res.data.data
          this.currentTheme = themeData.activeTheme || 'modern'
          this.selectedLayout = themeData.selectedLayout || 'grid' // Layout'u yükle
          this.themeConfig = getTheme(this.currentTheme)
          
          // Özelleştirmeler
          if (themeData.customization) {
            this.cafeName = themeData.customization.cafeName || this.cafeName
            this.cafeSlogan = themeData.customization.cafeSlogan || this.cafeSlogan
            
            // Logo URL'ini yükle
            if (themeData.customization.logoUrl) {
              this.cafeLogo = this.getImgUrl(themeData.customization.logoUrl)
            }
          }
          
          // CSS değişkenlerini uygula
          this.applyThemeColors()
          
          console.log('✅ Tema yüklendi:', this.currentTheme, 'Layout:', this.selectedLayout, 'Logo:', this.cafeLogo ? 'Var' : 'Yok')
        }
      } catch (e) {
        console.warn('⚠️ Tema yüklenemedi, varsayılan tema kullanılıyor:', e.message)
        this.currentTheme = 'modern'
        this.selectedLayout = 'grid'
        this.themeConfig = getTheme('modern')
        this.applyThemeColors()
      } finally {
        this.themeLoading = false
      }
    },

    applyThemeColors() {
      if (!this.themeConfig || !this.themeConfig.colors) {
        console.warn('⚠️ Tema config bulunamadı!')
        return
      }
      
      const root = document.documentElement
      const colors = this.themeConfig.colors
      
      // CSS değişkenlerini ayarla
      root.style.setProperty('--theme-primary', colors.primary)
      root.style.setProperty('--theme-primary-dark', colors.primaryDark)
      root.style.setProperty('--theme-primary-light', colors.primaryLight)
      root.style.setProperty('--theme-accent', colors.accent)
      root.style.setProperty('--theme-bg', colors.bg)
      root.style.setProperty('--theme-card-bg', colors.cardBg)
      root.style.setProperty('--theme-text', colors.text)
      root.style.setProperty('--theme-text-light', colors.textLight)
      root.style.setProperty('--theme-border', colors.border)
      
      console.log('🎨 Tema renkleri uygulandı:', {
        primary: colors.primary,
        bg: colors.bg,
        cardBg: colors.cardBg
      })
      
      // Body arkaplanını da güncelle
      document.body.style.background = colors.bg
    },

    async loadMenu() {
      this.loading = true
      try {
        const res = await axios.get('http://localhost:3000/api/menu')
        if (res.data.success) {
          this.menuItems = res.data.data || []
          if (this.allCategories.length) this.activeCategory = this.allCategories[0]
        }
      } catch (e) {
        console.warn('Menü yüklenemedi:', e.message)
      } finally {
        this.loading = false
      }
    },

    getByCategory(cat) {
      return this.menuItems.filter(p => p.category === cat && p.available !== false)
    },

    getCatEmoji(cat) {
      const m = { 'İçecekler': '☕', 'Yemekler': '🍽️', 'Tatlılar': '🍰', 'Atıştırmalıklar': '🍟', 'Salatalar': '🥗', 'Çorbalar': '🍲', 'Kahvaltı': '🥐', 'Pizzalar': '🍕', 'Burgerler': '🍔', 'Makarnalar': '🍝', 'Kahveler': '☕', 'Çaylar': '🍵', 'Ana Yemekler': '🍽️', 'Başlangıçlar': '🥙', 'Pastalar': '🎂', 'Dondurma': '🍨', 'Aperatifler': '🥨' }
      return m[cat] || '🍴'
    },

    getImgUrl(img) {
      if (!img) return null
      if (img.startsWith('http')) return img
      return 'http://localhost:3000' + img
    },

    scrollToCategory(cat) {
      this.activeCategory = cat
      this.searchQuery = ''
      const el = document.getElementById('cat-' + cat)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },

    getCartQty(productId) {
      return this.cart.filter(i => i.id === productId).reduce((s, i) => s + i.quantity, 0)
    },

    openProduct(p) {
      this.activeProduct = p
      this.productNote = ''
      this.modalQty = 1
    },

    quickAdd(p) {
      const ex = this.cart.find(i => i.id === p.id && !i.notes)
      if (ex) { ex.quantity++ } else {
        this.cart.push({ ...p, cartId: `${p.id}_${Date.now()}`, quantity: 1, notes: '' })
      }
      this.saveCart()
    },

    addFromModal() {
      const notes = this.productNote.trim()
      const ex = this.cart.find(i => i.id === this.activeProduct.id && i.notes === notes)
      if (ex) { ex.quantity += this.modalQty } else {
        this.cart.push({ ...this.activeProduct, cartId: `${this.activeProduct.id}_${Date.now()}`, quantity: this.modalQty, notes })
      }
      this.saveCart()
      this.activeProduct = null
    },

    decreaseCart(item) {
      if (item.quantity <= 1) this.cart = this.cart.filter(i => i.cartId !== item.cartId)
      else item.quantity--
      this.saveCart()
    },

    saveCart() {
      localStorage.setItem(`qr_cart_${this.tableNumber}`, JSON.stringify(this.cart))
    },

    loadCart() {
      const s = localStorage.getItem(`qr_cart_${this.tableNumber}`)
      if (s) this.cart = JSON.parse(s)
    },

    async submitOrder() {
      if (!this.tableNumber) { alert('Masa numarası bulunamadı. QR kodu tekrar okutun.'); return }
      if (!this.canOrder) { alert('🔒 Sipariş vermek için QR kodu tekrar okutun.'); return }
      if (!this.cart.length) return
      
      this.submitting = true
      
      try {
        // DEMO: Konum kontrolü YOK - isteğe bağlı
        let currentLocation = null
        try {
          console.log('📍 Demo: Sipariş için konum alınıyor (isteğe bağlı)...')
          currentLocation = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              console.log('📍 Demo: GPS yok, devam ediliyor')
              return reject()
            }
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                })
              },
              () => {
                console.log('📍 Demo: Konum alınamadı, devam ediliyor')
                reject()
              },
              { 
                enableHighAccuracy: false, 
                timeout: 5000,
                maximumAge: 60000 // 1 dakika cache kabul edilir
              }
            )
          })
          console.log('✅ Demo: Güncel konum alındı (kontrol edilmeyecek):', currentLocation)
        } catch (error) {
          console.log('📍 Demo: Konum olmadan devam ediliyor', error.message || '')
          // Demo'da konum olmasa da sipariş verilebilir
        }
        
        // Sipariş gönder
        await axios.post('http://localhost:3000/api/orders', {
          sessionId: this.sessionId,
          token: this.sessionToken,
          tableNumber: this.tableNumber,
          items: this.cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, notes: i.notes || '', category: i.category })),
          total: this.totalPrice,
          notes: this.orderNote,
          status: 'pending',
          currentLocation: currentLocation // Gönderilir ama kontrol edilmez
        })
        
        this.cart = []
        this.orderNote = ''
        this.showCartModal = false
        this.orderSuccess = true
        // Demo'da session silinmez - 10 sipariş hakkı var
        localStorage.removeItem(`qr_cart_${this.tableNumber}`)
        await this.loadBill()
      } catch (e) {
        if (e.response?.status === 401) this.clearSession()
        alert('Sipariş gönderilemedi: ' + (e.response?.data?.message || e.message))
      } finally {
        this.submitting = false
      }
    },

    async callWaiter(msg) {
      this.showWaiterModal = false
      try {
        await axios.post('http://localhost:3000/api/waiter-calls', { tableId: this.tableNumber, tableNumber: this.tableNumber, reason: msg, status: 'pending' })
        alert(this.t('waiter_called'))
      } catch (error) {
        console.error('Garson çağrı hatası:', error)
        alert('Garson çağrısı gönderilemedi')
      }
    }
  }
}
</script>

<style scoped>
/* ============================================================
   QR MENÜ - TEMA SİSTEMİ
   5 Farklı Tema Desteği
   ============================================================ */

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ---- TEMA YÜKLENİYOR ---- */
.theme-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #0f2d5c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.theme-loading p {
  font-size: 1rem;
  color: #64748b;
  font-family: 'Inter', sans-serif;
}

.qr-menu {
  min-height: 100vh;
  background: var(--theme-bg, #f5f5f5);
  font-family: 'Inter', sans-serif;
  padding-bottom: 100px;
  transition: background-color 0.3s ease;
}

/* ---- TEMA RENK DEĞİŞKENLERİ (JS'ten inject edilecek) ---- */
/* --theme-primary, --theme-primary-dark, --theme-primary-light, --theme-accent, 
   --theme-bg, --theme-card-bg, --theme-text, --theme-text-light, --theme-border */

/* ---- HEADER ---- */
.qr-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--theme-card-bg, #fff);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

/* ELEGANT DARK TEMA - Özel header */
.theme-elegant .qr-header {
  background: var(--theme-primary-dark);
  border-bottom: 1px solid var(--theme-border);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
}

.cafe-brand { display: flex; align-items: center; gap: 10px; }

.cafe-logo { 
  font-size: 2rem; 
  transition: transform 0.3s ease; 
}

.cafe-logo-img {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.cafe-logo-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.cafe-logo-img:hover {
  transform: scale(1.05);
}

.theme-vibrant .cafe-logo { animation: bounce 2s infinite; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.cafe-info h1 { 
  font-size: 1.1rem; 
  font-weight: 700; 
  color: var(--theme-text, #1a1a1a); 
  transition: color 0.3s ease;
}
.cafe-info p { font-size: 0.75rem; color: var(--theme-text-light, #888); }

.header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.table-badge {
  background: var(--theme-primary-light, #10b981);
  color: white;
  border: 1px solid var(--theme-border, #bbf7d0);
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.waiter-call-btn, .bill-view-btn {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark));
  color: white;
  border: none;
  padding: 7px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.waiter-call-btn:hover, .bill-view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.waiter-call-btn {
  background: linear-gradient(135deg, var(--theme-accent), var(--theme-primary));
}

/* Dil seçici */
.lang-picker {
  display: flex;
  gap: 4px;
}

.lang-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}

.lang-btn:hover { border-color: var(--primary-border); }
.lang-btn.active { border-color: var(--primary); background: var(--primary-xlight); }

/* ---- SEARCH ---- */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 10px;
  background: var(--theme-bg, #f5f5f5);
  border-radius: 12px;
  padding: 10px 14px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.search-bar:focus-within {
  border-color: var(--theme-primary-light);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  outline: none;
  color: var(--theme-text, #333);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--theme-text-light, #999);
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.clear-btn:hover { color: var(--theme-primary); }

/* ---- CATEGORY TABS ---- */
.category-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 16px 12px;
  scrollbar-width: none;
}
.category-scroll::-webkit-scrollbar { display: none; }

.cat-tab {
  white-space: nowrap;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--theme-border, #e5e7eb);
  background: var(--theme-card-bg, #fff);
  color: var(--theme-text-light, #555);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-tab.active {
  background: var(--theme-primary);
  color: white;
  border-color: var(--theme-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.cat-tab:hover:not(.active) {
  border-color: var(--theme-primary-light);
  background: var(--theme-bg);
}

/* WARM TEMA - Yuvarlak pill tarz */
.theme-warm .cat-tab { border-radius: 30px; padding: 8px 16px; }

/* VIBRANT TEMA - Renkli border */
.theme-vibrant .cat-tab { border-width: 2px; font-weight: 600; }
.theme-vibrant .cat-tab.active { transform: scale(1.05); }

/* ---- MAIN ---- */
.menu-main { padding: 16px; }

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  color: #888;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.section-header h2 { font-size: 1.05rem; font-weight: 700; color: var(--theme-text); }
.count-badge {
  background: var(--theme-primary-light);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.layout-badge {
  background: var(--theme-accent);
  color: white;
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  opacity: 0.8;
  margin-left: auto;
}

.category-section { margin-bottom: 28px; }

.empty-msg { text-align: center; color: #aaa; padding: 40px 0; }

/* ---- PRODUCT GRID ---- */
/* Grid Layout (Default & Modern) */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  transition: all 0.3s ease;
}

/* List Layout (Warm tema) */
.layout-list .product-grid {
  grid-template-columns: 1fr;
  gap: 10px;
}

.layout-list .product-card {
  display: flex;
  flex-direction: row !important;
  min-height: 100px;
}

.layout-list .product-img-wrap {
  width: 100px;
  flex-shrink: 0;
}

.layout-list .product-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Masonry Layout (Fresh tema) */
.layout-masonry .product-grid {
  column-count: 2;
  column-gap: 12px;
}

.layout-masonry .product-card {
  break-inside: avoid;
  margin-bottom: 12px;
  display: inline-block;
  width: 100%;
}

/* Horizontal Layout (Vintage tema) */
.layout-horizontal .product-grid {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  scroll-snap-type: x mandatory;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--theme-accent) var(--theme-border);
}

.layout-horizontal .product-grid::-webkit-scrollbar {
  height: 8px;
}

.layout-horizontal .product-grid::-webkit-scrollbar-track {
  background: var(--theme-bg);
  border-radius: 10px;
}

.layout-horizontal .product-grid::-webkit-scrollbar-thumb {
  background: var(--theme-accent);
  border-radius: 10px;
}

.layout-horizontal .product-card {
  flex: 0 0 280px;
  scroll-snap-align: start;
}

/* ---- PRODUCT CARD STİLLERİ ---- */
.product-card {
  background: var(--theme-card-bg, #fff);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--theme-border, transparent);
}

/* Rounded Style (Modern, Fresh) */
.card-rounded .product-card { border-radius: 14px; }

/* Sharp Style (Vibrant) */
.card-sharp .product-card { border-radius: 4px; }

/* Elevated Style (Warm, Elegant) */
.card-elevated .product-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Flat Style (Vintage, Minimal) */
.card-flat .product-card {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--theme-border);
}

/* Hover Effects */
.anim-fade .product-card:hover {
  opacity: 0.85;
}

.anim-slide .product-card:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.anim-scale .product-card:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  z-index: 10;
}

.anim-none .product-card:hover {
  /* Minimal hover - sadece border */
  border-color: var(--theme-primary);
}

.product-img-wrap {
  position: relative;
  height: 120px;
  background: var(--theme-bg, #f8f8f8);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0; left: 0;
  transition: transform 0.3s ease;
}

.product-card:hover .product-img-wrap img {
  transform: scale(1.1);
}

.product-emoji-fallback {
  font-size: 2.5rem;
  z-index: 1;
}

.product-emoji-fallback-masonry {
  position: absolute;
  top: 50%; 
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  z-index: 1;
}

.qty-badge {
  position: absolute;
  top: 8px; right: 8px;
  background: var(--theme-primary, #0f2d5c);
  color: white;
  width: 24px; height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.product-body { 
  padding: 10px; 
  background: var(--theme-card-bg);
}

.product-body h3 { 
  font-size: 0.88rem; 
  font-weight: 600; 
  color: var(--theme-text, #1a1a1a); 
  margin-bottom: 4px; 
  transition: color 0.3s;
}

.product-desc {
  font-size: 0.75rem;
  color: var(--theme-text-light, #888);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.product-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-top: 8px;
}

.price { 
  font-size: 0.95rem; 
  font-weight: 700; 
  color: var(--theme-primary, #0f2d5c); 
  transition: color 0.3s;
}

.quick-add {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark));
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.quick-add:hover { 
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

.quick-add:active {
  transform: rotate(90deg) scale(0.95);
}

/* TEMA ÖZEL CARD STİLLERİ */

/* Elegant Dark - Gölge efektleri */
.theme-elegant .product-card {
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.theme-elegant .product-card:hover {
  box-shadow: 0 8px 32px rgba(251,191,36,0.3);
  border-color: var(--theme-accent);
}

/* Warm - Yumuşak köşeler */
.theme-warm .product-card {
  border-radius: 20px;
}

.theme-warm .quick-add {
  border-radius: 10px;
}

/* Vibrant - Bold border */
.theme-vibrant .product-card {
  border-width: 2px;
}

.theme-vibrant .product-card:hover {
  border-color: var(--theme-accent);
  box-shadow: 0 0 20px var(--theme-accent);
}

/* Fresh - Soft shadow */
.theme-fresh .product-card {
  box-shadow: 0 2px 8px rgba(6,95,70,0.1);
}

.theme-fresh .product-card:hover {
  box-shadow: 0 6px 20px rgba(16,185,129,0.2);
}

/* VINTAGE TEMA - Parşömen Efekti */
.theme-vintage {
  font-family: 'Georgia', 'Times New Roman', serif;
}

.theme-vintage .qr-header {
  background: var(--theme-cardBg);
  border-bottom: 3px double var(--theme-border);
  box-shadow: 0 2px 8px rgba(61,40,23,0.1);
}

.theme-vintage .cafe-info h1 {
  font-family: 'Georgia', serif;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 2px rgba(212,196,176,0.3);
}

.theme-vintage .product-card {
  background: linear-gradient(135deg, #faf6f0 0%, #f8f4ed 100%);
  border: 2px solid var(--theme-border);
  box-shadow: 
    2px 2px 4px rgba(61,40,23,0.1),
    inset 0 0 60px rgba(212,165,116,0.05);
  position: relative;
}

.theme-vintage .product-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(139,115,85,0.03) 2px,
      rgba(139,115,85,0.03) 4px
    );
  pointer-events: none;
  border-radius: inherit;
}

.theme-vintage .product-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    3px 3px 8px rgba(61,40,23,0.15),
    inset 0 0 60px rgba(212,165,116,0.08);
}

.theme-vintage .product-body h3 {
  font-family: 'Georgia', serif;
  font-weight: 600;
}

.theme-vintage .price {
  font-family: 'Georgia', serif;
  font-weight: 700;
}

.theme-vintage .cat-tab {
  border: 2px solid var(--theme-border);
  background: var(--theme-cardBg);
  font-family: 'Georgia', serif;
}

.theme-vintage .cat-tab.active {
  background: var(--theme-primary);
  border-color: var(--theme-primaryDark);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* MINIMAL TEMA - Ultra Temiz */
.theme-minimal {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
}

.theme-minimal .qr-header {
  background: var(--theme-cardBg);
  border-bottom: 1px solid var(--theme-border);
  box-shadow: none;
}

.theme-minimal .cafe-info h1 {
  font-weight: 800;
  letter-spacing: -0.5px;
}

.theme-minimal .product-card {
  background: var(--theme-cardBg);
  border: 1px solid var(--theme-border);
  transition: all 0.2s ease;
}

.theme-minimal .product-card:hover {
  border-color: var(--theme-primary);
}

.theme-minimal .product-img-wrap {
  filter: grayscale(20%);
  transition: filter 0.3s;
}

.theme-minimal .product-card:hover .product-img-wrap {
  filter: grayscale(0%);
}

.theme-minimal .product-body h3 {
  font-weight: 600;
  letter-spacing: -0.3px;
}

.theme-minimal .price {
  font-weight: 700;
  letter-spacing: -0.5px;
}

.theme-minimal .cat-tab {
  border: 1px solid var(--theme-border);
  background: transparent;
  font-weight: 500;
  letter-spacing: -0.2px;
  transition: all 0.2s;
}

.theme-minimal .cat-tab.active {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
}

.theme-minimal .quick-add {
  background: var(--theme-primary);
  border-radius: 4px;
  box-shadow: none;
}

.theme-minimal .quick-add:hover {
  transform: none;
  background: var(--theme-primaryDark);
}

/* Minimal - Cart Float */
.theme-minimal .cart-float {
  background: var(--theme-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid var(--theme-primaryDark);
}

.theme-minimal .cart-float-left,
.theme-minimal .cart-float strong {
  color: white;
}

/* Vintage - Cart Float */
.theme-vintage .cart-float {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primaryDark));
  border: 2px solid var(--theme-accent);
  box-shadow: 
    0 4px 12px rgba(61,40,23,0.3),
    inset 0 1px 0 rgba(255,255,255,0.1);
}

.theme-vintage .cart-float-left,
.theme-vintage .cart-float strong {
  color: #faf6f0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.theme-vintage .cart-count {
  background: var(--theme-accent);
  color: var(--theme-primaryDark);
  font-weight: 800;
}

/* ---- CART FLOAT ---- */
.cart-float {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 480px;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark));
  color: white;
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 200;
  transition: all 0.3s ease;
}

.cart-float:hover {
  transform: translateX(-50%) translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.5);
}

.cart-float:active {
  transform: translateX(-50%) translateY(-2px);
}

.cart-float-left { 
  display: flex; 
  align-items: center; 
  gap: 12px;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.cart-float strong {
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.cart-count {
  background: white;
  color: var(--theme-primary);
  width: 28px; height: 28px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: pulse 2s infinite;
}

/* TEMA ÖZEL CART FLOAT */
.theme-vibrant .cart-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
}

.theme-elegant .cart-float {
  border: 2px solid var(--theme-accent);
}

.theme-elegant .cart-float-left,
.theme-elegant .cart-float strong {
  color: white;
}

.theme-warm .cart-float {
  border-radius: 30px;
}

.theme-warm .cart-float-left,
.theme-warm .cart-float strong {
  color: white;
}

/* ---- MODALS ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Elegant tema - koyu overlay */
.theme-elegant .modal-overlay {
  background: rgba(0,0,0,0.85);
}

/* Ürün Modal */
.product-modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
.product-modal-img {
  position: relative;
  height: 220px;
  background: #f0f0f0;
  overflow: hidden;
}
.product-modal-img img { width: 100%; height: 100%; object-fit: cover; }
.product-modal-emoji {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
}
.close-btn {
  position: absolute;
  top: 12px; right: 12px;
  background: rgba(0,0,0,0.4);
  color: white;
  border: none;
  width: 32px; height: 32px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-modal-body { padding: 20px; }
.product-modal-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.product-modal-title-row h2 { font-size: 1.2rem; font-weight: 700; flex: 1; }
.modal-price { font-size: 1.2rem; font-weight: 700; color: var(--primary); white-space: nowrap; margin-left: 12px; }
.modal-desc { color: #666; font-size: 0.9rem; margin-bottom: 16px; line-height: 1.5; }
.modal-note-wrap label { font-size: 0.85rem; font-weight: 600; color: #555; display: block; margin-bottom: 6px; }
.modal-note-wrap textarea {
  width: 100%;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  font-size: 0.9rem;
  resize: none;
  outline: none;
  margin-bottom: 16px;
}
.modal-action-row { display: flex; gap: 12px; align-items: center; }
.qty-row { display: flex; align-items: center; gap: 12px; }
.qty-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  background: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-num { font-size: 1.1rem; font-weight: 700; min-width: 24px; text-align: center; }
.add-modal-btn {
  flex: 1;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

/* Sepet Modal */
.cart-modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.cart-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.cart-modal-header h2 { font-size: 1.1rem; font-weight: 700; }
.close-btn-sm {
  background: #f5f5f5;
  border: none;
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
}
.cart-modal-items { flex: 1; overflow-y: auto; padding: 12px 20px; }
.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.cart-item-left { display: flex; align-items: flex-start; gap: 10px; flex: 1; }
.cart-emoji { font-size: 1.5rem; }
.cart-item-left strong { font-size: 0.9rem; }
.cart-note { font-size: 0.75rem; color: #888; }
.cart-unit-price { font-size: 0.8rem; color: #aaa; }
.cart-item-right { display: flex; align-items: center; gap: 8px; }
.cart-qty-ctrl { display: flex; align-items: center; gap: 6px; }
.qty-btn-sm {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 1rem;
  cursor: pointer;
}
.cart-line-total { font-size: 0.9rem; font-weight: 700; color: var(--primary); min-width: 60px; text-align: right; }
.cart-modal-footer { padding: 16px 20px; border-top: 1px solid #f0f0f0; }
.order-note-wrap label { font-size: 0.82rem; font-weight: 600; color: #555; display: block; margin-bottom: 6px; }
.order-note-wrap textarea {
  width: 100%;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  font-size: 0.85rem;
  resize: none;
  outline: none;
  margin-bottom: 12px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 1rem;
}
.total-row strong { font-size: 1.2rem; color: var(--primary); }
.order-confirm-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--success), #15803d);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
.order-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Garson Modal */
.waiter-modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 24px 20px;
}
.waiter-modal h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; text-align: center; }
.waiter-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.waiter-opt {
  background: #f8fafc;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.waiter-opt:hover { background: #eff6ff; border-color: var(--primary); color: var(--primary); }
.cancel-waiter-btn {
  width: 100%;
  background: #f5f5f5;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  cursor: pointer;
}

/* Başarı Ekranı */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.success-card {
  background: white;
  border-radius: 20px;
  padding: 36px 28px;
  text-align: center;
  max-width: 320px;
  width: 100%;
}
.success-anim { font-size: 4rem; margin-bottom: 16px; }
.success-card h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 8px; }
.success-card p { color: #555; margin-bottom: 4px; }
.success-sub { font-size: 0.85rem; color: #aaa; margin-bottom: 20px; }
.success-close-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.bill-pay-note {
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  margin: 1rem 0 0.75rem;
  line-height: 1.4;
}
.request-bill-btn {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

/* Mobil */
@media (max-width: 480px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
  .header-top { padding: 12px 12px 8px; }
  .search-bar { margin: 0 12px 8px; }
  .category-scroll { padding: 0 12px 10px; }
  .menu-main { padding: 12px; }
  
  /* Logo mobil boyutu */
  .cafe-logo-img {
    width: 40px;
    height: 40px;
  }
  
  .cafe-logo {
    font-size: 1.8rem;
  }
  
  .cafe-info h1 {
    font-size: 1rem;
  }
  
  .cafe-info p {
    font-size: 0.7rem;
  }
}

/* ============================================================
   LAYOUT SPECIFIC STYLES - 4 FARKLI SAYFA DÜZENİ
   ============================================================ */

/* 1. GRID LAYOUT - Klasik Grid */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.card-grid {
  display: flex;
  flex-direction: column;
  height: 100%; /* Sabit yükseklik */
}

.card-grid .img-large {
  height: 160px;
  flex-shrink: 0;
}

.card-grid .product-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Taşmayı önle */
}

.card-grid .product-desc {
  flex: 1;
  overflow: hidden;
}

.card-grid .product-footer {
  margin-top: auto;
  padding-top: 8px;
}

.price-badge {
  background: var(--theme-accent);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
}

/* 2. LIST LAYOUT - Kompakt Liste */
.layout-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-list {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 12px;
  min-height: 100px;
  padding: 8px !important;
}

.card-list .img-medium {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

.card-list .product-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 !important;
  min-width: 0; /* Taşmayı önle */
}

.card-list .product-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.card-list .product-title-row h3 {
  flex: 1;
  font-size: 0.95rem;
  min-width: 0; /* Text overflow için */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-inline {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.card-list .product-desc {
  margin-bottom: 0;
  font-size: 0.8rem;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.quick-add-list {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark));
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.quick-add-list:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

/* 3. MASONRY LAYOUT - Pinterest Tarzı */
.layout-masonry {
  column-count: 2;
  column-gap: 14px;
}

.card-masonry {
  break-inside: avoid;
  margin-bottom: 14px;
  display: inline-block;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.card-masonry .img-auto {
  height: auto;
  min-height: 180px;
  max-height: 280px;
  position: relative;
}

.card-masonry .img-auto img {
  position: relative;
  height: auto;
  min-height: 180px;
  object-fit: cover;
}

.card-masonry .product-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
  padding: 20px 12px 12px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-masonry:hover .product-overlay {
  opacity: 1;
}

.card-masonry .product-overlay h3 {
  color: white;
  font-size: 0.95rem;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.price-overlay {
  color: var(--theme-accent);
  font-size: 1.05rem;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

/* 4. HORIZONTAL LAYOUT - Yatay Kaydırma */
.layout-horizontal {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  scroll-snap-type: x mandatory;
  padding-bottom: 12px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--theme-accent) var(--theme-border);
}

.layout-horizontal::-webkit-scrollbar {
  height: 8px;
}

.layout-horizontal::-webkit-scrollbar-track {
  background: var(--theme-bg);
  border-radius: 10px;
}

.layout-horizontal::-webkit-scrollbar-thumb {
  background: var(--theme-accent);
  border-radius: 10px;
}

.card-horizontal {
  flex: 0 0 180px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  max-width: 180px; /* Buton taşmasını önle */
}

.card-horizontal .img-square {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-horizontal .product-body-center {
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow: hidden; /* Taşmayı önle */
}

.card-horizontal .product-body-center h3 {
  font-size: 0.9rem;
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-bottom {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme-primary);
}

.quick-add-horizontal {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark));
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.quick-add-horizontal:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

.quick-add-horizontal:active {
  transform: scale(0.95);
}

/* KATEGORI ANIMASYONLARI */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.category-anim-fadeIn {
  animation: fadeIn 0.5s ease;
}

.category-anim-slideIn {
  animation: slideIn 0.6s ease;
}

.category-anim-fadeUp {
  animation: fadeUp 0.6s ease;
}

.category-anim-scaleIn {
  animation: scaleIn 0.5s ease;
}

.category-anim-bounce .product-card:hover {
  animation: bounce 0.6s ease;
}

/* Mobil Responsive - Layout'lara göre */
@media (max-width: 480px) {
  /* Grid Layout - Mobil */
  .layout-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .card-grid .img-large {
    height: 140px;
  }
  
  .card-grid .product-body {
    padding: 8px;
  }
  
  .card-grid .product-body h3 {
    font-size: 0.85rem;
  }
  
  .card-grid .product-desc {
    font-size: 0.75rem;
    -webkit-line-clamp: 2;
  }
  
  .price-badge {
    font-size: 0.85rem;
    padding: 3px 10px;
  }
  
  .quick-add {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }
  
  /* List Layout - Mobil */
  .card-list {
    min-height: 90px;
    padding: 6px !important;
    gap: 10px;
  }
  
  .card-list .img-medium {
    width: 80px;
    height: 80px;
  }
  
  .card-list .product-title-row h3 {
    font-size: 0.85rem;
  }
  
  .price-inline {
    font-size: 0.9rem;
  }
  
  .card-list .product-desc {
    font-size: 0.75rem;
    -webkit-line-clamp: 1;
  }
  
  .quick-add-list {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }
  
  /* Masonry Layout - Mobil */
  .layout-masonry {
    column-count: 2;
    column-gap: 10px;
  }
  
  .card-masonry {
    margin-bottom: 10px;
  }
  
  .card-masonry .img-auto {
    min-height: 140px;
    max-height: 220px;
  }
  
  .card-masonry .product-overlay {
    padding: 16px 10px 10px;
  }
  
  .card-masonry .product-overlay h3 {
    font-size: 0.85rem;
  }
  
  .price-overlay {
    font-size: 0.95rem;
  }
  
  /* Horizontal Layout - Mobil */
  .layout-horizontal {
    gap: 12px;
  }
  
  .card-horizontal {
    flex: 0 0 150px;
    max-width: 150px;
  }
  
  .card-horizontal .img-square {
    width: 150px;
    height: 150px;
  }
  
  .card-horizontal .product-body-center {
    padding: 10px 6px;
    gap: 6px;
  }
  
  .card-horizontal .product-body-center h3 {
    font-size: 0.85rem;
  }
  
  .price-bottom {
    font-size: 0.9rem;
  }
  
  .quick-add-horizontal {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}

/* Tablet */
@media (min-width: 481px) and (max-width: 768px) {
  .layout-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  
  .card-grid .img-large {
    height: 150px;
  }
  
  .layout-masonry {
    column-count: 3;
    column-gap: 12px;
  }
  
  .card-horizontal {
    flex: 0 0 160px;
    max-width: 160px;
  }
  
  .card-horizontal .img-square {
    width: 160px;
    height: 160px;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .layout-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 18px;
  }
  
  .card-grid .img-large {
    height: 180px;
  }
  
  .layout-masonry {
    column-count: 4;
    column-gap: 16px;
  }
  
  .card-horizontal {
    flex: 0 0 200px;
    max-width: 200px;
  }
  
  .card-horizontal .img-square {
    width: 200px;
    height: 200px;
  }
  
  .card-list .img-medium {
    width: 120px;
    height: 120px;
  }
}

</style>
