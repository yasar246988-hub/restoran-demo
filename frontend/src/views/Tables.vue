<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <NavigationSidebar />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1>📱 QR Kod & Masa Yönetimi</h1>
        <div class="header-actions">
          <button @click="generateNewQR" class="generate-btn">
            ➕ Yeni QR Kod Oluştur
          </button>
          <button @click="regenerateAllQRCodes" class="regenerate-btn">
            🔄 QR Kodları Yenile
          </button>
          <button @click="printAllQRs" class="print-all-btn">
            🖨️ Tümünü Yazdır
          </button>
        </div>
      </div>

      <!-- QR Kod İstatistikleri -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📱</div>
          <div class="stat-info">
            <div class="stat-number">{{ tables.length }}</div>
            <div class="stat-label">Toplam QR Kod</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-number">{{ activeTables }}</div>
            <div class="stat-label">Aktif Masa</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-number">{{ totalScans }}</div>
            <div class="stat-label">Toplam Tarama</div>
          </div>
        </div>
      </div>

      <!-- QR Kod Listesi -->
      <div class="qr-grid">
        <div v-for="table in tables" :key="table.id" class="qr-card">
          <div class="qr-header">
            <h3>{{ table.name }}</h3>
            <div class="qr-status" :class="table.status">
              {{ getStatusText(table.status) }}
            </div>
          </div>
          
          <div class="qr-code-container">
            <canvas :id="`qr-${table.id}`" class="qr-code"></canvas>
          </div>
          
          <div class="qr-info">
            <div class="info-row">
              <span>Masa ID:</span>
              <strong>{{ table.id }}</strong>
            </div>
            <div class="info-row">
              <span>URL:</span>
              <code>{{ getTableURL(table.id) }}</code>
            </div>
            <div class="info-row">
              <span>Oluşturulma:</span>
              <span>{{ formatDate(table.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span>Tarama Sayısı:</span>
              <span>{{ table.scanCount || 0 }}</span>
            </div>
          </div>
          
          <div class="qr-actions">
            <button @click="printQR(table)" class="print-btn">🖨️ Yazdır</button>
            <button @click="downloadQR(table)" class="download-btn">💾 İndir</button>
            <button @click="viewTable(table)" class="view-btn">👁️ Görüntüle</button>
            <button @click="deleteTable(table)" class="delete-btn">🗑️ Sil</button>
          </div>
        </div>
        
        <!-- Boş Durum -->
        <div v-if="tables.length === 0" class="empty-state">
          <div class="empty-icon">📱</div>
          <h3>Henüz QR kod oluşturulmamış</h3>
          <p>İlk QR kodunuzu oluşturmak için yukarıdaki butona tıklayın</p>
        </div>
      </div>
    </main>

    <!-- QR Kod Görüntüleme Modal -->
    <div v-if="selectedTable" class="modal-overlay" @click="closeModal">
      <div class="modal-content qr-modal" @click.stop>
        <div class="modal-header">
          <h2>📱 {{ selectedTable.name }} - QR Kod</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="large-qr-container">
            <canvas :id="`large-qr-${selectedTable.id}`" class="large-qr-code"></canvas>
          </div>
          
          <div class="qr-details">
            <div class="detail-row">
              <span>Masa Adı:</span>
              <strong>{{ selectedTable.name }}</strong>
            </div>
            <div class="detail-row">
              <span>Masa ID:</span>
              <strong>{{ selectedTable.id }}</strong>
            </div>
            <div class="detail-row">
              <span>Sipariş URL:</span>
              <input 
                type="text" 
                :value="getTableURL(selectedTable.id)" 
                readonly 
                class="url-input"
                @click="copyToClipboard"
              >
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="printQR(selectedTable)" class="modal-btn print">🖨️ Yazdır</button>
          <button @click="downloadQR(selectedTable)" class="modal-btn download">💾 İndir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'

export default {
  name: 'Tables',
  components: {
    NavigationSidebar
  },
  data() {
    return {
      tables: [],
      selectedTable: null,
      nextTableNumber: 1
    }
  },
  mounted() {
    this.loadTables()
    this.generateQRCodes()
  },
  computed: {
    activeTables() {
      return this.tables.filter(table => table.status === 'active').length
    },
    totalScans() {
      return this.tables.reduce((total, table) => total + (table.scanCount || 0), 0)
    }
  },
  methods: {
    loadTables() {
      // LocalStorage'dan masaları yükle
      const savedTables = localStorage.getItem('restaurant_tables')
      if (savedTables) {
        this.tables = JSON.parse(savedTables)
        // Sonraki masa numarasını belirle
        if (this.tables.length > 0) {
          const maxNumber = Math.max(...this.tables.map(t => parseInt(t.name.split('-')[1])))
          this.nextTableNumber = maxNumber + 1
        }
      }
    },
    
    saveTables() {
      localStorage.setItem('restaurant_tables', JSON.stringify(this.tables))
    },
    
    generateNewQR() {
      const newTable = {
        id: this.nextTableNumber,
        name: `Masa-${this.nextTableNumber}`,
        status: 'active',
        createdAt: new Date(),
        scanCount: 0
      }
      
      this.tables.push(newTable)
      this.nextTableNumber++
      this.saveTables()
      
      // QR kodu oluştur
      this.$nextTick(() => {
        this.generateQRCode(newTable)
      })
    },
    
    async generateQRCodes() {
      // Tüm masalar için QR kodları oluştur
      await this.$nextTick()
      this.tables.forEach(table => {
        this.generateQRCode(table)
      })
    },
    
    // QR kodları yeniden oluştur
    async regenerateAllQRCodes() {
      await this.$nextTick()
      this.tables.forEach(table => {
        this.generateQRCode(table)
      })
      console.log('✅ Tüm QR kodları yeniden oluşturuldu')
    },
    
    async generateQRCode(table) {
      try {
        const url = this.getTableURL(table.id)
        const canvas = document.getElementById(`qr-${table.id}`)
        if (canvas) {
          await QRCode.toCanvas(canvas, url, {
            width: 150,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
        }
      } catch (error) {
        console.error('QR kod oluşturma hatası:', error)
      }
    },
    
    async generateLargeQRCode(table) {
      try {
        const url = this.getTableURL(table.id)
        const canvas = document.getElementById(`large-qr-${table.id}`)
        if (canvas) {
          await QRCode.toCanvas(canvas, url, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
        }
      } catch (error) {
        console.error('Büyük QR kod oluşturma hatası:', error)
      }
    },
    
    getTableURL(tableId) {
      return `${window.location.origin}/qr-menu?table=${tableId}`
    },
    
    getStatusText(status) {
      const statusMap = {
        'active': 'Aktif',
        'inactive': 'Pasif'
      }
      return statusMap[status] || status
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    async viewTable(table) {
      this.selectedTable = table
      await this.$nextTick()
      this.generateLargeQRCode(table)
    },
    
    closeModal() {
      this.selectedTable = null
    },
    
    printQR(table) {
      // QR kodu yazdırma işlevi
      const canvas = document.getElementById(`qr-${table.id}`)
      if (canvas) {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
          <html>
            <head>
              <title>${table.name} - QR Kod</title>
              <style>
                body { 
                  text-align: center; 
                  font-family: Arial, sans-serif;
                  padding: 20px;
                }
                .qr-container {
                  border: 2px solid #333;
                  padding: 20px;
                  margin: 20px auto;
                  display: inline-block;
                }
                h2 { margin-bottom: 10px; }
                p { margin: 5px 0; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h2>${table.name}</h2>
                <img src="${canvas.toDataURL()}" alt="QR Kod">
                <p>Sipariş vermek için QR kodu okutun</p>
                <p>Masa ID: ${table.id}</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    },
    
    downloadQR(table) {
      const canvas = document.getElementById(`qr-${table.id}`)
      if (canvas) {
        const link = document.createElement('a')
        link.download = `${table.name}-QR.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    },
    
    printAllQRs() {
      // Tüm QR kodlarını yazdır
      const printWindow = window.open('', '_blank')
      let content = `
        <html>
          <head>
            <title>Tüm QR Kodlar</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .qr-page {
                page-break-after: always;
                text-align: center;
                padding: 50px;
              }
              .qr-container {
                border: 2px solid #333;
                padding: 30px;
                margin: 20px auto;
                display: inline-block;
              }
              h2 { margin-bottom: 15px; }
              p { margin: 8px 0; }
            </style>
          </head>
          <body>
      `
      
      this.tables.forEach((table) => {
        const canvas = document.getElementById(`qr-${table.id}`)
        if (canvas) {
          content += `
            <div class="qr-page">
              <div class="qr-container">
                <h2>${table.name}</h2>
                <img src="${canvas.toDataURL()}" alt="QR Kod">
                <p>Sipariş vermek için QR kodu okutun</p>
                <p>Masa ID: ${table.id}</p>
              </div>
            </div>
          `
        }
      })
      
      content += `
          </body>
        </html>
      `
      
      printWindow.document.write(content)
      printWindow.document.close()
      printWindow.print()
    },
    
    deleteTable(table) {
      if (confirm(`${table.name} silinsin mi?`)) {
        const index = this.tables.findIndex(t => t.id === table.id)
        if (index > -1) {
          this.tables.splice(index, 1)
          this.saveTables()
        }
      }
    },
    
    copyToClipboard(event) {
      event.target.select()
      document.execCommand('copy')
      alert('URL kopyalandı!')
    },
    
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
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
  margin: 0;
  color: #2d3748;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.generate-btn, .regenerate-btn, .print-all-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.regenerate-btn {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
  color: white;
}

.print-all-btn {
  background: #48bb78;
  color: white;
}

.generate-btn:hover, .regenerate-btn:hover, .print-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  display: block;
  color: #718096;
  font-size: 0.9rem;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.qr-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.qr-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.qr-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qr-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.qr-status {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
}

.qr-code-container {
  padding: 2rem;
  text-align: center;
  background: #f9f9f9;
}

.qr-code {
  border: 3px solid var(--gray-200);
  border-radius: 8px;
  display: inline-block;
}

.qr-info {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row code {
  background: #edf2f7;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-actions {
  padding: 1rem 1.5rem;
  background: #f9f9f9;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.print-btn, .download-btn, .view-btn, .delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.print-btn {
  background: #4299e1;
  color: white;
}

.download-btn {
  background: #48bb78;
  color: white;
}

.view-btn {
  background: #ed8936;
  color: white;
}

.delete-btn {
  background: #f56565;
  color: white;
}

.print-btn:hover, .download-btn:hover, .view-btn:hover, .delete-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #2d3748;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.qr-modal {
  max-width: 500px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 2rem;
}

.large-qr-container {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.large-qr-code {
  border: 3px solid var(--gray-200);
  border-radius: 8px;
  display: inline-block;
}

.qr-details {
  margin: 1rem 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gray-200);
}

.detail-row:last-child {
  border-bottom: none;
}

.url-input {
  padding: 0.5rem;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  width: 250px;
  font-size: 0.8rem;
  background: #f9f9f9;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.modal-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-btn.print {
  background: #4299e1;
  color: white;
}

.modal-btn.download {
  background: #48bb78;
  color: white;
}

.modal-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .qr-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
