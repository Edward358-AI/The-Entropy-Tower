<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore'
import { Coins, ShieldCheck, Snowflake, Zap, CircleDollarSign, ArrowDown, Skull, Palette, Grid3x3, Swords, Sparkles } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const activeTab = ref('consumables') // 'consumables' | 'cosmetics'
const cosmeticSub = ref('theme') // 'theme' | 'heatmap' | 'cardStyle' | 'xpBar'
const feedbackItem = ref(null) // flash feedback on buy

const consumableIds = ['entropyShield', 'streakFreeze', 'xpBoost', 'doubleCoins', 'decayDampener', 'revivalElixir']
const cosmeticCategories = {
  theme:     { label: 'Themes',     ids: ['themeCrimson', 'themeAbyssal', 'themeNeon', 'themeAurora', 'themeSolar'] },
  heatmap:   { label: 'Heatmap',    ids: ['heatmapOcean', 'heatmapViolet', 'heatmapEmber', 'heatmapMono'] },
  cardStyle: { label: 'Cards',      ids: ['cardGilded', 'cardPhantom', 'cardRunic'] },
  xpBar:     { label: 'XP Bar',     ids: ['xpGradient', 'xpLightning', 'xpPrismatic'] },
}

const cosmeticItems = computed(() => cosmeticCategories[cosmeticSub.value]?.ids || [])

const canAfford = (itemId) => playerStore.coins >= playerStore.SHOP_ITEMS[itemId]?.price
const isMaxed = (itemId) => {
  const item = playerStore.SHOP_ITEMS[itemId]
  if (item?.type === 'consumable') return playerStore.inventory[itemId] >= item.max
  if (item?.type === 'cosmetic') return playerStore.ownedCosmetics.includes(itemId)
  return false
}

const isActive = (itemId) => {
  if (itemId === 'xpBoost') return playerStore.activeEffects.xpBoost > 0
  if (itemId === 'doubleCoins') return playerStore.activeEffects.doubleCoins > 0
  if (itemId === 'decayDampener') return playerStore.activeEffects.dampenerExpires && new Date(playerStore.activeEffects.dampenerExpires) > new Date()
  return false
}

const isSelected = (itemId) => {
  const item = playerStore.SHOP_ITEMS[itemId]
  if (!item || item.type !== 'cosmetic') return false
  return playerStore.selectedCosmetics[item.category] === itemId
}

const handleBuy = (itemId) => {
  const ok = playerStore.purchaseItem(itemId)
  if (ok) {
    feedbackItem.value = itemId
    setTimeout(() => feedbackItem.value = null, 1200)
  }
}

const handleActivate = (itemId) => {
  playerStore.activateItem(itemId)
}

const handleSelect = (itemId) => {
  playerStore.selectCosmetic(itemId)
}

const getItemIcon = (itemId) => {
  const icons = {
    entropyShield: ShieldCheck, streakFreeze: Snowflake, xpBoost: Zap,
    doubleCoins: CircleDollarSign, decayDampener: ArrowDown, revivalElixir: Skull,
  }
  return icons[itemId] || Sparkles
}
</script>

