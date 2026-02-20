<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore'
import { useQuestStore } from '../stores/questStore'

const props = defineProps({
  layout: {
    type: String,
    default: 'vertical' // 'vertical' | 'horizontal'
  }
})

const playerStore = usePlayerStore()
const questStore = useQuestStore()

const progressPercent = computed(() => {
  const required = playerStore.xpToNextLevel
  const current = playerStore.currentXP
  return Math.min((current / required) * 100, 100)
})

const material = computed(() => playerStore.activeTowerMaterial)

// Color mapping for level badge text
const materialTextClass = computed(() => {
  const map = {
    'Stone': 'text-gray-400',
    'Iron': 'text-slate-300',
    'Gold': 'text-yellow-400',
    'Diamond': 'text-cyan-300',
    'Astral': 'text-astral-glow',
    'Void': 'text-purple-400',
    'Celestial': 'text-amber-300',
    'Ethereal': 'text-teal-300',
    'Mythic': 'text-green-400',
    'Transcendent': 'text-rose-300',
    'Omega': 'text-white',
  }
  return map[material.value] || 'text-gray-400'
})

// Border color for vertical tower
const towerBorderClass = computed(() => {
  const map = {
    'Stone': 'bg-astral-nebula/30 border-white/10',
    'Iron': 'bg-astral-nebula/30 border-slate-400/20',
    'Gold': 'bg-astral-nebula/30 border-yellow-400/30',
    'Diamond': 'bg-astral-nebula/20 border-cyan-400/30',
    'Astral': 'bg-black/50 border-astral-glow/30',
    'Void': 'bg-black/60 border-purple-500/30',
    'Celestial': 'bg-black/40 border-amber-400/30',
    'Ethereal': 'bg-black/50 border-teal-400/30',
    'Mythic': 'bg-black/50 border-emerald-400/30',
    'Transcendent': 'bg-black/60 border-rose-400/30',
    'Omega': 'bg-black/70 border-white/40',
  }
  return map[material.value] || 'bg-astral-nebula/30 border-white/10'
})

const isHorizontal = computed(() => props.layout === 'horizontal')
const hasOverdueQuests = computed(() => questStore.quests.some(q => q.daysOverdue > 0))

// Tier index for styling (0=Stone ... 10=Omega)
const tierIndex = computed(() => {
  const tiers = ['Stone', 'Iron', 'Gold', 'Diamond', 'Astral', 'Void', 'Celestial', 'Ethereal', 'Mythic', 'Transcendent', 'Omega']
  return tiers.indexOf(material.value)
})
</script>

