<template>
  <div class="customer-app">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <span>🍽️</span>
          </div>
          <div class="restaurant-info">
            <h1>Restoran</h1>
            <p>Lezzetli Anlar</p>
          </div>
        </div>
        
        <div class="header-actions">
          <button @click="loadBill(true)" class="bill-btn">
            🧾 Hesabım
            <span v-if="billSummary.total > 0" class="bill-badge">₺{{ billSummary.total.toFixed(2) }}</span>
          </button>
          <button @click="showWaiterCall = true" class="waiter-btn">
            <i class="ri-hand-heart-line"></i>
            <span>Garson Çağır</span>
          </button>
          <div class="table-info">
            <span v-if="tableNumber">Masa {{ tableNumber }}</span>
            <span v-else class="error-text">⚠️ Masa Numarası Yok</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Açık Hesap Özeti (her zaman görünür) -->
    <div v-if="tableNumber" class="bill-summary-bar" @click="loadBill(true)">
      <div class="bill-summary-left">
        <span class="bill-summary-icon">🧾</span>
        <div>
          <div class="bill-summary-label">Masa Hesabı</div>
          <div class="bill-summary-detail">
            <span v-if="billSummary.orderCount > 0">{{ billSummary.orderCount }} sipariş</span>
            <span v-else>Henüz sipariş yok</span>
          </div>
        </div>
      </div>
      <div class="bill-summary-right">
        <strong v-if="billSummary.total > 0">₺{{ billSummary.total.toFixed(2) }}</strong>
        <strong v-else>₺0.00</strong>
      </div>
    </div>

    <!-- QR Güvenlik Uyarısı kaldırıldı — QR tarayıcı sipariş onayında açılır -->

    <!-- Category Tabs -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="selectedCategory = category.id"
        :class="['category-tab', { active: selectedCategory === category.id }]"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Product Grid -->
    <div class="product-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        @click="openProductModal(product)"
      >
        <div class="product-image">
          <img :src="product.image" :alt="product.name" />
          <div class="product-badge" v-if="getCartQuantity(product.id) > 0">
            {{ getCartQuantity(product.id) }}
          </div>
        </div>
        
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-price">{{ product.price }}₺</p>
        </div>
        
        <div class="product-actions">
          <button
            v-if="getCartQuantity(product.id) === 0"
            @click.stop="addToCart(product)"
            class="add-btn"
          >
            Sepete Ekle
          </button>
          
          <div v-else @click.stop class="quantity-controls">
            <button @click="updateQuantity(product.id, getCartQuantity(product.id) - 1)" class="qty-btn">-</button>
            <span class="quantity">{{ getCartQuantity(product.id) }}</span>
            <button @click="updateQuantity(product.id, getCartQuantity(product.id) + 1)" class="qty-btn">+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Bar -->
    <div v-if="cart.length > 0" class="cart-bar">
      <div class="cart-content">
        <div class="cart-info">
          <div class="cart-icon-section">
            <div class="cart-icon">
              <i class="ri-shopping-cart-line"></i>
            </div>
            <span class="cart-items">{{ totalItems }} Ürün</span>
          </div>
          <div class="cart-total">
            {{ totalPrice.toFixed(2) }}₺
          </div>
        </div>
        
        <button @click="completeOrder" class="complete-btn">
          <span class="desktop-text">Siparişi Tamamla</span>
          <span class="mobile-text">Tamamla</span>
        </button>
      </div>
    </div>

    <!-- Product Modal -->
    <div v-if="showProductModal" class="modal-overlay" @click="closeProductModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedProduct?.name }}</h2>
          <button @click="closeProductModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <img :src="selectedProduct?.image" :alt="selectedProduct?.name" class="modal-image" />
          <p class="modal-price">{{ selectedProduct?.price }}₺</p>
          
          <div class="customization-section">
            <h3>Özel İstekler</h3>
            <textarea
              v-model="productNotes"
              placeholder="Özel isteklerinizi yazın (az baharatlı, ekstra sos vb.)"
              class="notes-input"
            ></textarea>
          </div>
          
          <div class="quantity-section">
            <label>Adet:</label>
            <div class="quantity-controls">
              <button @click="modalQuantity = Math.max(1, modalQuantity - 1)" class="qty-btn">-</button>
              <span class="quantity">{{ modalQuantity }}</span>
              <button @click="modalQuantity++" class="qty-btn">+</button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="addToCartWithCustomization" class="add-to-cart-btn">
            Sepete Ekle - {{ (selectedProduct?.price * modalQuantity).toFixed(2) }}₺
          </button>
        </div>
      </div>
    </div>

    <!-- Order Confirmation Modal -->
    <div v-if="showOrderConfirmation" class="modal-overlay">
      <div class="modal-content order-confirmation">
        <div class="modal-header">
          <h2>Sipariş Özeti</h2>
          <button @click="showOrderConfirmation = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="order-items">
            <div v-for="item in cart" :key="item.cartId" class="order-item">
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p v-if="item.notes" class="item-notes">{{ item.notes }}</p>
                <p class="item-quantity">{{ item.quantity }} adet</p>
              </div>
              <div class="item-price">
                {{ (item.price * item.quantity).toFixed(2) }}₺
              </div>
            </div>
          </div>
          
          <div class="order-total">
            <strong>Toplam: {{ totalPrice.toFixed(2) }}₺</strong>
          </div>
          
          <div class="order-notes-section">
            <h3>Sipariş Notu</h3>
            <textarea
              v-model="orderNotes"
              placeholder="Genel sipariş notunuz (masaya peçete getirin, acele değil vb.)"
              class="order-notes-input"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showOrderConfirmation = false" class="cancel-btn">İptal</button>
          <button @click="submitOrder" class="confirm-btn" :disabled="submitting">
            {{ submitting ? 'Gönderiliyor...' : (canOrder ? 'Siparişi Onayla' : 'QR Okut & Onayla') }}
          </button>
        </div>
      </div>
    </div>

    <!-- QR Tarayıcı Modal -->
    <div v-if="showQrScanner" class="modal-overlay qr-scanner-overlay">
      <div class="modal-content qr-scanner-modal" @click.stop>
        <div class="modal-header">
          <h2>📷 Masadaki QR Kodu Okutun</h2>
          <button @click="closeQrScanner" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p class="qr-hint">Güvenlik için masadaki QR kodu kameraya gösterin.</p>
          <div id="qr-reader" class="qr-reader-box"></div>
          <p v-if="qrScanning" class="qr-status">Kamera açılıyor...</p>
          <p v-if="qrError" class="qr-error">{{ qrError }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeQrScanner" class="cancel-btn">İptal</button>
        </div>
      </div>
    </div>

    <!-- Waiter Call Modal -->
    <div v-if="showWaiterCall" class="modal-overlay">
      <div class="modal-content waiter-call">
        <div class="modal-header">
          <h2>Garson Çağır</h2>
          <button @click="showWaiterCall = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="quick-calls">
            <button
              v-for="quickCall in quickCalls"
              :key="quickCall.id"
              @click="callWaiter(quickCall.message)"
              class="quick-call-btn"
            >
              {{ quickCall.icon }} {{ quickCall.message }}
            </button>
          </div>
          
          <div class="custom-call">
            <h3>Özel Mesaj</h3>
            <textarea
              v-model="customWaiterMessage"
              placeholder="Özel mesajınızı yazın..."
              class="custom-message-input"
            ></textarea>
            <button @click="callWaiter(customWaiterMessage)" class="send-custom-btn">
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hesap Modalı -->
    <div v-if="showBillModal" class="modal-overlay" @click.self="showBillModal = false">
      <div class="modal-content bill-modal">
        <div class="modal-header">
          <h2>🧾 Hesabım — Masa {{ tableNumber }}</h2>
          <button @click="showBillModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="billLoading" class="bill-loading">⏳ Hesap yükleniyor...</div>
          <template v-else-if="billData && billData.items.length > 0">
            <div class="bill-items-list">
              <div v-for="(item, idx) in billData.items" :key="idx" class="bill-item-row">
                <span class="bill-qty">{{ item.quantity }}x</span>
                <div class="bill-item-info">
                  <span>{{ item.name }}</span>
                  <small v-if="item.notes">📝 {{ item.notes }}</small>
                </div>
                <span class="bill-item-price">₺{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
            <div class="bill-totals">
              <div class="bill-total-row">
                <span>Toplam ({{ billData.orderCount }} sipariş)</span>
                <strong>₺{{ billData.subtotal.toFixed(2) }}</strong>
              </div>
            </div>

            <p class="bill-pay-note">Ödeme kasada veya garson aracılığıyla yapılır.</p>
            <button type="button" @click="requestBillFromWaiter" class="request-bill-btn">
              🙋 Garsona Hesap İste
            </button>
          </template>
          <div v-else class="bill-empty">
            <p>Henüz açık hesap yok</p>
            <small>Sipariş verdiğinizde burada görünecek</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Area -->
    <div v-if="notification" class="notification" :class="notification.type">
      <div class="notification-content">
        <span class="notification-icon">{{ notification.icon }}</span>
        <span class="notification-message">{{ notification.message }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode'
import { parseTableFromQr } from '../utils/qrTable'

export default {
  name: 'CustomerNew',
  data() {
    return {
      tableNumber: null, // URL'den alınacak, varsayılan yok
      selectedCategory: 'icecekler',
      cart: [],
      showProductModal: false,
      selectedProduct: null,
      modalQuantity: 1,
      productNotes: '',
      showOrderConfirmation: false,
      orderNotes: '',
      submitting: false,
      showWaiterCall: false,
      customWaiterMessage: '',
      notification: null,
      menuItems: [], // Backend'den gelecek

      // QR Session (sipariş güvenliği)
      sessionId: null,
      sessionToken: null,
      sessionValid: false,
      sessionInitializing: false,

      showQrScanner: false,
      qrScanning: false,
      qrError: '',
      html5QrCode: null,
      pendingSubmitOrder: false,

      // Hesap görüntüleme
      showBillModal: false,
      billLoading: false,
      billData: null,
      billSummary: { total: 0, orderCount: 0 },
      billPollInterval: null,
      
      categories: [
        { id: 'icecekler', name: 'İçecekler' },
        { id: 'yemekler', name: 'Yemekler' },
        { id: 'tatlilar', name: 'Tatlılar' },
        { id: 'atistirmaliklar', name: 'Atıştırmalıklar' },
        { id: 'salatalar', name: 'Salatalar' },
        { id: 'corbalar', name: 'Çorbalar' }
      ],
      
      quickCalls: [
        { id: 1, icon: '💧', message: 'Su istiyoruz' },
        { id: 2, icon: '🧻', message: 'Peçete getirin' },
        { id: 3, icon: '🍴', message: 'Çatal-kaşık istiyoruz' },
        { id: 4, icon: '🧾', message: 'Hesap istiyoruz' },
        { id: 5, icon: '🧽', message: 'Masa temizleme' },
        { id: 6, icon: '❓', message: 'Yardım istiyoruz' }
      ],
      
      // Fallback products if backend is not available
      fallbackProducts: {
        icecekler: [
          { id: 1, name: 'Türk Kahvesi', price: 25, category: 'İçecekler', image: '/assets/images/turk-kahvesi.jpg', available: true },
          { id: 2, name: 'Cappuccino', price: 30, category: 'İçecekler', image: '/assets/images/cappuccino.jpg', available: true },
          { id: 3, name: 'Çay', price: 15, category: 'İçecekler', image: '/assets/images/cay.jpg', available: true },
          { id: 4, name: 'Limonata', price: 20, category: 'İçecekler', image: '/assets/images/limonata.jpg', available: true }
        ],
        yemekler: [
          { id: 7, name: 'Izgara Tavuk', price: 85, category: 'Yemekler', image: '/assets/images/tavuk.jpg', available: true },
          { id: 8, name: 'Köfte', price: 75, category: 'Yemekler', image: '/assets/images/kofte.jpg', available: true },
          { id: 9, name: 'Pizza Margherita', price: 90, category: 'Yemekler', image: '/assets/images/pizza.jpg', available: true },
          { id: 10, name: 'Hamburger', price: 65, category: 'Yemekler', image: '/assets/images/hamburger.jpg', available: true }
        ],
        tatlilar: [
          { id: 13, name: 'Baklava', price: 45, category: 'Tatlılar', image: '/assets/images/baklava.jpg', available: true },
          { id: 14, name: 'Tiramisu', price: 40, category: 'Tatlılar', image: '/assets/images/tiramisu.jpg', available: true },
          { id: 15, name: 'Cheesecake', price: 38, category: 'Tatlılar', image: '/assets/images/cheesecake.jpg', available: true }
        ],
        atistirmaliklar: [
          { id: 17, name: 'Patates Kızartması', price: 35, category: 'Atıştırmalıklar', image: '/assets/images/patates.jpg', available: true },
          { id: 18, name: 'Soğan Halkası', price: 30, category: 'Atıştırmalıklar', image: '/assets/images/sogan.jpg', available: true }
        ],
        salatalar: [
          { id: 21, name: 'Sezar Salata', price: 45, category: 'Salatalar', image: '/assets/images/salata.jpg', available: true }
        ],
        corbalar: [
          { id: 24, name: 'Mercimek Çorbası', price: 25, category: 'Çorbalar', image: '/assets/images/corba.jpg', available: true }
        ]
      }
    }
  },
  
  computed: {
    filteredProducts() {
      if (this.menuItems.length > 0) {
        // Backend'den gelen ürünleri kullan
        return this.menuItems.filter(product => {
          const categoryMap = {
            'icecekler': 'İçecekler',
            'yemekler': 'Yemekler', 
            'tatlilar': 'Tatlılar',
            'atistirmaliklar': 'Atıştırmalıklar',
            'salatalar': 'Salatalar',
            'corbalar': 'Çorbalar'
          }
          return product.category === categoryMap[this.selectedCategory] && product.available
        })
      } else {
        // Fallback products kullan
        return this.fallbackProducts[this.selectedCategory] || []
      }
    },
    
    totalItems() {
      return this.cart.reduce((total, item) => total + item.quantity, 0)
    },
    
    totalPrice() {
      return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    },

    canOrder() {
      return this.sessionValid && this.sessionId && this.sessionToken
    }
  },
  
  mounted() {
    this.initFromUrl()
  },

  beforeUnmount() {
    if (this.billPollInterval) clearInterval(this.billPollInterval)
    this.stopQrScanner()
  },
  
  methods: {
    initFromUrl() {
      const urlParams = new URLSearchParams(window.location.search)
      const tableParam = urlParams.get('table')

      if (tableParam) {
        const parsedTable = parseInt(tableParam)
        if (!isNaN(parsedTable) && parsedTable > 0) {
          this.tableNumber = parsedTable
        } else {
          alert('⚠️ Geçersiz masa numarası! Lütfen QR kodu tekrar okutun.')
          return
        }
      } else {
        alert('⚠️ Masa numarası bulunamadı! Lütfen QR kodu tekrar okutun.')
        return
      }

      this.loadMenu()
      this.loadCartFromStorage()
      this.loadBill()
      this.billPollInterval = setInterval(() => this.loadBill(), 15000)
    },

    async startQrScanner() {
      this.qrError = ''
      this.qrScanning = true
      await this.$nextTick()
      try {
        await this.stopQrScanner()
        this.html5QrCode = new Html5Qrcode('qr-reader')
        await this.html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => this.onQrScanned(decodedText),
          () => {}
        )
      } catch (e) {
        this.qrError = 'Kamera açılamadı. Tarayıcı ayarlarından kamera izni verin.'
        console.warn('QR kamera hatası:', e.message)
      } finally {
        this.qrScanning = false
      }
    },

    async stopQrScanner() {
      if (this.html5QrCode) {
        try {
          await this.html5QrCode.stop()
          await this.html5QrCode.clear()
        } catch { /* ignore */ }
        this.html5QrCode = null
      }
    },

    closeQrScanner() {
      this.showQrScanner = false
      this.pendingSubmitOrder = false
      this.stopQrScanner()
      this.qrError = ''
    },

    async openQrScannerForOrder() {
      this.pendingSubmitOrder = true
      this.showQrScanner = true
      await this.startQrScanner()
    },

    async onQrScanned(decodedText) {
      const scannedTable = parseTableFromQr(decodedText)
      if (!scannedTable) {
        this.qrError = 'Geçersiz QR kod. Masadaki QR kodu okutun.'
        return
      }
      if (scannedTable !== this.tableNumber) {
        this.qrError = `Bu QR Masa ${scannedTable} için. Siz Masa ${this.tableNumber}'desiniz.`
        return
      }

      await this.stopQrScanner()
      this.showQrScanner = false
      this.qrError = ''

      await this.initializeSession()
      if (!this.canOrder) {
        this.qrError = 'Oturum başlatılamadı. Tekrar deneyin.'
        this.showNotification('error', '❌', 'QR doğrulandı ama oturum açılamadı.')
        return
      }

      this.showNotification('success', '✅', 'QR doğrulandı!')

      if (this.pendingSubmitOrder) {
        this.pendingSubmitOrder = false
        await this.executeSubmitOrder()
      }
    },

    async initializeSession() {
      if (!this.tableNumber || this.sessionInitializing) return
      this.sessionInitializing = true
      try {
        let location = null
        try {
          location = await this.getUserLocation()
        } catch {
          console.log('📍 Konum alınamadı, QR-only mod')
        }

        const res = await axios.post('http://localhost:3000/api/table/session', {
          tableId: this.tableNumber,
          location
        })

        if (res.data.success) {
          this.sessionId = res.data.data.sessionId
          this.sessionToken = res.data.data.token
          this.sessionValid = true
        }
      } catch (e) {
        this.sessionValid = false
        console.warn('Session başlatılamadı:', e.response?.data?.message || e.message)
      } finally {
        this.sessionInitializing = false
      }
    },

    getUserLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation yok'))
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 8000 }
        )
      })
    },

    clearSession() {
      this.sessionId = null
      this.sessionToken = null
      this.sessionValid = false
    },

    async loadBill(openModal = false) {
      if (!this.tableNumber) return
      if (openModal) {
        this.showBillModal = true
        this.billLoading = true
      }
      try {
        const res = await axios.get(`http://localhost:3000/api/tables/${this.tableNumber}/bill`)
        if (res.data.success) {
          this.billData = res.data.data
          this.billSummary = {
            total: res.data.data.subtotal || 0,
            orderCount: res.data.data.orderCount || 0
          }
        }
      } catch (e) {
        console.warn('Hesap yüklenemedi:', e.message)
      } finally {
        this.billLoading = false
      }
    },

    async requestBillFromWaiter() {
      await this.callWaiter('Hesap istiyoruz')
      this.showBillModal = false
    },

    async loadMenu() {
      try {
        console.log('🍽️ Menü yükleniyor...')
        const response = await axios.get('http://localhost:3000/api/menu')
        
        if (response.data.success && response.data.data) {
          this.menuItems = response.data.data
          console.log('✅ Menü backend\'den yüklendi:', this.menuItems.length, 'ürün')
        } else {
          console.log('⚠️ Backend response başarısız, fallback kullanılıyor')
          this.menuItems = []
        }
      } catch (error) {
        console.log('⚠️ Backend bağlantısı yok, fallback menü kullanılıyor:', error.message)
        this.menuItems = []
      }
    },
    
    loadCartFromStorage() {
      const savedCart = localStorage.getItem(`cart_table_${this.tableNumber}`)
      if (savedCart) {
        this.cart = JSON.parse(savedCart)
        console.log('🛒 Sepet yüklendi:', this.cart.length, 'ürün')
      }
    },
    
    saveCartToStorage() {
      localStorage.setItem(`cart_table_${this.tableNumber}`, JSON.stringify(this.cart))
    },
    
    getCartQuantity(productId) {
      const cartItem = this.cart.find(item => item.id === productId && !item.notes)
      return cartItem ? cartItem.quantity : 0
    },
    
    addToCart(product, quantity = 1, notes = '') {
      const cartId = `${product.id}_${Date.now()}_${Math.random()}`
      const existingItem = this.cart.find(item => 
        item.id === product.id && item.notes === notes
      )
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.cart.push({
          ...product,
          cartId,
          quantity,
          notes
        })
      }
      
      this.saveCartToStorage()
      this.showNotification('success', '✅', `${product.name} sepete eklendi`)
    },
    
    updateQuantity(productId, newQuantity) {
      if (newQuantity <= 0) {
        this.cart = this.cart.filter(item => item.id !== productId || item.notes)
      } else {
        const item = this.cart.find(item => item.id === productId && !item.notes)
        if (item) {
          item.quantity = newQuantity
        }
      }
      this.saveCartToStorage();
    },
    // ...existing code...
    removeCompletedWaiterCall(callId) {
      // Hem localStorage'dan hem backend'den kaldır
      let waiterCalls = JSON.parse(localStorage.getItem('waiterCalls') || '[]');
      waiterCalls = waiterCalls.filter(call => call.id !== callId);
      localStorage.setItem('waiterCalls', JSON.stringify(waiterCalls));
      // Backend'e de handled olarak işaretle
      axios.put(`http://localhost:3000/api/waiter-calls/${callId}/handled`).catch(() => {});
    },
    openProductModal(product) {
      this.selectedProduct = product
      this.modalQuantity = 1
      this.productNotes = ''
      this.showProductModal = true
    },
    
    closeProductModal() {
      this.showProductModal = false
      this.selectedProduct = null
      this.productNotes = ''
    },
    
    addToCartWithCustomization() {
      if (this.selectedProduct) {
        this.addToCart(this.selectedProduct, this.modalQuantity, this.productNotes)
        this.closeProductModal()
      }
    },
    
    completeOrder() {
      if (this.cart.length === 0) return
      this.showOrderConfirmation = true
    },
    
    async submitOrder() {
      if (this.submitting) return
      
      if (!this.tableNumber) {
        this.showNotification('error', '❌', 'Masa numarası bulunamadı! Lütfen QR kodu tekrar okutun.')
        return
      }

      if (!this.canOrder) {
        await this.openQrScannerForOrder()
        return
      }

      await this.executeSubmitOrder()
    },

    async executeSubmitOrder() {
      this.submitting = true
      
      try {
        const orderData = {
          sessionId: this.sessionId,
          token: this.sessionToken,
          tableNumber: this.tableNumber,
          items: this.cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          })),
          total: this.totalPrice,
          notes: this.orderNotes,
          customerNotes: this.cart
            .filter(item => item.notes)
            .map(item => `${item.name}: ${item.notes}`)
            .join(' | '),
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
        
        console.log('📋 Sipariş gönderiliyor:')
        console.log('├── Masa Numarası:', orderData.tableNumber)
        console.log('├── Toplam:', orderData.total, '₺')
        console.log('├── Ürünler:', orderData.items.length, 'adet')
        console.log('└── Tam veri:', orderData)
        
        const response = await axios.post('http://localhost:3000/api/orders', orderData)

        if (!response.data.success) {
          throw new Error(response.data.message || 'Sipariş kaydedilemedi')
        }

        this.cart = []
        this.saveCartToStorage()
        this.showOrderConfirmation = false
        this.orderNotes = ''
        this.clearSession()
        await this.loadBill()
        this.showNotification('success', '🎉', 'Siparişiniz alındı! Yeni sipariş için QR kodu tekrar okutun.')
        
      } catch (error) {
        console.error('❌ Sipariş gönderim hatası:', error)
        if (error.response?.status === 401) {
          this.clearSession()
          this.showNotification('error', '🔒', error.response?.data?.message || 'Oturum geçersiz. QR kodu tekrar okutun.')
        } else {
          this.showNotification('error', '❌', error.response?.data?.message || error.message || 'Sipariş gönderilemedi. Tekrar deneyin.')
        }
      } finally {
        this.submitting = false
      }
    },
    
    async callWaiter(message) {
      if (!message.trim()) return
      
      try {
        const callData = {
          tableNumber: this.tableNumber,
          message: message.trim(),
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
        
        console.log('📞 Garson çağrısı:', callData)
        
        let callSaved = false
        
        // Backend'e gönder
        try {
          const response = await axios.post('http://localhost:3000/api/waiter-calls', callData)
          
          if (response.data.success) {
            console.log('✅ Garson çağrısı backend\'e gönderildi')
            callSaved = true
          }
        } catch (apiError) {
          console.log('⚠️ Garson çağrısı API hatası:', apiError.message)
        }
        
        // Sadece backend'e gönderilemediği durumda localStorage'a kaydet
        if (!callSaved) {
          const existingCalls = JSON.parse(localStorage.getItem('waiterCalls') || '[]')
          const newCall = {
            ...callData,
            id: 'CALL' + Date.now(),
            status: 'pending'
          }
          existingCalls.unshift(newCall)
          localStorage.setItem('waiterCalls', JSON.stringify(existingCalls))
          console.log('💾 Garson çağrısı localStorage\'a kaydedildi (backup)')
        }
        
        this.showWaiterCall = false
        this.customWaiterMessage = ''
        
        this.showNotification('success', '👋', 'Garson çağrınız iletildi!')
        
        // Debug: localStorage'daki garson çağrılarını kontrol et
        const waiterCalls = JSON.parse(localStorage.getItem('waiterCalls') || '[]')
        console.log('🔍 localStorage waiterCalls:', waiterCalls.length, 'çağrı')
        
      } catch (error) {
        console.error('❌ Garson çağrısı hatası:', error)
        this.showNotification('error', '❌', 'Garson çağrısı gönderilemedi.')
      }
    },
    
    showNotification(type, icon, message) {
    this.notification = { type, icon, message }
      setTimeout(() => {
        this.notification = null
      }, 3000)
    }
  }
}
</script>

