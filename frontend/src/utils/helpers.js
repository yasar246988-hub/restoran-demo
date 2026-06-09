import moment from 'moment'

// Date/Time helpers
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return ''
  return moment(date).format(format)
}

export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return ''
  return moment(date).format(format)
}

export const formatTime = (date, format = 'HH:mm') => {
  if (!date) return ''
  return moment(date).format(format)
}

export const getElapsedTime = (startTime) => {
  if (!startTime) return ''
  return moment(startTime).fromNow()
}

export const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return ''
  const start = moment(startTime)
  const end = moment(endTime)
  const duration = moment.duration(end.diff(start))
  
  if (duration.asHours() >= 1) {
    return `${Math.floor(duration.asHours())}s ${duration.minutes()}dk`
  }
  return `${duration.minutes()}dk ${duration.seconds()}sn`
}

// Currency helpers
export const formatCurrency = (amount, currency = '₺') => {
  if (amount === null || amount === undefined) return ''
  return `${parseFloat(amount).toFixed(2)}${currency}`
}

export const parseCurrency = (value) => {
  if (!value) return 0
  return parseFloat(value.toString().replace(/[^\d.-]/g, ''))
}

// Number helpers
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return ''
  return Number(number).toFixed(decimals)
}

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return ''
  return `${(value * 100).toFixed(decimals)}%`
}

// String helpers
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncate = (str, length = 100, suffix = '...') => {
  if (!str || str.length <= length) return str
  return str.substring(0, length) + suffix
}

export const slugify = (str) => {
  if (!str) return ''
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

// Array helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (direction === 'desc') {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
  })
}

export const unique = (array, key = null) => {
  if (key) {
    const seen = new Set()
    return array.filter(item => {
      const value = item[key]
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
  }
  return [...new Set(array)]
}

// Object helpers
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const cloned = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

export const omit = (obj, keys) => {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export const pick = (obj, keys) => {
  const result = {}
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key]
  })
  return result
}

// Status helpers
export const getStatusColor = (status) => {
  const colors = {
    active: '#27ae60',
    inactive: '#95a5a6',
    pending: '#f39c12',
    completed: '#27ae60',
    cancelled: '#e74c3c',
    available: '#27ae60',
    occupied: '#e74c3c',
    reserved: '#f39c12',
    maintenance: '#95a5a6',
    preparing: '#f39c12',
    ready: '#27ae60',
    served: '#95a5a6'
  }
  return colors[status] || '#95a5a6'
}

export const getStatusText = (status, type = 'general') => {
  const texts = {
    general: {
      active: 'Aktif',
      inactive: 'Pasif',
      pending: 'Bekliyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal'
    },
    table: {
      available: 'Boş',
      occupied: 'Dolu',
      reserved: 'Rezerve',
      maintenance: 'Bakım'
    },
    order: {
      active: 'Aktif',
      completed: 'Tamamlandı',
      cancelled: 'İptal'
    },
    item: {
      pending: 'Bekliyor',
      preparing: 'Hazırlanıyor',
      ready: 'Hazır',
      served: 'Servis Edildi'
    }
  }
  return texts[type]?.[status] || status
}

// Role helpers
export const getRoleText = (role) => {
  const roles = {
    admin: 'Yönetici',
    manager: 'Müdür',
    waiter: 'Garson',
    kitchen: 'Mutfak'
  }
  return roles[role] || role
}

export const getRoleColor = (role) => {
  const colors = {
    admin: '#e74c3c',
    manager: '#9b59b6',
    waiter: '#3498db',
    kitchen: '#f39c12'
  }
  return colors[role] || '#95a5a6'
}

// File helpers
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  return imageExtensions.includes(getFileExtension(filename))
}

// Local Storage helpers
export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export const getStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

// URL helpers
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl)
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key])
    }
  })
  return url.toString()
}

export const getUrlParams = () => {
  const params = {}
  const searchParams = new URLSearchParams(window.location.search)
  for (const [key, value] of searchParams) {
    params[key] = value
  }
  return params
}

// Debounce helper
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle helper
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Random helpers
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Color helpers
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Device detection
export const isMobile = () => {
  return window.innerWidth <= 768
}

export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024
}

export const isDesktop = () => {
  return window.innerWidth > 1024
}

// Browser helpers
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

export const downloadFile = (data, filename, type = 'text/plain') => {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

export const printContent = (content) => {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
} 