<template>
  <!-- Horizontal Layout (Mobile) -->
  <div v-if="isHorizontal" class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4">
    <div class="flex items-center gap-4">
      <!-- Level Badge -->
      <div class="text-center flex-shrink-0">
        <div class="text-[10px] text-gray-400 uppercase tracking-widest">Level</div>
        <div class="text-2xl font-bold font-display text-white">{{ playerStore.level }}</div>
        <div class="text-[10px] font-bold" :class="materialTextClass">{{ material }}</div>
      </div>

      <!-- Progress Bar (horizontal) -->
      <div class="flex-1 relative">
        <div class="h-6 bg-astral-nebula/50 border border-white/10 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            :class="`bar-${material.toLowerCase()}`" :style="{ width: `${progressPercent}%` }">
            <div v-if="tierIndex >= 1" class="absolute inset-0 shimmer-overlay"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-white/20"></div>
          </div>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-[10px] text-gray-500 font-mono">{{ Math.floor(playerStore.currentXP) }} XP</span>
          <span class="text-[10px] text-gray-500 font-mono">{{ playerStore.xpToNextLevel }} XP</span>
        </div>
      </div>
    </div>

    <div v-if="hasOverdueQuests" class="mt-2 text-center text-[10px] text-red-400 font-bold animate-pulse">
      ENTROPY DETECTED
    </div>
  </div>

  <!-- Vertical Layout (Desktop) -->
  <div v-else class="relative w-24 mx-auto">
    <!-- Outer Aura -->
    <div v-if="tierIndex >= 4" class="absolute -inset-3 rounded-t-xl pointer-events-none" :class="{
      'astral-aura': material === 'Astral',
      'void-aura': material === 'Void',
      'celestial-aura': material === 'Celestial',
      'ethereal-aura': material === 'Ethereal',
      'mythic-aura': material === 'Mythic',
      'transcendent-aura': material === 'Transcendent',
      'omega-aura': material === 'Omega',
    }"></div>

    <!-- Outer Glow (Gold/Diamond) -->
    <div v-if="material === 'Gold'" class="absolute -inset-1.5 rounded-t-lg gold-outer-glow pointer-events-none"></div>
    <div v-if="material === 'Diamond'" class="absolute -inset-2 rounded-t-lg diamond-outer-glow pointer-events-none">
    </div>

    <!-- Main Tower Body -->
    <div class="relative w-full h-[500px] border rounded-t-lg overflow-hidden backdrop-blur-sm"
      :class="towerBorderClass">

      <!-- Background effects for high tiers -->
      <div v-if="material === 'Astral'" class="absolute inset-0 starfield pointer-events-none"></div>
      <div v-if="material === 'Void'" class="absolute inset-0 void-bg pointer-events-none"></div>
      <div v-if="material === 'Celestial'" class="absolute inset-0 celestial-bg pointer-events-none"></div>
      <div v-if="material === 'Ethereal'" class="absolute inset-0 ethereal-bg pointer-events-none"></div>
      <div v-if="material === 'Mythic'" class="absolute inset-0 mythic-bg pointer-events-none"></div>
      <div v-if="material === 'Transcendent'" class="absolute inset-0 transcendent-bg pointer-events-none"></div>
      <div v-if="material === 'Omega'" class="absolute inset-0 omega-bg pointer-events-none"></div>

      <!-- Level Indicator -->
      <div class="absolute top-4 left-0 right-0 text-center z-10">
        <div class="text-xs text-gray-400 uppercase tracking-widest mb-1">Level</div>
        <div class="text-3xl font-bold font-display text-white">{{ playerStore.level }}</div>
        <div class="text-xs font-bold mt-1" :class="materialTextClass">{{ material }} Age</div>
      </div>

      <!-- The Fill Bar -->
      <div class="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out overflow-hidden"
        :class="`bar-${material.toLowerCase()}`" :style="{ height: `${progressPercent}%` }">
        <!-- Stone -->
        <div v-if="material === 'Stone'" class="absolute inset-0 bg-gradient-to-t from-black/40 to-white/10"></div>

        <!-- Iron -->
        <template v-if="material === 'Iron'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-white/20"></div>
          <div class="absolute inset-0 iron-shimmer"></div>
        </template>

        <!-- Gold -->
        <template v-if="material === 'Gold'">
          <div class="absolute inset-0 gold-gradient"></div>
          <div class="absolute inset-0 gold-sparkles"></div>
          <div class="absolute inset-0 gold-shimmer"></div>
        </template>

        <!-- Diamond -->
        <template v-if="material === 'Diamond'">
          <div class="absolute inset-0 diamond-gradient"></div>
          <div class="absolute inset-0 diamond-refraction"></div>
          <div class="absolute inset-0 diamond-shimmer"></div>
        </template>

        <!-- Astral -->
        <template v-if="material === 'Astral'">
          <div class="absolute inset-0 astral-nebula-gradient"></div>
          <div class="absolute inset-0 astral-stars"></div>
          <div class="absolute inset-0 astral-energy"></div>
        </template>

        <!-- Void -->
        <template v-if="material === 'Void'">
          <div class="absolute inset-0 void-fill"></div>
          <div class="absolute inset-0 void-particles"></div>
          <div class="absolute inset-0 void-pulse"></div>
        </template>

        <!-- Celestial -->
        <template v-if="material === 'Celestial'">
          <div class="absolute inset-0 celestial-fill"></div>
          <div class="absolute inset-0 celestial-rays"></div>
          <div class="absolute inset-0 celestial-sparkle"></div>
        </template>

        <!-- Ethereal -->
        <template v-if="material === 'Ethereal'">
          <div class="absolute inset-0 ethereal-fill"></div>
          <div class="absolute inset-0 ethereal-wisps"></div>
          <div class="absolute inset-0 ethereal-glow"></div>
        </template>

        <!-- Mythic -->
        <template v-if="material === 'Mythic'">
          <div class="absolute inset-0 mythic-fill"></div>
          <div class="absolute inset-0 mythic-aurora"></div>
          <div class="absolute inset-0 mythic-stars"></div>
        </template>

        <!-- Transcendent -->
        <template v-if="material === 'Transcendent'">
          <div class="absolute inset-0 transcendent-fill"></div>
          <div class="absolute inset-0 transcendent-glitch"></div>
          <div class="absolute inset-0 transcendent-chromatic"></div>
        </template>

        <!-- Omega -->
        <template v-if="material === 'Omega'">
          <div class="absolute inset-0 omega-fill"></div>
          <div class="absolute inset-0 omega-singularity"></div>
          <div class="absolute inset-0 omega-corona"></div>
        </template>
      </div>

      <!-- Entropy Cracks -->
      <div v-if="hasOverdueQuests"
        class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900/50 to-transparent pointer-events-none z-10">
        <div class="absolute bottom-2 left-0 right-0 text-center text-xs text-red-400 font-bold animate-pulse">
          ENTROPY DETECTED
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== HORIZONTAL BAR MATERIALS ========== */
.bar-stone {
  background: #4b5563;
}

