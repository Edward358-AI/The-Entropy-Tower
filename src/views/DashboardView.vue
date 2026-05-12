<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { usePlayerStore } from '../stores/playerStore'
import { useQuestStore } from '../stores/questStore'
import { useTime } from '../composables/useTime'
import { useRouter } from 'vue-router'
import TheTower from '../components/TheTower.vue'
import QuestFeed from '../components/QuestFeed.vue'
import AddGoal from '../components/AddGoal.vue'
import Heatmap from '../components/Heatmap.vue'
import BossGate from '../components/BossGate.vue'
import ThemePicker from '../components/ThemePicker.vue'
import CoinShop from '../components/CoinShop.vue'
import { LogOut, Plus, Swords, CalendarDays, BookOpen, Palette, RefreshCw, Coins, ShoppingBag, Flame } from 'lucide-vue-next'

const authStore = useAuthStore()
const playerStore = usePlayerStore()
const questStore = useQuestStore()
const router = useRouter()
const { onDayChange } = useTime()

// Card cosmetic styles for app-wide panels
const PANEL_STYLES = {
  cardGilded: {
    border: '1px solid rgba(251, 191, 36, 0.35)',
    background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.15), rgba(26, 26, 46, 0.3))',
    boxShadow: '0 0 15px rgba(251, 191, 36, 0.08)',
  },
  cardPhantom: {
    border: '1px solid rgba(129, 140, 248, 0.2)',
    background: 'rgba(49, 46, 129, 0.15)',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.08), inset 0 0 40px rgba(99, 102, 241, 0.03)',
  },
  cardRunic: {
    border: '1px solid rgba(139, 92, 246, 0.25)',
    background: 'rgba(76, 29, 149, 0.1)',
    boxShadow: 'inset 0 1px 0 rgba(167, 139, 250, 0.12), 0 0 18px rgba(139, 92, 246, 0.06)',
  },
}

const panelStyle = computed(() => {
  const style = playerStore.selectedCosmetics?.cardStyle
  return (style && PANEL_STYLES[style]) ? PANEL_STYLES[style] : {}
})

// Mobile tab state
const activeTab = ref('quests') // 'add' | 'quests' | 'history' | 'shop'
const showThemePicker = ref(false)
const isRefreshing = ref(false)
const rightPanelTab = ref('history') // 'history' | 'shop' (desktop)

const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([playerStore.initStats(), questStore.loadQuests()])
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 600)
  }
}

onMounted(() => {
  playerStore.initStats()
})

