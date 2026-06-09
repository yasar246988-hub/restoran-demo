import axios from 'axios'

const state = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

const getters = {
  isAuthenticated: (state) => {
    return state.isAuthenticated && state.user !== null
  },
  currentUser: (state) => {
    return state.user
  },
  userRole: (state) => {
    return state.user ? state.user.role : null
  },
  isEmployee: (state) => {
    return state.user && (state.user.role === 'calisan' || state.user.role === 'yonetici')
  },
  isManager: (state) => {
    return state.user && state.user.role === 'yonetici'
  },
  isCEO: (state) => {
    return state.user && state.user.role === 'ceo'
  },
  isAdmin: (state) => {
    return state.user && (state.user.role === 'yonetici' || state.user.role === 'ceo')
  }
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
    state.isAuthenticated = !!user
  },
  SET_LOADING(state, loading) {
    state.isLoading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  CLEAR_ERROR(state) {
    state.error = null
  }
}

const actions = {
  async login({ commit }, credentials) {
    try {
      commit('SET_LOADING', true)
      commit('CLEAR_ERROR')
      
      const response = await axios.post('http://localhost:3000/api/auth/login', credentials)
      
      if (response.data.success) {
        const user = response.data.user
        commit('SET_USER', user)
        
        // localStorage'a kullanıcı bilgilerini kaydet
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', response.data.token)
        
        return user
      }
    } catch (error) {
      console.error('Giriş hatası:', error)
      const errorMessage = error.response?.data?.message || 'Giriş yapılamadı'
      commit('SET_ERROR', errorMessage)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async logout({ commit }) {
    try {
      // Backend'e logout isteği gönder
      await axios.post('http://localhost:3000/api/auth/logout')
    } catch (error) {
      console.error('Logout hatası:', error)
    } finally {
      // Local state'i temizle
      commit('SET_USER', null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('currentShift')
    }
  },
  
  async checkAuth({ commit }) {
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      
      if (token && user) {
        // Token'ı doğrula
        const response = await axios.get('http://localhost:3000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          commit('SET_USER', user)
          return user
        }
      }
      
      // Geçersiz token veya kullanıcı
      commit('SET_USER', null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('currentShift')
      
    } catch (error) {
      console.error('Kimlik doğrulama hatası:', error)
      commit('SET_USER', null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('currentShift')
    }
  },
  
  async fetchUserProfile({ commit }) {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/user')
      
      if (response.data.success) {
        const user = response.data.user
        commit('SET_USER', user)
        localStorage.setItem('user', JSON.stringify(user))
        return user
      }
    } catch (error) {
      console.error('Kullanıcı profili yüklenirken hata:', error)
      commit('SET_ERROR', error.message)
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