.bar-iron {
  background: linear-gradient(90deg, #64748b, #94a3b8, #64748b);
}

.bar-gold {
  background: linear-gradient(90deg, #d97706, #fbbf24, #f59e0b);
}

.bar-diamond {
  background: linear-gradient(90deg, #06b6d4, #67e8f9, #22d3ee);
}

.bar-astral {
  background: linear-gradient(90deg, #be123c, #e94560, #f43f5e);
}

.bar-void {
  background: linear-gradient(90deg, #581c87, #7c3aed, #581c87);
}

.bar-celestial {
  background: linear-gradient(90deg, #b45309, #fbbf24, #f59e0b, #fbbf24, #b45309);
}

.bar-ethereal {
  background: linear-gradient(90deg, #0f766e, #2dd4bf, #5eead4, #2dd4bf, #0f766e);
}

.bar-mythic {
  background: linear-gradient(90deg, #065f46, #10b981, #34d399, #10b981, #065f46);
}

.bar-transcendent {
  background: linear-gradient(90deg, #9f1239, #fb7185, #f472b6, #fb7185, #9f1239);
}

.bar-omega {
  background: linear-gradient(90deg, #fafafa, #e879f9, #fafafa, #38bdf8, #fafafa);
}

/* ========== SHIMMER OVERLAY (horizontal) ========== */
.shimmer-overlay {
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer-h 3s ease-in-out infinite;
}

/* ========== IRON ========== */
.iron-shimmer {
  background: linear-gradient(170deg, transparent 30%, rgba(255, 255, 255, 0.15) 48%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.15) 52%, transparent 70%);
  background-size: 100% 300%;
  animation: shimmer-v 4s ease-in-out infinite;
}

/* ========== GOLD ========== */
.gold-outer-glow {
  background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}

.gold-gradient {
  background: linear-gradient(to top, rgba(120, 53, 15, 0.6), rgba(251, 191, 36, 0.4), rgba(253, 224, 71, 0.3));
}

.gold-sparkles {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(253, 224, 71, 0.9), transparent),
    radial-gradient(1px 1px at 60% 20%, rgba(253, 224, 71, 0.8), transparent),
    radial-gradient(1px 1px at 80% 60%, rgba(253, 224, 71, 0.9), transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(251, 191, 36, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 50% 50%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 30% 15%, rgba(253, 224, 71, 0.7), transparent);
  animation: sparkle-drift 6s ease-in-out infinite;
}

.gold-shimmer {
  background: linear-gradient(170deg, transparent 35%, rgba(255, 255, 255, 0.1) 49%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 51%, transparent 65%);
  background-size: 100% 400%;
  animation: shimmer-v 3s ease-in-out infinite;
}

/* ========== DIAMOND ========== */
.diamond-outer-glow {
  background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.12) 0%, transparent 70%);
  animation: glow-pulse 2.5s ease-in-out infinite;
}

.diamond-gradient {
  background: linear-gradient(to top, rgba(8, 145, 178, 0.6), rgba(34, 211, 238, 0.4), rgba(165, 243, 252, 0.3));
}

.diamond-refraction {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(251, 191, 36, 0.08) 15%, rgba(34, 197, 94, 0.08) 30%, rgba(34, 211, 238, 0.12) 45%, rgba(99, 102, 241, 0.08) 60%, rgba(168, 85, 247, 0.08) 75%, rgba(236, 72, 153, 0.08) 90%, rgba(239, 68, 68, 0.08) 100%);
  background-size: 100% 300%;
  animation: refraction 5s linear infinite;
  mix-blend-mode: screen;
}

.diamond-shimmer {
  background: linear-gradient(160deg, transparent 35%, rgba(255, 255, 255, 0.15) 48%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0.15) 52%, transparent 65%);
  background-size: 100% 400%;
  animation: shimmer-v 2.5s ease-in-out infinite;
}

/* ========== ASTRAL ========== */
.astral-aura {
  background: radial-gradient(ellipse at center, rgba(233, 69, 96, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%);
  animation: aura-breathe 4s ease-in-out infinite;
}

.starfield {
  background-image:
    radial-gradient(1px 1px at 15% 25%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 75% 35%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 45% 65%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1.5px 1.5px at 65% 45%, rgba(255, 255, 255, 0.7), transparent);
  animation: twinkle 4s ease-in-out infinite;
}

.astral-nebula-gradient {
  background: linear-gradient(to top, rgba(136, 19, 55, 0.8), rgba(233, 69, 96, 0.6) 30%, rgba(139, 92, 246, 0.5) 60%, rgba(59, 130, 246, 0.4) 80%, rgba(139, 92, 246, 0.3));
  background-size: 100% 200%;
  animation: nebula-shift 8s ease-in-out infinite;
}

.astral-stars {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 50% 15%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 80% 45%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(2px 2px at 65% 80%, rgba(233, 69, 96, 0.8), transparent),
    radial-gradient(1px 1px at 40% 40%, rgba(255, 255, 255, 0.8), transparent);
  animation: twinkle 3s ease-in-out infinite alternate;
}

.astral-energy {
  background: linear-gradient(180deg, transparent 30%, rgba(233, 69, 96, 0.1) 50%, transparent 70%);
  background-size: 100% 300%;
  animation: energy-pulse 3s ease-in-out infinite;
}

/* ========== VOID (Lv 50–59) ========== */
.void-aura {
  background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.2) 0%, rgba(88, 28, 135, 0.1) 40%, transparent 70%);
  animation: aura-breathe 3.5s ease-in-out infinite;
}

.void-bg {
  background: radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.08) 0%, transparent 60%);
  animation: void-swirl 10s linear infinite;
}

.void-fill {
  background: linear-gradient(to top, rgba(30, 0, 50, 0.9), rgba(88, 28, 135, 0.6) 40%, rgba(124, 58, 237, 0.4) 70%, rgba(167, 139, 250, 0.2));
}

.void-particles {
  background-image:
    radial-gradient(1.5px 1.5px at 25% 20%, rgba(167, 139, 250, 0.8), transparent),
    radial-gradient(1px 1px at 55% 40%, rgba(196, 181, 253, 0.6), transparent),
    radial-gradient(2px 2px at 75% 70%, rgba(139, 92, 246, 0.7), transparent),
    radial-gradient(1px 1px at 15% 80%, rgba(167, 139, 250, 0.5), transparent),
    radial-gradient(1px 1px at 85% 30%, rgba(196, 181, 253, 0.6), transparent);
  animation: twinkle 3.5s ease-in-out infinite alternate;
}

.void-pulse {
  background: radial-gradient(circle at 50% 60%, rgba(124, 58, 237, 0.3) 0%, transparent 50%);
  animation: energy-pulse 4s ease-in-out infinite;
}

/* ========== CELESTIAL (Lv 60–69) ========== */
.celestial-aura {
  background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 40%, transparent 70%);
  animation: aura-breathe 3s ease-in-out infinite;
}

.celestial-bg {
  background: radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.06) 0%, transparent 60%);
}

