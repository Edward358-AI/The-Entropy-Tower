<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { db, auth } from '../services/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday } from 'date-fns'
import { usePlayerStore } from '../stores/playerStore'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const playerStore = usePlayerStore()

// Heatmap color schemes — each has good, bad, mixed + text + legend colors
const HEATMAP_SCHEMES = {
  default: {
    good: 'bg-emerald-500/50 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    goodText: 'text-emerald-200',
    bad: 'bg-red-500/40 border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    badText: 'text-red-300',
    mixedText: 'text-yellow-200',
    mixedGood: 'rgba(16, 185, 129, 0.5)', mixedBad: 'rgba(239, 68, 68, 0.5)', mixedBorder: 'rgba(234, 179, 8, 0.5)',
    legendGood: 'bg-emerald-500/50 border-emerald-400/50',
    legendBad:  'bg-red-500/40 border-red-400/50',
  },
  heatmapOcean: {
    good: 'bg-blue-500/50 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    goodText: 'text-blue-200',
    bad: 'bg-slate-500/40 border-slate-400/50 shadow-[0_0_10px_rgba(100,116,139,0.3)]',
    badText: 'text-slate-300',
    mixedText: 'text-cyan-200',
    mixedGood: 'rgba(59, 130, 246, 0.5)', mixedBad: 'rgba(100, 116, 139, 0.5)', mixedBorder: 'rgba(34, 211, 238, 0.5)',
    legendGood: 'bg-blue-500/50 border-blue-400/50',
    legendBad:  'bg-slate-500/40 border-slate-400/50',
  },
  heatmapViolet: {
    good: 'bg-purple-500/50 border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    goodText: 'text-purple-200',
    bad: 'bg-rose-500/40 border-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    badText: 'text-rose-300',
    mixedText: 'text-fuchsia-200',
    mixedGood: 'rgba(168, 85, 247, 0.5)', mixedBad: 'rgba(244, 63, 94, 0.5)', mixedBorder: 'rgba(217, 70, 239, 0.5)',
    legendGood: 'bg-purple-500/50 border-purple-400/50',
    legendBad:  'bg-rose-500/40 border-rose-400/50',
  },
  heatmapEmber: {
    good: 'bg-orange-500/50 border-orange-400/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
    goodText: 'text-orange-200',
    bad: 'bg-red-700/40 border-red-600/50 shadow-[0_0_10px_rgba(185,28,28,0.3)]',
    badText: 'text-red-300',
    mixedText: 'text-amber-200',
    mixedGood: 'rgba(249, 115, 22, 0.5)', mixedBad: 'rgba(185, 28, 28, 0.5)', mixedBorder: 'rgba(245, 158, 11, 0.5)',
    legendGood: 'bg-orange-500/50 border-orange-400/50',
    legendBad:  'bg-red-700/40 border-red-600/50',
  },
  heatmapMono: {
    good: 'bg-gray-300/40 border-gray-300/50 shadow-[0_0_10px_rgba(209,213,219,0.2)]',
    goodText: 'text-gray-200',
    bad: 'bg-gray-600/40 border-gray-500/50 shadow-[0_0_10px_rgba(107,114,128,0.2)]',
    badText: 'text-gray-400',
    mixedText: 'text-gray-300',
    mixedGood: 'rgba(209, 213, 219, 0.4)', mixedBad: 'rgba(107, 114, 128, 0.4)', mixedBorder: 'rgba(156, 163, 175, 0.5)',
    legendGood: 'bg-gray-300/40 border-gray-300/50',
    legendBad:  'bg-gray-600/40 border-gray-500/50',
  },
}

const activeScheme = computed(() => HEATMAP_SCHEMES[playerStore.selectedCosmetics?.heatmap] || HEATMAP_SCHEMES.default)

const history = ref([])
const currentMonth = ref(new Date())
const historyData = ref({})
const selectedDay = ref(null) // For click-to-show tooltip on mobile

let unsubHeatmap = null

const monthLabel = computed(() => format(currentMonth.value, 'MMMM yyyy'))

const canGoForward = computed(() => {
  const now = new Date()
  return currentMonth.value.getMonth() < now.getMonth() || currentMonth.value.getFullYear() < now.getFullYear()
})

const prevMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
  selectedDay.value = null
  buildGrid()
}

const nextMonth = () => {
  if (canGoForward.value) {
    currentMonth.value = addMonths(currentMonth.value, 1)
    selectedDay.value = null
    buildGrid()
  }
}

const toggleDay = (day) => {
  if (!day.inMonth) return
  selectedDay.value = selectedDay.value === day.dateStr ? null : day.dateStr
}

const startListening = () => {
  if (!auth.currentUser) return

  if (unsubHeatmap) {
    unsubHeatmap()
    unsubHeatmap = null
  }

  const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', 'heatmap')
  unsubHeatmap = onSnapshot(historyRef, (snap) => {
    if (snap.exists()) {
      historyData.value = snap.data()
    }
    buildGrid()
  }, (err) => {
    console.error("Heatmap snapshot error:", err)
  })
}

