export default {
  namespaced: true,
  
  state: {
    notifications: []
  },

  mutations: {
    ADD_NOTIFICATION(state, notification) {
      const id = Date.now().toString()
      state.notifications.push({
        id,
        ...notification,
        timestamp: new Date().toISOString()
      })
    },
    
    REMOVE_NOTIFICATION(state, id) {
      const index = state.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        state.notifications.splice(index, 1)
      }
    },
    
    CLEAR_NOTIFICATIONS(state) {
      state.notifications = []
    }
  },

  actions: {
    add({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification)
      
      // Auto remove after 5 seconds for success/info, 10 seconds for error/warning
      const timeout = ['error', 'warning'].includes(notification.type) ? 10000 : 5000
      
      setTimeout(() => {
        commit('REMOVE_NOTIFICATION', notification.id)
      }, timeout)
    },
    
    remove({ commit }, id) {
      commit('REMOVE_NOTIFICATION', id)
    },
    
    clear({ commit }) {
      commit('CLEAR_NOTIFICATIONS')
    }
  },

  getters: {
    all: (state) => state.notifications,
    byType: (state) => (type) => state.notifications.filter(n => n.type === type)
  }
}
