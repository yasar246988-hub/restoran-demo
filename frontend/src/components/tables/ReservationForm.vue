<template>
  <Modal :show="show" @close="$emit('close')" title="Rezervasyon Oluştur">
    <form @submit.prevent="submitReservation" class="reservation-form">
      <div class="form-group">
        <label for="customerName">Müşteri Adı *</label>
        <input
          type="text"
          id="customerName"
          v-model="form.customerName"
          required
          :class="{ 'error': errors.customerName }"
          placeholder="Müşteri adı soyadı"
        />
        <span v-if="errors.customerName" class="error-message">{{ errors.customerName }}</span>
      </div>

      <div class="form-group">
        <label for="phone">Telefon *</label>
        <input
          type="tel"
          id="phone"
          v-model="form.phone"
          required
          :class="{ 'error': errors.phone }"
          placeholder="0555 555 5555"
        />
        <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
      </div>

      <div class="form-group">
        <label for="email">E-posta</label>
        <input
          type="email"
          id="email"
          v-model="form.email"
          :class="{ 'error': errors.email }"
          placeholder="ornek@email.com"
        />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="reservationDate">Tarih *</label>
          <input
            type="date"
            id="reservationDate"
            v-model="form.date"
            required
            :min="today"
            :class="{ 'error': errors.date }"
          />
          <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
        </div>

        <div class="form-group">
          <label for="reservationTime">Saat *</label>
          <select
            id="reservationTime"
            v-model="form.time"
            required
            :class="{ 'error': errors.time }"
          >
            <option value="">Saat seçin</option>
            <option v-for="time in availableTimes" :key="time" :value="time">
              {{ time }}
            </option>
          </select>
          <span v-if="errors.time" class="error-message">{{ errors.time }}</span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="guestCount">Kişi Sayısı *</label>
          <input
            type="number"
            id="guestCount"
            v-model="form.guestCount"
            required
            min="1"
            max="20"
            :class="{ 'error': errors.guestCount }"
            placeholder="2"
          />
          <span v-if="errors.guestCount" class="error-message">{{ errors.guestCount }}</span>
        </div>

        <div class="form-group">
          <label for="tableId">Masa Seçimi</label>
          <select id="tableId" v-model="form.tableId">
            <option value="">Otomatik atama</option>
            <option 
              v-for="table in availableTables" 
              :key="table.id" 
              :value="table.id"
            >
              Masa {{ table.number }} ({{ table.capacity }} kişi)
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="notes">Özel İstekler</label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="3"
          placeholder="Doğum günü kutlaması, özel diyet ihtiyaçları vb."
        ></textarea>
      </div>

      <div class="form-actions">
        <AppButton type="button" variant="secondary" @click="$emit('close')">
          İptal
        </AppButton>
        <AppButton type="submit" :loading="isLoading" :disabled="!isFormValid">
          Rezervasyon Oluştur
        </AppButton>
      </div>
    </form>
  </Modal>
</template>

<script>
import Modal from '../common/Modal.vue'
import AppButton from '../common/Button.vue'

