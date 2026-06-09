<template>
  <div class="app-layout">
    <NavigationSidebar />
    <div class="main-content">

      <div class="content-header">
        <h1>👥 Kullanıcı Yönetimi</h1>
        <button @click="openAddForm" class="btn btn-success">➕ Yeni Kullanıcı</button>
      </div>

      <!-- Kullanıcı Listesi -->
      <div v-if="loading && !users.length" class="loading-state">
        <div class="spinner"></div><p>Yükleniyor...</p>
      </div>

      <div class="users-grid">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-card"
          :class="{ 'self-card': user.id === currentUser?.id }"
        >
          <div class="user-card-head">
            <div class="user-avatar">{{ getRoleIcon(user.role) }}</div>
            <div class="user-info">
              <h3>{{ user.name }}</h3>
              <p class="user-username">@{{ user.username }}</p>
              <span :class="['role-badge', user.role]">{{ getRoleText(user.role) }}</span>
            </div>
            <div v-if="user.role === 'ceo'" class="ceo-lock">👑 Ana Hesap</div>
            <div v-else class="user-card-actions">
              <button @click="openEditForm(user)" class="btn-icon" title="Düzenle">✏️</button>
              <button @click="deleteUser(user)" class="btn-icon btn-icon-danger" title="Sil">🗑️</button>
            </div>
          </div>

          <!-- Yetki özeti -->
          <div v-if="user.role !== 'ceo' && user.permissions" class="perm-summary">
            <span
              v-for="p in getPermissionSummary(user.permissions)"
              :key="p"
              class="perm-chip"
            >{{ p }}</span>
            <span v-if="user.permissions.length > 5" class="perm-more">
              +{{ user.permissions.length - 5 }} daha
            </span>
          </div>
          <div v-else-if="user.role === 'ceo'" class="perm-summary">
            <span class="perm-chip perm-all">✅ Tüm Yetkiler</span>
          </div>
        </div>
      </div>

      <!-- KULLANICI FORM MODALI -->
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="user-modal">
          <div class="modal-head">
            <h2>{{ editingUser ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı' }}</h2>
            <button @click="closeForm" class="close-x">✕</button>
          </div>

          <form @submit.prevent="saveUser" class="modal-body">
            <!-- Temel Bilgiler -->
            <div class="form-section">
              <h4>👤 Temel Bilgiler</h4>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Ad Soyad *</label>
                  <input v-model="form.name" type="text" required placeholder="Ahmet Yılmaz" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Kullanıcı Adı *</label>
                  <input v-model="form.username" type="text" required placeholder="ahmet.yilmaz"
                    :disabled="!!editingUser" class="form-input" />
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label>{{ editingUser ? 'Yeni Şifre (boş = değişmez)' : 'Şifre *' }}</label>
                  <input v-model="form.password" type="password"
                    :required="!editingUser" placeholder="••••••••" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Unvan / Pozisyon</label>
                  <select v-model="form.role" required class="form-input" @change="applyDefaultPerms">
                    <option value="">Seçin...</option>
                    <option value="yonetici">👨‍💼 Yönetici</option>
                    <option value="calisan">🧑‍💼 Çalışan</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- YETKİ SEÇİCİ -->
            <div class="form-section" v-if="form.role">
              <div class="perm-header">
                <h4>🔐 Yetkiler</h4>
                <div class="perm-bulk-btns">
                  <button type="button" @click="selectAll" class="perm-bulk-btn">Tümünü Seç</button>
                  <button type="button" @click="selectNone" class="perm-bulk-btn">Temizle</button>
                  <button type="button" @click="applyDefaultPerms" class="perm-bulk-btn perm-default-btn">
                    Varsayılan ({{ form.role }})
                  </button>
                </div>
              </div>

              <div v-for="(perms, group) in permissionGroups" :key="group" class="perm-group">
                <div class="perm-group-head" @click="toggleGroup(group)">
                  <span>{{ group }}</span>
                  <span class="perm-group-count">
                    {{ selectedInGroup(group, perms) }}/{{ perms.length }}
                  </span>
                </div>
                <div class="perm-items">
                  <label
                    v-for="p in perms"
                    :key="p.key"
                    class="perm-item"
                    :class="{ selected: form.permissions.includes(p.key) }"
                  >
                    <input
                      type="checkbox"
                      :value="p.key"
                      v-model="form.permissions"
                      class="perm-checkbox"
                    />
                    <span class="perm-icon">{{ p.icon }}</span>
                    <span class="perm-label">{{ p.label }}</span>
                  </label>
                </div>
              </div>

              <div class="perm-count-bar">
                <div class="perm-count-fill" :style="{ width: (form.permissions.length / allPerms.length * 100) + '%' }"></div>
              </div>
              <p class="perm-count-text">{{ form.permissions.length }} / {{ allPerms.length }} yetki seçili</p>
            </div>

            <div v-if="formError" class="form-error">⚠️ {{ formError }}</div>

            <div class="form-actions">
              <button type="button" @click="closeForm" class="btn btn-ghost">İptal</button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? '⏳ Kaydediliyor...' : (editingUser ? '💾 Güncelle' : '➕ Oluştur') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Toast mesaj -->
      <transition name="toast">
        <div v-if="toast" :class="['toast', toast.type]">{{ toast.msg }}</div>
      </transition>

    </div>
  </div>
</template>

<script>
import axios from 'axios'
import NavigationSidebar from '@/components/common/NavigationSidebar.vue'
import { ALL_PERMISSIONS, getPermissionGroups, getDefaultPermissions } from '@/utils/permissions.js'

const API = 'http://localhost:3000/api'

export default {
  name: 'UsersView',
  components: { NavigationSidebar },
  data() {
    return {
      users: [],
      loading: false,
      showForm: false,
      editingUser: null,
      formError: '',
      toast: null,
      currentUser: null,
      form: {
        name: '',
        username: '',
        password: '',
        role: '',
        permissions: []
      },
      allPerms: ALL_PERMISSIONS,
      permissionGroups: getPermissionGroups()
    }
  },

  async mounted() {
    this.currentUser = JSON.parse(localStorage.getItem('user'))
    await this.loadUsers()
  },

  methods: {
    async loadUsers() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.success) this.users = res.data.data
      } catch (e) {
        this.showToast('Kullanıcılar yüklenemedi', 'error')
      } finally {
        this.loading = false
      }
    },

    openAddForm() {
      this.editingUser = null
      this.form = { name: '', username: '', password: '', role: '', permissions: [] }
      this.formError = ''
      this.showForm = true
    },

    openEditForm(user) {
      this.editingUser = user
      this.form = {
        name: user.name,
        username: user.username,
        password: '',
        role: user.role,
        permissions: [...(user.permissions || getDefaultPermissions(user.role))]
      }
      this.formError = ''
      this.showForm = true
    },

    closeForm() {
      this.showForm = false
      this.editingUser = null
    },

    applyDefaultPerms() {
      if (this.form.role) {
        this.form.permissions = getDefaultPermissions(this.form.role)
      }
    },

    selectAll() {
      this.form.permissions = this.allPerms.map(p => p.key)
    },

    selectNone() {
      this.form.permissions = []
    },

    toggleGroup(group) {
      const groupPerms = this.permissionGroups[group].map(p => p.key)
      const allSelected = groupPerms.every(k => this.form.permissions.includes(k))
      if (allSelected) {
        this.form.permissions = this.form.permissions.filter(k => !groupPerms.includes(k))
      } else {
        const toAdd = groupPerms.filter(k => !this.form.permissions.includes(k))
        this.form.permissions.push(...toAdd)
      }
    },

    selectedInGroup(group, perms) {
      return perms.filter(p => this.form.permissions.includes(p.key)).length
    },

    async saveUser() {
      if (!this.form.name || !this.form.role) { this.formError = 'Ad ve rol zorunludur.'; return }
      if (!this.editingUser && !this.form.password) { this.formError = 'Şifre zorunludur.'; return }
      if (this.form.permissions.length === 0) { this.formError = 'En az 1 yetki seçin.'; return }

      this.loading = true
      this.formError = ''
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        const payload = {
          name: this.form.name,
          role: this.form.role,
          permissions: this.form.permissions
        }
        if (this.form.password) payload.password = this.form.password

        if (this.editingUser) {
          await axios.put(`${API}/users/${this.editingUser.id}`, payload, { headers })
          this.showToast('Kullanıcı güncellendi ✅', 'success')
        } else {
          payload.username = this.form.username
          await axios.post(`${API}/users`, payload, { headers })
          this.showToast('Kullanıcı oluşturuldu ✅', 'success')
        }

        await this.loadUsers()
        this.closeForm()
      } catch (e) {
        this.formError = e.response?.data?.message || 'Kaydetme hatası'
      } finally {
        this.loading = false
      }
    },

    async deleteUser(user) {
      if (!confirm(`"${user.name}" kullanıcısını silmek istediğinizden emin misiniz?`)) return
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`${API}/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.showToast('Kullanıcı silindi', 'success')
        await this.loadUsers()
      } catch (e) {
        this.showToast(e.response?.data?.message || 'Silme hatası', 'error')
      }
    },

    getPermissionSummary(perms) {
      return perms.slice(0, 5).map(key => {
        const p = this.allPerms.find(a => a.key === key)
        return p ? `${p.icon} ${p.label}` : key
      })
    },

    getRoleIcon(role) {
      return { ceo: '👑', yonetici: '👨‍💼', calisan: '🧑‍💼' }[role] || '👤'
    },

    getRoleText(role) {
      return { ceo: 'CEO', yonetici: 'Yönetici', calisan: 'Çalışan' }[role] || role
    },

    showToast(msg, type = 'success') {
      this.toast = { msg, type }
      setTimeout(() => { this.toast = null }, 3000)
    }
  }
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.main-content { margin-left: 280px; flex: 1; padding: 1.75rem 2rem; background: var(--bg-app); }

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary-border);
}

.content-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--primary-dark); margin: 0; }

.btn {
  padding: 9px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}
.btn-success { background: var(--gradient-success); color: white; }
.btn-primary { background: var(--gradient-primary); color: white; }
.btn-ghost   { background: var(--gray-100); color: var(--gray-700); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* KULLANICI GRİD */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.user-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  padding: 16px 18px;
  transition: box-shadow 0.2s;
}

.user-card:hover { box-shadow: var(--shadow-md); }
.self-card { border-color: #f59e0b; background: #fffbeb; }

.user-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar { font-size: 2.2rem; flex-shrink: 0; }

.user-info { flex: 1; }
.user-info h3 { font-size: 1rem; font-weight: 700; color: var(--gray-800); margin: 0 0 2px; }
.user-username { font-size: 0.8rem; color: var(--gray-400); margin: 0 0 6px; }

.role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}
.role-badge.ceo      { background: linear-gradient(135deg,#f59e0b,#d97706); }
.role-badge.yonetici { background: var(--gradient-primary); }
.role-badge.calisan  { background: var(--gradient-success); }

.ceo-lock { font-size: 0.8rem; color: #d97706; font-weight: 600; }

.user-card-actions { display: flex; gap: 6px; }

.btn-icon {
  width: 32px; height: 32px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.btn-icon:hover { background: var(--primary-xlight); border-color: var(--primary-border); }
.btn-icon-danger:hover { background: var(--danger-light); border-color: #fca5a5; }

/* YETKİ ÖZETİ */
.perm-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-top: 10px;
  border-top: 1px solid var(--gray-100);
}

.perm-chip {
  background: var(--primary-xlight);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 500;
}

.perm-chip.perm-all { background: var(--success-light); color: var(--success); border-color: #a7f3d0; }
.perm-more { font-size: 0.72rem; color: var(--gray-400); padding: 2px 0; }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.user-modal {
  background: white;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 640px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  position: sticky; top: 0; z-index: 10;
}
.modal-head h2 { font-size: 1rem; font-weight: 700; margin: 0; }
.close-x {
  background: rgba(255,255,255,0.2); border: none; color: white;
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 0.9rem;
}

.modal-body { padding: 20px 22px; }

/* FORM */
.form-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--gray-200);
}
.form-section:last-of-type { border-bottom: none; }

.form-section h4 {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0 0 12px;
}

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--gray-600); }

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  outline: none;
  font-family: inherit;
}
.form-input:focus { border-color: var(--primary-light); }
.form-input:disabled { background: var(--gray-100); color: var(--gray-500); }

/* YETKİ SEÇİCİ */
.perm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.perm-header h4 { margin: 0; }

.perm-bulk-btns { display: flex; gap: 6px; }
.perm-bulk-btn {
  padding: 5px 10px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  background: white;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--gray-600);
}
.perm-bulk-btn:hover { background: var(--gray-100); }
.perm-default-btn { background: var(--primary-xlight); color: var(--primary); border-color: var(--primary-border); }

.perm-group { margin-bottom: 10px; }

.perm-group-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--gray-100);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--gray-700);
  margin-bottom: 6px;
}
.perm-group-count {
  background: var(--primary-xlight);
  color: var(--primary);
  padding: 1px 8px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
}

.perm-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 6px;
  padding: 0 4px;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
  background: white;
}
.perm-item:hover { border-color: var(--primary-border); background: var(--primary-xlight); }
.perm-item.selected { border-color: var(--primary); background: var(--primary-xlight); }
.perm-checkbox { display: none; }
.perm-icon { font-size: 0.9rem; flex-shrink: 0; }
.perm-label { color: var(--gray-700); font-weight: 500; }
.perm-item.selected .perm-label { color: var(--primary); font-weight: 600; }

/* Progress bar */
.perm-count-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 4px;
  margin: 10px 0 4px;
  overflow: hidden;
}
.perm-count-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.3s;
}
.perm-count-text { font-size: 0.78rem; color: var(--gray-500); text-align: right; }

.form-error {
  background: var(--danger-light);
  color: var(--danger);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--gray-200);
}

/* Loading */
.loading-state {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; padding: 60px; color: var(--gray-500);
}
.spinner { width: 28px; height: 28px; border: 3px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Toast */
.toast {
  position: fixed; bottom: 24px; right: 24px;
  padding: 12px 22px; border-radius: var(--radius-lg);
  font-weight: 700; font-size: 0.9rem;
  box-shadow: var(--shadow-lg); z-index: 9999;
}
.toast.success { background: var(--success); color: white; }
.toast.error   { background: var(--danger);  color: white; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(20px); }

@media (max-width: 768px) {
  .main-content { margin-left: 0; padding: 1rem; }
  .users-grid { grid-template-columns: 1fr; }
  .form-row-2 { grid-template-columns: 1fr; }
  .perm-items { grid-template-columns: 1fr 1fr; }
}
</style>
