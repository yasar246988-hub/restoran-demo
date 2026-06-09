import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// API methods
const apiService = {
  // Orders
  async getOrders() {
    try {
      return await api.get('/orders')
    } catch (error) {
      console.error('Get orders error:', error)
      return { success: false, orders: [] }
    }
  },

  async createOrder(orderData) {
    try {
      return await api.post('/orders', orderData)
    } catch (error) {
      console.error('Create order error:', error)
      return { success: false, error: error.message }
    }
  },

  async updateOrder(orderId, updateData) {
    try {
      return await api.put(`/orders/${orderId}`, updateData)
    } catch (error) {
      console.error('Update order error:', error)
      return { success: false, error: error.message }
    }
  },

  async deleteOrder(orderId) {
    try {
      return await api.delete(`/orders/${orderId}`)
    } catch (error) {
      console.error('Delete order error:', error)
      return { success: false, error: error.message }
    }
  },

  // Tables
  async getTables() {
    try {
      return await api.get('/tables')
    } catch (error) {
      console.error('Get tables error:', error)
      return { success: false, tables: [] }
    }
  },

  async updateTable(tableId, updateData) {
    try {
      return await api.put(`/tables/${tableId}`, updateData)
    } catch (error) {
      console.error('Update table error:', error)
      return { success: false, error: error.message }
    }
  },

  // Menu
  async getMenu() {
    try {
      return await api.get('/menu')
    } catch (error) {
      console.error('Get menu error:', error)
      return { success: false, menu: [] }
    }
  },

  async createMenuItem(itemData) {
    try {
      return await api.post('/menu', itemData)
    } catch (error) {
      console.error('Create menu item error:', error)
      return { success: false, error: error.message }
    }
  },

  async updateMenuItem(itemId, updateData) {
    try {
      return await api.put(`/menu/${itemId}`, updateData)
    } catch (error) {
      console.error('Update menu item error:', error)
      return { success: false, error: error.message }
    }
  },

  async deleteMenuItem(itemId) {
    try {
      return await api.delete(`/menu/${itemId}`)
    } catch (error) {
      console.error('Delete menu item error:', error)
      return { success: false, error: error.message }
    }
  },

  // Categories
  async getCategories() {
    try {
      return await api.get('/categories')
    } catch (error) {
      console.error('Get categories error:', error)
      return { success: false, categories: [] }
    }
  },

  // Statistics/Reports
  async getStatistics() {
    try {
      return await api.get('/statistics')
    } catch (error) {
      console.error('Get statistics error:', error)
      return { 
        success: false, 
        stats: {
          todayOrders: 0,
          activeTables: 0,
          totalTables: 0,
          dailyRevenue: 0,
          kitchenOrders: 0
        }
      }
    }
  },

  // Waiter calls
  async callWaiter(tableId, message) {
    try {
      return await api.post('/waiter-calls', { tableId, message })
    } catch (error) {
      console.error('Call waiter error:', error)
      return { success: false, error: error.message }
    }
  },

  async getWaiterCalls() {
    try {
      return await api.get('/waiter-calls')
    } catch (error) {
      console.error('Get waiter calls error:', error)
      return { success: false, calls: [] }
    }
  },

  async markWaiterCallHandled(callId) {
    try {
      return await api.put(`/waiter-calls/${callId}/handled`)
    } catch (error) {
      console.error('Mark waiter call handled error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default apiService
