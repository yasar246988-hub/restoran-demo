<template>
  <!-- Loading Screen -->
  <div v-if="!stylesLoaded || showLocationModal" class="loading-screen">
    <div class="loading-spinner"></div>
    <div class="loading-text">
      <h2>Kafe Sipariş</h2>
      <p v-if="!stylesLoaded">Menümüzden seçim yapabilirsiniz...</p>
      <p v-else-if="showLocationModal">{{ locationStatus }}</p>
    </div>
  </div>

  <!-- Location Permission Modal -->
  <div v-if="showLocationModal" class="fixed inset-0 bg-black bg-opacity-50 z-50">
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <div class="text-center">
          <i class="ri-map-pin-line text-4xl text-blue-600 mb-4"></i>
          <h3 class="text-xl font-semibold mb-4">Konum İzni Gerekli</h3>
          <p class="text-gray-600 mb-6">
            Güvenlik nedeniyle sipariş verebilmek için konumunuzu paylaşmanız gerekmektedir. 
            Bu sayede sadece kafe içinden sipariş verebilirsiniz.
          </p>
          <div class="space-y-3">
            <button
              @click="requestLocation"
              class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              :disabled="requestingLocation"
            >
              <span v-if="requestingLocation">Konum Alınıyor...</span>
              <span v-else>Konum İzni Ver</span>
            </button>
            <button
              @click="useTestLocation"
              class="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              :disabled="requestingLocation"
            >
              <i class="ri-code-line mr-2"></i>Test Konumu Kullan (Geliştirme)
            </button>
            <p class="text-sm text-red-600" v-if="locationError">
              {{ locationError }}
            </p>
            <p class="text-xs text-gray-500 text-center">
              💻 Bilgisayarda 3 saniye sonra otomatik test konumu aktif olacak
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div v-else class="min-h-screen bg-gray-50 font-sans pb-20">
    <!-- Simple Header -->
    <header class="bg-blue-600 text-white p-4 shadow-sm">
      <div class="container mx-auto text-center">
        <h1 class="text-xl font-bold">Kafe Sipariş - Masa {{ currentTableId || '?' }}</h1>
        <p class="text-sm text-blue-200">Menümüzden seçim yapın</p>
      </div>
    </header>

    <!-- Category Tabs -->
    <div class="bg-white border-b p-3">
      <div class="container mx-auto">
        <div class="flex space-x-1 overflow-x-auto">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="activeCategory = category.id"
            :class="[
              'px-3 py-2 rounded text-sm whitespace-nowrap',
              activeCategory === category.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'
            ]"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Products List -->
    <main class="container mx-auto p-4">
      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-600">Menü yükleniyor...</p>
      </div>
      
      <div v-else class="space-y-4">
        <div
          v-for="item in filteredMenu"
          :key="item.id"
          class="bg-white rounded-lg p-4 shadow-sm border flex items-center space-x-4"
        >
          <img 
            :src="item.image" 
            :alt="item.name" 
            class="w-20 h-20 object-cover rounded-lg"
            @error="$event.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'"
          >
          <div class="flex-1">
            <h3 class="font-semibold text-gray-800">{{ item.name }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ item.description }}</p>
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-blue-600">₺{{ item.price }}</span>
              <button
                @click="addToCart(item)"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredMenu.length === 0 && !loading" class="text-center py-12">
        <p class="text-gray-500">Bu kategoride ürün bulunmuyor.</p>
      </div>
    </main>

    <!-- Simple Bottom Buttons -->
    <div class="fixed bottom-4 right-4 z-20">
      <button
        @click="showOrderModal = true"
        class="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2"
      >
        <span>🛒</span>
        <span>Sepet ({{ cartCount }})</span>
      </button>
    </div>

    <div class="fixed bottom-4 left-4 z-20">
      <button
        @click="callWaiterForPayment"
        class="bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg"
      >
        👋 Garson Çağır
      </button>
    </div>

    <!-- Product Modal -->
    <div
      v-if="showProductModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click="closeProductModal"
    >
      <div
        class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold">{{ selectedProduct?.name }}</h3>
            <button @click="closeProductModal" class="text-gray-400 hover:text-gray-600">
              <i class="ri-close-line text-2xl"></i>
            </button>
          </div>
          
          <img 
            :src="selectedProduct?.image" 
            :alt="selectedProduct?.name" 
            class="w-full h-48 object-cover rounded-lg mb-4"
          >
          
          <p class="text-gray-600 mb-4">{{ selectedProduct?.description }}</p>
          
          <div class="flex items-center justify-between mb-4">
            <span class="text-2xl font-bold text-blue-600">₺{{ selectedProduct?.price }}</span>
            <div class="flex items-center space-x-3">
              <button
                @click="modalQuantity = Math.max(1, modalQuantity - 1)"
                class="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
              >
                <i class="ri-subtract-line"></i>
              </button>
              <span class="text-lg font-semibold">{{ modalQuantity }}</span>
              <button
                @click="modalQuantity++"
                class="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
              >
                <i class="ri-add-line"></i>
              </button>
            </div>
          </div>
          
          <!-- Product Note -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ürün Notu (İsteğe bağlı)
            </label>
            <textarea
              v-model="productNote"
              placeholder="Özel isteklerinizi yazabilirsiniz..."
              class="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows="3"
            ></textarea>
          </div>
          
          <button
            @click="addToCartFromModal"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sepete Ekle - ₺{{ (selectedProduct?.price * modalQuantity) || 0 }}
          </button>
        </div>
      </div>
    </div>

    <!-- Simple Order Modal -->
    <div
      v-if="showOrderModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click="closeOrderModal"
    >
      <div
        class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">Sepetim</h3>
            <button @click="closeOrderModal" class="text-gray-400 text-xl">✕</button>
          </div>
          
          <div v-if="cart.length === 0" class="text-center py-8">
            <p class="text-gray-500">Sepetiniz boş</p>
          </div>
          
          <div v-else>
            <div class="space-y-3 mb-4">
              <div
                v-for="item in cart"
                :key="item.cartIndex"
                class="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-sm text-gray-600">{{ item.quantity }} adet × ₺{{ item.price }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-blue-600">₺{{ item.price * item.quantity }}</p>
                  <button
                    @click="removeFromCart(item.cartIndex)"
                    class="text-red-500 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
            
            <div class="border-t pt-4">
              <div class="flex justify-between items-center text-lg font-bold mb-4">
                <span>Toplam:</span>
                <span class="text-blue-600">₺{{ cartTotal }}</span>
              </div>
              
              <button
                @click="confirmOrder"
                :disabled="loading || cart.length === 0"
                class="w-full bg-green-600 text-white py-3 rounded disabled:opacity-50"
              >
                {{ loading ? 'Sipariş Gönderiliyor...' : 'Siparişi Onayla' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <div class="text-green-600 text-6xl mb-4">
          <i class="ri-check-double-line"></i>
        </div>
        <h3 class="text-xl font-bold mb-2">Sipariş Alındı!</h3>
        <p class="text-gray-600 mb-4">
          Siparişiniz başarıyla alındı. {{ lastOrderId ? `Sipariş numaranız: ${lastOrderId}` : '' }}
        </p>
        <button
          @click="closeSuccessModal"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tamam
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CustomerView',
  props: {
    tableId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      currentTableId: this.tableId, // Local copy of the prop
      activeCategory: 'icecekler',
      cart: [],
      cartIndex: 0,
      showProductModal: false,
      showOrderModal: false,
      showSuccessModal: false,
      selectedProduct: null,
      modalQuantity: 1,
      productNote: '',
      orderNotes: '',
      loading: false,
      lastOrderId: null,
      stylesLoaded: false,
      // Güvenlik session bilgileri
      sessionId: null,
      sessionToken: null,
      sessionValid: false,
      securityChecked: false,
      maxOrders: 10,
      usedOrders: 0,
      sessionExpiry: null,
      
      // Konum güvenlik bilgileri
      showLocationModal: true,
      requestingLocation: false,
      locationError: '',
      locationStatus: 'Konum izni bekleniyor...',
      userLocation: null,
      cafeLocation: null,
      
      categories: [
        { id: 'icecekler', name: 'İçecekler', icon: 'ri-cup-line' },
        { id: 'yemekler', name: 'Yemekler', icon: 'ri-restaurant-line' },
        { id: 'tatlilar', name: 'Tatlılar', icon: 'ri-cake-line' },
        { id: 'atistirmalik', name: 'Atıştırmalık', icon: 'ri-cookie-line' }
      ],
      menuItems: []
    }
  },
  computed: {
    filteredMenu() {
      return this.menuItems.filter(item => item.category === this.activeCategory && item.available)
    },
    cartCount() {
      return this.cart.reduce((sum, item) => sum + item.quantity, 0)
    },
    cartTotal() {
      return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }
  },
  async mounted() {
    // URL'den masa numarasını al
    const urlParams = new URLSearchParams(window.location.search)
    const tableParam = urlParams.get('table')
    
    if (tableParam) {
      this.currentTableId = tableParam
      console.log('✅ Masa numarası URL\'den alındı:', this.currentTableId)
    } else if (this.currentTableId) {
      console.log('✅ Masa numarası props\'tan alındı:', this.currentTableId)
    } else {
      console.log('⚠️ Masa numarası bulunamadı')
      alert('⚠️ Masa numarası bulunamadı! Lütfen QR kodu tekrar okutun.')
    }
    
    // CSS yükleme simülasyonu
    setTimeout(() => {
      this.stylesLoaded = true
    }, 1000)
    
    // Bilgisayar için otomatik test konumu (3 saniye sonra)
    setTimeout(() => {
      console.log('💻 Bilgisayar tespit edildi, otomatik test konumu kullanılıyor...')
      this.useTestLocation()
    }, 2000) // 2 saniyeye düşürdüm
  },
  methods: {
    // Konum izni isteme
    async requestLocation() {
      this.requestingLocation = true
      this.locationError = ''
      this.locationStatus = 'Konum alınıyor...'
      
      if (!navigator.geolocation) {
        this.locationError = 'Tarayıcınız konum desteği sağlamıyor'
        this.requestingLocation = false
        return
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          console.log('📍 Konum alındı:', this.userLocation)
          this.checkLocationAndInitialize()
        },
        (error) => {
          console.error('❌ Konum hatası:', error)
          switch(error.code) {
            case error.PERMISSION_DENIED:
              this.locationError = 'Konum izni reddedildi. Sipariş verebilmek için konum izni gereklidir.'
              break
            case error.POSITION_UNAVAILABLE:
              this.locationError = 'Konum bilgisi alınamadı. Lütfen tekrar deneyin.'
              break
            case error.TIMEOUT:
              this.locationError = 'Konum alma işlemi zaman aşımına uğradı. Tekrar deneyin.'
              break
            default:
              this.locationError = 'Konum alma hatası oluştu.'
              break
          }
          this.requestingLocation = false
        },
        options
      )
    },
    
    // Test konumu kullanma (geliştirme amaçlı)
    useTestLocation() {
      console.log('🧪 Test konumu kullanılıyor...')
      this.requestingLocation = true
      this.locationError = ''
      this.locationStatus = 'Test konumu ayarlanıyor...'
      
      // Kafeye çok yakın test konumu (İstanbul örnek)
      this.userLocation = {
        latitude: 41.0085,  // Kafe konumuna çok yakın
        longitude: 28.9788,
        accuracy: 10
      }
      
      console.log('📍 Test konumu ayarlandı:', this.userLocation)
      this.locationGranted = true // Test konumu için otomatik onay
      
      setTimeout(() => {
        this.checkLocationAndInitialize()
      }, 1000)
    },
    
    // Konum kontrolü ve session başlatma
    async checkLocationAndInitialize() {
      try {
        this.locationStatus = 'Kafe konumu kontrol ediliyor...'
        
        // Kafe konum bilgilerini al
        const cafeResponse = await axios.get('http://localhost:3000/api/cafe/location')
        
        if (cafeResponse.data.success) {
          this.cafeLocation = cafeResponse.data.data
          
          // Mesafeyi hesapla
          const distance = this.calculateDistance(
            this.userLocation.latitude,
            this.userLocation.longitude,
            this.cafeLocation.latitude,
            this.cafeLocation.longitude
          )
          
          console.log('📏 Kafe mesafesi:', distance, 'metre')
          
          if (distance > this.cafeLocation.radius) {
            this.locationError = `Sipariş verebilmek için kafe konumunun ${this.cafeLocation.radius} metre yakınında olmalısınız. Şu anki mesafeniz: ${distance} metre`
            this.requestingLocation = false
            return
          }
          
          // Konum uygun, session başlat
          this.locationStatus = 'Güvenli bağlantı kuruluyor...'
          await this.initializeSession()
          
          // Modal'ı kapat ve menüyü yükle
          this.showLocationModal = false
          this.requestingLocation = false
          await this.loadMenu()
        }
      } catch (error) {
        console.error('❌ Konum kontrolü hatası:', error)
        this.locationError = 'Kafe bağlantısı kurulamadı. Lütfen tekrar deneyin.'
        this.requestingLocation = false
      }
    },
    
    // Mesafe hesaplama (Haversine formülü)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000 // Dünya'nın yarıçapı (metre)
      const φ1 = lat1 * Math.PI/180
      const φ2 = lat2 * Math.PI/180
      const Δφ = (lat2-lat1) * Math.PI/180
      const Δλ = (lon2-lon1) * Math.PI/180

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      return Math.round(R * c) // metre cinsinden mesafe
    },
    
    // Güvenlik session başlatma (konum ile)
    async initializeSession() {
      try {
        console.log('🔐 Session başlatılıyor...')
        
        const response = await axios.post('http://localhost:3000/api/table/session', {
          tableId: this.tableId,
          location: this.userLocation
        })
        
        if (response.data.success) {
          this.sessionId = response.data.data.sessionId
          this.sessionToken = response.data.data.token
          this.sessionValid = true
          this.maxOrders = response.data.data.maxOrders
          this.sessionExpiry = response.data.data.expiresAt
          this.securityChecked = true
          
          console.log('✅ Güvenli session oluşturuldu:', this.sessionId)
          console.log('├── Maksimum sipariş:', this.maxOrders)
          console.log('├── Geçerlik süresi:', new Date(this.sessionExpiry).toLocaleString('tr-TR'))
          console.log('└── Masa:', this.tableId)
          
          // Session'ı periyodik olarak doğrula
          this.startSessionValidation()
        }
      } catch (error) {
        console.error('❌ Session başlatılamadı:', error.message)
        this.sessionValid = false
        this.showSessionError()
      }
    },
    
    // Session doğrulama
    async validateSession() {
      if (!this.sessionId || !this.sessionToken) return false
      
      try {
        const response = await axios.post('http://localhost:3000/api/table/validate', {
          sessionId: this.sessionId,
          token: this.sessionToken
        })
        
        if (response.data.success) {
          this.sessionValid = true
          return true
        }
      } catch (error) {
        console.error('❌ Session doğrulama hatası:', error.message)
        this.sessionValid = false
        this.showSessionError()
      }
      return false
    },
    
    // Periyodik session kontrolü
    startSessionValidation() {
      // Her 5 dakikada bir session'ı kontrol et
      setInterval(async () => {
        await this.validateSession()
      }, 5 * 60 * 1000)
    },
    
    // Session hatası göster
    showSessionError() {
      alert('🔒 Güvenlik hatası: Oturum geçersiz. Lütfen QR kodu yeniden okutun.')
      // Sayfayı yenile veya ana sayfaya yönlendir
      window.location.reload()
    },
    
    async loadMenu() {
      try {
        this.loading = true
        const response = await axios.get('http://localhost:3000/api/menu')
        
        if (response.data.success) {
          this.menuItems = response.data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category: this.getCategorySlug(item.category),
            image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
            available: item.available !== false,
            description: item.description || ''
          }))
          console.log('✅ Müşteri menü yüklendi:', this.menuItems.length, 'ürün')
        }
      } catch (error) {
        console.error('❌ Menü yüklenemedi, fallback kullanılıyor:', error.message)
        // Fallback menu
        this.menuItems = [
          { id: 1, name: 'Türk Kahvesi', price: 25, category: 'icecekler', image: 'https://images.unsplash.com/photo-1545665277-5937750d9ae4?w=300&h=200&fit=crop', available: true, description: 'Geleneksel Türk kahvesi' },
          { id: 2, name: 'Latte', price: 30, category: 'icecekler', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop', available: true, description: 'Sıcak süt ile espresso' }
        ]
      } finally {
        this.loading = false
      }
    },
    
    getCategorySlug(categoryName) {
      const categoryMap = {
        'İçecekler': 'icecekler',
        'Yemekler': 'yemekler',
        'Tatlılar': 'tatlilar',
        'Atıştırmalıklar': 'atistirmalik'
      }
      return categoryMap[categoryName] || 'yemekler'
    },
    
    loadTailwind() {
      setTimeout(() => {
        this.stylesLoaded = true
      }, 100)

      if (!document.querySelector('#tailwind-css')) {
        const tailwindScript = document.createElement('script')
        tailwindScript.id = 'tailwind-css'
        tailwindScript.src = 'https://cdn.tailwindcss.com/3.4.16'
        document.head.appendChild(tailwindScript)
      }

      if (!document.querySelector('#remix-icons')) {
        const remixLink = document.createElement('link')
        remixLink.id = 'remix-icons'
        remixLink.rel = 'stylesheet'
        remixLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css'
        document.head.appendChild(remixLink)
      }
    },
    
    openProductModal(product) {
      this.selectedProduct = product
      this.modalQuantity = 1
      this.productNote = ''
      this.showProductModal = true
    },
    
    closeProductModal() {
      this.showProductModal = false
      this.selectedProduct = null
    },
    
    addToCartFromModal() {
      if (!this.selectedProduct) return
      
      const cartItem = {
        ...this.selectedProduct,
        quantity: this.modalQuantity,
        notes: this.productNote.trim(),
        cartIndex: this.cartIndex++
      }
      
      this.cart.push(cartItem)
      this.closeProductModal()
    },
    
    // Direkt sepete ekleme (basit)
    addToCart(product) {
      if (!product) return
      
      const cartItem = {
        ...product,
        quantity: 1,
        notes: '',
        cartIndex: this.cartIndex++
      }
      
      this.cart.push(cartItem)
      
      // Basit bildirim
      alert(`${product.name} sepete eklendi!`)
    },
    
    removeFromCart(cartIndex) {
      const index = this.cart.findIndex(item => item.cartIndex === cartIndex)
      if (index > -1) {
        this.cart.splice(index, 1)
      }
    },
    
    closeOrderModal() {
      this.showOrderModal = false
    },
    
    async confirmOrder() {
      // Güvenlik kontrolü
      if (!this.sessionValid || !this.sessionId || !this.sessionToken) {
        alert('🔒 Güvenlik hatası: Geçersiz oturum. Lütfen QR kodu yeniden okutun.')
        this.showSessionError()
        return
      }
      
      // Sipariş limiti kontrolü
      if (this.usedOrders >= this.maxOrders) {
        alert(`⚠️ Maksimum sipariş limitine (${this.maxOrders}) ulaştınız.`)
        return
      }
      
      // Session doğrulama
      const isValid = await this.validateSession()
      if (!isValid) {
        return
      }
      
      this.loading = true
      
      try {
        const orderData = {
          // Güvenlik bilgileri
          sessionId: this.sessionId,
          token: this.sessionToken,
          // Sipariş bilgileri
          tableNumber: parseInt(this.tableId) || 5,
          items: this.cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || null
          })),
          total: this.cartTotal,
          notes: this.orderNotes || '',
          customerNotes: this.cart
            .filter(item => item.notes)
            .map(item => `${item.name}: ${item.notes}`)
            .join('; '),
          timestamp: new Date().toISOString()
        }
        
        const response = await axios.post('http://localhost:3000/api/orders', orderData)
        
        if (response.data.success) {
          console.log('✅ Güvenli sipariş gönderildi:', response.data.id)
          this.lastOrderId = response.data.id
          this.usedOrders += 1 // Kullanılan sipariş sayısını artır
          
          this.showOrderModal = false
          this.showSuccessModal = true
          
          // Sepeti ve notları temizle
          this.cart = []
          this.orderNotes = ''
          this.productNote = ''
          
          console.log(`📊 Sipariş durumu: ${this.usedOrders}/${this.maxOrders}`)
        }
        
      } catch (error) {
        console.error('❌ Sipariş gönderilirken hata:', error)
        
        if (error.response?.status === 401) {
          alert('🔒 Oturum geçersiz. QR kodu yeniden okutun.')
          this.showSessionError()
        } else if (error.response?.status === 403) {
          alert('🚫 Güvenlik ihlali tespit edildi.')
          this.showSessionError()
        } else if (error.response?.status === 429) {
          alert('⚠️ Maksimum sipariş limitine ulaştınız.')
        } else {
          alert('❌ Sipariş gönderilirken hata oluştu: ' + (error.response?.data?.message || error.message))
        }
      } finally {
        this.loading = false
      }
    },
    
    closeSuccessModal() {
      this.showSuccessModal = false
      this.lastOrderId = null
    },
    
    async callWaiterForPayment() {
      try {
        await axios.post('http://localhost:3000/api/waiter-calls', {
          tableNumber: parseInt(this.tableId) || 5,
          message: 'Ödeme için garson çağrısı'
        })
        alert('Garson çağrınız iletildi!')
      } catch (error) {
        console.error('Garson çağrısı hatası:', error)
        alert('Garson çağrısı gönderilemedi!')
      }
    },
    
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }
}
</script>

<style scoped>
/* Loading Screen Styles */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h2 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.loading-text p {
  font-size: 1rem;
  opacity: 0.8;
  text-align: center;
}

/* Fallback Styles (before Tailwind loads) */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.bg-blue-600 { background-color: #2563eb; }
.bg-gray-100 { background-color: #f3f4f6; }
.text-white { color: white; }
.text-center { text-align: center; }
.p-4 { padding: 1rem; }
.mb-4 { margin-bottom: 1rem; }
.grid { display: grid; }
.gap-4 { gap: 1rem; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

@media (min-width: 768px) {
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* Fixed Buttons Styles */
.fixed {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3);
}

.fixed button {
  border: 3px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.fixed button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.4);
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animate pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Enhanced loading spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
