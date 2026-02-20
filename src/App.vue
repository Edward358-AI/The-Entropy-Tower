<script setup>
import { computed, onMounted } from 'vue'
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

// Page-wide ambient effect class — all tiers
const pageEffectClass = computed(() => {
  const mat = playerStore.activePageTheme
  const map = {
    'Stone': 'page-fx-stone',
    'Iron': 'page-fx-iron',
    'Gold': 'page-fx-gold',
    'Diamond': 'page-fx-diamond',
    'Astral': 'page-fx-astral',
    'Void': 'page-fx-void',
    'Celestial': 'page-fx-celestial',
    'Ethereal': 'page-fx-ethereal',
    'Mythic': 'page-fx-mythic',
    'Transcendent': 'page-fx-transcendent',
    'Omega': 'page-fx-omega',
  }
  return map[mat] || null
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

    <!-- Page-Wide Ambient Effects (Lv 50+) -->
    <div v-if="pageEffectClass" class="fixed inset-0 z-[5] pointer-events-none overflow-hidden"
      :class="pageEffectClass"></div>

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

/* ========== PAGE-WIDE TIER EFFECTS ========== */

/* Stone: subtle gray dust */
.page-fx-stone {
  background-image:
    radial-gradient(100px 100px at 15% 25%, rgba(156, 163, 175, 0.1) 0%, transparent 70%),
    radial-gradient(80px 80px at 80% 70%, rgba(107, 114, 128, 0.08) 0%, transparent 70%);
  animation: page-fx-drift 18s ease-in-out infinite;
}

/* Iron: metallic silver shimmer */
.page-fx-iron {
  background-image:
    radial-gradient(120px 120px at 20% 30%, rgba(148, 163, 184, 0.15) 0%, transparent 70%),
    radial-gradient(100px 100px at 75% 65%, rgba(203, 213, 225, 0.12) 0%, transparent 70%),
    radial-gradient(90px 90px at 50% 85%, rgba(148, 163, 184, 0.1) 0%, transparent 70%);
  animation: page-fx-drift 16s ease-in-out infinite;
}

/* Gold: warm golden particles */
.page-fx-gold {
  background-image:
    radial-gradient(140px 140px at 15% 20%, rgba(234, 179, 8, 0.18) 0%, transparent 70%),
    radial-gradient(110px 110px at 80% 60%, rgba(250, 204, 21, 0.14) 0%, transparent 70%),
    radial-gradient(90px 90px at 45% 85%, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
  animation: page-fx-glow 8s ease-in-out infinite;
}

/* Diamond: prismatic sparkles */
.page-fx-diamond {
  background-image:
    radial-gradient(130px 130px at 10% 15%, rgba(34, 211, 238, 0.18) 0%, transparent 70%),
    radial-gradient(150px 150px at 85% 70%, rgba(165, 243, 252, 0.15) 0%, transparent 70%),
    radial-gradient(100px 100px at 50% 45%, rgba(103, 232, 249, 0.12) 0%, transparent 70%);
  animation: page-fx-drift 14s ease-in-out infinite;
}

/* Astral: nebula glow */
.page-fx-astral {
  background:
    radial-gradient(180px 180px at 25% 25%, rgba(168, 85, 247, 0.15) 0%, transparent 70%),
    radial-gradient(200px 200px at 75% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 70%),
    radial-gradient(150px 150px at 50% 50%, rgba(192, 132, 252, 0.1) 0%, transparent 70%);
  animation: page-fx-glow 10s ease-in-out infinite;
}

/* Void: large floating purple orbs */
.page-fx-void {
  background-image:
    radial-gradient(200px 200px at 10% 20%, rgba(124, 58, 237, 0.35) 0%, transparent 70%),
    radial-gradient(250px 250px at 85% 75%, rgba(167, 139, 250, 0.3) 0%, transparent 70%),
    radial-gradient(220px 220px at 50% 50%, rgba(88, 28, 135, 0.25) 0%, transparent 70%),
    radial-gradient(160px 160px at 30% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation: page-fx-drift 12s ease-in-out infinite;
}

/* Celestial: warm golden edge beams */
.page-fx-celestial {
  background:
    radial-gradient(ellipse at 50% -10%, rgba(251, 191, 36, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse at -5% 50%, rgba(253, 224, 71, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 105% 50%, rgba(253, 224, 71, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 110%, rgba(245, 158, 11, 0.15) 0%, transparent 45%);
  animation: page-fx-glow 6s ease-in-out infinite;
}

/* Ethereal: teal nebula wisps */
.page-fx-ethereal {
  background-image:
    radial-gradient(280px 8px at 15% 25%, rgba(45, 212, 191, 0.4), transparent),
    radial-gradient(320px 7px at 75% 55%, rgba(94, 234, 212, 0.35), transparent),
    radial-gradient(250px 8px at 40% 80%, rgba(45, 212, 191, 0.38), transparent),
    radial-gradient(200px 6px at 85% 15%, rgba(153, 246, 228, 0.3), transparent),
    radial-gradient(180px 180px at 20% 60%, rgba(20, 184, 166, 0.15) 0%, transparent 70%);
  animation: page-fx-drift 10s ease-in-out infinite;
}

/* Mythic: aurora gradient across page */
.page-fx-mythic {
  background: linear-gradient(180deg,
      rgba(16, 185, 129, 0.28) 0%,
      rgba(45, 212, 191, 0.2) 15%,
      rgba(59, 130, 246, 0.15) 30%,
      rgba(139, 92, 246, 0.18) 50%,
      rgba(236, 72, 153, 0.12) 70%,
      transparent 90%);
  animation: page-fx-aurora 8s ease-in-out infinite;
}

/* Transcendent: scanlines + chromatic edges */
.page-fx-transcendent {
  background:
    repeating-linear-gradient(0deg, transparent 0px, transparent 4px, rgba(251, 113, 133, 0.06) 4px, rgba(251, 113, 133, 0.06) 5px),
    radial-gradient(ellipse at 0% 0%, rgba(239, 68, 68, 0.3) 0%, transparent 40%),
    radial-gradient(ellipse at 100% 100%, rgba(139, 92, 246, 0.3) 0%, transparent 40%),
    radial-gradient(ellipse at 100% 0%, rgba(244, 114, 182, 0.15) 0%, transparent 35%),
    radial-gradient(ellipse at 0% 100%, rgba(251, 113, 133, 0.15) 0%, transparent 35%);
  animation: page-fx-glitch 5s steps(8) infinite;
}

/* Omega: full cosmic radiance */
.page-fx-omega {
  background:
    radial-gradient(ellipse at 50% -5%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at -5% 50%, rgba(232, 121, 249, 0.28) 0%, transparent 45%),
    radial-gradient(ellipse at 105% 50%, rgba(56, 189, 248, 0.28) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 105%, rgba(250, 204, 21, 0.22) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  animation: page-fx-omega 5s ease-in-out infinite;
}

@keyframes page-fx-drift {

  0%,
  100% {
    opacity: 0.8;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

@keyframes page-fx-glow {

  0%,
  100% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }
}

@keyframes page-fx-aurora {

  0%,
  100% {
    opacity: 0.8;
    filter: hue-rotate(0deg);
  }

  50% {
    opacity: 1;
    filter: hue-rotate(40deg);
  }
}

@keyframes page-fx-glitch {

  0%,
  100% {
    opacity: 0.7;
  }

  25% {
    opacity: 0.9;
  }

  50% {
    opacity: 0.75;
  }

  75% {
    opacity: 1;
  }
}

@keyframes page-fx-omega {

  0%,
  100% {
    opacity: 0.8;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.03);
  }
}
</style>
