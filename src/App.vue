<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/authStore'

import { usePlayerStore } from './stores/playerStore'
import { Loader2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()

onMounted(() => {
  // Optional: Global initialization logic
})
</script>

<template>
  <div class="min-h-screen bg-astral-void text-astral-star font-sans antialiased">
    <!-- Starfield Background (Global) -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute inset-0 bg-[url('/stars.png')] opacity-50 animate-pulse-slow"></div>
    </div>

    <!-- Sync Indicator -->
    <div class="fixed top-4 right-4 z-50 pointer-events-none transition-opacity duration-500"
      :class="playerStore.isSyncing ? 'opacity-100' : 'opacity-0'">
      <div
        class="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-astral-glow">
        <Loader2 class="w-3 h-3 animate-spin" />
        <span>Saving...</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
