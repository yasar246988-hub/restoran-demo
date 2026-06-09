<template>
  <div class="theme-settings">
    <div class="settings-header">
      <h2>🎨 QR Menü Tema Ayarları</h2>
      <p>Müşteri menü sayfası için tema ve görünüm özelleştirmeleri</p>
    </div>

    <div class="settings-body">
      
      <!-- Tema Seçimi -->
      <div class="section">
        <h3>Tema Seçimi</h3>
        <p class="section-desc">7 farklı tema arasından seçim yapın</p>
        
        <div class="theme-grid">
          <div
            v-for="theme in themes"
            :key="theme.id"
            :class="['theme-card', { active: activeTheme === theme.id }]"
            @click="selectTheme(theme.id)"
            :style="{ borderColor: theme.colors.primary }"
          >
            <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryLight})` }">
              <span class="theme-icon">{{ theme.icon }}</span>
            </div>
            <div class="theme-info">
              <h4>{{ theme.name }}</h4>
              <p>{{ theme.description }}</p>
              <div class="theme-colors">
                <span v-for="(color, key) in theme.colors" :key="key" 
                  :style="{ background: color }" 
                  class="color-dot"
                ></span>
              </div>
            </div>
            <div v-if="activeTheme === theme.id" class="selected-badge">✓ Seçili</div>
          </div>
        </div>
      </div>

      <!-- Sayfa Düzeni Seçimi (Seçilen Tema İçin) -->
      <div v-if="activeTheme" class="section">
        <h3>📐 Sayfa Düzeni Seçimi</h3>
        <p class="section-desc">Seçtiğiniz tema için 4 farklı sayfa düzeni arasından birini seçin</p>
        
        <div class="layout-grid">
          <div
            v-for="layout in pageLayouts"
            :key="layout.id"
            :class="['layout-card', { active: selectedLayout === layout.id }]"
            @click="selectLayout(layout.id)"
          >
            <div class="layout-icon-wrap">
              <span class="layout-icon-big">{{ layout.icon }}</span>
            </div>
            <div class="layout-details">
              <h4>{{ layout.name }}</h4>
              <p>{{ layout.description }}</p>
              <div class="layout-specs">
                <span class="spec-badge">{{ layout.columns === 'auto' ? 'Yatay Scroll' : layout.columns + ' Sütun' }}</span>
                <span class="spec-badge">Görsel: {{ layout.imageSize === 'xlarge' ? 'Çok Büyük' : layout.imageSize === 'large' ? 'Büyük' : layout.imageSize === 'medium' ? 'Orta' : 'Küçük' }}</span>
              </div>
            </div>
            <div v-if="selectedLayout === layout.id" class="selected-badge-layout">✓</div>
          </div>
        </div>
      </div>

      <!-- Özelleştirme -->
      <div class="section">
        <h3>Özelleştirme</h3>
        
        <!-- Logo Yükleme -->
        <div class="form-group">
          <label>Firma Logosu</label>
          <p class="help-text">QR menüde kafe adının yanında gösterilecek logo (Önerilen: 200x200px, PNG/JPG)</p>
          
          <div class="logo-upload-area">
            <div v-if="uploading" class="logo-uploading">
              <div class="spinner-upload"></div>
              <p>Logo yükleniyor...</p>
            </div>
            <div v-else-if="customization.logoUrl" class="logo-preview">
              <img :src="getLogoUrl(customization.logoUrl)" alt="Logo" />
              <button @click="deleteLogo" class="delete-logo-btn" type="button">🗑️ Logoyu Kaldır</button>
            </div>
            <div v-else class="logo-upload-placeholder">
              <input 
                type="file" 
                ref="logoInput"
                @change="handleLogoUpload" 
                accept="image/*"
                class="logo-file-input"
                id="logoInput"
              />
              <label for="logoInput" class="logo-upload-label">
                <span class="upload-icon">📷</span>
                <span>Logo Yükle</span>
                <span class="upload-hint">Tıklayın veya sürükleyin</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>Kafe Adı</label>
          <input v-model="customization.cafeName" type="text" class="form-input" placeholder="Kafe Adı" />
        </div>

        <div class="form-group">
          <label>Slogan</label>
          <input v-model="customization.cafeSlogan" type="text" class="form-input" placeholder="Slogan veya açıklama" />
        </div>


        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="customization.showPrices" type="checkbox" />
            <span>Fiyatları Göster</span>
          </label>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="customization.showImages" type="checkbox" />
            <span>Ürün Görsellerini Göster</span>
          </label>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="customization.enableSearch" type="checkbox" />
            <span>Arama Özelliğini Aktif Et</span>
          </label>
        </div>
      </div>

      <!-- Önizleme -->
      <div class="section">
        <h3>Önizleme</h3>
        <p class="section-desc">QR Menü sayfanızın canlı önizlemesi</p>
        
        <div class="preview-actions">
          <button @click="openPreview" class="btn-preview">
            📱 Tam Ekran Önizle
          </button>
          <button @click="generateQR" class="btn-qr">
            📲 QR Kod Oluştur
          </button>
        </div>

        <div class="qr-info">
          <p><strong>QR Menü URL:</strong></p>
          <div class="url-box">
            <code>{{ qrMenuUrl }}</code>
            <button @click="copyUrl" class="btn-copy">📋 Kopyala</button>
          </div>
        </div>
      </div>

      <!-- Kaydet -->
      <div class="save-actions">
        <button @click="saveSettings" :disabled="saving" class="btn-save">
          {{ saving ? '⏳ Kaydediliyor...' : '💾 Tema Ayarlarını Kaydet' }}
        </button>
        <button @click="resetSettings" class="btn-reset">
          🔄 Varsayılan Ayarlara Dön
        </button>
      </div>

    </div>
    
    <!-- QR Kod Modal -->
    <transition name="fade">
      <div v-if="showQRModal" class="qr-modal-overlay" @click.self="showQRModal = false">
        <div class="qr-modal">
          <div class="qr-modal-header">
            <h2>📲 QR Kod - Masa {{ qrTableNumber }}</h2>
            <button @click="showQRModal = false" class="close-qr-btn">✕</button>
          </div>
          
          <div class="qr-modal-body">
            <div class="qr-code-display" id="qr-code-container"></div>
            
            <div class="qr-info-box">
              <p class="qr-url">{{ qrCodeUrl }}</p>
              <p class="qr-hint">Müşteriler bu QR kodu okutarak menüye erişebilir</p>
            </div>
            
            <div class="qr-actions">
              <button @click="downloadQR" class="btn-download-qr">
                💾 İndir
              </button>
              <button @click="printQR" class="btn-print-qr">
                🖨️ Yazdır
              </button>
              <button @click="showQRModal = false" class="btn-close-qr">
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios'
import { getThemesList } from '@/components/QRMenuThemes.js'
import QRCode from 'qrcode'

// Backend API URL
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000'

export default {
  name: 'QRMenuThemeSettings',
  data() {
    return {
      themes: getThemesList(),
      activeTheme: 'modern',
      selectedLayout: 'grid', // Varsayılan layout
      pageLayouts: [
        {
          id: 'grid',
          name: 'Grid (Izgara)',
          description: 'Klasik kart düzeni - 2-3 sütun, büyük görseller',
          icon: '▦',
          columns: 2,
          imageSize: 'large'
        },
        {
          id: 'list',
          name: 'List (Liste)',
          description: 'Tek sütun liste - kompakt, detaylı açıklamalar',
          icon: '☰',
          columns: 1,
          imageSize: 'medium'
        },
        {
          id: 'masonry',
          name: 'Masonry (Duvar)',
          description: 'Pinterest tarzı düzensiz yükseklik - görsel ağırlıklı',
          icon: '⊞',
          columns: 2,
          imageSize: 'large'
        },
        {
          id: 'horizontal',
          name: 'Horizontal (Yatay)',
          description: 'Yatay kaydırmalı galeri - Instagram stories tarzı',
          icon: '⇄',
          columns: 'auto',
          imageSize: 'xlarge'
        }
      ],
      customization: {
        cafeName: 'Kafe',
        cafeSlogan: 'Lezzetli anlar için buradayız',
        logoUrl: null, // Logo URL'i
        showPrices: true,
        showImages: true,
        enableSearch: true
      },
      saving: false,
      uploading: false, // Logo yükleme durumu
      qrMenuUrl: window.location.origin + '/qr-menu?table=1',
      // QR Modal
      showQRModal: false,
      qrTableNumber: null,
      qrCodeUrl: ''
    }
  },

  async mounted() {
    await this.loadSettings()
  },

  methods: {
    async loadSettings() {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API_URL}/api/qr-menu/theme`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.data.success) {
          this.activeTheme = res.data.data.activeTheme || 'modern'
          this.selectedLayout = res.data.data.selectedLayout || 'grid'
          this.customization = { ...this.customization, ...res.data.data.customization }
        }
      } catch (e) {
        console.error('Tema ayarları yüklenemedi:', e.message)
      }
    },

    selectTheme(themeId) {
      this.activeTheme = themeId
      // İlk tema seçiminde varsayılan layout'u ayarla (eğer henüz seçilmemişse)
      if (!this.selectedLayout || this.selectedLayout === 'grid') {
        this.selectedLayout = 'grid' // Her tema için grid varsayılan
      }
    },
    
    selectLayout(layoutId) {
      this.selectedLayout = layoutId
    },
    
    getLogoUrl(url) {
      if (!url) return null
      if (url.startsWith('http')) return url
      return API_URL + url
    },
    
    async handleLogoUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      // Dosya boyutu kontrolü (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('❌ Logo dosyası 2MB\'dan küçük olmalıdır')
        return
      }
      
      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        alert('❌ Sadece resim dosyaları yüklenebilir')
        return
      }
      
      this.uploading = true
      
      try {
        const formData = new FormData()
        formData.append('logo', file)
        
        const token = localStorage.getItem('token')
        const res = await axios.post(`${API_URL}/api/qr-menu/upload-logo`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (res.data.success) {
          this.customization.logoUrl = res.data.data.logoUrl
          alert('✅ Logo başarıyla yüklendi!')
          // Sayfayı yenile (logo önizlemesi için)
          await this.loadSettings()
        }
      } catch (e) {
        alert('❌ Logo yükleme hatası: ' + (e.response?.data?.message || e.message))
      } finally {
        this.uploading = false
        // Input'u temizle
        if (this.$refs.logoInput) {
          this.$refs.logoInput.value = ''
        }
      }
    },
    
    async deleteLogo() {
      if (!confirm('Logoyu kaldırmak istediğinizden emin misiniz?')) return
      
      try {
        const token = localStorage.getItem('token')
        const res = await axios.delete(`${API_URL}/api/qr-menu/delete-logo`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.data.success) {
          this.customization.logoUrl = null
          alert('✅ Logo başarıyla kaldırıldı!')
        }
      } catch (e) {
        alert('❌ Logo kaldırma hatası: ' + (e.response?.data?.message || e.message))
      }
    },
    
    getLayoutIcon(layoutId) {
      const icons = {
        grid: '▦ Grid',
        list: '☰ Liste',
        masonry: '⊞ Masonry',
        horizontal: '⇄ Yatay'
      }
      return icons[layoutId] || layoutId
    },
    
    getCategoryEmoji(cat) {
      const emojis = {
        'İçecekler': '☕',
        'Kahveler': '☕',
        'Çaylar': '🍵',
        'Tatlılar': '🍰',
        'Pastalar': '🎂',
        'Dondurma': '🍨',
        'Yemekler': '🍽️',
        'Ana Yemekler': '🍽️',
        'Başlangıçlar': '🥙',
        'Atıştırmalıklar': '🍟',
        'Aperatifler': '🥨',
        'Salatalar': '🥗',
        'Çorbalar': '🍲',
        'Kahvaltı': '🥐',
        'Pizzalar': '🍕',
        'Burgerler': '🍔',
        'Makarnalar': '🍝',
        'default': '📄'
      }
      return emojis[cat] || '🍴'
    },

    async saveSettings() {
      if (this.saving) return
      this.saving = true

      try {
        const token = localStorage.getItem('token')
        const res = await axios.put(`${API_URL}/api/qr-menu/theme`, {
          activeTheme: this.activeTheme,
          selectedLayout: this.selectedLayout, // Layout'u da kaydet
          customization: this.customization
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.data.success) {
          alert('✅ QR Menü tema ve sayfa düzeni ayarları başarıyla kaydedildi!')
        }
      } catch (e) {
        alert('❌ Kaydetme hatası: ' + (e.response?.data?.message || e.message))
      } finally {
        this.saving = false
      }
    },

    resetSettings() {
      if (confirm('Tüm özelleştirmeler sıfırlanacak. Devam etmek istiyor musunuz?')) {
        this.activeTheme = 'modern'
        this.selectedLayout = 'grid'
        this.customization = {
          cafeName: 'Kafe',
          cafeSlogan: 'Lezzetli anlar için buradayız',
          showPrices: true,
          showImages: true,
          enableSearch: true
        }
      }
    },

    openPreview() {
      window.open('/qr-menu?table=1', '_blank')
    },

    generateQR() {
      // Masa numarası sor
      const tableNumber = prompt('QR Kod oluşturmak istediğiniz masa numarasını girin:', '1')
      
      if (!tableNumber) {
        return // İptal edildi
      }
      
      // Sayı kontrolü
      if (isNaN(parseInt(tableNumber)) || parseInt(tableNumber) < 1) {
        alert('❌ Geçerli bir masa numarası girin (örn: 1, 2, 3...)')
        return
      }
      
      // QR kod URL'i oluştur
      const qrUrl = `${window.location.origin}/qr-menu?table=${tableNumber}`
      
      // QR kodu yeni sekmede aç veya indir
      this.showQRModal = true
      this.qrTableNumber = tableNumber
      this.qrCodeUrl = qrUrl
      
      // QR kodu oluştur
      this.$nextTick(() => {
        this.generateQRCodeImage()
      })
    },
    
    generateQRCodeImage() {
      // QR kod oluşturma (qrcode paketi kullanarak)
      const qrContainer = document.getElementById('qr-code-container')
      if (!qrContainer) return
      
      // Önceki QR'ı temizle
      qrContainer.innerHTML = ''
      
      // Canvas oluştur
      const canvas = document.createElement('canvas')
      qrContainer.appendChild(canvas)
      
      // QR kod oluştur
      QRCode.toCanvas(canvas, this.qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).catch(error => {
        console.error('QR Code oluşturma hatası:', error)
        // Hata durumunda Google Charts API kullan
        qrContainer.innerHTML = ''
        const img = document.createElement('img')
        img.src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(this.qrCodeUrl)}`
        img.alt = 'QR Code'
        img.style.width = '100%'
        img.style.height = 'auto'
        qrContainer.appendChild(img)
      })
    },
    
    downloadQR() {
      // QR kodu indir
      const qrContainer = document.getElementById('qr-code-container')
      const img = qrContainer?.querySelector('img')
      
      if (!img) {
        alert('❌ QR kod bulunamadı')
        return
      }
      
      // Download linki oluştur
      const link = document.createElement('a')
      link.download = `masa-${this.qrTableNumber}-qr.png`
      link.href = img.src
      link.click()
    },
    
    printQR() {
      // QR kodu yazdır
      const printWindow = window.open('', '', 'width=600,height=600')
      printWindow.document.write(`
        <html>
          <head>
            <title>Masa ${this.qrTableNumber} - QR Kod</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center;
                padding: 40px;
                font-family: Arial, sans-serif;
              }
              h1 { 
                font-size: 32px; 
                margin-bottom: 20px;
                color: #333;
              }
              img { 
                width: 400px; 
                height: 400px;
                border: 2px solid #ddd;
                padding: 20px;
                background: white;
              }
              p {
                margin-top: 20px;
                font-size: 18px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>Masa ${this.qrTableNumber}</h1>
            ${document.getElementById('qr-code-container').innerHTML}
            <p>${this.customization.cafeName || 'Kafe'}</p>
            <p style="font-size: 14px; color: #999;">${this.qrCodeUrl}</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    },

    copyUrl() {
      navigator.clipboard.writeText(this.qrMenuUrl)
      alert('📋 URL kopyalandı!')
    }
  }
}
</script>

