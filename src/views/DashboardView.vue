<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { usePlayerStore } from '../stores/playerStore'
import { useRouter } from 'vue-router'
import TheTower from '../components/TheTower.vue'
import QuestFeed from '../components/QuestFeed.vue'
import AddGoal from '../components/AddGoal.vue'
import Heatmap from '../components/Heatmap.vue'
import BossGate from '../components/BossGate.vue'
import { LogOut, Plus, Swords, CalendarDays } from 'lucide-vue-next'

const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()

// Mobile tab state
const activeTab = ref('quests') // 'add' | 'quests' | 'history'

onMounted(() => {
  playerStore.initStats()
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/auth')
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full">
    <!-- Header -->
    <header class="flex justify-between items-center mb-4 md:mb-6">
      <div>
        <h1 class="text-xl md:text-2xl font-bold font-display text-white">Entropy Tower</h1>
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

    <!-- ==================== MOBILE LAYOUT ==================== -->
    <div class="md:hidden flex flex-col gap-3 flex-1">
      <!-- Vital Signs (compact) -->
      <div class="bg-astral-nebula/30 border border-white/5 rounded-xl px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-gray-400 text-sm">XP</span>
            <span class="font-mono text-lg text-white">{{ Math.floor(playerStore.currentXP) }} <span class="text-xs text-gray-500">/ {{ playerStore.xpToNextLevel }}</span></span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-400 text-sm">Entropy</span>
            <span class="font-mono text-lg text-red-400">-{{ playerStore.totalXPLost }}</span>
          </div>
        </div>
      </div>

      <!-- Tower (compact horizontal) -->
      <TheTower layout="horizontal" />

      <!-- Tab Navigation -->
      <div class="flex bg-astral-nebula/30 border border-white/5 rounded-xl overflow-hidden">
        <button @click="activeTab = 'add'"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
          :class="activeTab === 'add' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
          <Plus class="w-3.5 h-3.5" />
          Add
        </button>
        <button @click="activeTab = 'quests'"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-x border-white/5"
          :class="activeTab === 'quests' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
          <Swords class="w-3.5 h-3.5" />
          Quests
        </button>
        <button @click="activeTab = 'history'"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
          :class="activeTab === 'history' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
          <CalendarDays class="w-3.5 h-3.5" />
          History
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1">
        <!-- Add Quest Tab -->
        <div v-if="activeTab === 'add'">
          <AddGoal />
        </div>

        <!-- Active Quests Tab -->
        <div v-else-if="activeTab === 'quests'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
            <QuestFeed />
          </div>
        </div>

        <!-- History Tab -->
        <div v-else-if="activeTab === 'history'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Consistency Graph</h2>
            <Heatmap />
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== DESKTOP LAYOUT ==================== -->
    <div class="hidden md:grid flex-1 grid-cols-12 gap-6">
      
      <!-- Left Panel: Quest Feed -->
      <div class="col-span-4 flex flex-col gap-6">
        <AddGoal />
        <div class="flex-1 bg-astral-nebula/30 border border-white/5 rounded-xl p-4 flex flex-col min-h-0">
          <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
          <QuestFeed class="flex-1" />
        </div>
      </div>

      <!-- Center Panel: The Tower -->
      <div class="col-span-4 flex flex-col justify-center">
        <TheTower layout="vertical" />
      </div>

      <!-- Right Panel: Stats & History -->
      <div class="col-span-4 flex flex-col gap-6">
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
