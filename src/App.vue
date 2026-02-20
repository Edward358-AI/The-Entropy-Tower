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
    <!-- Starfield Background (CSS) -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div class="stars-sm"></div>
      <div class="stars-md"></div>
      <div class="stars-lg"></div>
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

/* ---- CSS Starfield ---- */
.stars-sm,
.stars-md,
.stars-lg {
  position: absolute;
  inset: 0;
  will-change: opacity;
}

/* Small stars — many, subtle, fast twinkle */
.stars-sm {
  background-image:
    radial-gradient(1px 1px at 10% 15%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 25% 35%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 40% 8%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 55% 50%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 70% 22%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 85% 60%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 15% 72%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 50% 85%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 92% 40%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 35% 95%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 78% 78%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 5% 55%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 62% 30%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 88% 92%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 45% 62%, rgba(255, 255, 255, 0.4), transparent);
  animation: twinkle-stars 4s ease-in-out infinite alternate;
}

/* Medium stars — fewer, brighter, slow twinkle */
.stars-md {
  background-image:
    radial-gradient(1.5px 1.5px at 18% 20%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 48% 45%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 72% 12%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 33% 68%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 82% 55%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 8% 88%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 58% 78%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1.5px 1.5px at 95% 30%, rgba(255, 255, 255, 0.7), transparent);
  animation: twinkle-stars 6s ease-in-out infinite alternate-reverse;
}

/* Large stars — rare, bright, slow drift */
.stars-lg {
  background-image:
    radial-gradient(2px 2px at 22% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 65% 18%, rgba(200, 220, 255, 0.8), transparent),
    radial-gradient(2.5px 2.5px at 80% 70%, rgba(255, 240, 220, 0.7), transparent),
    radial-gradient(2px 2px at 42% 82%, rgba(200, 200, 255, 0.8), transparent),
    radial-gradient(2px 2px at 12% 60%, rgba(255, 255, 255, 0.7), transparent);
  animation: twinkle-stars 8s ease-in-out infinite alternate;
}

@keyframes twinkle-stars {
  0% {
    opacity: 0.4;
  }

  50% {
    opacity: 0.8;
  }

  100% {
    opacity: 0.5;
  }
}
</style>