.celestial-fill {
  background: linear-gradient(to top, rgba(120, 53, 15, 0.8), rgba(217, 119, 6, 0.5) 30%, rgba(251, 191, 36, 0.4) 60%, rgba(253, 224, 71, 0.3));
}

.celestial-rays {
  background: repeating-conic-gradient(from 0deg at 50% 0%, rgba(253, 224, 71, 0.04) 0deg 10deg, transparent 10deg 20deg);
  animation: celestial-rotate 20s linear infinite;
}

.celestial-sparkle {
  background-image:
    radial-gradient(2px 2px at 30% 25%, rgba(253, 224, 71, 0.9), transparent),
    radial-gradient(2px 2px at 70% 50%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 50% 75%, rgba(253, 224, 71, 0.7), transparent),
    radial-gradient(2.5px 2.5px at 20% 60%, rgba(255, 255, 255, 0.9), transparent);
  animation: sparkle-drift 4s ease-in-out infinite;
}

/* ========== ETHEREAL (Lv 70–79) ========== */
.ethereal-aura {
  background: radial-gradient(ellipse at center, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 40%, transparent 70%);
  animation: aura-breathe 4.5s ease-in-out infinite;
}

.ethereal-bg {
  background-image:
    radial-gradient(ellipse at 30% 40%, rgba(45, 212, 191, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(94, 234, 212, 0.04) 0%, transparent 50%);
  animation: ethereal-drift 12s ease-in-out infinite;
}

.ethereal-fill {
  background: linear-gradient(to top, rgba(15, 118, 110, 0.8), rgba(20, 184, 166, 0.5) 30%, rgba(45, 212, 191, 0.4) 60%, rgba(94, 234, 212, 0.2));
}

.ethereal-wisps {
  background-image:
    radial-gradient(30px 2px at 20% 30%, rgba(94, 234, 212, 0.4), transparent),
    radial-gradient(25px 2px at 60% 50%, rgba(45, 212, 191, 0.3), transparent),
    radial-gradient(35px 2px at 40% 70%, rgba(94, 234, 212, 0.35), transparent),
    radial-gradient(20px 2px at 80% 40%, rgba(153, 246, 228, 0.3), transparent);
  animation: ethereal-drift 6s ease-in-out infinite;
}

.ethereal-glow {
  background: radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.15) 0%, transparent 50%);
  animation: energy-pulse 5s ease-in-out infinite;
}

