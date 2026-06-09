export default {
  namespaced: true,
  
  state: {
    items: [],
    loading: false,
    error: null
  },

  getters: {
    allTables: (state) => state.items,
    activeTables: (state) => state.items.filter(table => table.status === 'occupied'),
    availableTables: (state) => state.items.filter(table => table.status === 'available'),
    reservedTables: (state) => state.items.filter(table => table.status === 'reserved'),
    isLoading: (state) => state.loading,
    error: (state) => state.error
  },

  mutations: {
    SET_TABLES(state, tables) {
      state.items = tables
    },
    
    ADD_TABLE(state, table) {
      state.items.push(table)
    },
    
    UPDATE_TABLE(state, updatedTable) {
      const index = state.items.findIndex(t => t._id === updatedTable._id)
      if (index !== -1) {
        state.items.splice(index, 1, updatedTable)
      }
    },
    
    DELETE_TABLE(state, tableId) {
      const index = state.items.findIndex(t => t._id === tableId)
      if (index !== -1) {
        state.items.splice(index, 1)
      }
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    async fetchTables({ commit }) {
      commit('SET_LOADING', true)
      try {
        // Mock data for now
        const mockTables = [
          {
            _id: '1',
            number: 1,
            capacity: 4,
            status: 'available',
            location: { x: 100, y: 150 },
            shape: 'square',
            currentOrder: null,
            reservation: null,
            waiterCall: null,
            lastCleaned: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            number: 2,
            capacity: 2,
            status: 'occupied',
            location: { x: 200, y: 150 },
            shape: 'round',
            currentOrder: {
              id: 'order_1',
              items: 3,
              total: 125.50,
              startTime: new Date(Date.now() - 45*60000).toISOString()
            },
            reservation: null,
            waiterCall: null,
            lastCleaned: new Date(Date.now() - 2*60*60000).toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            _id: '3',
            number: 3,
            capacity: 6,
            status: 'reserved',
            location: { x: 300, y: 150 },
            shape: 'rectangle',
            currentOrder: null,
            reservation: {
              customerName: 'Ahmet Yılmaz',
              time: new Date(Date.now() + 2*60*60000).toISOString(),
              guests: 4,
              phone: '0555 123 4567'
            },
            waiterCall: null,
            lastCleaned: new Date(Date.now() - 1*60*60000).toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            _id: '4',
            number: 4,
            capacity: 8,
            status: 'maintenance',
            location: { x: 100, y: 300 },
            shape: 'rectangle',
            currentOrder: null,
            reservation: null,
            waiterCall: null,
            lastCleaned: new Date(Date.now() - 4*60*60000).toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            _id: '5',
            number: 5,
            capacity: 2,
            status: 'available',
            location: { x: 200, y: 300 },
            shape: 'round',
            currentOrder: null,
            reservation: null,
            waiterCall: null,
            lastCleaned: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ]
        
        commit('SET_TABLES', mockTables)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async addTable({ commit }, tableData) {
      commit('SET_LOADING', true)
      try {
        // Mock API call
        const newTable = {
          _id: Date.now().toString(),
          ...tableData,
          status: 'available',
          currentOrder: null,
          reservation: null,
          waiterCall: null,
          lastCleaned: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
        
        commit('ADD_TABLE', newTable)
        return newTable
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async updateTable({ commit }, { id, data }) {
      commit('SET_LOADING', true)
      try {
        // Mock API call
        const updatedTable = { ...data, _id: id }
        commit('UPDATE_TABLE', updatedTable)
        return updatedTable
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async updateTableStatus({ commit }, { id, status }) {
      try {
        // Mock API call
        const updatedTable = { _id: id, status }
        commit('UPDATE_TABLE', updatedTable)
        return updatedTable
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    async deleteTable({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        // Mock API call
        commit('DELETE_TABLE', id)
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async callWaiter({ commit }, { id, reason }) {
      try {
        // Mock API call
        const updatedTable = { 
          _id: id, 
          waiterCall: {
            reason,
            time: new Date().toISOString(),
            resolved: false
          }
        }
        commit('UPDATE_TABLE', updatedTable)
        return updatedTable
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    }
  }
}
