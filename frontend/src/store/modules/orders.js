import apiService from '../../services/api'
import socketService from '../../services/socket'

const state = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null
}

const getters = {
  allOrders: (state) => state.orders,
  ordersByStatus: (state) => (status) => {
    return state.orders.filter(order => order.status === status)
  },
  pendingOrders: (state) => {
    return state.orders.filter(order => order.status === 'pending')
  },
  preparingOrders: (state) => {
    return state.orders.filter(order => order.status === 'preparing')
  },
  readyOrders: (state) => {
    return state.orders.filter(order => order.status === 'ready')
  },
  deliveredOrders: (state) => {
    return state.orders.filter(order => order.status === 'delivered')
  },
  recentOrders: (state) => {
    return state.orders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  },
  todaysOrders: (state) => {
    const today = new Date().toDateString()
    return state.orders.filter(order => {
      return new Date(order.createdAt).toDateString() === today
    })
  }
}

const mutations = {
  SET_ORDERS(state, orders) {
    state.orders = orders
  },
  ADD_ORDER(state, order) {
    // Check if order already exists
    const existingIndex = state.orders.findIndex(o => o.id === order.id)
    if (existingIndex !== -1) {
      // Update existing order
      state.orders.splice(existingIndex, 1, order)
    } else {
      // Add new order
      state.orders.unshift(order)
    }
  },
  UPDATE_ORDER(state, updatedOrder) {
    const index = state.orders.findIndex(order => order.id === updatedOrder.id)
    if (index !== -1) {
      state.orders.splice(index, 1, updatedOrder)
    }
  },
  REMOVE_ORDER(state, orderId) {
    state.orders = state.orders.filter(order => order.id !== orderId)
  },
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async fetchOrders({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await apiService.getOrders()
      commit('SET_ORDERS', response.orders || [])
    } catch (error) {
      console.error('Fetch orders error:', error)
      commit('SET_ERROR', 'Siparişler yüklenirken hata oluştu')
      commit('SET_ORDERS', []) // Hata durumunda boş array
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createOrder({ commit }, orderData) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await apiService.createOrder(orderData)
      
      if (response.success && response.order) {
        commit('ADD_ORDER', response.order)
        socketService.emitNewOrder(response.order)
        return { success: true, order: response.order }
      } else {
        commit('SET_ERROR', response.error || 'Sipariş oluşturulurken hata oluştu')
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Create order error:', error)
      commit('SET_ERROR', 'Sipariş oluşturulurken hata oluştu')
      return { success: false, error: error.message }
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateOrder({ commit }, { orderId, updateData }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await apiService.updateOrder(orderId, updateData)
      
      if (response.success && response.order) {
        commit('UPDATE_ORDER', response.order)
        socketService.emitOrderUpdate(response.order)
        return { success: true, order: response.order }
      } else {
        commit('SET_ERROR', response.error || 'Sipariş güncellenirken hata oluştu')
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Update order error:', error)
      commit('SET_ERROR', 'Sipariş güncellenirken hata oluştu')
      return { success: false, error: error.message }
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async deleteOrder({ commit }, orderId) {
    try {
      const response = await apiService.deleteOrder(orderId)
      
      if (response.success) {
        commit('REMOVE_ORDER', orderId)
        return { success: true }
      } else {
        commit('SET_ERROR', response.error || 'Sipariş silinirken hata oluştu')
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Delete order error:', error)
      commit('SET_ERROR', 'Sipariş silinirken hata oluştu')
      return { success: false, error: error.message }
    }
  },

  // Socket events (optional, graceful degradation)
  initializeSocket({ commit }) {
    try {
      const socket = socketService.connect()
      
      if (socket) {
        // Listen for new orders from other clients
        socketService.onNewOrder((order) => {
          console.log('📋 New order received via socket:', order)
          commit('ADD_ORDER', order)
        })
        
        // Listen for order updates
        socketService.onOrderUpdate((order) => {
          console.log('✏️ Order updated via socket:', order)
          commit('UPDATE_ORDER', order)
        })
      }
    } catch (error) {
      console.log('⚠️ Socket connection failed, continuing without real-time updates')
    }
  },

  disconnectSocket() {
    try {
      socketService.disconnect()
    } catch (error) {
      console.log('Socket disconnect error (ignored)')
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
