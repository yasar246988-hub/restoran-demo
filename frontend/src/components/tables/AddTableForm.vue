<template>
  <div class="add-table-form">
    <div class="form-header">
      <h3>{{ isEditing ? 'Masayı Düzenle' : 'Yeni Masa Ekle' }}</h3>
      <button @click="$emit('close')" class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <form @submit.prevent="submitForm" class="form-content">
      <div class="form-group">
        <label for="tableNumber">Masa Numarası</label>
        <input
          id="tableNumber"
          v-model="formData.number"
          type="number"
          min="1"
          required
          class="form-control"
          :disabled="isEditing"
        />
      </div>
      
      <div class="form-group">
        <label for="capacity">Kapasite</label>
        <select id="capacity" v-model="formData.capacity" required class="form-control">
          <option value="">Seçiniz</option>
          <option value="2">2 Kişi</option>
          <option value="4">4 Kişi</option>
          <option value="6">6 Kişi</option>
          <option value="8">8 Kişi</option>
          <option value="10">10 Kişi</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="location">Konum</label>
        <select id="location" v-model="formData.location" required class="form-control">
          <option value="">Seçiniz</option>
          <option value="indoor">İç Mekan</option>
          <option value="outdoor">Dış Mekan</option>
          <option value="window">Pencere Kenarı</option>
          <option value="vip">VIP</option>
        </select>
      </div>
      
      <div class="form-group" v-if="isEditing">
        <label for="status">Durum</label>
        <select id="status" v-model="formData.status" class="form-control">
          <option value="available">Müsait</option>
          <option value="occupied">Dolu</option>
          <option value="reserved">Rezerve</option>
          <option value="cleaning">Temizleniyor</option>
          <option value="maintenance">Bakımda</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="description">Açıklama (Opsiyonel)</label>
        <textarea
          id="description"
          v-model="formData.description"
          rows="3"
          class="form-control"
          placeholder="Masa hakkında ek bilgiler..."
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="$emit('close')" class="btn btn--outline">
          İptal
        </button>
        <button type="submit" class="btn btn--primary">
          <i class="fas fa-save"></i>
          {{ isEditing ? 'Güncelle' : 'Ekle' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'AddTableForm',
  props: {
    table: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  data() {
    return {
      formData: {
        number: '',
        capacity: '',
        location: '',
        status: 'available',
        description: ''
      }
    }
  },
  computed: {
    isEditing() {
      return !!this.table
    }
  },
  mounted() {
    if (this.isEditing) {
      this.formData = { ...this.table }
    }
  },
  methods: {
    submitForm() {
      const tableData = {
        ...this.formData,
        number: parseInt(this.formData.number),
        capacity: parseInt(this.formData.capacity),
        id: this.isEditing ? this.table.id : Date.now(),
        lastUpdated: new Date().toISOString()
      }
      
      if (!this.isEditing) {
        tableData.status = 'available'
        tableData.currentOrder = null
        tableData.reservation = null
      }
      
      this.$emit('save', tableData)
    }
  }
}
</script>

<style scoped>
.add-table-form {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  max-width: 500px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.form-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.form-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

.form-control:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn--primary {
  background: #007bff;
  color: white;
}

.btn--primary:hover {
  background: #0056b3;
}

.btn--outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn--outline:hover {
  background: #007bff;
  color: white;
}

@media (max-width: 768px) {
  .add-table-form {
    margin: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
