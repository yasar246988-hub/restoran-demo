<template>
  <div>
    <!-- MOBİL HAMBURGER BUTONU -->
    <button
      class="hamburger-btn"
      @click="mobileOpen = !mobileOpen"
      :aria-label="mobileOpen ? 'Menüyü Kapat' : 'Menüyü Aç'"
    >
      <span :class="{ open: mobileOpen }"></span>
      <span :class="{ open: mobileOpen }"></span>
      <span :class="{ open: mobileOpen }"></span>
    </button>

    <!-- MOBİL OVERLAY -->
    <div
      v-if="mobileOpen"
      class="sidebar-overlay"
      @click="mobileOpen = false"
    ></div>

    <!-- SIDEBAR -->
    <nav class="sidebar" :class="{ 'mobile-open': mobileOpen }">
      <div class="sidebar-header">
        <h2>🍽️ Kafe Sipariş</h2>
        <p>{{ getWelcomeMessage() }}</p>
      </div>

      <ul class="nav-menu">
        <!-- CEO — Tüm menü -->
        <template v-if="userRole === 'ceo'">
          <li><router-link to="/dashboard"            class="nav-link" active-class="active" @click="closeMenu">📊 Dashboard</router-link></li>
          <li><router-link to="/users"                class="nav-link" active-class="active" @click="closeMenu">👥 Kullanıcı Yönetimi</router-link></li>
          <li><router-link to="/tables"               class="nav-link" active-class="active" @click="closeMenu">🪑 Masa Yönetimi</router-link></li>
          <li><router-link to="/table-map"            class="nav-link" active-class="active" @click="closeMenu">🗺️ Masa Haritası</router-link></li>
          <li><router-link to="/menu"                 class="nav-link" active-class="active" @click="closeMenu">🍽️ Menü Yönetimi</router-link></li>
          <li><router-link to="/orders"               class="nav-link" active-class="active" @click="closeMenu">📋 Sipariş Takibi</router-link></li>
          <li><router-link to="/waiter-calls"         class="nav-link" active-class="active" @click="closeMenu">🤝 Garson Çağrıları</router-link></li>
          <li><router-link to="/kitchen"              class="nav-link" active-class="active" @click="closeMenu">🍳 Mutfak Ekranı</router-link></li>
          <li><router-link to="/cashier-pos"          class="nav-link" active-class="active" @click="closeMenu">🧾 Kasa POS</router-link></li>
          <li><router-link to="/cash-register"        class="nav-link" active-class="active" @click="closeMenu">💰 Kasa Yönetimi</router-link></li>
          <li><router-link to="/reports"              class="nav-link" active-class="active" @click="closeMenu">📊 Raporlar</router-link></li>
          <li><router-link to="/employee-performance" class="nav-link" active-class="active" @click="closeMenu">👥 Çalışan Performans</router-link></li>
          <li><router-link to="/audit-log"            class="nav-link" active-class="active" @click="closeMenu">📋 Denetim Günlüğü</router-link></li>
          <li><router-link to="/settings"             class="nav-link" active-class="active" @click="closeMenu">⚙️ Sistem Ayarları</router-link></li>
          <li><router-link to="/qr-menu-theme"        class="nav-link" active-class="active" @click="closeMenu">🎨 QR Menü Tema</router-link></li>
          <li><a @click="openQRMenu" class="nav-link customer-preview">📲 QR Menü Önizle</a></li>
        </template>

        <!-- CEO dışı — permission bazlı -->
        <template v-else>
          <li v-if="can('dashboard.view')">
            <router-link to="/dashboard" class="nav-link" active-class="active" @click="closeMenu">📊 Dashboard</router-link>
          </li>
          <li v-if="can('orders.view')">
            <router-link to="/orders" class="nav-link" active-class="active" @click="closeMenu">📋 Sipariş Takibi</router-link>
          </li>
          <li v-if="can('tables.manage')">
            <router-link to="/tables" class="nav-link" active-class="active" @click="closeMenu">🪑 Masa Yönetimi</router-link>
          </li>
          <li v-if="can('tables.map')">
            <router-link to="/table-map" class="nav-link" active-class="active" @click="closeMenu">🗺️ Masa Haritası</router-link>
          </li>
          <li v-if="can('menu.manage')">
            <router-link to="/menu" class="nav-link" active-class="active" @click="closeMenu">🍽️ Menü Yönetimi</router-link>
          </li>
          <li v-if="can('waiter.calls')">
            <router-link to="/waiter-calls" class="nav-link" active-class="active" @click="closeMenu">🤝 Garson Çağrıları</router-link>
          </li>
          <li v-if="can('kitchen.view')">
            <router-link to="/kitchen" class="nav-link" active-class="active" @click="closeMenu">🍳 Mutfak Ekranı</router-link>
          </li>
          <li v-if="can('cashier.pos')">
            <router-link to="/cashier-pos" class="nav-link" active-class="active" @click="closeMenu">🧾 Kasa POS</router-link>
          </li>
          <li v-if="can('cashier.register')">
            <router-link to="/cash-register" class="nav-link" active-class="active" @click="closeMenu">💰 Kasa Yönetimi</router-link>
          </li>
          <li v-if="can('reports.view')">
            <router-link to="/reports" class="nav-link" active-class="active" @click="closeMenu">📊 Raporlar</router-link>
          </li>
          <li v-if="can('employees.view')">
            <router-link to="/employee-performance" class="nav-link" active-class="active" @click="closeMenu">👥 Çalışan Performans</router-link>
          </li>
          <li v-if="can('audit.view')">
            <router-link to="/audit-log" class="nav-link" active-class="active" @click="closeMenu">📋 Denetim Günlüğü</router-link>
          </li>
          <li v-if="can('settings.manage')">
            <router-link to="/settings" class="nav-link" active-class="active" @click="closeMenu">⚙️ Sistem Ayarları</router-link>
          </li>
          <li v-if="can('settings.manage')">
            <router-link to="/qr-menu-theme" class="nav-link" active-class="active" @click="closeMenu">🎨 QR Menü Tema</router-link>
          </li>
        </template>
      </ul>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ getRoleIcon() }}</div>
          <div class="user-details">
            <strong>{{ currentUser?.name }}</strong>
            <span class="user-role">{{ getRoleText() }}</span>
          </div>
        </div>
        <button @click="logout" class="logout-btn">🚪 Çıkış Yap</button>
      </div>
    </nav>
  </div>
