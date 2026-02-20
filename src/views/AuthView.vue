<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  if (route.query.mode === 'signup') {
    isLogin.value = false
  }
})

const handleSubmit = async () => {
  try {
    if (isLogin.value) {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
    }
    router.push('/dashboard')
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <!-- Back to Home -->
    <router-link to="/"
      class="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
      <ArrowLeft class="w-4 h-4" />
      Home
    </router-link>

    <div
      class="w-full max-w-md bg-astral-nebula/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <!-- Glow Effect -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-astral-glow shadow-[0_0_20px_rgba(233,69,96,0.5)]">
      </div>

      <h2 class="text-3xl font-display font-bold text-center mb-8">
        {{ isLogin ? 'Welcome Back' : 'Begin Journey' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Email</label>
          <input v-model="email" type="email" required
            class="w-full bg-astral-void border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-astral-glow transition-colors"
            placeholder="you@email.com" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Password</label>
          <input v-model="password" type="password" required
            class="w-full bg-astral-void border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-astral-glow transition-colors"
            placeholder="••••••••" />
        </div>

        <button type="submit"
          class="w-full bg-astral-glow hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-astral-glow/20">
          <span v-if="authStore.loading">Processing...</span>
          <span v-else>{{ isLogin ? 'Enter the Void' : 'Initialize Protocol' }}</span>
        </button>

        <p v-if="authStore.error" class="text-red-400 text-sm text-center">
          {{ authStore.error }}
        </p>

        <div class="text-center text-sm text-gray-400">
          <button type="button" @click="isLogin = !isLogin" class="hover:text-white transition-colors">
            {{ isLogin ? "New user? Create account" : "Existing user? Sign in" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