// Midnight rollover: hard refresh when the date changes locally
onDayChange(() => {
  questStore.handleMidnightRollover()
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4 desk:p-8 max-w-6xl mx-auto w-full relative">
    <!-- Header -->
    <header class="flex justify-between items-center mb-4 desk:mb-6">
      <div>
        <h1 class="text-xl desk:text-2xl font-bold font-display text-white">Entropy Tower</h1>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <span>Streak: <span class="text-astral-glow font-bold">{{ playerStore.streak }} days</span></span>
          <span class="text-xs bg-white/10 px-2 py-0.5 rounded">Multiplier x{{ playerStore.streak >= 14 ? '2.5' :
            playerStore.streak >= 7 ? '2.0' : playerStore.streak >= 5 ? '1.6' :
              playerStore.streak >= 3 ? '1.3' : '1.0' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button @click="handleRefresh"
          class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Refresh">
          <RefreshCw class="w-5 h-5 transition-transform duration-500" :class="isRefreshing ? 'animate-spin' : ''" />
        </button>
        <button @click="showThemePicker = true"
          class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Themes">
          <Palette class="w-5 h-5" />
        </button>
        <router-link to="/tutorial"
          class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Tutorial">
          <BookOpen class="w-5 h-5" />
        </router-link>
        <button @click="handleLogout"
          class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Sign Out">
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- ==================== MOBILE LAYOUT ==================== -->
    <div class="desk:hidden flex flex-col gap-3">
      <!-- Vital Signs (compact) -->
      <div class="bg-astral-nebula/30 border border-white/5 rounded-xl px-4 py-3" :style="panelStyle">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-gray-400 text-sm">XP</span>
            <span class="font-mono text-lg text-white">{{ Math.floor(playerStore.currentXP) }} <span
                class="text-xs text-gray-500">/ {{ playerStore.xpToNextLevel }}</span></span>
          </div>
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1 text-amber-400">
              <span class="hidden sm:inline text-gray-400 text-sm mr-1">Coins</span>
              <Coins class="w-3.5 h-3.5" />
              <span class="font-mono text-lg font-bold">{{ playerStore.coins }}</span>
            </span>
            <span class="flex items-center gap-1 text-red-400">
              <span class="hidden sm:inline text-gray-400 text-sm mr-1">Entropy</span>
              <Flame class="w-3.5 h-3.5" />
              <span class="font-mono text-lg">-{{ playerStore.totalXPLost }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Tower (compact horizontal) -->
      <TheTower layout="horizontal" />

      <!-- Tab Navigation -->
      <div class="flex bg-astral-nebula/30 border border-white/5 rounded-xl overflow-hidden" :style="panelStyle">
        <button @click="activeTab = 'add'"
          class="flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors"
          :class="activeTab === 'add' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
          <Plus class="w-5 h-5" />
        </button>
        <button @click="activeTab = 'quests'"
          class="flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors border-x border-white/5"
          :class="activeTab === 'quests' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
          <Swords class="w-5 h-5" />
        </button>
        <button @click="activeTab = 'history'"
          class="flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors border-r border-white/5"
          :class="activeTab === 'history' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
          <CalendarDays class="w-5 h-5" />
        </button>
        <button @click="activeTab = 'shop'"
          class="flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors"
          :class="activeTab === 'shop' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'">
          <ShoppingBag class="w-5 h-5" />
        </button>
      </div>

      <!-- Tab Content -->
      <div>
        <!-- Add Quest Tab -->
        <div v-if="activeTab === 'add'">
          <AddGoal />
        </div>

        <!-- Active Quests Tab -->
        <div v-else-if="activeTab === 'quests'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
            <QuestFeed />
          </div>
        </div>

        <!-- History Tab -->
        <div v-else-if="activeTab === 'history'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Consistency Graph</h2>
            <Heatmap />
          </div>
        </div>

        <!-- Shop Tab -->
        <div v-else-if="activeTab === 'shop'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Coin Shop</h2>
            <CoinShop />
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== DESKTOP LAYOUT ==================== -->
    <div class="hidden desk:grid grid-cols-12 gap-6">

      <!-- Left Panel: Quest Feed -->
      <div class="col-span-4 flex flex-col gap-6 min-w-0">
        <AddGoal />
        <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4 flex flex-col" :style="panelStyle">
          <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
          <QuestFeed class="flex-1" />
        </div>
      </div>

      <!-- Center Panel: The Tower -->
      <div class="col-span-4 flex flex-col">
        <TheTower layout="vertical" />
      </div>

      <!-- Right Panel: Stats & History -->
      <div class="col-span-4 flex flex-col gap-6">
        <!-- Stats Card -->
        <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
          <h2 class="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Vital Signs</h2>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-400">Current XP</span>
              <span class="font-mono text-xl">{{ Math.floor(playerStore.currentXP) }} <span
                  class="text-sm text-gray-500">/ {{ playerStore.xpToNextLevel }}</span></span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400 flex items-center gap-1">
                <Flame class="w-4 h-4 text-red-500" /> Total Entropy
              </span>
              <span class="font-mono text-xl text-red-400">-{{ playerStore.totalXPLost }} XP</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400 flex items-center gap-1">
                <Coins class="w-4 h-4 text-amber-400" /> Coins
              </span>
              <span class="font-mono text-xl text-amber-400">{{ playerStore.coins }}</span>
            </div>
          </div>
        </div>

        <!-- Right Panel Tabs: History | Shop -->
        <div class="flex bg-white/5 rounded-lg overflow-hidden">
          <button @click="rightPanelTab = 'history'"
            class="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            :class="rightPanelTab === 'history' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
            History
          </button>
          <button @click="rightPanelTab = 'shop'"
            class="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            :class="rightPanelTab === 'shop' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'">
            Shop
          </button>
        </div>

        <!-- Heatmap -->
        <div v-if="rightPanelTab === 'history'" class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4"
          :style="panelStyle">
          <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Consistency Graph</h2>
          <Heatmap />
        </div>

        <!-- Shop -->
        <div v-else class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
          <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Coin Shop</h2>
          <CoinShop />
        </div>
      </div>

    </div>

    <BossGate />
    <ThemePicker v-if="showThemePicker" @close="showThemePicker = false" />
  </div>
</template>
