import apiService from '../../services/api'
import socketService from '../../services/socket'

const state = {
  tables: [],
  loading: false,
  error: null
}

const getters = {
  allTables: (state) => state.tables,
  activeTables: (state) => {
    return state.tables.filter(table => table.status === 'occupied')
  },
  availableTables: (state) => {
    return state.tables.filter(table => table.status === 'available')
  },
  reservedTables: (state) => {
    return state.tables.filter(table => table.status === 'reserved')
  },
  getTableById: (state) => (id) => {
    return state.tables.find(table => table.id === parseInt(id))
  }
}

const mutations = {
  SET_TABLES(state, tables) {
    state.tables = tables
  },
  ADD_TABLE(state, table) {
    const existingIndex = state.tables.findIndex(t => t.id === table.id)
    if (existingIndex !== -1) {
      state.tables.splice(existingIndex, 1, table)
    } else {
      state.tables.push(table)
    }
  },
  UPDATE_TABLE(state, updatedTable) {
    const index = state.tables.findIndex(table => table.id === updatedTable.id)
    if (index !== -1) {
      state.tables.splice(index, 1, updatedTable)
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async fetchTables({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await apiService.getTables()
      
      if (response.success) {
        commit('SET_TABLES', response.tables || [])
      } else {
        // Use mock data if API fails
        const mockTables = [
          {
            id: 1,
            number: 1,
            capacity: 4,
            status: 'available',
            currentOrder: null
          },
          {
            id: 2,
            number: 2,
            capacity: 2,
            status: 'occupied',
            currentOrder: 'ORD001'
          },
          {
            id: 3,
            number: 3,
            capacity: 6,
            status: 'available',
            currentOrder: null
          }
        ]
        commit('SET_TABLES', mockTables)
      }
    } catch (error) {
      console.error('Fetch tables error:', error)
      commit('SET_ERROR', 'Masalar yüklenirken hata oluştu')
      
      // Use mock data on error
      const mockTables = [
        {
          id: 1,
          number: 1,
          capacity: 4,
          status: 'available',
          currentOrder: null
        },
        {
          id: 2,
          number: 2,
          capacity: 2,
          status: 'occupied',
          currentOrder: 'ORD001'
        }
      ]
      commit('SET_TABLES', mockTables)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateTable({ commit }, { tableId, updateData }) {
    try {
      const response = await apiService.updateTable(tableId, updateData)
      
      if (response.success) {
        commit('UPDATE_TABLE', response.table)
        return { success: true, table: response.table }
      } else {
        commit('SET_ERROR', response.error || 'Masa güncellenirken hata oluştu')
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Update table error:', error)
      commit('SET_ERROR', 'Masa güncellenirken hata oluştu')
      return { success: false, error: error.message }
    }
  },

  // Socket events
  initializeSocket() {
    socketService.connect()
  },

  disconnectSocket() {
    socketService.disconnect()
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
