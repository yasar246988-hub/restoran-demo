<template>
  <div class="settings-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">⚙️ Sistem Ayarları</h1>
        <p class="page-subtitle">Kafe konum ve güvenlik ayarları</p>
      </div>
      <span class="badge-active">🔒 Güvenlik Aktif</span>
    </div>

    <div class="settings-grid">
      <!-- Sol Panel — Konum Ayarları -->
      <div class="settings-main">
        <div class="settings-card">
          <div class="card-head">
            <h2>📍 Kafe Konum Ayarları</h2>
            <p>Müşteriler yalnızca belirlenen alan içinden sipariş verebilir</p>
          </div>
          <div class="card-content">

            <div class="form-row-2">
              <div class="form-group">
                <label>Kafe Adı</label>
                <input v-model="cafeSettings.name" type="text" class="form-input" placeholder="Kafe adınızı girin" />
              </div>
              <div class="form-group">
                <label>Güvenlik Yarıçapı (metre)</label>
                <input v-model.number="cafeSettings.radius" type="number" min="10" max="1000" class="form-input" placeholder="100" />
              </div>
            </div>

            <div class="form-group">
              <label>Adres</label>
              <textarea v-model="cafeSettings.address" class="form-input" rows="2" placeholder="Kafe adresini girin"></textarea>
            </div>

            <div class="coord-box">
              <h3>Koordinat Bilgileri</h3>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Enlem (Latitude)</label>
                  <input v-model.number="cafeSettings.latitude" type="number" step="0.000001" class="form-input" placeholder="41.0082" />
                </div>
                <div class="form-group">
                  <label>Boylam (Longitude)</label>
                  <input v-model.number="cafeSettings.longitude" type="number" step="0.000001" class="form-input" placeholder="28.9784" />
                </div>
              </div>
            </div>

            <div class="location-actions">
              <h3>Konum Alma</h3>
              <div class="btn-row">
                <button @click="getCurrentLocation" :disabled="gettingLocation" class="btn btn-success">
                  📡 {{ gettingLocation ? 'Alınıyor...' : 'Mevcut Konumumu Al' }}
                </button>
                <button @click="openMapModal" class="btn btn-primary">
                  🗺️ Koordinat Gir
                </button>
              </div>
            </div>

            <div class="preset-section">
              <h3>Hızlı Konum Seçimi</h3>
              <div class="preset-grid">
                <button v-for="preset in locationPresets" :key="preset.name" @click="setPresetLocation(preset)" class="preset-btn">
                  📍 {{ preset.name }}
                </button>
              </div>
            </div>

            <div v-if="locationError" class="error-box">⚠️ {{ locationError }}</div>

            <div class="form-actions">
              <button @click="resetSettings" class="btn btn-ghost">↺ Sıfırla</button>
              <button @click="saveSettings" :disabled="saving" class="btn btn-primary">
                {{ saving ? '⏳ Kaydediliyor...' : '💾 Kaydet' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sağ Panel -->
      <div class="settings-sidebar">

        <!-- Mevcut Ayarlar -->
        <div class="info-card">
          <div class="info-card-head">ℹ️ Mevcut Ayarlar</div>
          <div class="info-card-body">
            <div class="info-row">
              <span>Konum</span>
              <code>{{ cafeSettings.latitude?.toFixed(4) }}, {{ cafeSettings.longitude?.toFixed(4) }}</code>
            </div>
            <div class="info-row">
              <span>Yarıçap</span>
              <strong>{{ cafeSettings.radius }} m</strong>
            </div>
            <div class="info-row">
              <span>Alan</span>
              <strong>~{{ calculateArea(cafeSettings.radius) }} m²</strong>
            </div>
          </div>
        </div>

        <!-- Güvenlik Özellikleri -->
        <div class="info-card">
          <div class="info-card-head">🛡️ Güvenlik Özellikleri</div>
          <div class="info-card-body">
            <div class="feature-item">
              <span class="feature-check">✅</span>
              <div>
                <strong>Konum Doğrulama</strong>
                <p>Müşteriler yalnızca kafe yakınından sipariş verebilir</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-check">✅</span>
              <div>
                <strong>Session Güvenliği</strong>
                <p>Her QR tarama için benzersiz oturum</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-check">✅</span>
              <div>
                <strong>Zaman Sınırı</strong>
                <p>30 dk pasiflik kontrolü</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-check">✅</span>
              <div>
                <strong>Sipariş Limiti</strong>
                <p>Her QR tarama = 1 sipariş hakkı</p>
              </div>
            </div>
          </div>
        </div>

        <!-- İstatistikler -->
        <div class="info-card">
          <div class="info-card-head">📊 Hızlı İstatistikler</div>
          <div class="info-card-body stats-grid">
            <div class="stat-cell">
              <div class="stat-num">{{ activeSessionsCount }}</div>
              <div class="stat-lbl">Aktif Oturum</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num">{{ todayOrdersCount }}</div>
              <div class="stat-lbl">Bugünkü Sipariş</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Başarı Toast -->
    <transition name="toast">
      <div v-if="showSuccess" class="toast-success">✅ Ayarlar başarıyla kaydedildi!</div>
    </transition>

    <!-- Koordinat Modal -->
    <div v-if="showMapModal" class="modal-overlay" @click.self="closeMapModal">
      <div class="coord-modal">
        <div class="coord-modal-head">
          <h3>📍 Koordinat Gir</h3>
          <button @click="closeMapModal" class="close-x">✕</button>
        </div>
        <div class="coord-modal-body">
          <p class="coord-hint">Kafenizin enlem ve boylam bilgilerini girin. Google Maps'ten koordinatları kopyalayabilirsiniz.</p>
          <div class="form-group">
            <label>Enlem (Latitude)</label>
            <input v-model.number="tempLat" type="number" step="0.000001" class="form-input" placeholder="Örn: 41.0082" />
          </div>
          <div class="form-group">
            <label>Boylam (Longitude)</label>
            <input v-model.number="tempLng" type="number" step="0.000001" class="form-input" placeholder="Örn: 28.9784" />
          </div>
          <button @click="setMapLocation" class="btn btn-primary" style="width:100%">✅ Bu Konumu Kullan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

export default {
  name: 'NewSettingsView',
  data() {
    return {
      cafeSettings: {
        name: '',
        address: '',
        latitude: 41.0082,
        longitude: 28.9784,
        radius: 100
      },
      gettingLocation: false,
      saving: false,
      showSuccess: false,
      locationError: '',
      showMapModal: false,
      tempLat: null,
      tempLng: null,
      activeSessionsCount: 0,
      todayOrdersCount: 0,
      locationPresets: [
        { name: 'Taksim',   latitude: 41.0369, longitude: 28.9852 },
        { name: 'Kadıköy',  latitude: 40.9899, longitude: 29.0322 },
        { name: 'Beşiktaş', latitude: 41.0422, longitude: 29.0067 },
        { name: 'Şişli',    latitude: 41.0602, longitude: 28.9887 },
        { name: 'Bakırköy', latitude: 40.9752, longitude: 28.8737 },
        { name: 'Üsküdar',  latitude: 41.0276, longitude: 29.0076 }
      ]
    }
  },
  async mounted() {
    await this.loadCurrentSettings()
    this.loadStatistics()
  },
  methods: {
    loadStatistics() {
      this.activeSessionsCount = 0
      this.todayOrdersCount = 0
    },

    async loadCurrentSettings() {
      try {
        const res = await axios.get(`${API}/cafe/location`)
        if (res.data.success) {
          this.cafeSettings = { ...this.cafeSettings, ...res.data.data }
        }
      } catch (e) {
        // settings yüklenemedi, varsayılan değerler kullanılır
      }
    },

    async getCurrentLocation() {
      this.gettingLocation = true
      this.locationError = ''
      if (!navigator.geolocation) {
        this.locationError = 'Tarayıcınız konum desteklemiyor'
        this.gettingLocation = false
        return
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.cafeSettings.latitude = pos.coords.latitude
          this.cafeSettings.longitude = pos.coords.longitude
          this.gettingLocation = false
        },
        () => {
          this.locationError = 'Konum alınamadı. Manuel girin.'
          this.gettingLocation = false
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    },

    setPresetLocation(preset) {
      this.cafeSettings.latitude = preset.latitude
      this.cafeSettings.longitude = preset.longitude
    },

    openMapModal() {
      this.tempLat = this.cafeSettings.latitude
      this.tempLng = this.cafeSettings.longitude
      this.showMapModal = true
    },

    closeMapModal() {
      this.showMapModal = false
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
      if (area > 1000000) return (area / 1000000).toFixed(1) + 'M'
      if (area > 1000) return (area / 1000).toFixed(1) + 'K'
      return Math.round(area)
    },

    async saveSettings() {
      if (!this.cafeSettings.latitude || !this.cafeSettings.longitude) {
        this.locationError = 'Enlem ve boylam gerekli'
        return
      }
      if (this.cafeSettings.radius < 10 || this.cafeSettings.radius > 1000) {
        this.locationError = 'Mesafe 10-1000 m arasında olmalı'
        return
      }
      this.saving = true
      this.locationError = ''
      try {
        const token = localStorage.getItem('token')
        const res = await axios.put(`${API}/cafe/location`, this.cafeSettings, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.success) {
          this.showSuccess = true
          setTimeout(() => { this.showSuccess = false }, 3000)
        }
      } catch (e) {
        this.locationError = e.response?.data?.message || 'Kaydetme hatası'
      } finally {
        this.saving = false
      }
    },

    resetSettings() {
      this.cafeSettings = { name: '', address: '', latitude: 41.0082, longitude: 28.9784, radius: 100 }
      this.locationError = ''
    }
  }
}
</script>

<style scoped>
.settings-view {
  padding: 1.75rem 2rem;
  background: var(--bg-app);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary-border);
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 0.2rem;
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--gray-500);
  margin: 0;
}

.badge-active {
  background: var(--success-light);
  color: var(--success);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid #a7f3d0;
}

/* Grid */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .settings-grid { grid-template-columns: 1fr; }
}

