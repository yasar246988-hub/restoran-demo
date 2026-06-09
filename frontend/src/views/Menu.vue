<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <NavigationSidebar />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1>🍽️ Menü Yönetimi</h1>
        <div class="header-actions">
          <!-- Stok özeti -->
          <div class="stock-summary">
            <span class="stock-ok">✅ {{ inStockCount }} mevcut</span>
            <span v-if="outOfStockCount > 0" class="stock-empty">🚫 {{ outOfStockCount }} tükendi</span>
          </div>
          <!-- KDV Toggle -->
          <div class="kdv-toggle-wrap" title="KDV gösterimini aç/kapat">
            <span class="kdv-label">KDV %{{ kdvRate }}</span>
            <label class="stock-switch">
              <input type="checkbox" v-model="kdvEnabled" @change="saveKdvSetting" />
              <span class="stock-slider" :class="kdvEnabled ? 'slider-on' : 'slider-off'"></span>
            </label>
          </div>
          <button @click="showAddModal = true" class="add-btn">➕ Yeni Ürün Ekle</button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="activeCategory = category.id"
          :class="['category-tab', { active: activeCategory === category.id }]"
        >
          {{ category.icon }} {{ category.name }}
        </button>
      </div>

      <!-- Menu Items Grid -->
      <div class="menu-grid">
        <div
          v-for="item in filteredMenuItems"
          :key="item.id"
          :class="['menu-item', { 'out-of-stock': !item.available }]"
        >
          <!-- Stokta yok overlay -->
          <div v-if="!item.available" class="out-of-stock-overlay">
            <div class="out-of-stock-label">
              <span class="oos-icon">🚫</span>
              <span>STOKTA YOK</span>
            </div>
          </div>

          <div class="item-image">
            <img :src="item.image" :alt="item.name" @error="e => e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=60'" />
            <div :class="['stock-badge', item.available ? 'badge-in' : 'badge-out']">
              {{ item.available ? '✅ Mevcut' : '🚫 Tükendi' }}
            </div>
          </div>
          
          <div class="item-content">
            <div class="item-name-row">
              <h3 :class="{ 'item-name-dimmed': !item.available }">{{ item.name }}</h3>
              <!-- Stok toggle switch -->
              <label class="stock-switch" :title="item.available ? 'Stokta var — tıkla tükenince işaretle' : 'Tükendi — tıkla yeniden aktif et'">
                <input type="checkbox" :checked="item.available" @change="toggleAvailability(item)" />
                <span class="stock-slider" :class="item.available ? 'slider-on' : 'slider-off'"></span>
              </label>
            </div>
            <p class="description">{{ item.description }}</p>
            <div class="price-row">
              <div class="price">₺{{ item.price.toFixed(2) }}</div>
              <div v-if="kdvEnabled" class="price-kdv">
                KDV dahil: ₺{{ (item.price * (1 + kdvRate / 100)).toFixed(2) }}
              </div>
            </div>
            
            <div class="item-actions">
              <button @click="editItem(item)" class="edit-btn">✏️ Düzenle</button>
              <button 
                @click="toggleAvailability(item)" 
                :class="['toggle-btn', item.available ? 'btn-in-stock' : 'btn-out-stock']"
              >
                {{ item.available ? '🚫 Tükendi İşaretle' : '✅ Yeniden Aktif' }}
              </button>
              <button @click="deleteItem(item)" class="delete-btn">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredMenuItems.length === 0" class="empty-state">
        <p>Bu kategoride henüz ürün bulunmuyor.</p>
        <button @click="showAddModal = true" class="add-btn">
          İlk ürünü ekleyin
        </button>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ showAddModal ? '➕ Yeni Ürün Ekle' : '✏️ Ürün Düzenle' }}</h2>
          <button @click="closeModals" class="close-btn">✖️</button>
        </div>
        
        <form @submit.prevent="saveItem" class="modal-body">
          <div class="form-group">
            <label>Ürün Adı</label>
            <input 
              v-model="formData.name" 
              type="text" 
              required 
              placeholder="Örn: Türk Kahvesi"
            />
          </div>
          
          <div class="form-group">
            <label>Açıklama</label>
            <textarea 
              v-model="formData.description"
              placeholder="Ürün açıklaması..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Kategori</label>
              <select v-model="formData.categoryId" required>
                <option value="">Kategori Seçin</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Fiyat (₺)</label>
              <input 
                v-model="formData.price" 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>📷 Ürün Resmi</label>
            <div class="image-input-container">
              <!-- Resim seçim yöntemi -->
              <div class="image-method-selector">
                <label class="method-option">
                  <input type="radio" v-model="imageMethod" value="url" />
                  🔗 URL ile
                </label>
                <label class="method-option">
                  <input type="radio" v-model="imageMethod" value="file" />
                  📁 Dosya ile
                </label>
              </div>
              
              <!-- URL ile resim -->
              <div v-if="imageMethod === 'url'" class="url-input">
                <input 
                  v-model="formData.image" 
                  type="url" 
                  placeholder="https://example.com/image.jpg"
                />
                <small>🌐 İnternetten bir resim URL'si girin</small>
              </div>
              
              <!-- Dosya ile resim -->
              <div v-if="imageMethod === 'file'" class="file-input">
                <input 
                  type="file" 
                  @change="handleFileSelect"
                  accept="image/*"
                  ref="fileInput"
                />
                <small>📤 Cihazınızdan bir resim seçin</small>
              </div>
              
              <!-- Resim önizleme -->
              <div v-if="formData.image" class="image-preview">
                <img :src="formData.image" alt="Önizleme" />
                <button type="button" @click="clearImage" class="clear-image-btn">
                  ❌ Temizle
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.available" type="checkbox" />
              Stokta mevcut
            </label>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModals" class="cancel-btn">
              İptal
            </button>
            <button type="submit" class="save-btn" :disabled="loading">
              {{ loading ? 'Kaydediliyor...' : (showAddModal ? 'Ürün Ekle' : 'Güncelle') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'

export default {
  name: 'MenuView',
  components: {
    NavigationSidebar
  },
  data() {
    return {
      activeCategory: 1,
      showAddModal: false,
      showEditModal: false,
      editingItem: null,
      loading: false,
      imageMethod: 'url',
      formData: {
        name: '',
        description: '',
        categoryId: 1,
        price: 0,
        image: '',
        available: true
      },
      categories: [
        { id: 1, name: 'İçecekler', icon: '☕' },
        { id: 2, name: 'Yemekler', icon: '🍽️' },
        { id: 3, name: 'Tatlılar', icon: '🍰' },
        { id: 4, name: 'Atıştırmalıklar', icon: '🥨' }
      ],
      menuItems: [],
      // KDV
      kdvEnabled: false,
      kdvRate: 10
    }
  },
  computed: {
    filteredMenuItems() {
      return this.menuItems.filter(item => item.categoryId === this.activeCategory)
    },
    inStockCount() {
      return this.menuItems.filter(i => i.available !== false).length
    },
    outOfStockCount() {
      return this.menuItems.filter(i => i.available === false).length
    }
  },
  async mounted() {
    await this.loadMenu()
    await this.loadKdvSetting()
  },
  methods: {
    async loadMenu() {
      try {
        this.loading = true
        const response = await axios.get('http://localhost:3000/api/menu')
        if (response.data.success) {
          this.menuItems = response.data.data.map(item => ({
            id: item.id,
            categoryId: this.getCategoryId(item.category),
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.image || '/api/placeholder/300/200',
            available: item.available !== false
          }))
          console.log('✅ Admin menü yüklendi:', this.menuItems.length, 'ürün')
        }
      } catch (error) {
        console.error('❌ Backend bağlantı hatası:', error.message)
        // Fallback: Mevcut menuItems'ı koru
        if (this.menuItems.length === 0) {
          this.loadFallbackMenu()
        }
      } finally {
        this.loading = false
      }
    },
    
    loadFallbackMenu() {
      this.menuItems = [
        { id: 1, categoryId: 1, name: 'Türk Kahvesi', description: 'Geleneksel Türk kahvesi, lokumlu', price: 25.00, image: '/api/placeholder/300/200', available: true },
        { id: 2, categoryId: 1, name: 'Latte', description: 'Sıcak süt ile hazırlanmış espresso', price: 30.00, image: '/api/placeholder/300/200', available: true },
        { id: 3, categoryId: 2, name: 'Karışık Tost', description: 'Kaşar, sucuk, domates ve marul ile', price: 70.00, image: '/api/placeholder/300/200', available: true }
      ]
    },
    
    getCategoryId(categoryName) {
      const categoryMap = {
        'İçecekler': 1,
        'Yemekler': 2,
        'Tatlılar': 3,
        'Atıştırmalıklar': 4
      }
      return categoryMap[categoryName] || 1
    },
    
    getCategoryName(categoryId) {
      const categories = {
        1: 'İçecekler',
        2: 'Yemekler',
        3: 'Tatlılar',
        4: 'Atıştırmalıklar'
      }
      return categories[categoryId] || 'İçecekler'
    },
    
    editItem(item) {
      this.editingItem = item
      this.formData = { 
        name: item.name,
        description: item.description,
        categoryId: item.categoryId,
        price: item.price,
        image: item.image,
        available: item.available
      }
      this.showEditModal = true
    },
    
    async deleteItem(item) {
      if (confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`)) {
        try {
          const response = await axios.delete(`http://localhost:3000/api/menu/${item.id}`)
          if (response.data.success) {
            const index = this.menuItems.findIndex(i => i.id === item.id)
            if (index > -1) {
              this.menuItems.splice(index, 1)
            }
            alert('✅ Ürün başarıyla silindi!')
          }
        } catch (error) {
          console.error('❌ Backend hatası, sadece frontend\'den siliniyor:', error.message)
          const index = this.menuItems.findIndex(i => i.id === item.id)
          if (index > -1) {
            this.menuItems.splice(index, 1)
            alert('⚠️ Ürün geçici olarak silindi (Backend bağlantısı yok)')
          }
        }
      }
    },
    
    async toggleAvailability(item) {
      try {
        const response = await axios.put(`http://localhost:3000/api/menu/${item.id}`, {
          available: !item.available
        })
        if (response.data.success) {
          item.available = !item.available
        }
      } catch (error) {
        console.error('❌ Backend hatası, sadece frontend\'de güncelleniyor:', error.message)
        item.available = !item.available
      }
    },
    
    // Resim işleme methodları
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('❌ Dosya boyutu 5MB\'dan küçük olmalıdır')
          return
        }
        
        // Dosya tipini kontrol et
        if (!file.type.startsWith('image/')) {
          alert('❌ Lütfen bir resim dosyası seçin')
          return
        }
        
        try {
          // Loading durumunu göster
          this.loading = true
          
          // FormData oluştur
          const formData = new FormData()
          formData.append('image', file)
          
          // Backend'e yükle
          const response = await axios.post('http://localhost:3000/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          
          if (response.data.success) {
            this.formData.image = response.data.data.url
            console.log('✅ Dosya yüklendi:', response.data.data.url)
          } else {
            alert('❌ Dosya yüklenemedi: ' + response.data.message)
          }
        } catch (error) {
          console.error('❌ Dosya yükleme hatası:', error)
          alert('❌ Dosya yüklenirken hata oluştu')
        } finally {
          this.loading = false
        }
      }
    },
    
    clearImage() {
      this.formData.image = ''
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    
    async saveItem() {
      try {
        this.loading = true
        const itemData = {
          name: this.formData.name,
          description: this.formData.description,
          price: parseFloat(this.formData.price),
          category: this.getCategoryName(this.formData.categoryId),
          image: this.formData.image,
          available: this.formData.available
        }

        if (this.showAddModal) {
          try {
            const response = await axios.post('http://localhost:3000/api/menu', itemData)
            if (response.data.success) {
              const newItem = {
                ...itemData,
                id: response.data.data.id,
                categoryId: this.formData.categoryId
              }
              this.menuItems.push(newItem)
              alert('✅ Ürün başarıyla eklendi!')
            }
          } catch (error) {
            console.error('❌ Backend hatası, sadece frontend\'e ekleniyor:', error.message)
            const newItem = {
              ...itemData,
              id: Date.now(),
              categoryId: this.formData.categoryId
            }
            this.menuItems.push(newItem)
            alert('⚠️ Ürün geçici olarak eklendi (Backend bağlantısı yok)')
          }
        } else if (this.showEditModal) {
          try {
            const response = await axios.put(`http://localhost:3000/api/menu/${this.editingItem.id}`, itemData)
            if (response.data.success) {
              Object.assign(this.editingItem, {
                ...itemData,
                categoryId: this.formData.categoryId
              })
              alert('✅ Ürün başarıyla güncellendi!')
            }
          } catch (error) {
            console.error('❌ Backend hatası, sadece frontend\'de güncelleniyor:', error.message)
            Object.assign(this.editingItem, {
              ...itemData,
              categoryId: this.formData.categoryId
            })
            alert('⚠️ Ürün geçici olarak güncellendi (Backend bağlantısı yok)')
          }
        }
        
        this.closeModals()
      } catch (error) {
        console.error('Genel hata:', error)
        alert('Bir hata oluştu!')
      } finally {
        this.loading = false
      }
    },
    
    closeModals() {
      this.showAddModal = false
      this.showEditModal = false
      this.editingItem = null
      this.imageMethod = 'url' // Reset image method
      this.formData = {
        name: '',
        description: '',
        categoryId: 1,
        price: 0,
        image: '',
        available: true
      }
      // File input'u temizle
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },

    async loadKdvSetting() {
      try {
        const res = await axios.get('http://localhost:3000/api/tax/config')
        if (res.data.success) {
          this.kdvEnabled = res.data.data.enabled
          this.kdvRate = res.data.data.rate || 10
        }
      } catch { /* sessiz */ }
    },

    async saveKdvSetting() {
      try {
        const token = localStorage.getItem('token')
        await axios.put('http://localhost:3000/api/tax/config',
          { enabled: this.kdvEnabled, rate: this.kdvRate },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (e) {
        // Sessiz fail — ayar gösterimi yine çalışır
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
  background: var(--gray-50);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.stock-summary {
  display: flex;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stock-ok   { color: var(--success); background: var(--success-light); padding: 4px 10px; border-radius: 20px; }
.stock-empty { color: var(--danger);  background: var(--danger-light);  padding: 4px 10px; border-radius: 20px; }

.kdv-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-xlight);
  border: 1.5px solid var(--primary-border);
  padding: 6px 12px;
  border-radius: 20px;
}

.kdv-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--primary);
}

/* STOK SWITCH */
.stock-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  cursor: pointer;
  flex-shrink: 0;
}

.stock-switch input { display: none; }

.stock-slider {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  transition: background 0.25s;
}

.stock-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.25s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.slider-on  { background: var(--success); }
.slider-on::before  { transform: translateX(18px); }
.slider-off { background: var(--gray-300); }
.slider-off::before { transform: translateX(0); }

.add-btn {
  background: linear-gradient(135deg, var(--success) 0%, var(--success) 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.add-btn:hover {
  transform: translateY(-2px);
}

.category-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
}

.category-tab {
  padding: 0.75rem 1.5rem;
  background-color: var(--gray-200);
  color: var(--gray-500);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.category-tab.active {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-dark) 100%);
  color: white;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.menu-item {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.menu-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(15,45,92,0.12);
}

.menu-item.out-of-stock {
  border-color: var(--danger);
  opacity: 0.82;
}

/* STOKTA YOK OVERLAY */
.out-of-stock-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(185, 28, 28, 0.08);
  z-index: 2;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.out-of-stock-label {
  background: var(--danger);
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 0 0 8px 0;
}

.oos-icon { font-size: 0.9rem; }

.item-image {
  position: relative;
  height: 200px;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* STOK BADGE */
.stock-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.badge-in  { background: rgba(13,124,74,0.9);  color: white; }
.badge-out { background: rgba(185,28,28,0.9); color: white; }

.item-content {
  padding: 1.25rem 1.5rem;
}

.item-name-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}

.item-name-row h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gray-800);
  flex: 1;
}

.item-name-dimmed { color: var(--gray-400) !important; text-decoration: line-through; }

.description {
  color: var(--gray-500);
  font-size: 0.85rem;
  margin-bottom: 10px;
  line-height: 1.5;
}

.price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
.price { font-size: 1.35rem; font-weight: 800; color: var(--primary); }
.price-kdv { font-size: 0.78rem; color: var(--gray-400); }

.item-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.edit-btn, .toggle-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-btn { background: #fef3c7; color: #92400e; }
.edit-btn:hover { background: #fde68a; }

.btn-in-stock  { background: var(--danger-light); color: var(--danger); }
.btn-in-stock:hover  { background: var(--danger); color: white; }
.btn-out-stock { background: var(--success-light); color: var(--success); }
.btn-out-stock:hover { background: var(--success); color: white; }

.delete-btn { background: var(--gray-100); color: var(--gray-600); padding: 6px 10px; }
.delete-btn:hover { background: var(--danger); color: white; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-500);
}

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
  max-width: 500px;
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

/* Resim yükleme stilleri */
.image-input-container {
  margin-top: 0.5rem;
}

.image-method-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.method-option:hover {
  border-color: var(--primary-light);
}

.method-option input[type="radio"] {
  width: auto;
  margin: 0;
}

.method-option input[type="radio"]:checked + * {
  color: var(--primary-light);
  font-weight: 600;
}

.url-input, .file-input {
  margin-bottom: 1rem;
}

.url-input input {
  width: 100%;
}

.file-input input[type="file"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed var(--gray-300);
  border-radius: 0.5rem;
  background: var(--gray-50);
  cursor: pointer;
}

.file-input input[type="file"]:hover {
  border-color: var(--primary-light);
  background: var(--primary-xlight);
}

.image-preview {
  position: relative;
  margin-top: 1rem;
  display: inline-block;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 0.5rem;
  border: 2px solid var(--gray-200);
}

.clear-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-image-btn:hover {
  background: var(--danger);
}

.url-input small, .file-input small {
  display: block;
  color: var(--gray-500);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--gray-500);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
