import axios from 'axios'

const state = {
  currentShift: null,
  shiftHistory: [],
  isLoading: false,
  error: null
}

const getters = {
  isShiftActive: (state) => {
    return state.currentShift && !state.currentShift.endTime
  },
  shiftStartTime: (state) => {
    return state.currentShift ? state.currentShift.startTime : null
  },
  shiftEndTime: (state) => {
    return state.currentShift ? state.currentShift.endTime : null
  },
  currentShiftDuration: (state) => {
    if (!state.currentShift || !state.currentShift.startTime) return 0
    
    const startTime = new Date(state.currentShift.startTime)
    const endTime = state.currentShift.endTime ? new Date(state.currentShift.endTime) : new Date()
    
    return endTime - startTime
  }
}

const mutations = {
  SET_CURRENT_SHIFT(state, shift) {
    state.currentShift = shift
  },
  SET_SHIFT_HISTORY(state, history) {
    state.shiftHistory = history
  },
  SET_LOADING(state, loading) {
    state.isLoading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  UPDATE_SHIFT_DURATION(state) {
    if (state.currentShift && !state.currentShift.endTime) {
      // Vardiya süresini güncelle (gerçek zamanlı)
      state.currentShift.duration = getters.currentShiftDuration(state)
    }
  }
}

const actions = {
  async fetchShiftStatus({ commit }) {
    try {
      commit('SET_LOADING', true)
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }
      
      const response = await axios.get(`http://localhost:3000/api/employee/shift/status/${user.id}`)
      
      if (response.data.success) {
        commit('SET_CURRENT_SHIFT', response.data.shift)
      }
    } catch (error) {
      console.error('Vardiya durumu yüklenirken hata:', error)
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async startShift({ commit }) {
    try {
      commit('SET_LOADING', true)
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }
      
      const response = await axios.post('http://localhost:3000/api/employee/shift/start', {
        employeeId: user.id,
        employeeName: user.name
      })
      
      if (response.data.success) {
        commit('SET_CURRENT_SHIFT', response.data.shift)
        // Vardiya başladığında localStorage'a kaydet
        localStorage.setItem('currentShift', JSON.stringify(response.data.shift))
      }
    } catch (error) {
      console.error('Vardiya başlatma hatası:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async endShift({ commit }) {
    try {
      commit('SET_LOADING', true)
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı')
      }
      
      const response = await axios.post('http://localhost:3000/api/employee/shift/end', {
        employeeId: user.id
      })
      
      if (response.data.success) {
        commit('SET_CURRENT_SHIFT', response.data.shift)
        // Vardiya bittiğinde localStorage'dan temizle
        localStorage.removeItem('currentShift')
      }
    } catch (error) {
      console.error('Vardiya bitirme hatası:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async fetchShiftHistory({ commit }, { employeeId, startDate, endDate }) {
    try {
      commit('SET_LOADING', true)
      
      const response = await axios.get(`http://localhost:3000/api/employee/performance/${employeeId}`, {
        params: { startDate, endDate }
      })
      
      if (response.data.success) {
        commit('SET_SHIFT_HISTORY', response.data.shifts)
      }
    } catch (error) {
      console.error('Vardiya geçmişi yüklenirken hata:', error)
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  initializeSocket({ commit }) {
    // Gerçek zamanlı güncellemeler için WebSocket bağlantısı
    // Şimdilik sadece localStorage event listener kullanıyoruz
    window.addEventListener('storage', (event) => {
      if (event.key === 'currentShift') {
        const shift = event.newValue ? JSON.parse(event.newValue) : null
        commit('SET_CURRENT_SHIFT', shift)
      }
    })
  },
  
  disconnectSocket() {
    // WebSocket bağlantısını kapat
    // Şimdilik localStorage event listener'ı temizlemiyoruz
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 