const buildGrid = () => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(currentMonth.value)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const grid = []
  let day = calStart

  while (day <= calEnd) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const count = historyData.value[dateStr] || 0
    const missed = historyData.value[`missed_${dateStr}`] || 0
    const inMonth = isSameMonth(day, currentMonth.value)

    // Determine status
    let status = 'neutral'
    if (count > 0 && missed > 0) status = 'mixed'
    else if (count > 0) status = 'good'
    else if (missed > 0) status = 'bad'

    grid.push({
      date: new Date(day),
      dateStr,
      dayNum: format(day, 'd'),
      count,
      missed,
      status,
      inMonth,
      isToday: isToday(day)
    })

    day = addDays(day, 1)
  }

  history.value = grid
}

onMounted(() => {
  startListening()
})

onUnmounted(() => {
  if (unsubHeatmap) {
    unsubHeatmap()
    unsubHeatmap = null
  }
})

const getColor = (day) => {
  if (!day.inMonth) return 'bg-transparent border-transparent opacity-20'
  if (day.status === 'mixed') return '' // handled by inline style
  if (day.status === 'good') return activeScheme.value.good
  if (day.status === 'bad') return activeScheme.value.bad
  return 'bg-white/5 border-transparent'
}

const getTextColor = (day) => {
  if (day.status === 'good') return activeScheme.value.goodText
  if (day.status === 'bad') return activeScheme.value.badText
  if (day.status === 'mixed') return activeScheme.value.mixedText
  return 'text-gray-600'
}

const getMixedStyle = (day) => {
  if (day.status !== 'mixed' || !day.inMonth) return {}
  const s = activeScheme.value
  return {
    background: `linear-gradient(135deg, ${s.mixedGood} 50%, ${s.mixedBad} 50%)`,
    borderColor: s.mixedBorder,
  }
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Month Header with Navigation -->
    <div class="flex items-center justify-between mb-3">
      <button @click="prevMonth" class="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
        <ChevronLeft class="w-4 h-4" />
      </button>

      <span class="text-sm font-bold text-white tracking-wide">{{ monthLabel }}</span>

      <button @click="nextMonth" class="p-1 rounded hover:bg-white/10 transition-colors"
        :class="canGoForward ? 'text-gray-400 hover:text-white' : 'text-gray-700 cursor-not-allowed'"
        :disabled="!canGoForward">
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Day Headers -->
    <div class="grid grid-cols-7 gap-1 mb-1 text-center">
      <span class="text-[10px] text-gray-500 uppercase">Mon</span>
      <span class="text-[10px] text-gray-500 uppercase">Tue</span>
      <span class="text-[10px] text-gray-500 uppercase">Wed</span>
      <span class="text-[10px] text-gray-500 uppercase">Thu</span>
      <span class="text-[10px] text-gray-500 uppercase">Fri</span>
      <span class="text-[10px] text-gray-500 uppercase">Sat</span>
      <span class="text-[10px] text-gray-500 uppercase">Sun</span>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1 content-start">
      <div v-for="day in history" :key="day.dateStr" @click="toggleDay(day)"
        class="aspect-square rounded-sm border transition-all duration-300 hover:scale-110 relative group flex items-center justify-center cursor-pointer"
        :class="[getColor(day), day.isToday ? 'ring-1 ring-astral-glow/60' : '']"
        :style="getMixedStyle(day)">
        <!-- Day Number -->
        <span v-if="day.inMonth" class="text-[9px] font-mono" :class="getTextColor(day)">{{ day.dayNum }}</span>

        <!-- Tooltip (hover on desktop, click on mobile) -->
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded text-xs whitespace-nowrap transition-opacity pointer-events-none z-10"
          :class="selectedDay === day.dateStr ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
          {{ day.dateStr }}
          <span v-if="day.count > 0" class="text-emerald-400 block font-bold">✓ {{ day.count }} completed</span>
          <span v-if="day.missed > 0" class="text-red-400 block font-bold">✗ {{ day.missed }} missed</span>
          <span v-if="day.count === 0 && day.missed === 0 && day.inMonth" class="text-gray-500 block">No activity</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div
      class="flex items-center gap-3 mt-3 text-[10px] text-gray-400 uppercase tracking-widest justify-center flex-wrap">
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm border" :class="activeScheme.legendGood"></div>
        <span>Completed</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm border" :class="activeScheme.legendBad"></div>
        <span>Missed</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm border"
          :style="{ background: `linear-gradient(135deg, ${activeScheme.mixedGood} 50%, ${activeScheme.mixedBad} 50%)`, borderColor: activeScheme.mixedBorder }"></div>
        <span>Mixed</span>
      </div>
    </div>
  </div>
</template>
