import { createStore } from 'vuex'
import tables from './modules/tables'
import notifications from './modules/notifications'
import orders from './modules/orders'
import waiterCalls from './modules/waiterCalls'
import menu from './modules/menu'
import auth from './modules/auth'
import shifts from './modules/shifts'

export default createStore({
  modules: {
    tables,
    notifications,
    orders,
    waiterCalls,
    menu,
    auth,
    shifts
  },
  
  state: {
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    SET_LOADING(state, loading) {
      state.isLoading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    CLEAR_AUTH(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
    }
  },
  
  actions: {
    logout({ commit }) {
      commit('CLEAR_AUTH')
    }
  },
  
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user
  }
})