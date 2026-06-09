import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import CSS
import './assets/css/main.css'

// Create app
const app = createApp(App)

app.use(store)
app.use(router)
app.mount('#app')