<style scoped>
.customer-app {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 100px;
}

/* Header Styles */
.header {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-content {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #f97316 0%, var(--danger) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.restaurant-info h1 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  font-family: 'Pacifico', cursive;
}

.restaurant-info p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.waiter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--success);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.waiter-btn:hover {
  background: var(--success);
}

.table-info {
  background: var(--primary-light);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
}

/* Category Tabs */
.category-tabs {
  background: white;
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  border-bottom: 1px solid #eee;
  max-width: 1200px;
  margin: 0 auto;
}

.category-tab {
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 2rem;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 0.875rem;
}

.category-tab.active {
  border-color: var(--primary-light);
  background: var(--primary-light);
  color: white;
}

.category-tab:hover:not(.active) {
  border-color: #9ca3af;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.product-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.product-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--primary-light);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.product-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--success);
  margin: 0;
}

.product-actions {
  padding: 0 1rem 1rem;
}

.add-btn {
  width: 100%;
  background: var(--primary-light);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: #2563eb;
}

.quantity-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.qty-btn {
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.qty-btn:hover {
  background: #2563eb;
}

.quantity {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  min-width: 40px;
  text-align: center;
}

/* Cart Bar */
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  z-index: 30;
}

.cart-content {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-icon-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cart-icon {
  width: 2rem;
  height: 2rem;
  background: var(--primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cart-items {
  font-weight: 500;
  color: #1f2937;
}

.cart-total {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--primary-light);
}

.complete-btn {
  background: var(--success);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.complete-btn:hover {
  background: var(--success);
}

.complete-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.bill-btn {
  background: #eff6ff;
  color: var(--primary);
  border: 1px solid #bfdbfe;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.bill-badge {
  background: var(--primary);
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.bill-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  padding: 0.75rem 1rem;
  cursor: pointer;
  max-width: 1200px;
  margin: 0 auto;
}

.bill-summary-left { display: flex; align-items: center; gap: 0.75rem; }
.bill-summary-icon { font-size: 1.5rem; }
.bill-summary-label { font-weight: 700; font-size: 0.9rem; }
.bill-summary-detail { font-size: 0.75rem; opacity: 0.85; }
.bill-summary-right { text-align: right; }
.bill-summary-right strong { font-size: 1.25rem; display: block; }

.session-banner {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
  padding: 0.75rem 1rem;
  max-width: 1200px;
  margin: 0.5rem auto;
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.session-banner p { margin: 0.2rem 0 0; opacity: 0.85; }

.session-ok-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #dcfce7;
  color: #166534;
  padding: 0.5rem 1rem;
  max-width: 1200px;
  margin: 0.5rem auto;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.bill-modal { max-width: 480px; }
.bill-loading, .bill-empty { text-align: center; padding: 2rem; color: #6b7280; }
.bill-items-list { max-height: 240px; overflow-y: auto; margin-bottom: 1rem; }
.bill-item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.9rem;
}
.bill-qty { font-weight: 700; color: var(--primary); min-width: 2rem; }
.bill-item-info { flex: 1; }
.bill-item-info small { display: block; color: #888; font-size: 0.75rem; }
.bill-item-price { font-weight: 600; }
.bill-totals { background: #f8fafc; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 1rem; }
.bill-total-row { display: flex; justify-content: space-between; padding: 0.25rem 0; }
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

.request-bill-btn:hover { opacity: 0.95; }

.qr-scanner-overlay { z-index: 60; }
.qr-scanner-modal { max-width: 420px; }
.qr-hint { text-align: center; color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
.qr-reader-box { width: 100%; min-height: 280px; border-radius: 12px; overflow: hidden; background: #111; }
.qr-status { text-align: center; color: var(--primary); font-size: 0.85rem; margin-top: 0.75rem; }
.qr-error { text-align: center; color: var(--danger); font-size: 0.85rem; margin-top: 0.75rem; padding: 0.5rem; background: #fef2f2; border-radius: 8px; }

.mobile-text {
  display: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--danger);
}

.modal-body {
  padding: 1.5rem;
}

.modal-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.modal-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--success);
  margin-bottom: 1.5rem;
}

.customization-section h3,
.quantity-section label {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 1.5rem;
}

.quantity-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
}

.add-to-cart-btn {
  flex: 1;
  background: var(--success);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-to-cart-btn:hover {
  background: var(--success);
}

/* Order Confirmation */
.order-confirmation {
  max-width: 600px;
}

.order-items {
  margin-bottom: 1.5rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.item-info h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.item-notes {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0;
  font-style: italic;
}

.item-quantity {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.item-price {
  font-weight: 600;
  color: var(--success);
}

.order-total {
  text-align: right;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.order-notes-section h3 {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.order-notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
  min-height: 80px;
}

.cancel-btn {
  background: #6b7280;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #4b5563;
}

.confirm-btn {
  flex: 1;
  background: var(--success);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--success);
}

.confirm-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Waiter Call */
.waiter-call {
  max-width: 450px;
}

.quick-calls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.quick-call-btn {
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.quick-call-btn:hover {
  background: var(--primary-light);
  color: white;
  border-color: var(--primary-light);
}

.custom-call h3 {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.custom-message-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 1rem;
}

.send-custom-btn {
  background: var(--primary-light);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.send-custom-btn:hover {
  background: #2563eb;
}

/* Notification */
.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 60;
  padding: 1rem 1.5rem;
  border-left: 4px solid var(--success);
}

.notification.error {
  border-left-color: var(--danger);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notification-icon {
  font-size: 1.25rem;
}

.notification-message {
  color: #1f2937;
  font-weight: 500;
}

.error-text {
  color: var(--danger);
  font-weight: 600;
  font-size: 0.875rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0.75rem;
  }
  
  .logo {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }
  
  .restaurant-info h1 {
    font-size: 1.125rem;
  }
  
  .restaurant-info p {
    font-size: 0.75rem;
  }
  
  .waiter-btn span {
    display: none;
  }
  
  .table-info {
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
  }
  
  .category-tabs {
    padding: 0.75rem;
  }
  
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  
  .desktop-text {
    display: none;
  }
  
  .mobile-text {
    display: inline;
  }
  
  .modal-content {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .quick-calls {
    grid-template-columns: 1fr;
  }
  
  .notification {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 0.5rem;
  }
  
  .product-grid {
    grid-template-columns: 1fr;
    padding: 0.75rem;
  }
  
  .cart-content {
    padding: 0.75rem;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
  }
}
</style>
