/**
 * Socket.io Servisi — Gerçek Zamanlı Bağlantı
 *
 * Olaylar (backend → frontend):
 *   new_order      → Yeni sipariş geldi (mutfak, sipariş takibi, dashboard)
 *   order_updated  → Sipariş durumu değişti (mutfak, sipariş takibi)
 *   waiter_call    → Garson çağrısı (garson çağrıları, dashboard)
 *   table_update   → Masa durumu değişti (masa haritası, kasa)
 */

import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3000'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this._listeners = {}
  }

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    })

    this.socket.on('connect', () => {
      this.connected = true
      console.log('🔌 Socket bağlandı:', this.socket.id)
    })

    this.socket.on('disconnect', (reason) => {
      this.connected = false
      console.log('🔌 Socket ayrıldı:', reason)
    })

    this.socket.on('connect_error', () => {
      this.connected = false
      // Sessiz — polling yedek olarak çalışmaya devam eder
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected
  }

  // ---- Event Dinleme ----

  on(event, callback) {
    if (!this.socket) this.connect()
    this.socket.on(event, callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    this.socket?.off(event, callback)
  }

  // ---- Kısayollar ----

  onNewOrder(cb)     { return this.on('new_order', cb) }
  onOrderUpdated(cb) { return this.on('order_updated', cb) }
  onWaiterCall(cb)   { return this.on('waiter_call', cb) }
  onTableUpdate(cb)  { return this.on('table_update', cb) }
}

// Singleton — tüm uygulama tek bağlantı kullanır
const socketService = new SocketService()
export default socketService