/* Main Card */
.settings-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-head {
  padding: 16px 22px;
  background: var(--gradient-primary);
  color: white;
}

.card-head h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 4px;
}

.card-head p {
  font-size: 0.8rem;
  opacity: 0.8;
  margin: 0;
}

.card-content {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row-2 { grid-template-columns: 1fr; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-600);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--gray-800);
  background: white;
  transition: border-color 0.2s;
  outline: none;
  font-family: inherit;
  resize: vertical;
}

.form-input:focus {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(37, 99, 168, 0.1);
}

.coord-box {
  background: var(--gray-50);
  border-radius: var(--radius-md);
  padding: 14px;
  border: 1px solid var(--gray-200);
}

.coord-box h3,
.location-actions h3,
.preset-section h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gray-700);
  margin: 0 0 10px;
}

.btn-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-primary);
}

.btn-success {
  background: var(--gradient-success);
  color: white;
}

.btn-ghost {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 8px 10px;
  background: var(--primary-xlight);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.preset-btn:hover {
  background: var(--primary-border);
}

.error-box {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--gray-200);
}

/* Sidebar Info Cards */
.info-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 1rem;
}

.info-card:last-child { margin-bottom: 0; }

.info-card-head {
  padding: 12px 16px;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.88rem;
  font-weight: 700;
}

