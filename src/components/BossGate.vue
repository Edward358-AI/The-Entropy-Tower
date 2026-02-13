<script setup>
import { usePlayerStore } from '../stores/playerStore'
import { useQuestStore } from '../stores/questStore'
import { computed } from 'vue'
import { Ghost, Sword } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const questStore = useQuestStore()

const bossQuest = computed(() => {
  return questStore.quests.find(q => q.isBoss && q.status !== 'completed')
})

// If no boss quest exists but we are capped, we might need to generate one
// For now, this component just shows the gate
</script>

<template>
  <div 
    v-if="playerStore.isLevelCapped"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
  >
    <div class="bg-astral-nebula border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">
      <!-- Background Pulse -->
      <div class="absolute inset-0 bg-red-500/5 animate-pulse-slow pointer-events-none"></div>

      <div class="relative z-10">
        <Ghost class="w-16 h-16 text-red-500 mx-auto mb-4 animate-float" />
        
        <h2 class="text-3xl font-display font-bold text-white mb-2">GATEKEEPER DETECTED</h2>
        <p class="text-red-300 mb-6">
          Your Entropy capacity has reached its limit. You cannot ascend to Level {{ playerStore.level + 1 }} 
          until you defeat the Gatekeeper.
        </p>

        <div v-if="bossQuest" class="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
          <h3 class="font-bold text-white text-lg">{{ bossQuest.title }}</h3>
          <p class="text-red-400 text-sm mt-1">Reward: ASCENSION + {{ bossQuest.xpReward }} XP</p>
        </div>
        <div v-else class="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
          <p class="text-red-400 text-sm">No Boss Quest Found. Consult the Architect to summon one.</p>
        </div>

        <button 
          v-if="bossQuest"
          @click="questStore.completeQuest(bossQuest.id)"
          class="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 mx-auto transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
        >
          <Sword class="w-5 h-5" />
          SLAY GATEKEEPER
        </button>
      </div>
    </div>
  </div>
</template>
