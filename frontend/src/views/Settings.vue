<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <NavigationSidebar />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1>Sistem Ayarları</h1>
        <div class="header-actions">
          <span class="status-badge success">✓ Sistem Aktif</span>
        </div>
      </div>

      <!-- Settings Grid -->
      <div class="settings-grid">
        
        <!-- Kafe Bilgileri Kartı -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🏪 Kafe Bilgileri</h3>
          </div>
          <div class="card-content">
            <div class="form-group">
              <label>Kafe Adı</label>
              <input 
                v-model="cafeSettings.name" 
                type="text" 
                class="form-input"
                placeholder="Kafe adınızı girin"
              >
            </div>
            
            <div class="form-group">
              <label>Güvenlik Yarıçapı (metre)</label>
              <input 
                v-model.number="cafeSettings.radius" 
                type="number" 
                min="10" 
                max="1000"
                class="form-input"
                placeholder="200"
              >
              <small style="color:#888;display:block;margin-top:4px">
                <strong>Önerilen değerler:</strong><br>
                • <strong>50-100m:</strong> Sadece kafe içi (en güvenli, GPS hatası olabilir)<br>
                • <strong>150-200m:</strong> Kafe + yakın çevre (dengeli - önerilen)<br>
                • <strong>200m+:</strong> Geniş alan (daha esnek ama daha az güvenli)
              </small>
              <div style="background:#fef3c7;border:1px solid #fde047;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:0.8rem;color:#854d0e">
                💡 <strong>İpucu:</strong> Her sipariş sırasında güncel konum kontrol edilir.
              </div>
            </div>
            
            <div class="form-group">
              <label>Adres</label>
              <textarea 
                v-model="cafeSettings.address" 
                class="form-textarea"
                rows="3"
                placeholder="Kafe adresini girin"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Telefon</label>
              <input 
                v-model="cafeSettings.phone" 
                type="text" 
                class="form-input"
                placeholder="0212 000 00 00"
              >
            </div>

            <div class="button-group" style="margin-top:12px">
              <button @click="saveCafeInfo" class="btn btn-primary">
                💾 Kafe Bilgilerini Kaydet
              </button>
              <span v-if="cafeSaved" style="color:#22c55e;font-size:0.85rem;margin-left:8px">✅ Kaydedildi!</span>
            </div>
          </div>
        </div>

        <!-- GPS Koordinatları Kartı -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🧭 GPS Koordinatları</h3>
          </div>
          <div class="card-content">
            <div style="background:#fef3c7;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.875rem;color:#854d0e">
              🛡️ <strong>Güvenlik Özelliği:</strong> Müşteriler sadece belirlenen konum yarıçapı içindeyken sipariş verebilir. Bu sayede QR kodun fotoğrafı çekilip başka yerden sipariş verilmesi önlenir.
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Enlem (Latitude)</label>
                <input 
                  v-model.number="cafeSettings.latitude" 
                  type="number" 
                  step="0.000001"
                  class="form-input"
                  placeholder="41.0082"
                >
              </div>
              
              <div class="form-group">
                <label>Boylam (Longitude)</label>
                <input 
                  v-model.number="cafeSettings.longitude" 
                  type="number" 
                  step="0.000001"
                  class="form-input"
                  placeholder="28.9784"
                >
              </div>
            </div>
            
            <div class="button-group">
              <button 
                @click="getCurrentLocation" 
                :disabled="gettingLocation"
                class="btn btn-primary"
              >
                {{ gettingLocation ? '� Alınıyor...' : '📍 Mevcut Konumumu Al' }}
              </button>
              
              <button 
                @click="openMapModal" 
                class="btn btn-secondary"
              >
                🗺️ Haritadan Seç
              </button>
            </div>
          </div>
        </div>

        <!-- Mevcut Ayarlar -->
        <div class="settings-card">
          <div class="card-header">
            <h3>📊 Mevcut Ayarlar</h3>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Konum:</span>
                <span class="info-value">{{ cafeSettings.latitude?.toFixed(6) }}, {{ cafeSettings.longitude?.toFixed(6) }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">Yarıçap:</span>
                <span class="info-value">{{ cafeSettings.radius }} metre</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">Kapsama Alanı:</span>
                <span class="info-value">~{{ calculateArea(cafeSettings.radius) }} m²</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Güvenlik Özellikleri -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🛡️ Güvenlik Özellikleri</h3>
          </div>
          <div class="card-content">
            <div class="security-features">
              <div class="security-item">
                <span class="security-icon">✅</span>
                <div class="security-info">
                  <strong>Session Oluşturma</strong>
                  <p>QR okutulurken konum kontrolü</p>
                </div>
              </div>
              
              <div class="security-item">
                <span class="security-icon">✅</span>
                <div class="security-info">
                  <strong>Sipariş Sırasında Kontrol</strong>
                  <p>Her sipariş sırasında güncel konum alınır</p>
                </div>
              </div>
              
              <div class="security-item">
                <span class="security-icon">✅</span>
                <div class="security-info">
                  <strong>Çift Katmanlı Koruma</strong>
                  <p>Session + sipariş sırasında konum</p>
                </div>
              </div>
              
              <div class="security-item">
                <span class="security-icon">✅</span>
                <div class="security-info">
                  <strong>GPS Hassasiyeti</strong>
                  <p>Konum hassasiyeti kaydedilir ve loglanır</p>
                </div>
              </div>
              
              <div class="security-item">
                <span class="security-icon">✅</span>
                <div class="security-info">
                  <strong>Zaman Sınırı</strong>
                  <p>8 saat oturum, 30dk pasiflik limiti</p>
                </div>
              </div>
              
              <div class="security-item">
                <span class="security-icon">✅</span>
                <div class="security-info">
                  <strong>Sipariş Limiti</strong>
                  <p>Oturum başına maks. 10 sipariş</p>
                </div>
              </div>
            </div>
            
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:0.875rem;color:#047857">
              <strong>🔒 Nasıl Çalışır?</strong><br><br>
              1️⃣ Müşteri QR okutunca → Konum alınır ve kontrol edilir<br>
              2️⃣ Sipariş verirken → Tekrar güncel konum alınır<br>
              3️⃣ Her ikisi de radius içinde olmalı → Aksi halde sipariş engellenir<br><br>
              <strong>Sonuç:</strong> QR fotoğrafı çekilip kafeden çıkılsa bile sipariş verilemez! ✅
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="locationError" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ locationError }}
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="resetSettings" class="btn btn-secondary">
          🔄 Sıfırla
        </button>
        
        <button 
          @click="saveSettings" 
          :disabled="saving"
          class="btn btn-primary"
        >
          {{ saving ? '💾 Kaydediliyor...' : '💾 Ayarları Kaydet' }}
        </button>
      </div>

      <!-- Yazıcı Ayarları Kartı -->
      <div class="settings-card" style="margin-top:24px">
        <div class="card-header">
          <h3>🖨️ Yazıcı Ayarları</h3>
        </div>
        <div class="card-content">

          <!-- Sekme -->
          <div style="display:flex;gap:8px;margin-bottom:20px">
            <button
              @click="activePrinterTab = 'kasa'"
              :style="{ padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', background: activePrinterTab==='kasa' ? 'var(--primary)' : '#f1f5f9', color: activePrinterTab==='kasa' ? 'white' : '#555' }"
            >🧾 Kasa Yazıcısı</button>
            <button
              @click="activePrinterTab = 'mutfak'"
              :style="{ padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', background: activePrinterTab==='mutfak' ? 'var(--success)' : '#f1f5f9', color: activePrinterTab==='mutfak' ? 'white' : '#555' }"
            >🍳 Mutfak Yazıcısı</button>
          </div>

          <!-- Kasa Yazıcısı -->
          <div v-if="activePrinterTab === 'kasa'">
            <div style="background:var(--primary-xlight);border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.85rem;color:var(--primary)">
              💡 Garson "Adisyon Yazdır" butonuna basınca bu yazıcıdan çıktı alır.
            </div>

            <div class="form-group">
              <label>Aktif</label>
              <select v-model="printerConfig.kasa.enabled" class="form-input">
                <option :value="true">✅ Aktif</option>
                <option :value="false">❌ Devre Dışı</option>
              </select>
            </div>

            <div class="form-group">
              <label>Bağlantı Türü</label>
              <select v-model="printerConfig.kasa.interface" class="form-input">
                <option value="tcp">Ağ (TCP/IP) — WiFi veya LAN</option>
                <option value="printer">Windows Yazıcı — USB</option>
              </select>
            </div>

            <div v-if="printerConfig.kasa.interface === 'tcp'" class="form-row">
              <div class="form-group">
                <label>IP Adresi</label>
                <input v-model="printerConfig.kasa.host" type="text" class="form-input" placeholder="192.168.1.200">
              </div>
              <div class="form-group">
                <label>Port</label>
                <input v-model.number="printerConfig.kasa.port" type="number" class="form-input" placeholder="9100">
              </div>
            </div>

            <div v-if="printerConfig.kasa.interface === 'printer'" class="form-group">
              <label>Windows Yazıcı Adı</label>
              <input v-model="printerConfig.kasa.windowsPrinterName" type="text" class="form-input" placeholder="Epson TM-T20">
            </div>

            <div class="form-group">
              <label>Yazıcı Markası</label>
              <select v-model="printerConfig.kasa.type" class="form-input">
                <option value="EPSON">Epson (TM serisi)</option>
                <option value="STAR">Star Micronics</option>
              </select>
            </div>
          </div>

          <!-- Mutfak Yazıcısı -->
          <div v-if="activePrinterTab === 'mutfak'">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.85rem;color:var(--success)">
              🍳 Yeni sipariş geldiğinde <strong>otomatik olarak</strong> bu yazıcıdan mutfak fişi çıkar.
            </div>

            <div class="form-group">
              <label>Aktif</label>
              <select v-model="printerConfig.mutfak.enabled" class="form-input">
                <option :value="true">✅ Aktif — Otomatik yazdır</option>
                <option :value="false">❌ Devre Dışı</option>
              </select>
            </div>

            <div class="form-group">
              <label>Bağlantı Türü</label>
              <select v-model="printerConfig.mutfak.interface" class="form-input">
                <option value="tcp">Ağ (TCP/IP) — WiFi veya LAN</option>
                <option value="printer">Windows Yazıcı — USB</option>
              </select>
            </div>

            <div v-if="printerConfig.mutfak.interface === 'tcp'" class="form-row">
              <div class="form-group">
                <label>IP Adresi</label>
                <input v-model="printerConfig.mutfak.host" type="text" class="form-input" placeholder="192.168.1.201">
                <small style="color:#888">Mutfak yazıcısının IP adresi (kasa yazıcısından farklı olmalı)</small>
              </div>
              <div class="form-group">
                <label>Port</label>
                <input v-model.number="printerConfig.mutfak.port" type="number" class="form-input" placeholder="9100">
              </div>
            </div>

            <div v-if="printerConfig.mutfak.interface === 'printer'" class="form-group">
              <label>Windows Yazıcı Adı</label>
              <input v-model="printerConfig.mutfak.windowsPrinterName" type="text" class="form-input" placeholder="Kitchen-Printer">
            </div>

            <div class="form-group">
              <label>Yazıcı Markası</label>
              <select v-model="printerConfig.mutfak.type" class="form-input">
                <option value="EPSON">Epson (TM serisi)</option>
                <option value="STAR">Star Micronics</option>
              </select>
            </div>
          </div>

          <!-- Butonlar -->
          <div class="button-group" style="margin-top:16px;gap:10px;display:flex;flex-wrap:wrap">
            <button @click="savePrinterConfig" class="btn btn-primary">
              💾 Kaydet
            </button>
            <button @click="testPrinter(activePrinterTab)" :disabled="printerTesting" class="btn btn-secondary">
              {{ printerTesting ? '⏳ Test ediliyor...' : '🧪 ' + (activePrinterTab === 'kasa' ? 'Kasa' : 'Mutfak') + ' Yazıcısını Test Et' }}
            </button>
          </div>

          <div v-if="printerTestResult" :style="{ marginTop:'10px', padding:'10px', borderRadius:'8px', background: printerTestResult.success ? 'var(--success-light)' : 'var(--danger-light)', color: printerTestResult.success ? 'var(--success)' : 'var(--danger)' }">
            {{ printerTestResult.success ? '✅' : '❌' }} {{ printerTestResult.message }}
          </div>

        </div>
      </div>

    </main>

    <!-- Success Toast -->
    <div v-if="showSuccess" class="success-toast">
      <span class="toast-icon">✅</span>
      <span>Ayarlar başarıyla kaydedildi!</span>
    </div>

    <!-- Map Modal -->
    <div v-if="showMapModal" class="modal-overlay" @click="closeMapModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🗺️ Haritadan Konum Seç</h3>
          <button @click="closeMapModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="map-placeholder">
            <div class="map-demo">
              <h4>Harita Entegrasyonu</h4>
              <p>Gerçek uygulamada burada Google Maps olacak</p>
              
              <div class="form-group">
                <label>Enlem (Latitude)</label>
                <input v-model.number="tempLat" type="number" step="0.000001" class="form-input">
              </div>
              
              <div class="form-group">
                <label>Boylam (Longitude)</label>
                <input v-model.number="tempLng" type="number" step="0.000001" class="form-input">
              </div>
              
              <button @click="setMapLocation" class="btn btn-primary">
                ✅ Bu Konumu Kullan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'