<style scoped>
.theme-settings {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 0.5rem;
}

.settings-header p {
  color: var(--gray-600);
  font-size: 0.95rem;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.section h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 0.5rem;
}

.section-desc {
  color: var(--gray-600);
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
}

/* Tema Grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Layout Grid */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}

.layout-card {
  border: 3px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.layout-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.layout-card.active {
  border-width: 3px;
  border-color: var(--primary);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  background: var(--primary-xlight);
}

.layout-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.layout-card:hover .layout-icon-wrap {
  transform: scale(1.1) rotate(5deg);
}

.layout-card.active .layout-icon-wrap {
  background: var(--gradient-success);
}

.layout-icon-big {
  font-size: 2.5rem;
  color: white;
}

.layout-details {
  flex: 1;
}

.layout-details h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}

.layout-details p {
  font-size: 0.85rem;
  color: var(--gray-600);
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

.layout-specs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.75rem;
}

.spec-badge {
  background: var(--gray-100);
  color: var(--gray-700);
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.layout-card.active .spec-badge {
  background: var(--primary-light);
  color: white;
}

.selected-badge-layout {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--success);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.theme-card {
  border: 3px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.theme-card.active {
  border-width: 3px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.theme-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.theme-icon {
  font-size: 3rem;
}

.theme-info {
  padding: 1rem;
}

.theme-info h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 0.3rem;
}

.theme-info p {
  font-size: 0.82rem;
  color: var(--gray-600);
  margin-bottom: 0.75rem;
}

.theme-colors {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.theme-layouts {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--gray-100);
}

.layout-info small {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-600);
  margin-bottom: 6px;
  font-weight: 600;
}

.layout-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.layout-tag {
  background: var(--gray-100);
  color: var(--gray-700);
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--success);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

/* Form */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.help-text {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

/* Logo Upload */
.logo-upload-area {
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  text-align: center;
  background: var(--gray-50);
  transition: all 0.3s;
}

.logo-upload-area:hover {
  border-color: var(--primary);
  background: var(--primary-xlight);
}

.logo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.logo-preview img {
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  background: white;
  padding: 1rem;
}

.delete-logo-btn {
  padding: 0.5rem 1rem;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-logo-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.logo-upload-placeholder {
  position: relative;
}

.logo-file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.logo-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.logo-upload-label:hover {
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 3rem;
}

.logo-upload-label > span:nth-child(2) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}

.upload-hint {
  font-size: 0.8rem;
  color: var(--gray-500);
}

/* Logo Uploading State */
.logo-uploading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem;
}

.spinner-upload {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.logo-uploading p {
  font-size: 0.9rem;
  color: var(--gray-600);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-light);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: var(--gray-100);
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Önizleme */
.preview-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn-preview, .btn-qr {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-preview {
  background: var(--gradient-primary);
  color: white;
}

.btn-qr {
  background: var(--gray-700);
  color: white;
}

.btn-preview:hover, .btn-qr:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.qr-info {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: var(--radius-md);
}

.qr-info p {
  font-size: 0.85rem;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.url-box {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: white;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
}

.url-box code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--primary);
  overflow-x: auto;
}

.btn-copy {
  padding: 0.5rem 1rem;
  background: var(--primary-light);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

/* Kaydet Actions */
.save-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--gray-200);
  flex-wrap: wrap;
}

.btn-save, .btn-reset {
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-save {
  background: var(--gradient-success);
  color: white;
  flex: 1;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1.5px solid var(--gray-300);
}

.btn-save:hover:not(:disabled), .btn-reset:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Responsive */
@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }

  .save-actions {
    flex-direction: column;
  }
  
  .btn-save, .btn-reset {
    width: 100%;
  }
}