export default {
  name: 'ReservationForm',
  
  components: {
    Modal,
    AppButton: AppButton
  },

  props: {
    show: {
      type: Boolean,
      default: false
    },
    table: {
      type: Object,
      default: null
    }
  },

  emits: ['close', 'submit'],

  data() {
    return {
      form: {
        customerName: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        guestCount: 2,
        tableId: null,
        notes: ''
      },
      errors: {},
      isLoading: false,
      availableTimes: [
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
        '20:00', '20:30', '21:00', '21:30', '22:00'
      ],
      availableTables: [
        { id: 1, number: 1, capacity: 2 },
        { id: 2, number: 2, capacity: 4 },
        { id: 3, number: 3, capacity: 6 },
        { id: 4, number: 4, capacity: 4 },
        { id: 5, number: 5, capacity: 2 },
        { id: 6, number: 6, capacity: 8 }
      ]
    }
  },

  computed: {
    today() {
      return new Date().toISOString().split('T')[0]
    },

    isFormValid() {
      return this.form.customerName &&
             this.form.phone &&
             this.form.date &&
             this.form.time &&
             this.form.guestCount > 0 &&
             Object.keys(this.errors).length === 0
    }
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.resetForm()
        if (this.table) {
          this.form.tableId = this.table.id
        }
      }
    },

    'form.customerName'() {
      this.validateField('customerName')
    },
    'form.phone'() {
      this.validateField('phone')
    },
    'form.email'() {
      this.validateField('email')
    },
    'form.date'() {
      this.validateField('date')
    },
    'form.time'() {
      this.validateField('time')
    },
    'form.guestCount'() {
      this.validateField('guestCount')
    }
  },

  methods: {
    resetForm() {
      this.form = {
        customerName: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        guestCount: 2,
        tableId: this.table?.id || null,
        notes: ''
      }
      this.errors = {}
      this.isLoading = false
    },

    validateField(field) {
      this.$delete(this.errors, field)

      switch (field) {
        case 'customerName':
          if (!this.form.customerName.trim()) {
            this.$set(this.errors, 'customerName', 'Müşteri adı gereklidir')
          } else if (this.form.customerName.length < 2) {
            this.$set(this.errors, 'customerName', 'Müşteri adı en az 2 karakter olmalıdır')
          }
          break

        case 'phone': {
          const phoneRegex = /^[0-9]{10,11}$/
          if (!this.form.phone) {
            this.$set(this.errors, 'phone', 'Telefon numarası gereklidir')
          } else if (!phoneRegex.test(this.form.phone.replace(/\s/g, ''))) {
            this.$set(this.errors, 'phone', 'Geçerli bir telefon numarası girin')
          }
          break
        }

        case 'email': {
          if (this.form.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(this.form.email)) {
              this.$set(this.errors, 'email', 'Geçerli bir e-posta adresi girin')
            }
          }
          break
        }

        case 'date':
          if (!this.form.date) {
            this.$set(this.errors, 'date', 'Rezervasyon tarihi gereklidir')
          } else if (new Date(this.form.date) < new Date(this.today)) {
            this.$set(this.errors, 'date', 'Geçmiş bir tarih seçilemez')
          }
          break

        case 'time':
          if (!this.form.time) {
            this.$set(this.errors, 'time', 'Rezervasyon saati gereklidir')
          }
          break

        case 'guestCount':
          if (!this.form.guestCount || this.form.guestCount < 1) {
            this.$set(this.errors, 'guestCount', 'Kişi sayısı en az 1 olmalıdır')
          } else if (this.form.guestCount > 20) {
            this.$set(this.errors, 'guestCount', 'Kişi sayısı en fazla 20 olabilir')
          }
          break
      }
    },

    validateForm() {
      const fields = ['customerName', 'phone', 'email', 'date', 'time', 'guestCount']
      fields.forEach(field => this.validateField(field))
      return Object.keys(this.errors).length === 0
    },

    async submitReservation() {
      if (!this.validateForm()) {
        return
      }

      this.isLoading = true

      try {
        const reservationData = {
          ...this.form,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        this.$emit('submit', reservationData)
        this.$emit('close')
        
        // Show success message
        this.$toast.success('Rezervasyon başarıyla oluşturuldu!')
        
      } catch (error) {
        console.error('Rezervasyon oluşturma hatası:', error)
        this.$toast.error('Rezervasyon oluşturulurken bir hata oluştu')
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.reservation-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #374151;
      font-size: 0.875rem;
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &.error {
        border-color: #ef4444;
        background-color: #fef2f2;
      }
    }

    textarea {
      resize: vertical;
      min-height: 80px;
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;

    @media (max-width: 768px) {
      flex-direction: column-reverse;
    }
  }
}
</style>