</template>

<script>
import { hasPermission } from '@/utils/permissions.js'

export default {
  name: 'NavigationSidebar',
  data() {
    return {
      currentUser: null,
      userRole: null,
      userPermissions: [],
      mobileOpen: false
    }
  },
  mounted() {
    this.loadUserData()
    // Route değişince mobilide kapat
    this.$router.afterEach(() => { this.mobileOpen = false })
  },
  methods: {
    loadUserData() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.currentUser = JSON.parse(userStr)
        this.userRole = this.currentUser.role
        this.userPermissions = this.currentUser.permissions || []
      }
    },

    closeMenu() { this.mobileOpen = false },

    can(permission) {
      if (this.userRole === 'ceo') return true
      return hasPermission(permission)
    },

    getWelcomeMessage() {
      const m = { ceo: 'CEO Paneli', yonetici: 'Yönetici Paneli', calisan: 'Çalışan Paneli' }
      return m[this.userRole] || 'Yönetim Paneli'
    },

    getRoleIcon() {
      const m = { ceo: '👑', yonetici: '👨‍💼', calisan: '🧑‍💼' }
      return m[this.userRole] || '👤'
    },

    getRoleText() {
      const m = { ceo: 'CEO', yonetici: 'Yönetici', calisan: 'Çalışan' }
      return m[this.userRole] || 'Kullanıcı'
    },

    openCustomerView() { window.open('/customer', '_blank') },
    openQRMenu()       { window.open('/qr-menu?table=1', '_blank') },

    logout() {
      if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.$router.push('/login')
      }
    }
  }
}
</script>

<style scoped>
/* ── HAMBURGER BUTONU (sadece mobilde görünür) ── */
.hamburger-btn {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 201;
  width: 44px;
  height: 44px;
  background: var(--primary-dark);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px;
  box-shadow: var(--shadow-md);
}

.hamburger-btn span {
  display: block;
  width: 20px;
  height: 2px;
  background: white;
  border-radius: 2px;
  transition: all 0.25s ease;
  transform-origin: center;
}

/* Hamburger → X animasyonu */
.hamburger-btn span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger-btn span.open:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger-btn span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── OVERLAY ── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 199;
  backdrop-filter: blur(2px);
}

/* ── SIDEBAR ── */
.sidebar {
  width: 280px;
  height: 100vh;
  background: var(--gradient-sidebar);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(15,45,92,0.25);
  position: fixed;
  top: 0; left: 0;
  z-index: 200;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.sidebar-header h2 {
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
  color: var(--accent);
  font-weight: 700;
}

.sidebar-header p {
  font-size: 0.78rem;
  opacity: 0.7;
  margin: 0;
}

.nav-menu {
  flex: 1;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}

.nav-menu li { margin-bottom: 2px; }

.nav-link {
  display: block;
  padding: 0.7rem 1.25rem;
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
  font-size: 0.88rem;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255,255,255,0.08);
  border-left-color: var(--accent);
  color: white;
}

.nav-link.active {
  background: rgba(255,255,255,0.13);
  border-left-color: var(--accent);
  font-weight: 600;
}

.customer-preview { opacity: 0.8; font-style: italic; }

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255,255,255,0.1);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.user-avatar { font-size: 1.8rem; margin-right: 0.75rem; }

.user-details strong { display: block; font-size: 0.88rem; margin-bottom: 0.2rem; }

.user-role {
  font-size: 0.75rem;
  opacity: 0.8;
  background: rgba(251,191,36,0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  display: inline-block;
}

.logout-btn {
  width: 100%;
  padding: 0.7rem;
  background: rgba(239,68,68,0.8);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  transition: background 0.2s;
}

.logout-btn:hover { background: rgba(239,68,68,1); }

/* ── MOBİL (≤ 768px) ── */
@media (max-width: 768px) {
  .hamburger-btn {
    display: flex;
  }

  .sidebar-overlay {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>