<template>
  <div class="space-y-3">
    <!-- Coin Balance -->
    <div class="flex items-center justify-between bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-500/20 rounded-xl px-4 py-2.5">
      <div class="flex items-center gap-2">
        <Coins class="w-5 h-5 text-amber-400" />
        <span class="text-sm font-bold text-amber-300">Balance</span>
      </div>
      <span class="font-mono text-lg font-bold text-amber-400">{{ playerStore.coins }}</span>
    </div>

    <!-- Tabs -->
    <div class="flex bg-white/5 rounded-lg overflow-hidden">
      <button @click="activeTab = 'consumables'"
        class="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
        :class="activeTab === 'consumables' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
        Items
      </button>
      <button @click="activeTab = 'cosmetics'"
        class="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
        :class="activeTab === 'cosmetics' ? 'bg-astral-glow/20 text-astral-glow' : 'text-gray-500 hover:text-gray-300'">
        Cosmetics
      </button>
    </div>

    <!-- Active Effects Banner -->
    <div v-if="playerStore.activeEffects.xpBoost > 0 || playerStore.activeEffects.doubleCoins > 0 || (playerStore.activeEffects.dampenerExpires && new Date(playerStore.activeEffects.dampenerExpires) > new Date())"
      class="flex flex-wrap gap-1.5">
      <span v-if="playerStore.activeEffects.xpBoost > 0" class="text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
        ⚡ XP Boost ({{ playerStore.activeEffects.xpBoost }} left)
      </span>
      <span v-if="playerStore.activeEffects.doubleCoins > 0" class="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
        💰 2× Coins ({{ playerStore.activeEffects.doubleCoins }} left)
      </span>
      <span v-if="playerStore.activeEffects.dampenerExpires && new Date(playerStore.activeEffects.dampenerExpires) > new Date()" class="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
        🔻 Dampener Active
      </span>
    </div>

    <!-- Consumables Grid -->
    <div v-if="activeTab === 'consumables'" class="grid grid-cols-2 gap-2">
      <div v-for="id in consumableIds" :key="id"
        class="relative border rounded-xl p-3 transition-all duration-300"
        :class="[
          feedbackItem === id ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]' : 'border-white/10 bg-white/[0.02]',
          isMaxed(id) ? 'opacity-50' : ''
        ]">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-lg">{{ playerStore.SHOP_ITEMS[id].emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-white truncate">{{ playerStore.SHOP_ITEMS[id].name }}</div>
            <div class="text-[10px] text-gray-500 leading-tight">{{ playerStore.SHOP_ITEMS[id].desc }}</div>
          </div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-[10px] text-gray-500">
            {{ playerStore.inventory[id] }}/{{ playerStore.SHOP_ITEMS[id].max }}
          </span>
          <div class="flex items-center gap-1">
            <!-- Activate button for activatable items -->
            <button v-if="['xpBoost','doubleCoins','decayDampener'].includes(id) && playerStore.inventory[id] > 0 && !isActive(id)"
              @click="handleActivate(id)"
              class="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 hover:bg-purple-500/50 transition-colors font-bold">
              Use
            </button>
            <span v-if="isActive(id)" class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              Active
            </span>
            <!-- Buy button -->
            <button @click="handleBuy(id)"
              :disabled="!canAfford(id) || isMaxed(id)"
              class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold transition-colors"
              :class="canAfford(id) && !isMaxed(id)
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'">
              <Coins class="w-3 h-3" />
              {{ playerStore.SHOP_ITEMS[id].price }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cosmetics -->
    <div v-else>
      <!-- Cosmetic Sub-tabs -->
      <div class="flex gap-1 mb-2">
        <button v-for="(cat, key) in cosmeticCategories" :key="key"
          @click="cosmeticSub = key"
          class="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition-colors"
          :class="cosmeticSub === key ? 'bg-astral-glow/20 text-astral-glow' : 'bg-white/5 text-gray-500 hover:text-gray-300'">
          {{ cat.label }}
        </button>
      </div>

      <!-- Cosmetic Items Grid -->
      <div class="grid grid-cols-2 gap-2">
        <div v-for="id in cosmeticItems" :key="id"
          class="relative border rounded-xl p-3 transition-all duration-300 cursor-pointer"
          :class="[
            isSelected(id) ? 'border-astral-glow bg-astral-glow/10' : 'border-white/10 bg-white/[0.02]',
            isMaxed(id) && !isSelected(id) ? 'opacity-70' : ''
          ]"
          @click="isMaxed(id) ? handleSelect(id) : null">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{{ playerStore.SHOP_ITEMS[id].emoji }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-white truncate">{{ playerStore.SHOP_ITEMS[id].name }}</div>
              <div class="text-[10px] text-gray-500 leading-tight">{{ playerStore.SHOP_ITEMS[id].desc }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-2">
            <span v-if="isSelected(id)" class="text-[10px] text-astral-glow font-bold">✓ Equipped</span>
            <span v-else-if="isMaxed(id)" class="text-[10px] text-gray-400 font-bold">Owned</span>
            <span v-else></span>
            <!-- Buy or Select -->
            <button v-if="!isMaxed(id)" @click.stop="handleBuy(id)"
              :disabled="!canAfford(id)"
              class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold transition-colors"
              :class="canAfford(id)
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'">
              <Coins class="w-3 h-3" />
              {{ playerStore.SHOP_ITEMS[id].price }}
            </button>
            <button v-else-if="!isSelected(id)" @click.stop="handleSelect(id)"
              class="text-[10px] px-2 py-0.5 rounded bg-astral-glow/20 text-astral-glow hover:bg-astral-glow/40 font-bold transition-colors">
              Equip
            </button>
            <button v-else @click.stop="handleSelect(id)"
              class="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-400 hover:bg-white/20 font-bold transition-colors">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
