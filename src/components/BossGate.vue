<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore'
import { Ghost, Swords, Minimize2 } from 'lucide-vue-next'

const playerStore = usePlayerStore()

const isMinimized = ref(false)

const bossHPPercent = computed(() => {
  const remaining = playerStore.bossXPRequired - playerStore.bossXPEarned
  return Math.max((remaining / playerStore.bossXPRequired) * 100, 0)
})

const damageDealt = computed(() => Math.min(playerStore.bossXPEarned, playerStore.bossXPRequired))
</script>

<template>
  <div v-if="playerStore.isLevelCapped">
    <!-- Minimized Widget -->
    <button v-if="isMinimized" @click="isMinimized = false"
      class="fixed z-40 bottom-24 right-4 desk:bottom-8 desk:right-8 flex items-center gap-2 bg-astral-nebula border border-red-500/50 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-900/20 transition-colors">
      <div class="absolute inset-0 bg-red-500/10 rounded-full animate-pulse-slow pointer-events-none"></div>
      <Ghost class="w-5 h-5 text-red-500 animate-float" />
      <span class="text-xs font-bold text-red-300">GATEKEEPER DETECTED ({{ Math.round(bossHPPercent) }}%)</span>
    </button>

    <!-- Expanded Widget -->
    <div v-else
      class="fixed z-40 bottom-24 left-1/2 -translate-x-1/2 desk:bottom-8 desk:left-auto desk:right-8 desk:translate-x-0 w-[90%] max-w-[340px] bg-astral-nebula border border-red-500/30 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden">
      <!-- Background Pulse -->
      <div class="absolute inset-0 bg-red-500/5 animate-pulse-slow pointer-events-none"></div>

      <!-- Minimize Button -->
      <button @click="isMinimized = true"
        class="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-20"
        title="Minimize Gatekeeper">
        <Minimize2 class="w-4 h-4" />
      </button>

      <div class="relative z-10">
        <Ghost class="w-10 h-10 text-red-500 mx-auto mb-3 animate-float" />

        <h2 class="text-xl font-display font-bold text-white mb-1">GATEKEEPER DETECTED</h2>
        <p class="text-red-300 text-sm mb-2">
          A Gatekeeper blocks your path to Level {{ playerStore.level + 1 }}.
        </p>
        <p class="text-gray-400 text-sm mb-6">
          Complete quests to deal damage. Earn <span class="text-red-300 font-bold">{{ playerStore.bossXPRequired }}
            XP</span> to slay it.
        </p>

        <!-- Boss HP Bar -->
        <div class="bg-black/40 border border-red-500/20 rounded-xl p-3 mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Swords class="w-3.5 h-3.5 text-red-400" />
              Boss #{{ playerStore.bossNumber }}
            </span>
            <span class="text-xs font-mono text-red-300">
              {{ damageDealt }} / {{ playerStore.bossXPRequired }} DMG
            </span>
          </div>

          <!-- HP Bar -->
          <div class="h-5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
            <div class="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              :class="bossHPPercent < 25 ? 'boss-hp-critical' : 'boss-hp-bar'" :style="{ width: `${bossHPPercent}%` }">
              <div class="absolute inset-0 boss-hp-shimmer"></div>
            </div>
          </div>

          <div class="flex justify-between mt-1.5">
            <span class="text-[10px] text-gray-500">DEFEATED</span>
            <span class="text-[10px] text-gray-500">FULL HP</span>
          </div>
        </div>

        <p class="text-gray-500 text-xs">
          Keep completing quests — each one deals damage to the Gatekeeper.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boss-hp-bar {
  background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

.boss-hp-critical {
  background: linear-gradient(90deg, #991b1b, #dc2626, #991b1b);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
  animation: critical-pulse 1s ease-in-out infinite;
}

.boss-hp-shimmer {
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer 2.5s ease-in-out infinite;
}

@keyframes shimmer {

  0%,
  100% {
    background-position: 200% 0;
  }

  50% {
    background-position: -100% 0;
  }
}

@keyframes critical-pulse {

  0%,
  100% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }
}
</style>
