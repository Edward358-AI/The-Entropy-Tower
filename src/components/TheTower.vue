<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore'

const playerStore = usePlayerStore()

// Calculate height based on current XP progress within level
// XP required is 100 + (Level * 20)
const progressPercent = computed(() => {
  const required = playerStore.xpToNextLevel
  const current = playerStore.currentXP
  return Math.min((current / required) * 100, 100)
})

const materialClass = computed(() => {
  const mat = playerStore.towerMaterial
  switch (mat) {
    case 'Stone': return 'bg-gray-600'
    case 'Iron': return 'bg-slate-400'
    case 'Gold': return 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]'
    case 'Diamond': return 'bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)]'
    case 'Astral': return 'bg-astral-glow shadow-[0_0_40px_rgba(233,69,96,0.8)]'
    default: return 'bg-gray-600'
  }
})
</script>

<template>
  <div class="relative w-24 h-[500px] bg-astral-nebula/30 border border-white/10 rounded-t-lg overflow-hidden mx-auto backdrop-blur-sm">
    <!-- Level Indicator -->
    <div class="absolute top-4 left-0 right-0 text-center z-10">
      <div class="text-xs text-gray-400 uppercase tracking-widest mb-1">Level</div>
      <div class="text-3xl font-bold font-display text-white">{{ playerStore.level }}</div>
      <div class="text-xs text-astral-glow font-bold mt-1">{{ playerStore.towerMaterial }} Age</div>
    </div>

    <!-- The Bar -->
    <div 
      class="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out flex items-start justify-center overflow-hidden"
      :class="materialClass"
      :style="{ height: `${progressPercent}%` }"
    >
      <!-- Texture overlay -->
      <div class="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
      
      <!-- Shine effect -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-white/20"></div>
    </div>

    <!-- Entropy Cracks (Overlay at bottom if decay happened recently) -->
    <div 
      v-if="playerStore.totalXPLost > 0"
      class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900/50 to-transparent pointer-events-none"
    >
      <div class="absolute bottom-2 left-0 right-0 text-center text-xs text-red-400 font-bold animate-pulse">
        ENTROPY DETECTED
      </div>
    </div>
  </div>
</template>
