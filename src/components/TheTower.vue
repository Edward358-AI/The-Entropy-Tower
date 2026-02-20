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

// Calculate progress based on current XP within level
const progressPercent = computed(() => {
  const required = playerStore.xpToNextLevel
  const current = playerStore.currentXP
  return Math.min((current / required) * 100, 100)
})

const material = computed(() => playerStore.towerMaterial)

const materialClass = computed(() => {
  switch (material.value) {
    case 'Stone': return 'tower-stone'
    case 'Iron': return 'tower-iron'
    case 'Gold': return 'tower-gold'
    case 'Diamond': return 'tower-diamond'
    case 'Astral': return 'tower-astral'
    default: return 'tower-stone'
  }
})

const barMaterialClass = computed(() => {
  switch (material.value) {
    case 'Stone': return 'bar-stone'
    case 'Iron': return 'bar-iron'
    case 'Gold': return 'bar-gold'
    case 'Diamond': return 'bar-diamond'
    case 'Astral': return 'bar-astral'
    default: return 'bar-stone'
  }
})

const isHorizontal = computed(() => props.layout === 'horizontal')

const hasOverdueQuests = computed(() => questStore.quests.some(q => q.daysOverdue > 0))
</script>

<template>
  <!-- Horizontal Layout (Mobile) -->
  <div v-if="isHorizontal" class="bg-astral-nebula/30 border border-white/5 rounded-xl p-4">
    <div class="flex items-center gap-4">
      <!-- Level Badge -->
      <div class="text-center flex-shrink-0">
        <div class="text-[10px] text-gray-400 uppercase tracking-widest">Level</div>
        <div class="text-2xl font-bold font-display text-white">{{ playerStore.level }}</div>
        <div class="text-[10px] font-bold" :class="{
          'text-gray-400': material === 'Stone',
          'text-slate-300': material === 'Iron',
          'text-yellow-400': material === 'Gold',
          'text-cyan-300': material === 'Diamond',
          'text-astral-glow': material === 'Astral'
        }">{{ material }}</div>
      </div>

      <!-- Progress Bar (horizontal) -->
      <div class="flex-1 relative">
        <div class="h-6 bg-astral-nebula/50 border border-white/10 rounded-full overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            :class="barMaterialClass"
            :style="{ width: `${progressPercent}%` }"
          >
            <!-- Shimmer overlay for Iron+ -->
            <div v-if="material !== 'Stone'" class="absolute inset-0 shimmer-overlay"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-white/20"></div>
          </div>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-[10px] text-gray-500 font-mono">{{ Math.floor(playerStore.currentXP) }} XP</span>
          <span class="text-[10px] text-gray-500 font-mono">{{ playerStore.xpToNextLevel }} XP</span>
        </div>
      </div>
    </div>

    <!-- Entropy indicator -->
    <div v-if="hasOverdueQuests" class="mt-2 text-center text-[10px] text-red-400 font-bold animate-pulse">
      ENTROPY DETECTED
    </div>
  </div>

  <!-- Vertical Layout (Desktop) -->
  <div v-else class="relative w-24 mx-auto" :class="materialClass">
    <!-- Outer Aura (Astral only) -->
    <div v-if="material === 'Astral'" class="absolute -inset-3 rounded-t-xl astral-aura pointer-events-none"></div>
    
    <!-- Outer Glow -->
    <div v-if="material === 'Diamond'" class="absolute -inset-2 rounded-t-lg diamond-outer-glow pointer-events-none"></div>
    <div v-if="material === 'Gold'" class="absolute -inset-1.5 rounded-t-lg gold-outer-glow pointer-events-none"></div>

    <!-- Main Tower Body -->
    <div class="relative w-full h-[500px] border rounded-t-lg overflow-hidden backdrop-blur-sm"
      :class="{
        'bg-astral-nebula/30 border-white/10': material === 'Stone',
        'bg-astral-nebula/30 border-slate-400/20': material === 'Iron',
        'bg-astral-nebula/30 border-yellow-400/30': material === 'Gold',
        'bg-astral-nebula/20 border-cyan-400/30': material === 'Diamond',
        'bg-black/50 border-astral-glow/30': material === 'Astral'
      }">

      <!-- Astral Background Starfield -->
      <div v-if="material === 'Astral'" class="absolute inset-0 starfield pointer-events-none"></div>

      <!-- Level Indicator -->
      <div class="absolute top-4 left-0 right-0 text-center z-10">
        <div class="text-xs text-gray-400 uppercase tracking-widest mb-1">Level</div>
        <div class="text-3xl font-bold font-display text-white">{{ playerStore.level }}</div>
        <div class="text-xs font-bold mt-1" :class="{
          'text-gray-400': material === 'Stone',
          'text-slate-300': material === 'Iron',
          'text-yellow-400': material === 'Gold',
          'text-cyan-300': material === 'Diamond',
          'text-astral-glow': material === 'Astral'
        }">{{ material }} Age</div>
      </div>

      <!-- The Fill Bar -->
      <div 
        class="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out overflow-hidden"
        :class="barMaterialClass"
        :style="{ height: `${progressPercent}%` }"
      >
        <!-- Stone: simple gradient -->
        <div v-if="material === 'Stone'" class="absolute inset-0 bg-gradient-to-t from-black/40 to-white/10"></div>

        <!-- Iron: metallic shimmer -->
        <template v-if="material === 'Iron'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-white/20"></div>
          <div class="absolute inset-0 iron-shimmer"></div>
        </template>

        <!-- Gold: warm glow + sparkles -->
        <template v-if="material === 'Gold'">
          <div class="absolute inset-0 gold-gradient"></div>
          <div class="absolute inset-0 gold-sparkles"></div>
          <div class="absolute inset-0 gold-shimmer"></div>
        </template>

        <!-- Diamond: prismatic refraction -->
        <template v-if="material === 'Diamond'">
          <div class="absolute inset-0 diamond-gradient"></div>
          <div class="absolute inset-0 diamond-refraction"></div>
          <div class="absolute inset-0 diamond-shimmer"></div>
        </template>

        <!-- Astral: nebula + stars + cosmic energy -->
        <template v-if="material === 'Astral'">
          <div class="absolute inset-0 astral-nebula-gradient"></div>
          <div class="absolute inset-0 astral-stars"></div>
          <div class="absolute inset-0 astral-energy"></div>
        </template>
      </div>

      <!-- Entropy Cracks -->
      <div 
        v-if="hasOverdueQuests"
        class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900/50 to-transparent pointer-events-none z-10"
      >
        <div class="absolute bottom-2 left-0 right-0 text-center text-xs text-red-400 font-bold animate-pulse">
          ENTROPY DETECTED
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== HORIZONTAL BAR MATERIALS ========== */
.bar-stone { background: #4b5563; }
.bar-iron { background: linear-gradient(90deg, #64748b, #94a3b8, #64748b); }
.bar-gold { background: linear-gradient(90deg, #d97706, #fbbf24, #f59e0b); }
.bar-diamond { background: linear-gradient(90deg, #06b6d4, #67e8f9, #22d3ee); }
.bar-astral { background: linear-gradient(90deg, #be123c, #e94560, #f43f5e); }

/* ========== SHIMMER OVERLAY (horizontal bar) ========== */
.shimmer-overlay {
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer-h 3s ease-in-out infinite;
}

/* ========== IRON: Metallic shimmer ========== */
.tower-iron {}

.iron-shimmer {
  background: linear-gradient(170deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 52%, transparent 70%);
  background-size: 100% 300%;
  animation: shimmer-v 4s ease-in-out infinite;
}

/* ========== GOLD: Warm glow + sparkles ========== */
.tower-gold {}

.gold-outer-glow {
  background: radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}

.gold-gradient {
  background: linear-gradient(to top, rgba(120,53,15,0.6), rgba(251,191,36,0.4), rgba(253,224,71,0.3));
}

.gold-sparkles {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(253,224,71,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 20%, rgba(253,224,71,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 60%, rgba(253,224,71,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 70%, rgba(251,191,36,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 10% 85%, rgba(253,224,71,0.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 90%, rgba(253,224,71,0.8) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 50% 50%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 15%, rgba(253,224,71,0.7) 0%, transparent 100%);
  animation: sparkle-drift 6s ease-in-out infinite;
}

.gold-shimmer {
  background: linear-gradient(170deg, transparent 35%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 51%, transparent 65%);
  background-size: 100% 400%;
  animation: shimmer-v 3s ease-in-out infinite;
}

/* ========== DIAMOND: Prismatic + crystalline ========== */
.tower-diamond {}

.diamond-outer-glow {
  background: radial-gradient(ellipse at center, rgba(34,211,238,0.12) 0%, transparent 70%);
  animation: glow-pulse 2.5s ease-in-out infinite;
}

.diamond-gradient {
  background: linear-gradient(to top, rgba(8,145,178,0.6), rgba(34,211,238,0.4), rgba(165,243,252,0.3));
}

.diamond-refraction {
  background: linear-gradient(135deg,
    rgba(239,68,68,0.08) 0%,
    rgba(251,191,36,0.08) 15%,
    rgba(34,197,94,0.08) 30%,
    rgba(34,211,238,0.12) 45%,
    rgba(99,102,241,0.08) 60%,
    rgba(168,85,247,0.08) 75%,
    rgba(236,72,153,0.08) 90%,
    rgba(239,68,68,0.08) 100%
  );
  background-size: 100% 300%;
  animation: refraction 5s linear infinite;
  mix-blend-mode: screen;
}

.diamond-shimmer {
  background: linear-gradient(160deg, transparent 35%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 52%, transparent 65%);
  background-size: 100% 400%;
  animation: shimmer-v 2.5s ease-in-out infinite;
}

/* ========== ASTRAL: Cosmic nebula + starfield ========== */
.tower-astral {}

.astral-aura {
  background: radial-gradient(ellipse at center, rgba(233,69,96,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 70%);
  animation: astral-breathe 4s ease-in-out infinite;
}

.starfield {
  background-image:
    radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 15%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 25% 55%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 35% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 65% 45%, rgba(255,255,255,0.7) 0%, transparent 100%);
  animation: twinkle 4s ease-in-out infinite;
}

.astral-nebula-gradient {
  background: linear-gradient(
    to top,
    rgba(136,19,55,0.8),
    rgba(233,69,96,0.6) 30%,
    rgba(139,92,246,0.5) 60%,
    rgba(59,130,246,0.4) 80%,
    rgba(139,92,246,0.3)
  );
  background-size: 100% 200%;
  animation: nebula-shift 8s ease-in-out infinite;
}

.astral-stars {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 50% 15%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 45%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 35% 65%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(2px 2px at 65% 80%, rgba(233,69,96,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 10% 90%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 70%, rgba(139,92,246,0.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 40%, rgba(255,255,255,0.8) 0%, transparent 100%);
  animation: twinkle 3s ease-in-out infinite alternate;
}

.astral-energy {
  background: linear-gradient(180deg, transparent 30%, rgba(233,69,96,0.1) 50%, transparent 70%);
  background-size: 100% 300%;
  animation: energy-pulse 3s ease-in-out infinite;
}

/* ========== KEYFRAMES ========== */
@keyframes shimmer-h {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -100% 0; }
}

@keyframes shimmer-v {
  0%, 100% { background-position: 0 0; }
  50% { background-position: 0 100%; }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes sparkle-drift {
  0%, 100% { opacity: 0.6; transform: translateY(0); }
  25% { opacity: 1; }
  50% { opacity: 0.4; transform: translateY(-3px); }
  75% { opacity: 0.9; }
}

@keyframes refraction {
  0% { background-position: 0 0; }
  100% { background-position: 0 300%; }
}

@keyframes astral-breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.08); }
}

@keyframes nebula-shift {
  0%, 100% { background-position: 0 0; }
  50% { background-position: 0 100%; }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.4; }
  25% { opacity: 0.9; }
  50% { opacity: 0.5; }
  75% { opacity: 1; }
}

@keyframes energy-pulse {
  0%, 100% { background-position: 0 0; opacity: 0.3; }
  50% { background-position: 0 100%; opacity: 0.7; }
}
</style>
