// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone validation (Turkish format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+90|0)?[5][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Password strength validation
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: [],
    strength: 0
  }
  
  if (!password) {
    result.isValid = false
    result.errors.push('Şifre gereklidir')
    return result
  }
  
  if (password.length < 6) {
    result.isValid = false
    result.errors.push('Şifre en az 6 karakter olmalıdır')
  } else {
    result.strength += 1
  }
  
  if (password.length >= 8) {
    result.strength += 1
  }
  
  if (/[a-z]/.test(password)) {
    result.strength += 1
  }
  
  if (/[A-Z]/.test(password)) {
    result.strength += 1
  }
  
  if (/\d/.test(password)) {
    result.strength += 1
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.strength += 1
  }
  
  return result
}

// Required field validation
export const isRequired = (value, fieldName = 'Bu alan') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} gereklidir`
  }
  return null
}

// Minimum length validation
export const minLength = (value, min, fieldName = 'Bu alan') => {
  if (value && value.length < min) {
    return `${fieldName} en az ${min} karakter olmalıdır`
  }
  return null
}

// Maximum length validation
export const maxLength = (value, max, fieldName = 'Bu alan') => {
  if (value && value.length > max) {
    return `${fieldName} en fazla ${max} karakter olabilir`
  }
  return null
}

// Number validation
export const isNumber = (value, fieldName = 'Bu alan') => {
  if (value && isNaN(Number(value))) {
    return `${fieldName} geçerli bir sayı olmalıdır`
  }
  return null
}

// Minimum value validation
export const minValue = (value, min, fieldName = 'Bu alan') => {
  if (value && Number(value) < min) {
    return `${fieldName} en az ${min} olmalıdır`
  }
  return null
}

// Maximum value validation
export const maxValue = (value, max, fieldName = 'Bu alan') => {
  if (value && Number(value) > max) {
    return `${fieldName} en fazla ${max} olabilir`
  }
  return null
}

// Date validation
export const isValidDate = (date, fieldName = 'Tarih') => {
  if (!date) return null
  
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return `${fieldName} geçerli bir tarih olmalıdır`
  }
  return null
}

// Future date validation
export const isFutureDate = (date, fieldName = 'Tarih') => {
  if (!date) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const selectedDate = new Date(date)
  selectedDate.setHours(0, 0, 0, 0)
  
  if (selectedDate <= today) {
    return `${fieldName} gelecek bir tarih olmalıdır`
  }
  return null
}

// Past date validation
export const isPastDate = (date, fieldName = 'Tarih') => {
  if (!date) return null
  
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const selectedDate = new Date(date)
  
  if (selectedDate >= today) {
    return `${fieldName} geçmiş bir tarih olmalıdır`
  }
  return null
}

// Time validation
export const isValidTime = (time, fieldName = 'Saat') => {
  if (!time) return null
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(time)) {
    return `${fieldName} geçerli bir saat formatı olmalıdır (HH:MM)`
  }
  return null
}

// URL validation
export const isValidUrl = (url, fieldName = 'URL') => {
  if (!url) return null
  
  try {
    new URL(url)
    return null
  } catch {
    return `${fieldName} geçerli bir URL olmalıdır`
  }
}

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    fieldName = 'Dosya'
  } = options
  
  const errors = []
  
  if (!file) {
    errors.push(`${fieldName} seçmelisiniz`)
    return errors
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    errors.push(`${fieldName} boyutu ${maxSizeMB}MB'den küçük olmalıdır`)
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`${fieldName} türü desteklenmiyor`)
  }
  
  return errors
}

// Credit card validation
export const isValidCreditCard = (cardNumber) => {
  if (!cardNumber) return false
  
  // Remove spaces and dashes
  const cleanNumber = cardNumber.replace(/[\s-]/g, '')
  
  // Check if all digits
  if (!/^\d+$/.test(cleanNumber)) return false
  
  // Luhn algorithm
  let sum = 0
  let isEven = false
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Turkish ID validation
export const isValidTurkishId = (id) => {
  if (!id || id.length !== 11) return false
  
  const digits = id.split('').map(Number)
  
  // First digit cannot be 0
  if (digits[0] === 0) return false
  
  // Check sum of first 10 digits
  let sum1 = 0
  let sum2 = 0
  
  for (let i = 0; i < 10; i++) {
    sum1 += digits[i]
    if (i % 2 === 0) {
      sum2 += digits[i]
    }
  }
  
  // 10th digit check
  if ((sum2 * 7 - (sum1 - sum2)) % 10 !== digits[9]) return false
  
  // 11th digit check
  if (sum1 % 10 !== digits[10]) return false
  
  return true
}

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field]
    const fieldValue = data[field]
    const fieldErrors = []
    
    fieldRules.forEach(rule => {
      let error = null
      
      if (typeof rule === 'function') {
        error = rule(fieldValue)
      } else if (typeof rule === 'object') {
        const { validator, message, params } = rule
        if (params) {
          error = validator(fieldValue, ...params)
        } else {
          error = validator(fieldValue)
        }
        if (error && message) {
          error = message
        }
      }
      
      if (error) {
        fieldErrors.push(error)
      }
    })
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Password confirmation validation
export const confirmPassword = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Şifreler eşleşmiyor'
  }
  return null
}

// Age validation
export const isValidAge = (birthDate, minAge = 18, maxAge = 100) => {
  if (!birthDate) return 'Doğum tarihi gereklidir'
  
  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  
  if (age < minAge) {
    return `En az ${minAge} yaşında olmalısınız`
  }
  
  if (age > maxAge) {
    return `En fazla ${maxAge} yaşında olabilirsiniz`
  }
  
  return null
}

// Postal code validation (Turkish)
export const isValidPostalCode = (code) => {
  const postalRegex = /^[0-9]{5}$/
  if (!postalRegex.test(code)) {
    return 'Geçerli bir posta kodu giriniz (5 haneli)'
  }
  return null
}

// IBAN validation (Turkish)
export const isValidIban = (iban) => {
  if (!iban) return 'IBAN gereklidir'
  
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  
  // Turkish IBAN format: TR + 2 digits + 4 digits + 1 digit + 16 digits
  const turkishIbanRegex = /^TR\d{2}\d{4}\d{1}\d{16}$/
  
  if (!turkishIbanRegex.test(cleanIban)) {
    return 'Geçerli bir Türk IBAN\'ı giriniz'
  }
  
  return null
} 