/* ========== MYTHIC (Lv 80–89) ========== */
.mythic-aura {
  background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.08) 30%, rgba(139, 92, 246, 0.05) 60%, transparent 80%);
  animation: aura-breathe 3s ease-in-out infinite;
}

.mythic-bg {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(139, 92, 246, 0.04) 50%, rgba(59, 130, 246, 0.04) 100%);
  background-size: 100% 300%;
  animation: nebula-shift 10s ease-in-out infinite;
}

.mythic-fill {
  background: linear-gradient(to top, rgba(6, 95, 70, 0.8), rgba(16, 185, 129, 0.5) 25%, rgba(52, 211, 153, 0.4) 50%, rgba(139, 92, 246, 0.3) 75%, rgba(59, 130, 246, 0.2));
  background-size: 100% 200%;
  animation: nebula-shift 6s ease-in-out infinite;
}

.mythic-aurora {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 20%, rgba(45, 212, 191, 0.1) 40%, rgba(59, 130, 246, 0.1) 60%, rgba(139, 92, 246, 0.15) 80%, rgba(236, 72, 153, 0.1) 100%);
  background-size: 300% 300%;
  animation: aurora-shift 8s ease-in-out infinite;
  mix-blend-mode: screen;
}

.mythic-stars {
  background-image:
    radial-gradient(1.5px 1.5px at 20% 25%, rgba(52, 211, 153, 0.9), transparent),
    radial-gradient(2px 2px at 60% 40%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 80% 70%, rgba(139, 92, 246, 0.7), transparent),
    radial-gradient(2px 2px at 40% 85%, rgba(59, 130, 246, 0.8), transparent);
  animation: twinkle 2.5s ease-in-out infinite alternate;
}

/* ========== TRANSCENDENT (Lv 90–99) ========== */
.transcendent-aura {
  background: radial-gradient(ellipse at center, rgba(251, 113, 133, 0.2) 0%, rgba(244, 114, 182, 0.1) 30%, rgba(192, 132, 252, 0.08) 60%, transparent 80%);
  animation: aura-breathe 2.5s ease-in-out infinite;
}

.transcendent-bg {
  background: linear-gradient(180deg, rgba(159, 18, 57, 0.06) 0%, rgba(219, 39, 119, 0.04) 50%, rgba(168, 85, 247, 0.04) 100%);
}

.transcendent-fill {
  background: linear-gradient(to top, rgba(159, 18, 57, 0.8), rgba(244, 63, 94, 0.5) 25%, rgba(251, 113, 133, 0.4) 50%, rgba(244, 114, 182, 0.3) 75%, rgba(192, 132, 252, 0.3));
}

