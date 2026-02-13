import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { initFirebase } from './services/firebase'

// Initialize Firebase
initFirebase()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
