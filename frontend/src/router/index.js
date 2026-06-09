import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Tables from '../views/Tables.vue'
import Menu from '../views/Menu.vue'
import Orders from '../views/Orders.vue'
import Reports from '../views/Reports.vue'
import Customer from '../views/CustomerNew.vue'
import WaiterCalls from '../views/WaiterCalls.vue'
import EmployeePerformance from '../views/EmployeePerformance.vue'
import { hasPermission, getUserPermissions } from '../utils/permissions.js'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, permission: 'dashboard.view', ceoOnly: true, title: 'Ana Sayfa' }
  },
  {
    path: '/tables',
    name: 'Tables',
    component: Tables,
    meta: { requiresAuth: true, permission: 'tables.manage', title: 'Masalar' }
  },
  {
    path: '/menu',
    name: 'Menu',
    component: Menu,
    meta: { requiresAuth: true, permission: 'menu.manage', title: 'Menü Yönetimi' }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true, permission: 'orders.view', title: 'Sipariş Takibi' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
    meta: { requiresAuth: true, permission: 'reports.view', title: 'Raporlar' }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Users.vue'),
    meta: { requiresAuth: true, ceoOnly: true, title: 'Kullanıcı Yönetimi' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/NewSettings.vue'),
    meta: { requiresAuth: true, permission: 'settings.manage', title: 'Sistem Ayarları' }
  },
  {
    path: '/qr-menu-theme',
    name: 'QRMenuTheme',
    component: () => import('../views/QRMenuThemeSettings.vue'),
    meta: { requiresAuth: true, permission: 'settings.manage', title: 'QR Menü Tema' }
  },
  {
    path: '/waiter-calls',
    name: 'WaiterCalls',
    component: WaiterCalls,
    meta: { requiresAuth: true, permission: 'waiter.calls', title: 'Garson Çağrıları' }
  },
  {
    path: '/employee-performance',
    name: 'EmployeePerformance',
    component: EmployeePerformance,
    meta: { requiresAuth: true, permission: 'employees.view', title: 'Çalışan Performans' }
  },
  {
    path: '/customer',
    name: 'Customer',
    component: Customer,
    props: true,
    meta: { title: 'Müşteri Sipariş' }
  },
  {
    path: '/qr-menu',
    name: 'QRMenu',
    component: () => import('../views/QRMenu.vue'),
    meta: { title: 'QR Menü' }
  },
  {
    path: '/table-map',
    name: 'TableMap',
    component: () => import('../views/TableMap.vue'),
    meta: { requiresAuth: true, permission: 'tables.map', title: 'Masa Haritası' }
  },
  {
    path: '/cash-register',
    name: 'CashRegister',
    component: () => import('../views/CashRegister.vue'),
    meta: { requiresAuth: true, permission: 'cashier.register', title: 'Kasa Yönetimi' }
  },
  {
    path: '/cashier-pos',
    name: 'CashierPOS',
    component: () => import('../views/CashierPOS.vue'),
    meta: { requiresAuth: true, permission: 'cashier.pos', title: 'Kasa Ödeme' }
  },
  {
    path: '/kitchen',
    name: 'Kitchen',
    component: () => import('../views/Kitchen.vue'),
    meta: { requiresAuth: true, permission: 'kitchen.view', title: 'Mutfak Ekranı' }
  },
  {
    path: '/audit-log',
    name: 'AuditLog',
    component: () => import('../views/AuditLog.vue'),
    meta: { requiresAuth: true, permission: 'audit.view', title: 'Denetim Günlüğü' }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard — Permission bazlı erişim kontrolü
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')

  // Login sayfasına gidiyorsa ve zaten giriş yapmışsa yönlendir
  if (to.path === '/login' && token && userStr) {
    const user = JSON.parse(userStr)
    const perms = getUserPermissions()
    // İlk erişebilir sayfaya yönlendir
    if (user.role === 'ceo') { next('/dashboard'); return }
    if (perms.includes('dashboard.view'))    { next('/dashboard'); return }
    if (perms.includes('orders.view'))       { next('/orders'); return }
    if (perms.includes('kitchen.view'))      { next('/kitchen'); return }
    if (perms.includes('cashier.pos'))       { next('/cashier-pos'); return }
    next('/orders')
    return
  }

  if (to.meta.requiresAuth) {
    if (!token || !userStr) { next('/login'); return }

    const user = JSON.parse(userStr)

    // CEO everything
    if (user.role === 'ceo') { next(); return }

    // CEO-only sayfalar
    if (to.meta.ceoOnly) {
      next(getFirstAccessibleRoute())
      return
    }

    // Permission kontrolü
    if (to.meta.permission && !hasPermission(to.meta.permission)) {
      next(getFirstAccessibleRoute())
      return
    }
  }

  next()
})

function getFirstAccessibleRoute() {
  const perms = getUserPermissions()
  if (perms.includes('orders.view'))    return '/orders'
  if (perms.includes('kitchen.view'))   return '/kitchen'
  if (perms.includes('cashier.pos'))    return '/cashier-pos'
  if (perms.includes('waiter.calls'))   return '/waiter-calls'
  return '/login'
}

export default router