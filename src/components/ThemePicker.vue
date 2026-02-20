<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore'
import { Lock, X, Check } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const playerStore = usePlayerStore()

const TIER_LIST = playerStore.TIER_LIST

const tierColors = {
  'Stone': { bg: 'bg-gray-600/20', border: 'border-gray-500/40', text: 'text-gray-300', activeBorder: 'border-gray-400' },
  'Iron': { bg: 'bg-slate-400/20', border: 'border-slate-400/40', text: 'text-slate-300', activeBorder: 'border-slate-300' },
  'Gold': { bg: 'bg-yellow-500/20', border: 'border-yellow-400/40', text: 'text-yellow-300', activeBorder: 'border-yellow-400' },
  'Diamond': { bg: 'bg-cyan-400/20', border: 'border-cyan-400/40', text: 'text-cyan-300', activeBorder: 'border-cyan-400' },
  'Astral': { bg: 'bg-astral-glow/20', border: 'border-astral-glow/40', text: 'text-astral-glow', activeBorder: 'border-astral-glow' },
  'Void': { bg: 'bg-purple-500/20', border: 'border-purple-400/40', text: 'text-purple-300', activeBorder: 'border-purple-400' },
  'Celestial': { bg: 'bg-amber-400/20', border: 'border-amber-300/40', text: 'text-amber-300', activeBorder: 'border-amber-300' },
  'Ethereal': { bg: 'bg-teal-400/20', border: 'border-teal-300/40', text: 'text-teal-300', activeBorder: 'border-teal-300' },
  'Mythic': { bg: 'bg-emerald-400/20', border: 'border-emerald-300/40', text: 'text-emerald-300', activeBorder: 'border-emerald-300' },
  'Transcendent': { bg: 'bg-rose-400/20', border: 'border-rose-300/40', text: 'text-rose-300', activeBorder: 'border-rose-300' },
  'Omega': { bg: 'bg-white/10', border: 'border-white/40', text: 'text-white', activeBorder: 'border-white' },
}

const tierLevelRange = (tier) => {
  const idx = TIER_LIST.indexOf(tier)
  if (idx === TIER_LIST.length - 1) return 'Lv 100'
  return `Lv ${idx * 10}–${idx * 10 + 9}`
}

const isUnlocked = (tier) => playerStore.unlockedTiers.includes(tier)

// Current active selections (null means "auto")
const activeTower = computed(() => playerStore.selectedTowerTheme || null)
const activePage = computed(() => playerStore.selectedPageTheme || null)

const selectTower = async (tier) => {
  if (!isUnlocked(tier)) return
  // If selecting current tier or same as auto, set to null (auto mode)
  if (tier === playerStore.towerMaterial || tier === playerStore.selectedTowerTheme) {
    playerStore.selectedTowerTheme = null
  } else {
    playerStore.selectedTowerTheme = tier
  }
  await playerStore.saveStats()
}

const selectPage = async (tier) => {
  if (!isUnlocked(tier)) return
  if (tier === playerStore.towerMaterial || tier === playerStore.selectedPageTheme) {
    playerStore.selectedPageTheme = null
  } else {
    playerStore.selectedPageTheme = tier
  }
  await playerStore.saveStats()
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

    <!-- Modal -->
    <div
      class="relative bg-astral-nebula border border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
      <!-- Header -->
      <div
        class="sticky top-0 bg-astral-nebula/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 class="text-lg font-display font-bold text-white">Theme Selector</h2>
          <p class="text-xs text-gray-400 mt-0.5">Equip any tier you've unlocked</p>
        </div>
        <button @click="emit('close')"
          class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="px-6 py-5 space-y-6">
        <!-- Tower Theme Section -->
        <div>
          <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Tower Design</h3>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button v-for="tier in TIER_LIST" :key="'tower-' + tier" @click="selectTower(tier)"
              :disabled="!isUnlocked(tier)"
              class="relative rounded-xl p-3 text-center transition-all duration-200 border-2" :class="[
                isUnlocked(tier) ? tierColors[tier].bg : 'bg-white/[0.02]',
                isUnlocked(tier)
                  ? (activeTower === tier
                    ? tierColors[tier].activeBorder + ' shadow-lg scale-105'
                    : (!activeTower && tier === playerStore.towerMaterial
                      ? tierColors[tier].activeBorder + ' shadow-lg scale-105'
                      : tierColors[tier].border + ' hover:scale-[1.03] cursor-pointer'))
                  : 'border-white/5 cursor-not-allowed',
                isUnlocked(tier) ? '' : 'opacity-40'
              ]">
              <!-- Lock overlay -->
              <div v-if="!isUnlocked(tier)" class="absolute inset-0 flex items-center justify-center z-10">
                <Lock class="w-4 h-4 text-gray-500" />
              </div>

              <!-- Active check -->
              <div
                v-if="isUnlocked(tier) && (activeTower === tier || (!activeTower && tier === playerStore.towerMaterial))"
                class="absolute top-1 right-1">
                <Check class="w-3.5 h-3.5" :class="tierColors[tier].text" />
              </div>

              <div class="text-xs font-bold" :class="isUnlocked(tier) ? tierColors[tier].text : 'text-gray-600'">
                {{ tier }}
              </div>
              <div class="text-[9px] mt-0.5" :class="isUnlocked(tier) ? 'text-gray-500' : 'text-gray-700'">
                {{ tierLevelRange(tier) }}
              </div>
            </button>
          </div>
        </div>

        <!-- Page Background Section -->
        <div>
          <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Page Background</h3>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button v-for="tier in TIER_LIST" :key="'page-' + tier" @click="selectPage(tier)"
              :disabled="!isUnlocked(tier)"
              class="relative rounded-xl p-3 text-center transition-all duration-200 border-2" :class="[
                isUnlocked(tier) ? tierColors[tier].bg : 'bg-white/[0.02]',
                isUnlocked(tier)
                  ? (activePage === tier
                    ? tierColors[tier].activeBorder + ' shadow-lg scale-105'
                    : (!activePage && tier === playerStore.towerMaterial
                      ? tierColors[tier].activeBorder + ' shadow-lg scale-105'
                      : tierColors[tier].border + ' hover:scale-[1.03] cursor-pointer'))
                  : 'border-white/5 cursor-not-allowed',
                isUnlocked(tier) ? '' : 'opacity-40'
              ]">
              <!-- Lock overlay -->
              <div v-if="!isUnlocked(tier)" class="absolute inset-0 flex items-center justify-center z-10">
                <Lock class="w-4 h-4 text-gray-500" />
              </div>

              <!-- Active check -->
              <div
                v-if="isUnlocked(tier) && (activePage === tier || (!activePage && tier === playerStore.towerMaterial))"
                class="absolute top-1 right-1">
                <Check class="w-3.5 h-3.5" :class="tierColors[tier].text" />
              </div>

              <div class="text-xs font-bold" :class="isUnlocked(tier) ? tierColors[tier].text : 'text-gray-600'">
                {{ tier }}
              </div>
              <div class="text-[9px] mt-0.5" :class="isUnlocked(tier) ? 'text-gray-500' : 'text-gray-700'">
                {{ tierLevelRange(tier) }}
              </div>
            </button>
          </div>
        </div>

        <!-- Info -->
        <p class="text-xs text-gray-500 text-center pb-2">
          Reach new levels to unlock more themes. Select your current tier to reset to auto.
        </p>
      </div>
    </div>
  </div>
</template>
