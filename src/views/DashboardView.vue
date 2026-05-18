<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
import { LogOut, Plus, Swords, CalendarDays, BookOpen, Palette, RefreshCw, Coins, ShoppingBag, Flame, TowerControl, ScrollText } from 'lucide-vue-next'

const authStore = useAuthStore()
const playerStore = usePlayerStore()
const questStore = useQuestStore()
const router = useRouter()
const { now, onDayChange } = useTime()

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

// Mobile tab state (< 768px)
const activeTab = ref('quests') // 'add' | 'quests' | 'history' | 'shop'

// Desktop tab state (>= 768px)
const desktopTab = ref('tower') // 'tower' | 'quests' | 'shop'

const showThemePicker = ref(false)
const isRefreshing = ref(false)

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

// Every 60-second tick: re-check if any quests have become overdue mid-session
watch(now, () => {
  questStore.refreshOverdueStatus()
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
  <div class="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full relative">
    <!-- Header -->
    <header class="flex justify-between items-center mb-4 md:mb-6">
      <div>
        <h1 class="text-xl md:text-2xl font-bold font-display text-white">Entropy Tower</h1>
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

    <!-- ==================== MOBILE LAYOUT (< 768px) ==================== -->
    <div class="md:hidden flex flex-col gap-3">
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
              <Coins class="w-3.5 h-3.5" />
              <span class="font-mono text-lg font-bold">{{ playerStore.coins }}</span>
            </span>
            <span class="flex items-center gap-1 text-red-400">
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
        <div v-if="activeTab === 'add'"><AddGoal /></div>
        <div v-else-if="activeTab === 'quests'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
            <QuestFeed />
          </div>
        </div>
        <div v-else-if="activeTab === 'history'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Consistency Graph</h2>
            <Heatmap />
          </div>
        </div>
        <div v-else-if="activeTab === 'shop'">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Coin Shop</h2>
            <CoinShop />
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== DESKTOP LAYOUT (>= 768px) ==================== -->
    <div class="hidden md:flex flex-col gap-6 flex-1">

      <!-- Desktop 3-Tab Navigation -->
      <div class="flex justify-center">
        <div class="inline-flex bg-astral-nebula/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <button @click="desktopTab = 'tower'"
            class="flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300"
            :class="desktopTab === 'tower'
              ? 'bg-astral-glow/20 text-astral-glow border-b-2 border-astral-glow'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'">
            <Flame class="w-4 h-4" />
            Tower
          </button>
          <button @click="desktopTab = 'quests'"
            class="flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-x border-white/5"
            :class="desktopTab === 'quests'
              ? 'bg-astral-glow/20 text-astral-glow border-b-2 border-astral-glow'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'">
            <ScrollText class="w-4 h-4" />
            Quests
          </button>
          <button @click="desktopTab = 'shop'"
            class="flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300"
            :class="desktopTab === 'shop'
              ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'">
            <ShoppingBag class="w-4 h-4" />
            Shop
          </button>
        </div>
      </div>

      <!-- TAB 1: Tower (left) | Vitals + Heatmap (right) -->
      <div v-if="desktopTab === 'tower'" class="flex justify-center items-center gap-12 lg:gap-32">
        <!-- Left: The Tower -->
        <div class="flex flex-col items-center">
          <TheTower layout="vertical" />
        </div>

        <!-- Right: Vitals + Heatmap stacked -->
        <div class="flex flex-col gap-6 max-w-[350px]">
          <!-- Vital Signs -->
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-5" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Vital Signs</h2>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-400">Level</span>
                <span class="font-mono text-xl text-white">{{ playerStore.level }}
                  <span class="text-sm text-gray-500">{{ playerStore.towerMaterial }}</span>
                </span>
              </div>
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

            <!-- Active Effects -->
            <div v-if="playerStore.activeEffects.xpBoost > 0 || playerStore.activeEffects.doubleCoins > 0 || (playerStore.activeEffects.dampenerExpires && new Date(playerStore.activeEffects.dampenerExpires) > new Date()) || (playerStore.activeEffects.momentumSurgeExpires && new Date(playerStore.activeEffects.momentumSurgeExpires) > new Date())" 
                 class="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
              <span v-if="playerStore.activeEffects.xpBoost > 0" class="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2.5 py-1 rounded-full">
                ⚡ XP Boost ({{ playerStore.activeEffects.xpBoost }} left)
              </span>
              <span v-if="playerStore.activeEffects.doubleCoins > 0" class="text-xs bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full">
                💰 2× Coins ({{ playerStore.activeEffects.doubleCoins }} left)
              </span>
              <span v-if="playerStore.activeEffects.dampenerExpires && new Date(playerStore.activeEffects.dampenerExpires) > new Date()" class="text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-full">
                🔻 Dampener Active
              </span>
              <span v-if="playerStore.activeEffects.momentumSurgeExpires && new Date(playerStore.activeEffects.momentumSurgeExpires) > new Date()" class="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full">
                📈 Surge Active
              </span>
            </div>
          </div>

          <!-- Heatmap -->
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-5" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Consistency Graph</h2>
            <Heatmap />
          </div>
        </div>
      </div>

      <!-- TAB 2: Quests — AddGoal | QuestFeed -->
      <!-- lg: side-by-side | md-lg: stacked vertically -->
      <div v-else-if="desktopTab === 'quests'" class="flex flex-col lg:flex-row gap-6">
        <!-- Left / Top: Quest Creation -->
        <div class="lg:w-[45%] lg:min-w-[380px]">
          <AddGoal />
        </div>
        <!-- Right / Bottom: Active Quests -->
        <div class="flex-1 min-w-0">
          <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4" :style="panelStyle">
            <h2 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Quests</h2>
            <QuestFeed />
          </div>
        </div>
      </div>

      <!-- TAB 3: Shop — Full width expanded -->
      <div v-else-if="desktopTab === 'shop'">
        <CoinShop :expanded="true" />
      </div>

    </div>

    <BossGate />
    <ThemePicker v-if="showThemePicker" @close="showThemePicker = false" />
  </div>
</template>
