<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { db, auth } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday } from 'date-fns'
import { useQuestStore } from '../stores/questStore'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const questStore = useQuestStore()

const history = ref([])
const currentMonth = ref(new Date())
const historyData = ref({})

const monthLabel = computed(() => format(currentMonth.value, 'MMMM yyyy'))

const canGoForward = computed(() => {
  const now = new Date()
  return currentMonth.value.getMonth() < now.getMonth() || currentMonth.value.getFullYear() < now.getFullYear()
})

const prevMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
  buildGrid()
}

const nextMonth = () => {
  if (canGoForward.value) {
    currentMonth.value = addMonths(currentMonth.value, 1)
    buildGrid()
  }
}

const fetchHistory = async () => {
  if (!auth.currentUser) return

  try {
    const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', 'heatmap')
    const snap = await getDoc(historyRef)
    if (snap.exists()) {
      historyData.value = snap.data()
    }
  } catch (err) {
    console.error("Failed to load heatmap:", err)
  }

  buildGrid()
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
  fetchHistory()
})

// Live update after heatmap data is written
watch(() => questStore.heatmapVersion, () => {
  fetchHistory()
})

const getColor = (day) => {
  if (!day.inMonth) return 'bg-transparent border-transparent opacity-20'
  if (day.status === 'mixed') return 'heatmap-mixed border-yellow-400/50'
  if (day.status === 'good') return 'bg-emerald-500/50 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
  if (day.status === 'bad') return 'bg-red-500/40 border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
  return 'bg-white/5 border-transparent'
}

const getTextColor = (day) => {
  if (day.status === 'good') return 'text-emerald-200'
  if (day.status === 'bad') return 'text-red-300'
  if (day.status === 'mixed') return 'text-yellow-200'
  return 'text-gray-600'
}
</script>

<template>
  <div class="flex flex-col h-full">
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
    <div class="grid grid-cols-7 gap-1 content-start flex-1">
      <div v-for="day in history" :key="day.dateStr"
        class="aspect-square rounded-sm border transition-all duration-300 hover:scale-110 relative group flex items-center justify-center"
        :class="[getColor(day), day.isToday ? 'ring-1 ring-astral-glow/60' : '']">
        <!-- Day Number -->
        <span v-if="day.inMonth" class="text-[9px] font-mono"
          :class="getTextColor(day)">{{ day.dayNum }}</span>

        <!-- Tooltip -->
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {{ day.dateStr }}
          <span v-if="day.count > 0" class="text-emerald-400 block font-bold">✓ {{ day.count }} completed</span>
          <span v-if="day.missed > 0" class="text-red-400 block font-bold">✗ {{ day.missed }} missed</span>
          <span v-if="day.count === 0 && day.missed === 0 && day.inMonth" class="text-gray-500 block">No activity</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-3 mt-3 text-[10px] text-gray-400 uppercase tracking-widest justify-center flex-wrap">
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-400/50"></div>
        <span>Completed</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-red-500/40 border border-red-400/50"></div>
        <span>Missed</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm heatmap-mixed border border-yellow-400/50"></div>
        <span>Mixed</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-mixed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.5) 50%, rgba(239, 68, 68, 0.5) 50%);
}
</style>
