<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <NavigationSidebar />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1>Sipariş Takibi</h1>
        <div class="header-actions">
          <button @click="refreshOrders" class="refresh-btn" :disabled="loading">
            {{ loading ? '🔄 Yenileniyor...' : '🔄 Yenile' }}
          </button>
        </div>
      </div>

      <!-- Orders Grid -->
      <div v-if="loading && orders.length === 0" class="loading-state">
        <p>Siparişler yükleniyor...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Henüz aktif sipariş yok</h3>
        <p>Müşterilerden gelen aktif siparişler burada görünecek</p>
      </div>

      <div v-else class="orders-grid">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
          :class="[`status-${order.status}`]"
          @click="selectOrder(order)"
        >
          <div class="order-header">
            <div class="order-info">
              <h3 class="order-id">Sipariş #{{ order.id }}</h3>
              <p class="table-number">🪑 Masa {{ order.tableNumber || order.tableId || 'Bilinmiyor' }}</p>
            </div>
            <div class="order-status">
              <span :class="['status-badge', `status-${order.status}`]">
                {{ getStatusText(order.status) }}
              </span>
            </div>
          </div>

          <div class="order-items">
            <div class="items-preview">
              <span class="items-count">{{ order.items?.length || 0 }} ürün</span>
            </div>
            <div class="items-list">
              <div
                v-for="item in order.items?.slice(0, 2)"
                :key="item.id"
                class="item-preview"
              >
                {{ item.quantity }}x {{ item.name }}
              </div>
              <div v-if="order.items?.length > 2" class="more-items">
                +{{ order.items.length - 2 }} daha...
              </div>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-time">
              {{ order.createdAt || new Date(order.timestamp).toLocaleString('tr-TR') }}
            </div>
            <div v-if="order.note" class="order-note">
              📝 {{ order.note }}
            </div>
            <div class="order-actions" @click.stop>
              <PrintBill
                :order="order"
                :cafe-name="cafeName"
                :cafe-address="cafeAddress"
                :cafe-phone="cafePhone"
              />
              <ThermalPrint :order="order" />
              <button 
                @click="completeOrder(order.id)"
                class="complete-btn"
              >
                ✅ Tamamlandı
              </button>
            </div>
          </div>

          <!-- Notes Preview -->
          <div v-if="order.notes || order.customerNotes" class="order-notes">
            <div v-if="order.notes" class="note">
              <strong>Sipariş Notu:</strong> {{ order.notes }}
            </div>
            <div v-if="order.customerNotes" class="note">
              <strong>Ürün Notları:</strong> {{ order.customerNotes }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Order Detail Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="selectedOrder = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Sipariş Detayı</h2>
          <button @click="selectedOrder = null" class="close-btn">✖️</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h3>Sipariş Bilgileri</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Sipariş ID:</label>
                <span>{{ selectedOrder.id }}</span>
              </div>
                             <div class="detail-item">
                 <label>Masa:</label>
                 <span class="table-number-display">🪑 Masa {{ selectedOrder.tableNumber || selectedOrder.tableId }}</span>
               </div>
              <div class="detail-item">
                <label>Durum:</label>
                <span :class="['status-badge', `status-${selectedOrder.status}`]">
                  {{ getStatusText(selectedOrder.status) }}
                </span>
              </div>
              <div class="detail-item">
                <label>Zaman:</label>
                <span>{{ formatDateTime(selectedOrder.createdAt || selectedOrder.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Sipariş İçeriği</h3>
            <div class="items-detail">
              <div
                v-for="item in selectedOrder.items"
                :key="item.id"
                class="item-detail"
              >
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-quantity">{{ item.quantity }} adet</span>
                  <span class="item-price">₺{{ item.price * item.quantity }}</span>
                </div>
                <div v-if="item.notes" class="item-notes">
                  📝 {{ item.notes }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedOrder.note || selectedOrder.notes || selectedOrder.customerNotes" class="detail-section">
            <h3>Notlar</h3>
            <div v-if="selectedOrder.note" class="note-item">
              <strong>Müşteri Notu:</strong>
              <p>{{ selectedOrder.note }}</p>
            </div>
            <div v-if="selectedOrder.notes" class="note-item">
              <strong>Sipariş Notu:</strong>
              <p>{{ selectedOrder.notes }}</p>
            </div>
            <div v-if="selectedOrder.customerNotes" class="note-item">
              <strong>Ürün Notları:</strong>
              <p>{{ selectedOrder.customerNotes }}</p>
            </div>
          </div>

          <div class="detail-section">
            <div class="total-section">
              <strong>Toplam: ₺{{ selectedOrder.total }}</strong>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <PrintBill
            v-if="selectedOrder"
            :order="selectedOrder"
            :cafe-name="cafeName"
            :cafe-address="cafeAddress"
            :cafe-phone="cafePhone"
          />
          <ThermalPrint v-if="selectedOrder" :order="selectedOrder" />
          <button
            @click="openTransferModal(selectedOrder)"
            class="transfer-btn"
          >
            🔄 Masa Değiştir
          </button>
          <button
            @click="openPaymentModal(selectedOrder)"
            class="payment-btn"
          >
            💳 Ödeme Al
          </button>
          <button 
            @click="completeOrder(selectedOrder.id)"
            class="complete-btn large"
          >
            ✅ Sipariş Tamamlandı
          </button>
          <button @click="selectedOrder = null" class="close-modal-btn">
            Kapat
          </button>
        </div>
      </div>
    </div>

    <!-- Ödeme Alma Modalı -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal payment-modal">
        <div class="modal-header">
          <h2>💳 Ödeme Al</h2>
          <button @click="showPaymentModal = false" class="close-btn">✖️</button>
        </div>
        <div class="modal-body">
          <div class="payment-summary">
            <div class="payment-row">
              <span>Masa</span>
              <strong>🪑 Masa {{ paymentOrder?.tableNumber }}</strong>
            </div>
            <div class="payment-row">
              <span>Ara Toplam</span>
              <strong>₺{{ paymentOrder?.total }}</strong>
            </div>
            <div class="payment-row discount-row">
              <span>İndirim (₺)</span>
              <input v-model.number="paymentDiscount" type="number" min="0" class="discount-input" placeholder="0" />
            </div>
            <div class="payment-row total-row">
              <span>Ödenecek Tutar</span>
              <strong class="final-total">₺{{ finalPaymentTotal }}</strong>
            </div>
          </div>

          <div class="payment-methods">
            <p class="payment-method-label">Ödeme Yöntemi</p>
            <div class="method-buttons">
              <button
                v-for="m in paymentMethods"
                :key="m.value"
                @click="selectedPaymentMethod = m.value"
                :class="['method-btn', { active: selectedPaymentMethod === m.value }]"
              >
                {{ m.icon }} {{ m.label }}
              </button>
            </div>
          </div>

          <div class="form-group" style="margin-top:12px">
            <label style="font-size:0.85rem;color:#555">Not (opsiyonel)</label>
            <input v-model="paymentNote" type="text" class="payment-note-input" placeholder="Ödeme notu..." />
          </div>
        </div>
        <div class="modal-footer">
          <button
            @click="confirmPayment"
            class="complete-btn large"
            :disabled="!selectedPaymentMethod || paymentProcessing"
          >
            {{ paymentProcessing ? '⏳ İşleniyor...' : `✅ ₺${finalPaymentTotal} Tahsil Et` }}
          </button>
          <button @click="showPaymentModal = false" class="close-modal-btn">İptal</button>
        </div>
      </div>
    </div>

    <!-- Masa Değiştirme Modalı -->
    <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
      <div class="modal transfer-modal">
        <div class="modal-header">
          <h2>🔄 Masa Değiştir</h2>
          <button @click="showTransferModal = false" class="close-btn">✖️</button>
        </div>
        <div class="modal-body">
          <div class="transfer-info">
            <div class="transfer-from">
              <span class="transfer-label">Mevcut Masa</span>
              <span class="transfer-table from">🪑 Masa {{ transferFromTable }}</span>
              <span class="transfer-count">{{ transferOrderCount }} aktif sipariş</span>
            </div>
            <div class="transfer-arrow">→</div>
            <div class="transfer-to">
              <span class="transfer-label">Yeni Masa</span>
              <select v-model="transferToTable" class="transfer-select">
                <option value="">Masa seçin...</option>
                <option
                  v-for="n in 20"
                  :key="n"
                  :value="n"
                  :disabled="n === transferFromTable"
                >
                  Masa {{ n }} {{ n === transferFromTable ? '(mevcut)' : '' }}
                </option>
              </select>
            </div>
          </div>

          <div class="transfer-warning">
            ⚠️ Bu işlem Masa {{ transferFromTable }}'deki tüm aktif siparişleri seçilen masaya taşır.
            Raporlarda yeni masa numarası görünür.
          </div>

          <p v-if="transferError" class="transfer-error">❌ {{ transferError }}</p>
        </div>
        <div class="modal-footer">
          <button
            @click="confirmTransfer"
            class="complete-btn large"
            :disabled="!transferToTable || transferring"
          >
            {{ transferring ? '⏳ Taşınıyor...' : '✅ Masayı Değiştir' }}
          </button>
          <button @click="showTransferModal = false" class="close-modal-btn">İptal</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'
import PrintBill from '@/components/common/PrintBill.vue'
import ThermalPrint from '@/components/common/ThermalPrint.vue'
import socketService from '@/services/socket.js'

export default {
  name: 'OrdersView',
  components: {
    NavigationSidebar,
    PrintBill,
    ThermalPrint
  },
  data() {
    return {
      orders: [],
      selectedOrder: null,
      loading: false,
      refreshInterval: null,
      // Kafe bilgileri — Settings sayfasından veya buradan düzenlenebilir
      cafeName: localStorage.getItem('cafeName') || 'Kafe Sipariş',
      cafeAddress: localStorage.getItem('cafeAddress') || '',
      cafePhone: localStorage.getItem('cafePhone') || '',
      // Masa değiştirme
      showTransferModal: false,
      transferFromTable: null,
      transferToTable: '',
      transferOrderCount: 0,
      transferring: false,
      transferError: '',
      // Ödeme alma
      showPaymentModal: false,
      paymentOrder: null,
      selectedPaymentMethod: 'cash',
      paymentDiscount: 0,
      paymentNote: '',
      paymentProcessing: false,
      paymentMethods: [
        { value: 'cash', icon: '💵', label: 'Nakit' },
        { value: 'card', icon: '💳', label: 'Kart' },
        { value: 'transfer', icon: '📱', label: 'Havale/EFT' },
        { value: 'mixed', icon: '🔀', label: 'Karma' }
      ]
    }
  },
  computed: {
    filteredOrders() {
      return this.orders.filter(order => order.status !== 'completed')
    },
    finalPaymentTotal() {
      const total = parseFloat(this.paymentOrder?.total || 0)
      const discount = parseFloat(this.paymentDiscount || 0)
      return Math.max(0, total - discount).toFixed(2)
    }
  },
  async mounted() {
    await this.loadOrders()
    this.connectSocket()
    // Yedek polling — socket yokken 30sn (daha seyrek)
    this.refreshInterval = setInterval(async () => {
      if (!this.$socketService?.isConnected()) await this.loadOrders()
    }, 30000)
  },
  beforeUnmount() {
    this.stopAutoRefresh()
    if (this._socketUnsubs) this._socketUnsubs.forEach(fn => fn())
  },
  methods: {
    async loadOrders() {
      try {
        this.loading = true
        
        // Backend'den siparişleri al
        try {
          const response = await axios.get('http://localhost:3000/api/orders')
          if (response.data.success) {
            this.orders = response.data.data || []
            console.log('✅ Backend\'den siparişler yüklendi:', this.orders.length, 'sipariş')
          } else {
            console.log('⚠️ Backend response başarısız:', response.data)
            // Fallback olarak localStorage kullan
            const localOrders = JSON.parse(localStorage.getItem('orders') || '[]')
            this.orders = localOrders
            console.log('✅ localStorage\'dan siparişler yüklendi:', this.orders.length, 'sipariş')
          }
        } catch (apiError) {
          console.log('⚠️ Backend API hatası:', apiError.message)
          // Fallback olarak localStorage kullan
          const localOrders = JSON.parse(localStorage.getItem('orders') || '[]')
          this.orders = localOrders
          console.log('✅ localStorage\'dan siparişler yüklendi:', this.orders.length, 'sipariş')
        }
        
        // Her siparişin masa numarasını kontrol et
        this.orders.forEach((order, index) => {
          console.log(`📋 Sipariş ${index + 1}: ID=${order.id}, Masa=${order.tableNumber || order.tableId}, Durum=${order.status}`)
        })
      } catch (error) {
        console.error('❌ Siparişler yüklenemedi:', error.message)
        this.orders = []
      } finally {
        this.loading = false
      }
    },
    
    async refreshOrders() {
      await this.loadOrders()
    },
    
    startAutoRefresh() {
      // Yedek polling — socket bağlıyken çalışmaz
    },
    
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },

    connectSocket() {
      this.$socketService = socketService
      socketService.connect()

      const u1 = socketService.onNewOrder((order) => {
        if (!this.orders.find(o => o.id === order.id)) {
          this.orders.unshift({ ...order })
        }
      })

      const u2 = socketService.onOrderUpdated(({ id, status }) => {
        const idx = this.orders.findIndex(o => o.id === id)
        if (idx !== -1) {
          if (status === 'completed') {
            this.orders.splice(idx, 1)
            if (this.selectedOrder?.id === id) this.selectedOrder = null
          } else {
            this.orders[idx].status = status
            if (this.selectedOrder?.id === id) this.selectedOrder.status = status
          }
        }
      })

      const u3 = socketService.onTableUpdate(() => {
        this.loadOrders()
      })

      this._socketUnsubs = [u1, u2, u3]
    },
    
    async completeOrder(orderId) {
      if (confirm('Bu siparişi tamamlandı olarak işaretlemek istediğinize emin misiniz?')) {
        await this.updateOrderStatus(orderId, 'completed')
        // Modal açıksa kapat
        if (this.selectedOrder) {
          this.selectedOrder = null
        }
      }
    },
    
    async updateOrderStatus(orderId, newStatus) {
      try {
        // Vardiya kontrolü - sadece çalışanlar için
        if (this.$store.getters['auth/isEmployee']) {
          const isShiftActive = this.$store.getters['shifts/isShiftActive'];
          if (!isShiftActive) {
            alert('❌ Vardiya başlatmadan sipariş işlemi yapamazsınız!');
            return;
          }
        }

        // Sipariş nesnesini bul
        const order = this.orders.find(o => o.id === orderId)
        
        if (!order) {
          console.log('⚠️ Sipariş bulunamadı:', orderId)
          return
        }
        
        // Eğer sipariş tamamlanıyorsa completed_at tarihini ekle ve süre hesapla
        if (newStatus === 'completed') {
          const startTime = new Date(order.timestamp || order.createdAt || order.created_at)
          const endTime = new Date()
          const duration = Math.round((endTime - startTime) / 1000 / 60) // dakika cinsinden
          
          order.completed_at = endTime.toISOString()
          order.completedAt = endTime.toLocaleString('tr-TR')
          order.duration = duration
          
          // Tamamlanan siparişi raporlara kaydet
          const completedOrder = {
            ...order,
            type: 'order',
            completedAt: endTime.toISOString(),
            duration: duration
          }
          
          const reports = JSON.parse(localStorage.getItem('completedReports') || '[]')
          reports.unshift(completedOrder)
          localStorage.setItem('completedReports', JSON.stringify(reports))
          
          // Custom event tetikle
          window.dispatchEvent(new CustomEvent('localStorageChange', {
            detail: { key: 'completedReports', value: reports }
          }))
          
          console.log(`✅ Sipariş tamamlandı ve raporlara kaydedildi: ${duration} dakika`)
          console.log('📊 Toplam tamamlanan sipariş sayısı:', reports.length)
        }
        
        // Backend'e güncelleme gönder
        try {
          // Mevcut kullanıcı bilgilerini al
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
          
          const response = await axios.put(`http://localhost:3000/api/orders/${orderId}`, {
            status: newStatus,
            completed_at: newStatus === 'completed' ? order.completed_at : null,
            duration: newStatus === 'completed' ? order.duration : null,
            employeeId: newStatus === 'completed' ? currentUser.id : null,
            employeeName: newStatus === 'completed' ? currentUser.name : null
          })
          
          if (response.data.success) {
            console.log('✅ Backend\'de sipariş durumu güncellendi')
            if (newStatus === 'completed') {
              console.log('👤 Çalışan bilgileri eklendi:', currentUser.name)
            }
          }
        } catch (apiError) {
          console.log('⚠️ Backend güncelleme başarısız:', apiError.message)
        }
        
        // Local state'i güncelle
        const localOrderIndex = this.orders.findIndex(o => o.id === orderId)
        if (localOrderIndex > -1) {
          this.orders[localOrderIndex].status = newStatus
          if (newStatus === 'completed') {
            this.orders[localOrderIndex].completed_at = order.completed_at
            this.orders[localOrderIndex].completedAt = order.completedAt
            this.orders[localOrderIndex].duration = order.duration
          }
        }
        
        // Modal'daki seçili siparişi güncelle
        if (this.selectedOrder && this.selectedOrder.id === orderId) {
          this.selectedOrder.status = newStatus
          if (newStatus === 'completed') {
            this.selectedOrder.completed_at = order.completed_at
            this.selectedOrder.completedAt = order.completedAt
            this.selectedOrder.duration = order.duration
          }
        }
        
        console.log('✅ Sipariş durumu güncellendi:', orderId, newStatus)
      } catch (error) {
        console.error('❌ Sipariş güncellenemedi:', error)
      }
    },
    
    selectOrder(order) {
      this.selectedOrder = order
    },
    
    getStatusText(status) {
      const statusMap = {
        pending: 'Bekleyen',
        preparing: 'Hazırlanıyor',
        ready: 'Hazır',
        completed: 'Tamamlandı',
        cancelled: 'İptal'
      }
      return statusMap[status] || status
    },
    
    formatTime(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },
    
    formatDateTime(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },

    // ---- ÖDEME ALMA ----
    openPaymentModal(order) {
      this.paymentOrder = order
      this.selectedPaymentMethod = 'cash'
      this.paymentDiscount = 0
      this.paymentNote = ''
      this.showPaymentModal = true
    },

    async confirmPayment() {
      if (!this.selectedPaymentMethod || !this.paymentOrder) return
      this.paymentProcessing = true
      try {
        const response = await axios.post(
          `http://localhost:3000/api/orders/${this.paymentOrder.id}/payment`,
          {
            paymentMethod: this.selectedPaymentMethod,
            discount: this.paymentDiscount,
            notes: this.paymentNote
          }
        )
        if (response.data.success) {
          // Local state güncelle
          const idx = this.orders.findIndex(o => o.id === this.paymentOrder.id)
          if (idx > -1) {
            this.orders[idx].status = 'completed'
            this.orders[idx].paymentMethod = this.selectedPaymentMethod
            this.orders[idx].finalTotal = this.finalPaymentTotal
          }
          this.showPaymentModal = false
          this.selectedOrder = null
          alert(`✅ Ödeme alındı!\n₺${this.finalPaymentTotal} — ${this.paymentMethods.find(m => m.value === this.selectedPaymentMethod)?.label}`)
        }
      } catch (e) {
        alert('❌ Ödeme kaydedilemedi: ' + (e.response?.data?.message || e.message))
      } finally {
        this.paymentProcessing = false
      }
    },

    // ---- MASA DEĞİŞTİRME ----
    openTransferModal(order) {
      const tableNum = order.tableNumber || order.tableId
      this.transferFromTable = parseInt(tableNum)
      this.transferToTable = ''
      this.transferError = ''
      // O masadaki aktif sipariş sayısını hesapla
      this.transferOrderCount = this.orders.filter(o =>
        (o.tableNumber === this.transferFromTable || o.tableNumber === String(this.transferFromTable)) &&
        o.status !== 'completed' && o.status !== 'cancelled'
      ).length
      this.showTransferModal = true
    },

    async confirmTransfer() {
      if (!this.transferToTable) return
      this.transferring = true
      this.transferError = ''

      try {
        const response = await axios.post('http://localhost:3000/api/orders/transfer-table', {
          fromTable: this.transferFromTable,
          toTable: parseInt(this.transferToTable)
        })

        if (response.data.success) {
          // Local state'i güncelle — tüm aktif siparişlerin masa numarasını değiştir
          this.orders.forEach(order => {
            if (
              (order.tableNumber === this.transferFromTable ||
               order.tableNumber === String(this.transferFromTable)) &&
              order.status !== 'completed' && order.status !== 'cancelled'
            ) {
              order.tableNumber = parseInt(this.transferToTable)
              order.tableId = parseInt(this.transferToTable)
            }
          })

          // Seçili siparişi de güncelle
          if (this.selectedOrder) {
            this.selectedOrder.tableNumber = parseInt(this.transferToTable)
            this.selectedOrder.tableId = parseInt(this.transferToTable)
          }

          this.showTransferModal = false
          alert(`✅ ${response.data.message}`)
        } else {
          this.transferError = response.data.message
        }
      } catch (error) {
        this.transferError = error.response?.data?.message || 'Masa değiştirme başarısız'
      } finally {
        this.transferring = false
      }
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
  background: #f8f9fa;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h1 {
  font-size: 2rem;
  font-weight: bold;
  color: var(--gray-800);
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  background: white;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.refresh-btn:hover {
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-500);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.order-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid var(--gray-200);
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
}

.order-card.status-pending {
  border-left-color: var(--warning);
}

.order-card.status-preparing {
  border-left-color: var(--primary-light);
}

.order-card.status-ready {
  border-left-color: var(--success);
}

.order-card.status-completed {
  border-left-color: var(--gray-500);
}

.order-card.status-cancelled {
  border-left-color: var(--danger);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.order-id {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
}

.table-number {
  color: var(--primary-light);
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--primary-xlight);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  display: inline-block;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-pending {
  background-color: var(--warning-light);
  color: var(--accent-gold-dark);
}

.status-badge.status-preparing {
  background-color: var(--primary-xlight);
  color: var(--primary);
}

.status-badge.status-ready {
  background-color: var(--success-light);
  color: var(--success);
}

.status-badge.status-completed {
  background-color: var(--gray-100);
  color: var(--gray-600);
}

.status-badge.status-cancelled {
  background-color: var(--danger-light);
  color: var(--danger);
}

.order-items {
  margin-bottom: 1rem;
}

.items-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.items-count {
  color: var(--gray-500);
  font-size: 0.875rem;
}

.total-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--primary-light);
}

.items-list {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.item-preview {
  margin-bottom: 0.25rem;
}

.more-items {
  font-style: italic;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.order-time {
  color: var(--gray-500);
  font-size: 0.875rem;
}

.status-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.status-select.large {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.order-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.note {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: 0.5rem;
}

.note strong {
  color: var(--gray-700);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--gray-800);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--gray-500);
  padding: 0.5rem;
}

.modal-body {
  padding: 2rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  color: var(--gray-500);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.items-detail {
  margin-bottom: 1rem;
}

.item-detail {
  padding: 1rem;
  background-color: var(--gray-50);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-name {
  font-weight: 600;
}

.item-quantity {
  color: var(--gray-500);
}

.item-price {
  font-weight: bold;
  color: var(--primary-light);
}

.item-notes {
  font-size: 0.875rem;
  color: var(--warning);
  font-style: italic;
}

.note-item {
  margin-bottom: 1rem;
}

.note-item strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--gray-700);
}

.note-item p {
  color: var(--gray-500);
  line-height: 1.5;
}

.total-section {
  text-align: right;
  font-size: 1.25rem;
  color: var(--gray-800);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--gray-200);
}

.complete-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--success) 0%, var(--success) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.complete-btn:hover {
  transform: translateY(-1px);
}

.complete-btn.large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.close-modal-btn {
  padding: 0.5rem 1rem;
  background-color: var(--gray-500);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.table-number-display {
  color: var(--primary-light);
  font-weight: 600;
  background: var(--primary-xlight);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  display: inline-block;
}

/* ---- ÖDEME ALMA ---- */
.payment-btn {
  background: linear-gradient(135deg, var(--success), var(--success));
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.payment-btn:hover { background: linear-gradient(135deg, var(--success), #166534); transform: translateY(-1px); }

.payment-modal { max-width: 440px; }

.payment-summary {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.95rem;
}
.payment-row:last-child { border-bottom: none; }
.discount-row input { width: 80px; }
.total-row { font-size: 1.05rem; }
.final-total { font-size: 1.3rem; color: var(--success); }

.discount-input {
  width: 80px;
  padding: 4px 8px;
  border: 1.5px solid var(--gray-200);
  border-radius: 6px;
  text-align: right;
  font-size: 0.9rem;
  outline: none;
}
.discount-input:focus { border-color: var(--success); }

.payment-method-label { font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 10px; }
.method-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.method-btn {
  padding: 12px;
  border: 2px solid var(--gray-200);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}
.method-btn:hover { border-color: var(--success); background: #f0fdf4; }
.method-btn.active { border-color: var(--success); background: #dcfce7; color: #166534; font-weight: 700; }

.payment-note-input {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid var(--gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  margin-top: 6px;
}

/* ---- MASA DEĞİŞTİRME ---- */
.transfer-btn {
  background: linear-gradient(135deg, var(--warning), var(--accent-gold-dark));
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.transfer-btn:hover {
  background: linear-gradient(135deg, var(--accent-gold-dark), #b45309);
  transform: translateY(-1px);
}

.transfer-modal {
  max-width: 480px;
}

.transfer-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.transfer-from,
.transfer-to {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transfer-label {
  font-size: 0.75rem;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.transfer-table {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gray-800);
}

.transfer-table.from {
  color: var(--danger);
}

.transfer-count {
  font-size: 0.8rem;
  color: var(--gray-500);
}

.transfer-arrow {
  font-size: 1.5rem;
  color: var(--gray-400);
  font-weight: bold;
}

.transfer-select {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid var(--gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  cursor: pointer;
}
.transfer-select:focus {
  border-color: var(--warning);
}

.transfer-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #92400e;
  margin-bottom: 12px;
}

.transfer-error {
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: 8px;
}
</style>
