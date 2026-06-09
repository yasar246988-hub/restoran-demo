import apiService from '../../services/api'
import socketService from '../../services/socket'

const state = {
  waiterCalls: [],
  loading: false,
  error: null
}

const getters = {
  allWaiterCalls: (state) => state.waiterCalls,
  pendingCalls: (state) => {
    return state.waiterCalls.filter(call => !call.handled)
  },
  handledCalls: (state) => {
    return state.waiterCalls.filter(call => call.handled)
  },
  callsCount: (state) => {
    return state.waiterCalls.filter(call => !call.handled).length
  },
  recentCalls: (state) => {
    return state.waiterCalls
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
  }
}

const mutations = {
  SET_WAITER_CALLS(state, calls) {
    state.waiterCalls = calls
  },
  ADD_WAITER_CALL(state, call) {
    // Check if call already exists
    const existingIndex = state.waiterCalls.findIndex(c => c.id === call.id)
    if (existingIndex !== -1) {
      // Update existing call
      state.waiterCalls.splice(existingIndex, 1, call)
    } else {
      // Add new call
      state.waiterCalls.unshift(call)
    }
  },
  UPDATE_WAITER_CALL(state, updatedCall) {
    const index = state.waiterCalls.findIndex(call => call.id === updatedCall.id)
    if (index !== -1) {
      state.waiterCalls.splice(index, 1, updatedCall)
    }
  },
  REMOVE_WAITER_CALL(state, callId) {
    state.waiterCalls = state.waiterCalls.filter(call => call.id !== callId)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async fetchWaiterCalls({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await apiService.getWaiterCalls()
      commit('SET_WAITER_CALLS', response.calls || [])
    } catch (error) {
      console.error('Fetch waiter calls error:', error)
      commit('SET_ERROR', 'Garson çağrıları yüklenirken hata oluştu')
      commit('SET_WAITER_CALLS', [])
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async callWaiter({ commit }, { tableId, message = 'Garson çağrısı' }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Create waiter call
      const newCall = {
        id: 'CALL' + Date.now(),
        tableId,
        message,
        timestamp: new Date(),
        handled: false
      }

      const response = await apiService.callWaiter(tableId, message)
      
      if (response.success) {
        commit('ADD_WAITER_CALL', response.call || newCall)
        
        // Emit socket event for real-time updates
        socketService.emitWaiterCall(response.call || newCall)
        
        return { success: true, call: response.call || newCall }
      } else {
        // Even if API fails, add call locally and emit socket event
        commit('ADD_WAITER_CALL', newCall)
        socketService.emitWaiterCall(newCall)
        
        return { success: true, call: newCall }
      }
    } catch (error) {
      console.error('Call waiter error:', error)
      
      // Still create call locally for demo purposes
      const newCall = {
        id: 'CALL' + Date.now(),
        tableId,
        message,
        timestamp: new Date(),
        handled: false
      }
      
      commit('ADD_WAITER_CALL', newCall)
      socketService.emitWaiterCall(newCall)
      
      return { success: true, call: newCall }
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async markCallHandled({ commit }, callId) {
    try {
      const response = await apiService.markWaiterCallHandled(callId)
      
      if (response.success) {
        const updatedCall = { ...state.waiterCalls.find(c => c.id === callId), handled: true, handledAt: new Date() }
        commit('UPDATE_WAITER_CALL', updatedCall)
        return { success: true }
      } else {
        // Update locally even if API fails
        const existingCall = state.waiterCalls.find(c => c.id === callId)
        if (existingCall) {
          const updatedCall = { ...existingCall, handled: true, handledAt: new Date() }
          commit('UPDATE_WAITER_CALL', updatedCall)
        }
        
        commit('SET_ERROR', response.error || 'Çağrı işaretlenirken hata oluştu')
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Mark call handled error:', error)
      commit('SET_ERROR', 'Çağrı işaretlenirken hata oluştu')
      return { success: false, error: error.message }
    }
  },

  // Socket events (optional, graceful degradation)
  initializeSocket({ commit }) {
    try {
      const socket = socketService.connect()
      
      if (socket) {
        // Listen for waiter calls from customers
        socketService.onWaiterCall((call) => {
          console.log('🔔 Waiter call received via socket:', call)
          const newCall = {
            id: call.id || 'CALL' + Date.now(),
            tableId: call.tableId,
            message: call.message,
            timestamp: call.timestamp || new Date(),
            handled: false
          }
          commit('ADD_WAITER_CALL', newCall)
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
