<template>
  <div 
    :class="['table-card', `table-card--${table.status}`]"
    @click="$emit('select', table)"
  >
    <div class="table-header">
      <div class="table-number">{{ table.number }}</div>
      <div class="table-capacity">
        <i class="fas fa-users"></i>
        {{ table.capacity }}
      </div>
    </div>
    
    <div class="table-status">
      <span :class="`status-badge status-badge--${table.status}`">
        {{ getStatusText(table.status) }}
      </span>
    </div>
    
    <div v-if="table.currentOrder" class="current-order">
      <div class="order-info">
        <span class="order-number">{{ table.currentOrder.orderNumber }}</span>
        <span class="order-time">{{ getElapsedTime(table.currentOrder.createdAt) }}</span>
      </div>
      <div class="order-total">{{ table.currentOrder.totalAmount }}₺</div>
    </div>
    
    <div v-if="table.reservation" class="reservation-info">
      <div class="reservation-details">
        <span class="customer-name">{{ table.reservation.customerName }}</span>
        <span class="reservation-time">{{ formatTime(table.reservation.time) }}</span>
      </div>
    </div>
    
    <div v-if="table.callWaiter?.isActive" class="waiter-call">
      <i class="fas fa-bell"></i>
      <span>Garson Çağrılıyor</span>
    </div>
    
    <div class="table-actions">
      <button 
        v-if="table.status === 'available'"
        @click.stop="$emit('status-change', table, 'occupied')"
        class="action-btn action-btn--primary"
      >
        <i class="fas fa-users"></i>
        Oturtur
      </button>
      
      <button 
        v-if="table.status === 'occupied'"
        @click.stop="$emit('status-change', table, 'available')"
        class="action-btn action-btn--success"
      >
        <i class="fas fa-check"></i>
        Kaldır
      </button>
      
      <button 
        v-if="table.status === 'available'"
        @click.stop="$emit('reserve', table)"
        class="action-btn action-btn--warning"
      >
        <i class="fas fa-bookmark"></i>
        Rezerve
      </button>
      
      <button 
        @click.stop="$emit('call-waiter', table)"
        class="action-btn action-btn--secondary"
      >
        <i class="fas fa-bell"></i>
        Garson
      </button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'TableCard',
  props: {
    table: {
      type: Object,
      required: true
    }
  },
  emits: ['select', 'status-change', 'call-waiter', 'reserve'],
  setup() {
    const getStatusText = (status) => {
      const statuses = {
        available: 'Boş',
        occupied: 'Dolu',
        reserved: 'Rezerve',
        maintenance: 'Bakım'
      }
      return statuses[status] || status
    }
    
    const getElapsedTime = (createdAt) => {
      return moment(createdAt).fromNow()
    }
    
    const formatTime = (time) => {
      return moment(time).format('HH:mm')
    }
    
    return {
      getStatusText,
      getElapsedTime,
      formatTime
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

.table-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  &--available {
    border-left: 4px solid $success-color;
  }
  
  &--occupied {
    border-left: 4px solid $error-color;
  }
  
  &--reserved {
    border-left: 4px solid $warning-color;
  }
  
  &--maintenance {
    border-left: 4px solid $text-secondary;
    opacity: 0.7;
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  .table-number {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
  }
  
  .table-capacity {
    display: flex;
    align-items: center;
    gap: 6px;
    color: $text-secondary;
    font-size: 14px;
  }
}

.table-status {
  margin-bottom: 15px;
  
  .status-badge {
    &--available { 
      background: rgba($success-color, 0.1);
      color: $success-color;
    }
    &--occupied { 
      background: rgba($error-color, 0.1);
      color: $error-color;
    }
    &--reserved { 
      background: rgba($warning-color, 0.1);
      color: $warning-color;
    }
    &--maintenance { 
      background: rgba($text-secondary, 0.1);
      color: $text-secondary;
    }
  }
}

.current-order {
  background: $bg-light;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  
  .order-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .order-number {
      font-weight: 600;
      color: $text-primary;
    }
    
    .order-time {
      font-size: 12px;
      color: $text-secondary;
    }
  }
  
  .order-total {
    font-size: 16px;
    font-weight: 600;
    color: $primary-color;
  }
}

.reservation-info {
  background: rgba($warning-color, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  
  .reservation-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .customer-name {
      font-weight: 600;
      color: $text-primary;
    }
    
    .reservation-time {
      font-size: 12px;
      color: $text-secondary;
    }
  }
}

.waiter-call {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba($error-color, 0.1);
  color: $error-color;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 12px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

.table-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  
  i {
    font-size: 14px;
  }
  
  &--primary {
    background: $primary-color;
    color: white;
    
    &:hover {
      background: darken($primary-color, 10%);
    }
  }
  
  &--success {
    background: $success-color;
    color: white;
    
    &:hover {
      background: darken($success-color, 10%);
    }
  }
  
  &--warning {
    background: $warning-color;
    color: white;
    
    &:hover {
      background: darken($warning-color, 10%);
    }
  }
  
  &--secondary {
    background: $text-secondary;
    color: white;
    
    &:hover {
      background: darken($text-secondary, 10%);
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style> 