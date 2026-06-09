<template>
  <button
    @click="printThermal"
    class="thermal-btn"
    :class="{ loading: printing, error: hasError, success: printSuccess }"
    :disabled="printing"
    :title="statusText"
  >
    <span v-if="printing">⏳ Yazdırılıyor...</span>
    <span v-else-if="printSuccess">✅ Yazdırıldı!</span>
    <span v-else-if="hasError">❌ Hata</span>
    <span v-else>🖨️ Termal Yazdır</span>
  </button>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ThermalPrint',
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      printing: false,
      printSuccess: false,
      hasError: false,
      statusText: 'Termal yazıcıya gönder'
    }
  },
  methods: {
    async printThermal() {
      this.printing = true
      this.hasError = false
      this.printSuccess = false
      this.statusText = 'Yazdırılıyor...'

      try {
        const response = await axios.post('http://localhost:3000/api/printer/print-data', {
          order: this.order
        })

        if (response.data.success) {
          this.printSuccess = true
          this.statusText = 'Başarıyla yazdırıldı!'
          setTimeout(() => {
            this.printSuccess = false
            this.statusText = 'Termal yazıcıya gönder'
          }, 3000)
        } else {
          throw new Error(response.data.message)
        }
      } catch (error) {
        this.hasError = true
        const msg = error.response?.data?.message || error.message || 'Yazıcı hatası'
        this.statusText = msg
        alert('🖨️ Yazıcı Hatası:\n\n' + msg + '\n\nÇözüm: Sistem Ayarları > Yazıcı Ayarları sayfasını kontrol edin.')
        setTimeout(() => {
          this.hasError = false
          this.statusText = 'Termal yazıcıya gönder'
        }, 5000)
      } finally {
        this.printing = false
      }
    }
  }
}
</script>

<style scoped>
.thermal-btn {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.thermal-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.thermal-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.thermal-btn.loading {
  background: linear-gradient(135deg, #64748b, #475569);
}

.thermal-btn.success {
  background: linear-gradient(135deg, #22c55e, var(--success));
}

.thermal-btn.error {
  background: linear-gradient(135deg, var(--danger), var(--danger));
}
</style>