.transcendent-glitch {
  background: repeating-linear-gradient(0deg, transparent 0px, transparent 4px, rgba(251, 113, 133, 0.06) 4px, rgba(251, 113, 133, 0.06) 5px);
  animation: glitch-flicker 3s steps(5) infinite;
}

.transcendent-chromatic {
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.05), rgba(251, 191, 36, 0.05), rgba(34, 197, 94, 0.05), rgba(34, 211, 238, 0.05), rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
  background-size: 100% 600%;
  animation: chromatic-scroll 4s linear infinite;
  mix-blend-mode: screen;
}

/* ========== OMEGA (Lv 100) ========== */
.omega-aura {
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12) 0%, rgba(232, 121, 249, 0.1) 25%, rgba(56, 189, 248, 0.08) 50%, rgba(250, 204, 21, 0.05) 75%, transparent 100%);
  animation: omega-breathe 3s ease-in-out infinite;
}

.omega-bg {
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 30% 30%, rgba(232, 121, 249, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(56, 189, 248, 0.04) 0%, transparent 40%);
  animation: omega-rotate 15s linear infinite;
}

.omega-fill {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(88, 28, 135, 0.4) 20%, rgba(232, 121, 249, 0.3) 40%, rgba(255, 255, 255, 0.2) 60%, rgba(56, 189, 248, 0.3) 80%, rgba(250, 204, 21, 0.2));
  background-size: 100% 200%;
  animation: nebula-shift 5s ease-in-out infinite;
}

.omega-singularity {
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4) 0%, rgba(232, 121, 249, 0.2) 20%, transparent 50%);
  animation: energy-pulse 2.5s ease-in-out infinite;
}

.omega-corona {
  background-image:
    radial-gradient(2.5px 2.5px at 25% 20%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 75% 35%, rgba(232, 121, 249, 0.9), transparent),
    radial-gradient(3px 3px at 50% 60%, rgba(56, 189, 248, 0.9), transparent),
    radial-gradient(2px 2px at 30% 80%, rgba(250, 204, 21, 0.8), transparent),
    radial-gradient(2px 2px at 80% 75%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 60% 15%, rgba(232, 121, 249, 0.8), transparent);
  animation: twinkle 2s ease-in-out infinite alternate;
}

/* ========== KEYFRAMES ========== */
@keyframes shimmer-h {

  0%,
  100% {
    background-position: 200% 0;
  }

  50% {
    background-position: -100% 0;
  }
}

@keyframes shimmer-v {

  0%,
  100% {
    background-position: 0 0;
  }

  50% {
    background-position: 0 100%;
  }
}

@keyframes glow-pulse {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes sparkle-drift {

  0%,
  100% {
    opacity: 0.6;
    transform: translateY(0);
  }

  25% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
    transform: translateY(-3px);
  }

  75% {
    opacity: 0.9;
  }
}

@keyframes refraction {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 0 300%;
  }
}

@keyframes aura-breathe {

  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.08);
  }
}

@keyframes nebula-shift {

  0%,
  100% {
    background-position: 0 0;
  }

  50% {
    background-position: 0 100%;
  }
}

@keyframes twinkle {

  0%,
  100% {
    opacity: 0.4;
  }

  25% {
    opacity: 0.9;
  }

  50% {
    opacity: 0.5;
  }

  75% {
    opacity: 1;
  }
}

@keyframes energy-pulse {

  0%,
  100% {
    background-position: 0 0;
    opacity: 0.3;
  }

  50% {
    background-position: 0 100%;
    opacity: 0.7;
  }
}

@keyframes void-swirl {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes celestial-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes ethereal-drift {

  0%,
  100% {
    transform: translateX(0) translateY(0);
    opacity: 0.5;
  }

  50% {
    transform: translateX(5px) translateY(-5px);
    opacity: 0.8;
  }
}

@keyframes aurora-shift {
  0% {
    background-position: 0% 0%;
  }

  50% {
    background-position: 100% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}

@keyframes glitch-flicker {

  0%,
  100% {
    opacity: 0.3;
    transform: translateX(0);
  }

  20% {
    opacity: 0.6;
    transform: translateX(-1px);
  }

  40% {
    opacity: 0.2;
    transform: translateX(1px);
  }

  60% {
    opacity: 0.5;
    transform: translateX(0);
  }

  80% {
    opacity: 0.4;
    transform: translateX(-1px);
  }
}

@keyframes chromatic-scroll {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 0 600%;
  }
}

@keyframes omega-breathe {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

@keyframes omega-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
