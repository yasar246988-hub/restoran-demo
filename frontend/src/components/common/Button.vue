<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
    <i v-else-if="icon" :class="icon"></i>
    <span v-if="$slots.default || text" class="button-text">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AppButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline', 'ghost'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: null
    },
    text: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value)
    },
    block: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const buttonClasses = computed(() => {
      return [
        'btn',
        `btn--${props.variant}`,
        `btn--${props.size}`,
        {
          'btn--block': props.block,
          'btn--loading': props.loading,
          'btn--icon-only': props.icon && !props.text && !props.$slots.default
        }
      ]
    })
    
    const handleClick = (event) => {
      if (!props.disabled && !props.loading) {
        emit('click', event)
      }
    }
    
    return {
      buttonClasses,
      handleClick
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  // Sizes
  &--small {
    padding: 6px 12px;
    font-size: 12px;
    
    &.btn--icon-only {
      padding: 6px;
      width: 28px;
      height: 28px;
    }
  }
  
  &--medium {
    padding: 10px 16px;
    font-size: 14px;
    
    &.btn--icon-only {
      padding: 10px;
      width: 36px;
      height: 36px;
    }
  }
  
  &--large {
    padding: 14px 24px;
    font-size: 16px;
    
    &.btn--icon-only {
      padding: 14px;
      width: 48px;
      height: 48px;
    }
  }
  
  // Variants
  &--primary {
    background: $primary-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: darken($primary-color, 8%);
    }
    
    &:active {
      background: darken($primary-color, 12%);
    }
  }
  
  &--secondary {
    background: $secondary-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: darken($secondary-color, 8%);
      }
    
    &:active {
      background: darken($secondary-color, 12%);
    }
  }
  
  &--success {
    background: $success-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: darken($success-color, 8%);
    }
  }
  
  &--danger {
    background: $error-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: darken($error-color, 8%);
    }
  }
  
  &--warning {
    background: $warning-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: darken($warning-color, 8%);
    }
  }
  
  &--info {
    background: $info-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: darken($info-color, 8%);
    }
  }
  
  &--outline {
    background: transparent;
    border-color: $primary-color;
    color: $primary-color;
    
    &:hover:not(:disabled) {
      background: $primary-color;
      color: white;
    }
  }
  
  &--ghost {
    background: transparent;
    color: $primary-color;
    
    &:hover:not(:disabled) {
      background: rgba($primary-color, 0.1);
    }
  }
  
  // Modifiers
  &--block {
    width: 100%;
  }
  
  &--loading {
    pointer-events: none;
  }
}

.button-text {
  line-height: 1;
}
</style> 