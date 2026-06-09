<template>
  <div class="table-details">
    <div class="details-header">
      <h3>Masa {{ table.number }} Detayları</h3>
      <button @click="$emit('close')" class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="details-content">
      <div class="detail-item">
        <label>Masa Numarası:</label>
        <span>{{ table.number }}</span>
      </div>
      
      <div class="detail-item">
        <label>Kapasite:</label>
        <span>{{ table.capacity }} kişi</span>
      </div>
      
      <div class="detail-item">
        <label>Durum:</label>
        <span :class="['status-badge', table.status]">
          {{ getStatusText(table.status) }}
        </span>
      </div>
      
      <div class="detail-item" v-if="table.currentOrder">
        <label>Aktif Sipariş:</label>
        <span>#{{ table.currentOrder.id }}</span>
      </div>
      
      <div class="detail-item" v-if="table.reservation">
        <label>Rezervasyon:</label>
        <span>{{ table.reservation.customerName }} - {{ table.reservation.time }}</span>
      </div>
      
      <div class="detail-item">
        <label>Son Güncelleme:</label>
        <span>{{ formatDate(table.lastUpdated) }}</span>
      </div>
    </div>
    
    <div class="details-actions">
      <button v-if="table.status === 'available'" @click="reserveTable" class="btn btn--primary">
        <i class="fas fa-calendar"></i>
        Rezerve Et
      </button>
      <button v-if="table.status === 'occupied'" @click="clearTable" class="btn btn--danger">
        <i class="fas fa-broom"></i>
        Masayı Temizle
      </button>
      <button @click="editTable" class="btn btn--outline">
        <i class="fas fa-edit"></i>
        Düzenle
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableDetails',
  props: {
    table: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'reserve', 'clear', 'edit'],
  methods: {
    getStatusText(status) {
      const statusMap = {
        'available': 'Müsait',
        'occupied': 'Dolu',
        'reserved': 'Rezerve',
        'cleaning': 'Temizleniyor'
      }
      return statusMap[status] || status
    },
    
    formatDate(date) {
      return new Date(date).toLocaleString('tr-TR')
    },
    
    reserveTable() {
      this.$emit('reserve', this.table)
    },
    
    clearTable() {
      this.$emit('clear', this.table)
    },
    
    editTable() {
      this.$emit('edit', this.table)
    }
  }
}
</script>

<style scoped>
.table-details {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.details-header h3 {
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

.details-content {
  padding: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: 500;
  color: #666;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.available {
  background: #d4edda;
  color: #155724;
}

.status-badge.occupied {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.reserved {
  background: #fff3cd;
  color: #856404;
}

.status-badge.cleaning {
  background: #d1ecf1;
  color: #0c5460;
}

.details-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.5rem 1rem;
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

.btn--danger {
  background: #dc3545;
  color: white;
}

.btn--danger:hover {
  background: #c82333;
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
</style>
