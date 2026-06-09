<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🍽️ Kafe Sipariş</h1>
        <p>Sisteme giriş yapın</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Email / Kullanıcı Adı</label>
          <input 
            type="text" 
            v-model="email" 
            required 
            placeholder="ceo@kafe.com veya ceo"
          />
        </div>
        
        <div class="form-group">
          <label>Şifre</label>
          <input 
            type="password" 
            v-model="password" 
            required 
            placeholder="Şifrenizi girin"
          />
        </div>
        
        <button type="submit" class="login-btn">
          Giriş Yap
        </button>
      </form>
      
      <div class="demo-info">
        <p><strong>💡 Test Hesapları:</strong></p>
        <div class="test-accounts">
          <div class="account-info">
            <strong>CEO (Tüm yetkiler)</strong><br>
            📧 Email: <code>ceo@kafe.com</code><br>
            👤 Kullanıcı: <code>ceo</code><br>
            🔑 Şifre: <code>ceo123</code>
          </div>
        </div>
        <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
          ℹ️ Email veya kullanıcı adı ile giriş yapabilirsiniz
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      email: 'ceo@kafe.com',
      password: 'ceo123'
    }
  },
  methods: {
    async handleLogin() {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.email, // Email veya username olarak gönder
            password: this.password
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Token ve kullanıcı bilgilerini kaydet
          localStorage.setItem('token', data.data.token)
          localStorage.setItem('user', JSON.stringify(data.data.user))
          
          console.log('✅ Giriş başarılı:', data.data.user.name)
          
          // Kullanıcı rolüne göre yönlendir
          const userRole = data.data.user.role
          
          if (userRole === 'calisan') {
            this.$router.push('/orders')
          } else if (userRole === 'yonetici') {
            this.$router.push('/menu')
          } else if (userRole === 'ceo') {
            this.$router.push('/dashboard')
          } else {
            this.$router.push('/orders')
          }
        } else {
          alert('❌ ' + data.message)
        }
      } catch (error) {
        console.error('❌ Giriş hatası:', error)
        alert('❌ Bağlantı hatası. Backend sunucusunun çalıştığından emin olun.')
      }
    }
  },
  mounted() {
    // Eğer zaten giriş yapılmışsa yönlendir
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      const userData = JSON.parse(user)
      if (userData.role === 'calisan') {
        this.$router.push('/orders')
      } else if (userData.role === 'yonetici') {
        this.$router.push('/menu')
      } else if (userData.role === 'ceo') {
        this.$router.push('/dashboard')
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 60%, #050e1f 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(15,45,92,0.35);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: var(--primary-dark);
  margin-bottom: 0.4rem;
  font-size: 1.7rem;
  font-weight: 700;
}

.login-header p {
  color: var(--gray-500);
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--gray-700);
  font-weight: 600;
  font-size: 0.88rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--gray-300);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  outline: none;
}

.form-group input:focus {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(37,99,168,0.1);
}

.login-btn {
  width: 100%;
  padding: 0.8rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: opacity 0.2s;
  box-shadow: var(--shadow-primary);
}

.login-btn:hover { opacity: 0.9; }

.demo-info {
  background: var(--primary-xlight);
  border: 1px solid var(--primary-border);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--gray-600);
}

code {
  background: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: var(--primary);
  border: 1px solid var(--primary-border);
}
</style>