.info-card-body {
  padding: 14px 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.85rem;
}

.info-row:last-child { border-bottom: none; }
.info-row span { color: var(--gray-500); }
.info-row strong, .info-row code { color: var(--primary); font-weight: 600; }
.info-row code { font-family: monospace; font-size: 0.78rem; }

.feature-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.83rem;
}

.feature-item:last-child { border-bottom: none; }
.feature-check { font-size: 1rem; flex-shrink: 0; }
.feature-item strong { display: block; color: var(--gray-800); margin-bottom: 2px; }
.feature-item p { color: var(--gray-500); margin: 0; font-size: 0.78rem; }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-cell {
  text-align: center;
  padding: 10px;
  background: var(--primary-xlight);
  border-radius: var(--radius-md);
}

.stat-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-lbl {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 2px;
}

/* Toast */
.toast-success {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--success);
  color: white;
  padding: 14px 22px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: var(--shadow-lg);
  z-index: 9999;
}

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }

/* Modal */
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

.coord-modal {
  background: white;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.coord-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--gradient-primary);
  color: white;
}

.coord-modal-head h3 { margin: 0; font-size: 1rem; }

.close-x {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
}

.coord-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.coord-hint {
  font-size: 0.82rem;
  color: var(--gray-500);
  line-height: 1.5;
  margin: 0;
}
</style>
