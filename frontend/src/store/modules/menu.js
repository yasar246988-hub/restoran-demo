import apiService from '../../services/api'

const state = {
  menuItems: [],
  categories: [],
  loading: false,
  error: null
}

const getters = {
  allMenuItems: (state) => state.menuItems,
  allCategories: (state) => state.categories,
  itemsByCategory: (state) => (categoryId) => {
    return state.menuItems.filter(item => item.categoryId === categoryId)
  },
  availableItems: (state) => {
    return state.menuItems.filter(item => item.available)
  }
}

const mutations = {
  SET_MENU_ITEMS(state, items) {
    state.menuItems = items || []
  },
  SET_CATEGORIES(state, categories) {
    state.categories = categories || []
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async getMenu({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await apiService.getMenu()
      
      if (response.success) {
        commit('SET_MENU_ITEMS', response.menu || response.items || [])
        
        // Extract categories if available
        if (response.categories) {
          commit('SET_CATEGORIES', response.categories)
        }
        
        return { 
          success: true, 
          items: response.menu || response.items || [],
          categories: response.categories || []
        }
      } else {
        commit('SET_ERROR', 'Menu yüklenemedi')
        return { success: false, error: 'Menu yüklenemedi' }
      }
    } catch (error) {
      console.error('Get menu error:', error)
      commit('SET_ERROR', 'Menu yüklenirken hata oluştu')
      return { success: false, error: error.message }
    } finally {
      commit('SET_LOADING', false)
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