/* QR Modal */
.qr-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.qr-modal {
  background: white;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qr-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--gray-100);
}

.qr-modal-header h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0;
}

.close-qr-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-qr-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
}

.qr-modal-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.qr-code-display {
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.qr-code-display img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-info-box {
  width: 100%;
  background: var(--gray-50);
  padding: 1rem;
  border-radius: var(--radius-md);
  text-align: center;
}

.qr-url {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--primary);
  word-break: break-all;
  margin-bottom: 0.5rem;
}

.qr-hint {
  font-size: 0.8rem;
  color: var(--gray-600);
  margin: 0;
}

.qr-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  flex-wrap: wrap;
}

.btn-download-qr,
.btn-print-qr,
.btn-close-qr {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-download-qr {
  background: var(--gradient-primary);
  color: white;
}

.btn-download-qr:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-print-qr {
  background: var(--gradient-success);
  color: white;
}

.btn-print-qr:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-close-qr {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1.5px solid var(--gray-300);
}

.btn-close-qr:hover {
  background: var(--gray-200);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive QR Modal */
@media (max-width: 480px) {
  .qr-code-display {
    width: 250px;
    height: 250px;
    padding: 15px;
  }
  
  .qr-actions {
    flex-direction: column;
  }
  
  .btn-download-qr,
  .btn-print-qr,
  .btn-close-qr {
    width: 100%;
  }
}
</style>
