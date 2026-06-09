/**
 * Bildirim Servisi
 * - Tarayıcı Notification API
 * - Ses bildirimi (Web Audio API — harici dosya gerekmez)
 * - Garson çağrısı ve yeni sipariş polling
 */

const API = 'http://localhost:3000/api'

class NotificationService {
  constructor() {
    this.permission = 'default'
    this.pollTimer = null
    this.lastCallIds = new Set()
    this.lastOrderIds = new Set()
    this.audioCtx = null
    this.enabled = true
    this.soundEnabled = true
    this.listeners = []
  }

  // ---- İZİN ----

  async requestPermission() {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') {
      this.permission = 'granted'
      return true
    }
    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission()
      this.permission = result
      return result === 'granted'
    }
    return false
  }

  // ---- SES ----

  getAudioCtx() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      } catch { return null }
    }
    return this.audioCtx
  }

  playBeep(type = 'waiter') {
    if (!this.soundEnabled) return
    const ctx = this.getAudioCtx()
    if (!ctx) return

    const configs = {
      waiter: [
        { freq: 880, dur: 0.12, start: 0.0 },
        { freq: 880, dur: 0.12, start: 0.18 },
        { freq: 1100, dur: 0.2, start: 0.36 }
      ],
      order: [
        { freq: 660, dur: 0.15, start: 0.0 },
        { freq: 880, dur: 0.15, start: 0.2 }
      ],
      info: [
        { freq: 660, dur: 0.1, start: 0.0 }
      ]
    }

    const notes = configs[type] || configs.info
    const now = ctx.currentTime

    notes.forEach(({ freq, dur, start }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0.3, now + start)
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.05)
    })
  }

  // ---- BİLDİRİM GÖSTER ----

  show(title, body, options = {}) {
    if (!this.enabled) return
    this.playBeep(options.type || 'info')

    if (this.permission !== 'granted') return

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'kafe-' + Date.now(),
        requireInteraction: options.requireInteraction || false,
        silent: true // sesi biz yönetiyoruz
      })

      notif.onclick = () => {
        window.focus()
        if (options.onClick) options.onClick()
        notif.close()
      }

      // Garson çağrısı 8 saniye, diğerleri 4 saniye
      setTimeout(() => notif.close(), options.timeout || 5000)
    } catch (e) {
      // Bildirim API hatası — sessiz devam
    }
  }

  // ---- POLLING ----

  startPolling(intervalMs = 8000) {
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => this._poll(), intervalMs)
    // İlk çağrıyı hemen yap (mevcut durumu baseline al)
    this._initBaseline()
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  async _initBaseline() {
    // İlk yüklemede mevcut ID'leri baseline olarak kaydet, bildirim verme
    try {
      const [callsRes, ordersRes] = await Promise.all([
        fetch(`${API}/waiter-calls`).then(r => r.json()).catch(() => null),
        fetch(`${API}/orders`).then(r => r.json()).catch(() => null)
      ])
      if (callsRes?.success) {
        callsRes.data.filter(c => c.status === 'pending').forEach(c => this.lastCallIds.add(c.id))
      }
      if (ordersRes?.success) {
        ordersRes.data.forEach(o => this.lastOrderIds.add(o.id))
      }
    } catch { /* sessiz */ }
  }

  async _poll() {
    if (!this.enabled) return
    try {
      const [callsRes, ordersRes] = await Promise.all([
        fetch(`${API}/waiter-calls`).then(r => r.json()).catch(() => null),
        fetch(`${API}/orders`).then(r => r.json()).catch(() => null)
      ])

      // Yeni garson çağrıları
      if (callsRes?.success) {
        const pending = callsRes.data.filter(c => c.status === 'pending')
        pending.forEach(call => {
          if (!this.lastCallIds.has(call.id)) {
            this.lastCallIds.add(call.id)
            this.show(
              `🔔 Garson Çağrısı — Masa ${call.tableNumber}`,
              call.message || call.reason || 'Masa garson istiyor',
              { type: 'waiter', requireInteraction: true, timeout: 10000, tag: 'waiter-' + call.id }
            )
            this._emit('waiter-call', call)
          }
        })
        // Kapatılan çağrıları temizle
        const pendingIds = new Set(pending.map(c => c.id))
        this.lastCallIds.forEach(id => { if (!pendingIds.has(id)) this.lastCallIds.delete(id) })
      }

      // Yeni siparişler
      if (ordersRes?.success) {
        const active = ordersRes.data.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
        active.forEach(order => {
          if (!this.lastOrderIds.has(order.id)) {
            this.lastOrderIds.add(order.id)
            this.show(
              `📋 Yeni Sipariş — Masa ${order.tableNumber || order.tableId}`,
              `${order.items?.length || 0} ürün — ₺${order.total}`,
              { type: 'order', timeout: 5000, tag: 'order-' + order.id }
            )
            this._emit('new-order', order)
          }
        })
      }
    } catch { /* sessiz */ }
  }

  // ---- EVENT EMITTER ----

  on(event, callback) {
    this.listeners.push({ event, callback })
    return () => { this.listeners = this.listeners.filter(l => l.callback !== callback) }
  }

  _emit(event, data) {
    this.listeners.filter(l => l.event === event).forEach(l => l.callback(data))
  }

  // ---- AYARLAR ----

  setEnabled(v) { this.enabled = v }
  setSoundEnabled(v) { this.soundEnabled = v }
  isEnabled() { return this.enabled }
  isSoundEnabled() { return this.soundEnabled }
}

// Singleton
const notifService = new NotificationService()
export default notifService
