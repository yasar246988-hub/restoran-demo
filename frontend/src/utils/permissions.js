/**
 * Yetki (Permission) Sistemi
 *
 * CEO kullanıcı oluştururken hangi yetkilerin açık olacağını seçer.
 * Her sayfa/özellik bir permission key'e karşılık gelir.
 * Router ve sidebar bu key'lere göre erişim kontrolü yapar.
 */

// Tüm yetkiler ve grupları
export const ALL_PERMISSIONS = [
  // Siparişler
  { key: 'orders.view',        label: 'Sipariş Takibi',          group: 'Siparişler',    icon: '📋' },
  { key: 'orders.complete',    label: 'Sipariş Tamamlama',       group: 'Siparişler',    icon: '✅' },
  { key: 'orders.transfer',    label: 'Masa Transferi',          group: 'Siparişler',    icon: '🔄' },
  // Masalar
  { key: 'tables.view',        label: 'Masa Görüntüleme',        group: 'Masalar',       icon: '🪑' },
  { key: 'tables.manage',      label: 'Masa Yönetimi',           group: 'Masalar',       icon: '🗂️' },
  { key: 'tables.map',         label: 'Masa Haritası',           group: 'Masalar',       icon: '🗺️' },
  // Mutfak
  { key: 'kitchen.view',       label: 'Mutfak Ekranı',           group: 'Mutfak',        icon: '🍳' },
  { key: 'kitchen.update',     label: 'Sipariş Durumu Değiştir', group: 'Mutfak',        icon: '🔥' },
  // Kasa
  { key: 'cashier.pos',        label: 'Kasa POS',                group: 'Kasa',          icon: '🧾' },
  { key: 'cashier.payment',    label: 'Ödeme Alma',              group: 'Kasa',          icon: '💳' },
  { key: 'cashier.register',   label: 'Kasa Açılış/Kapanış',    group: 'Kasa',          icon: '💰' },
  // Menü
  { key: 'menu.view',          label: 'Menü Görüntüleme',        group: 'Menü',          icon: '🍽️' },
  { key: 'menu.manage',        label: 'Menü Düzenleme',          group: 'Menü',          icon: '✏️' },
  // Garson
  { key: 'waiter.calls',       label: 'Garson Çağrıları',        group: 'Garson',        icon: '🔔' },
  // Raporlar
  { key: 'reports.view',       label: 'Raporlar',                group: 'Raporlar',      icon: '📊' },
  { key: 'reports.export',     label: 'Excel Export',            group: 'Raporlar',      icon: '📤' },
  // Çalışanlar
  { key: 'employees.view',     label: 'Çalışan Performansı',     group: 'Çalışanlar',    icon: '👥' },
  // Sistem
  { key: 'audit.view',         label: 'Denetim Günlüğü',        group: 'Sistem',        icon: '📋' },
  { key: 'settings.manage',    label: 'Sistem Ayarları',         group: 'Sistem',        icon: '⚙️' },
  { key: 'dashboard.view',     label: 'Dashboard',               group: 'Sistem',        icon: '📊' },
]

// Grup başlıklarını çıkar
export function getPermissionGroups() {
  const groups = {}
  ALL_PERMISSIONS.forEach(p => {
    if (!groups[p.group]) groups[p.group] = []
    groups[p.group].push(p)
  })
  return groups
}

// Rol bazlı varsayılan yetkiler
export function getDefaultPermissions(role) {
  switch (role) {
    case 'ceo':
      return ALL_PERMISSIONS.map(p => p.key)
    case 'yonetici':
      return [
        'orders.view', 'orders.complete', 'orders.transfer',
        'tables.view', 'tables.manage', 'tables.map',
        'kitchen.view', 'kitchen.update',
        'cashier.pos', 'cashier.payment', 'cashier.register',
        'menu.view', 'menu.manage',
        'waiter.calls',
        'employees.view',
        'dashboard.view'
      ]
    case 'calisan':
      return [
        'orders.view', 'orders.complete',
        'kitchen.view', 'kitchen.update',
        'cashier.pos',
        'waiter.calls',
      ]
    default:
      return ['orders.view', 'waiter.calls']
  }
}

// localStorage'dan kullanıcı yetkilerini al
export function getUserPermissions() {
  const userStr = localStorage.getItem('user')
  if (!userStr) return []
  try {
    const user = JSON.parse(userStr)
    // CEO her şeye erişebilir
    if (user.role === 'ceo') return ALL_PERMISSIONS.map(p => p.key)
    return user.permissions || getDefaultPermissions(user.role)
  } catch {
    return []
  }
}

// Kullanıcının belirli bir yetkisi var mı?
export function hasPermission(key) {
  const perms = getUserPermissions()
  return perms.includes(key)
}

// Route path'ini permission key'e çevir
export const ROUTE_PERMISSIONS = {
  '/dashboard':          'dashboard.view',
  '/orders':             'orders.view',
  '/tables':             'tables.manage',
  '/table-map':          'tables.map',
  '/menu':               'menu.manage',
  '/reports':            'reports.view',
  '/waiter-calls':       'waiter.calls',
  '/kitchen':            'kitchen.view',
  '/cashier-pos':        'cashier.pos',
  '/cash-register':      'cashier.register',
  '/employee-performance': 'employees.view',
  '/audit-log':          'audit.view',
  '/settings':           'settings.manage',
  '/users':              null, // Sadece CEO
}