export default {
  name: 'CleanSettingsView',
  components: {
    NavigationSidebar
  },
  data() {
    return {
      cafeSettings: {
        name: localStorage.getItem('cafeName') || 'Kafe XYZ',
        address: localStorage.getItem('cafeAddress') || 'İstanbul, Türkiye',
        phone: localStorage.getItem('cafePhone') || '',
        latitude: 41.0082,
        longitude: 28.9784,
        radius: 200 // 200 metre varsayılan (GPS hassasiyet hatası için)
      },
      gettingLocation: false,
      saving: false,
      showSuccess: false,
      cafeSaved: false,
      locationError: '',
      showMapModal: false,
      tempLat: null,
      tempLng: null,
      securityFeatures: [
        { title: '🛡️ Konum Doğrulama', desc: 'GPS tabanlı sipariş kontrolü' },
        { title: '🔐 Session Güvenliği', desc: 'Benzersiz oturum yönetimi' },
        { title: '⏰ Zaman Sınırı', desc: '8 saat oturum, 30dk pasiflik' },
        { title: '📊 Sipariş Limiti', desc: 'Oturum başına maks. 10 sipariş' }
      ],
      // Yazıcı ayarları
      printerConfig: {
        kasa: {
          enabled: true,
          type: 'EPSON',
          interface: 'tcp',
          host: '192.168.1.200',
          port: 9100,
          windowsPrinterName: '',
          cafeName: 'Kafe',
          cafeAddress: '',
          cafePhone: '',
          currency: '₺'
        },
        mutfak: {
          enabled: true,
          type: 'EPSON',
          interface: 'tcp',
          host: '192.168.1.201',
          port: 9100,
          windowsPrinterName: '',
          cafeName: 'MUTFAK'
        }
      },
      activePrinterTab: 'kasa',
      printerTesting: false,
      printerTestResult: null
    }
  },
  async mounted() {
    console.log('🚀 Settings Component Mounted!')
    await this.loadCurrentSettings()
  },
  methods: {
    saveCafeInfo() {
      localStorage.setItem('cafeName', this.cafeSettings.name || '')
      localStorage.setItem('cafeAddress', this.cafeSettings.address || '')
      localStorage.setItem('cafePhone', this.cafeSettings.phone || '')
      this.cafeSaved = true
      setTimeout(() => { this.cafeSaved = false }, 3000)
    },

    async savePrinterConfig() {
      try {
        const token = localStorage.getItem('token')
        await axios.put('http://localhost:3000/api/printer/config', {
          kasa: this.printerConfig.kasa,
          mutfak: this.printerConfig.mutfak
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ Yazıcı ayarları kaydedildi!')
      } catch (error) {
        alert('❌ Kaydetme hatası: ' + (error.response?.data?.message || error.message))
      }
    },

    async testPrinter(yazici) {
      this.printerTesting = true
      this.printerTestResult = null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post('http://localhost:3000/api/printer/test',
          { yazici: yazici || this.activePrinterTab },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.printerTestResult = response.data
      } catch (error) {
        this.printerTestResult = {
          success: false,
          message: error.response?.data?.message || error.message || 'Bağlantı hatası'
        }
      } finally {
        this.printerTesting = false
      }
    },
    async loadCurrentSettings() {
      try {
        const response = await axios.get('http://localhost:3000/api/cafe/location')
        if (response.data.success) {
          this.cafeSettings = {
            ...response.data.data,
            phone: localStorage.getItem('cafePhone') || '',
          }
        }
      } catch (error) {
        console.log('Demo modunda çalışıyor - API bağlantısı yok')
      }
    },

    async getCurrentLocation() {
      this.gettingLocation = true
      this.locationError = ''

      if (!navigator.geolocation) {
        this.locationError = 'Tarayıcınız konum desteği sağlamıyor'
        this.gettingLocation = false
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.cafeSettings.latitude = position.coords.latitude
          this.cafeSettings.longitude = position.coords.longitude
          console.log('📍 Mevcut konum alındı:', this.cafeSettings.latitude, this.cafeSettings.longitude)
          this.gettingLocation = false
        },
        (error) => {
          console.error('Konum hatası:', error)
          this.locationError = 'Konum alınamadı. Manuel olarak girin.'
          this.gettingLocation = false
        },
        { enableHighAccuracy: true, timeout: 15000 }
      )
    },

    openMapModal() {
      this.showMapModal = true
      this.tempLat = this.cafeSettings.latitude
      this.tempLng = this.cafeSettings.longitude
    },

    closeMapModal() {
      this.showMapModal = false
      this.tempLat = null
      this.tempLng = null
    },

    setMapLocation() {
      if (this.tempLat && this.tempLng) {
        this.cafeSettings.latitude = this.tempLat
        this.cafeSettings.longitude = this.tempLng
        this.closeMapModal()
      }
    },

    calculateArea(radius) {
      const area = Math.PI * radius * radius
      if (area > 1000000) {
        return (area / 1000000).toFixed(1) + 'M'
      } else if (area > 1000) {
        return (area / 1000).toFixed(1) + 'K'
      }
      return Math.round(area)
    },

    async saveSettings() {
      if (!this.cafeSettings.latitude || !this.cafeSettings.longitude) {
        this.locationError = 'Enlem ve boylam bilgileri gerekli'
        return
      }

      if (this.cafeSettings.radius < 10 || this.cafeSettings.radius > 1000) {
        this.locationError = 'Mesafe 10-1000 metre arasında olmalı'
        return
      }

      this.saving = true
      this.locationError = ''

      try {
        const token = localStorage.getItem('token')
        const response = await axios.put('http://localhost:3000/api/cafe/location', {
          latitude: this.cafeSettings.latitude,
          longitude: this.cafeSettings.longitude,
          radius: this.cafeSettings.radius,
          name: this.cafeSettings.name,
          address: this.cafeSettings.address
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          this.showSuccess = true
          setTimeout(() => {
            this.showSuccess = false
          }, 4000)
          
          console.log('✅ Kafe konumu güncellendi:', response.data.data)
        }
      } catch (error) {
        console.error('Ayarlar kaydedilemedi:', error)
        this.locationError = error.response?.data?.message || 'Kaydetme hatası. CEO yetkisi gerekli olabilir.'
      } finally {
        this.saving = false
      }
    },

    resetSettings() {
      this.cafeSettings = {
        name: 'Kafe XYZ',
        address: 'İstanbul, Türkiye',
        latitude: 41.0082,
        longitude: 28.9784,
        radius: 200 // 200 metre varsayılan
      }
      this.locationError = ''
    }
  }
}
</script>

<style scoped>
/* Ana layout - diğer sayfalarla aynı */
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
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--gray-200);
}

