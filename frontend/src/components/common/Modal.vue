<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" :class="modalClass">
      <div class="modal-header">
        <slot name="header">
          <h3>Modal Title</h3>
        </slot>
        <button @click="$emit('close')" class="modal-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <slot name="body">
          <p>Modal content goes here.</p>
        </slot>
      </div>
      
      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, computed } from 'vue'

export default {
  name: 'Modal',
  props: {
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large', 'extra-large'].includes(value)
    },
    closable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && props.closable) {
        emit('close')
      }
    }
    
    const modalClass = computed(() => `modal--${props.size}`)
    
    onMounted(() => {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    })
    
    return {
      modalClass
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
  
  &--small {
    width: 100%;
    max-width: 400px;
  }
  
  &--medium {
    width: 100%;
    max-width: 600px;
  }
  
  &--large {
    width: 100%;
    max-width: 800px;
  }
  
  &--extra-large {
    width: 100%;
    max-width: 1200px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid $border-color;
  
  h3 {
    margin: 0;
    color: $text-primary;
    font-size: 18px;
    font-weight: 600;
  }
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: $text-secondary;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
  
  &:hover {
    background: $bg-light;
    color: $text-primary;
  }
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid $border-color;
  background: $bg-light;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal {
    &--small,
    &--medium,
    &--large,
    &--extra-large {
      max-width: 100%;
    }
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style> 