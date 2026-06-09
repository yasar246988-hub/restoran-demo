<template>
  <div :class="alertClasses" v-show="visible">
    <div class="alert-icon">
      <i :class="iconClass"></i>
    </div>
    <div class="alert-content">
      <h4 v-if="title" class="alert-title">{{ title }}</h4>
      <div class="alert-message">
        <slot>{{ message }}</slot>
      </div>
    </div>
    <button v-if="dismissible" @click="dismiss" class="alert-close">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'Alert',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: value => ['success', 'error', 'warning', 'info'].includes(value)
    },
    title: {
      type: String,
      default: null
    },
    message: {
      type: String,
      default: ''
    },
    dismissible: {
      type: Boolean,
      default: false
    },
    autoDismiss: {
      type: Number,
      default: null
    }
  },
  emits: ['dismiss'],
  setup(props, { emit }) {
    const visible = ref(true)
    
    const alertClasses = computed(() => [
      'alert',
      `alert--${props.type}`
    ])
    
    const iconClass = computed(() => {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      }
      return icons[props.type]
    })
    
    const dismiss = () => {
      visible.value = false
      emit('dismiss')
    }
    
    onMounted(() => {
      if (props.autoDismiss) {
        setTimeout(() => {
          dismiss()
        }, props.autoDismiss)
      }
    })
    
    return {
      visible,
      alertClasses,
      iconClass,
      dismiss
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  
  &--success {
    background: rgba($success-color, 0.1);
    border-color: rgba($success-color, 0.3);
    color: darken($success-color, 10%);
  }
  
  &--error {
    background: rgba($error-color, 0.1);
    border-color: rgba($error-color, 0.3);
    color: darken($error-color, 10%);
  }
  
  &--warning {
    background: rgba($warning-color, 0.1);
    border-color: rgba($warning-color, 0.3);
    color: darken($warning-color, 10%);
  }
  
  &--info {
    background: rgba($info-color, 0.1);
    border-color: rgba($info-color, 0.3);
    color: darken($info-color, 10%);
  }
}

.alert-icon {
  font-size: 18px;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
  
  .alert-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .alert-message {
    margin: 0;
    line-height: 1.5;
  }
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  padding: 0;
  font-size: 14px;
  
  &:hover {
    opacity: 1;
  }
}
</style> 