.content-header h1 {
  font-size: 2rem;
  font-weight: bold;
  color: var(--gray-800);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.success {
  background-color: var(--success-light);
  color: var(--success);
}

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.settings-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-light), #8b5cf6);
  color: white;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-content {
  padding: 1.5rem;
}

/* Form elements */
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

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Button styles */
.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-light), #8b5cf6);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 2px solid var(--gray-300);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Info grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  border: 1px solid var(--gray-200);
}

.info-label {
  font-weight: 600;
  color: var(--gray-700);
}

.info-value {
  font-family: monospace;
  color: var(--gray-800);
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

/* Security features */
.security-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.security-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 0.5rem;
  border: 1px solid #bbf7d0;
}

.security-icon {
  font-size: 1.25rem;
}

.security-info strong {
  display: block;
  color: #065f46;
  margin-bottom: 0.25rem;
}

.security-info p {
  color: #047857;
  font-size: 0.875rem;
  margin: 0;
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--gray-200);
}

/* Error message */
.error-message {
  background: var(--danger-light);
  border: 2px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  color: var(--danger);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1.25rem;
}

/* Success toast */
.success-toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: white;
  border: 2px solid var(--success);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
  color: #065f46;
  font-weight: 600;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.toast-icon {
  font-size: 1.25rem;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
  background: linear-gradient(135deg, var(--primary-light), #8b5cf6);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 2rem;
}

.map-placeholder {
  background: linear-gradient(135deg, var(--primary-xlight), var(--primary-xlight));
  border: 2px dashed var(--primary-light);
  border-radius: 1rem;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-demo {
  text-align: center;
  max-width: 400px;
}

.map-demo h4 {
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.map-demo p {
  color: var(--primary);
  margin-bottom: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .location-presets {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-mini {
    grid-template-columns: 1fr;
  }
}
</style>
