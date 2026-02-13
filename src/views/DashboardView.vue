<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { usePlayerStore } from '../stores/playerStore'
import { useRouter } from 'vue-router'
import TheTower from '../components/TheTower.vue'
import QuestFeed from '../components/QuestFeed.vue'
import AddGoal from '../components/AddGoal.vue'
import Heatmap from '../components/Heatmap.vue'
import BossGate from '../components/BossGate.vue'
import { LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()

onMounted(() => {
  playerStore.initStats()
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/auth')
}
</script>

<template>
  <div class="h-screen flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full">
    <!-- Header -->
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold font-display text-white">Entropy Tower</h1>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <span>Streak: <span class="text-astral-glow font-bold">{{ playerStore.streak }} days</span></span>
          <span class="text-xs bg-white/10 px-2 py-0.5 rounded">Multiplier x{{ playerStore.streak >= 7 ? '1.5' : playerStore.streak >= 3 ? '1.2' : '1.0' }}</span>
        </div>
      </div>
      
      <button 
        @click="handleLogout"
        class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        title="Sign Out"
      >
        <LogOut class="w-5 h-5" />
      </button>
    </header>

    <!-- Main Grid -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
      
      <!-- Left Panel: Quest Feed -->
      <div class="md:col-span-4 flex flex-col gap-6 min-h-0">
        <AddGoal />
        <div class="flex-1 bg-astral-nebula/30 border border-white/5 rounded-xl p-4 flex flex-col min-h-0">
          <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
          <QuestFeed class="flex-1" />
        </div>
      </div>

      <!-- Center Panel: The Tower -->
      <div class="md:col-span-4 flex flex-col justify-end pb-8">
        <TheTower />
      </div>

      <!-- Right Panel: Stats & History -->
      <div class="md:col-span-4 flex flex-col gap-6">
        <!-- Stats Card -->
        <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4">
          <h2 class="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Vital Signs</h2>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-400">Current XP</span>
              <span class="font-mono text-xl">{{ Math.floor(playerStore.currentXP) }} <span class="text-sm text-gray-500">/ {{ playerStore.xpToNextLevel }}</span></span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Total Entropy</span>
              <span class="font-mono text-xl text-red-400">-{{ playerStore.totalXPLost }} XP</span>
            </div>
          </div>
        </div>

        <!-- Heatmap -->
        <div class="flex-1 bg-astral-nebula/30 border border-white/5 rounded-xl p-4">
          <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Consistency Graph</h2>
          <Heatmap />
        </div>
      </div>

    </div>
    
    <BossGate />
  </div>
</template>
