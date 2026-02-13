<script setup>
import { ref, onMounted } from 'vue'
import { db, auth } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { subDays, format, startOfWeek, addDays, isSameDay } from 'date-fns'

const history = ref([])
const daysToShow = 28 // 4 weeks

const loadHistory = async () => {
  if (!auth.currentUser) return
  
  // Align start date to the beginning of the week (Monday) 4 weeks ago
  const today = new Date()
  const startDate = startOfWeek(subDays(today, daysToShow - 1), { weekStartsOn: 1 }) 
  
  // Fetch History
  let historyData = {}
  try {
     const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', 'heatmap')
     const snap = await getDoc(historyRef)
     if (snap.exists()) {
       historyData = snap.data()
     }
  } catch (err) {
    console.error("Failed to load heatmap:", err)
  }
  
  const grid = []
  for (let i = 0; i < daysToShow; i++) {
    const date = addDays(startDate, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const count = historyData[dateStr] || 0
    
    let status = 'neutral'
    if (count > 0) status = 'good' 
    // We don't track 'decay' events in heatmap yet, just activity
    
    grid.push({
      date: date,
      dateStr: dateStr,
      dayName: format(date, 'EEE'),
      count: count,
      status: status
    })
  }

  history.value = grid
}

onMounted(() => {
  loadHistory()
})

const getColor = (status) => {
  if (status === 'good') return 'bg-emerald-500/50 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
  if (status === 'bad') return 'bg-red-500/50 border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
  return 'bg-white/5 border-transparent'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Day Headers -->
    <div class="grid grid-cols-7 gap-1 mb-2 text-center">
      <span class="text-[10px] text-gray-500 uppercase">Mon</span>
      <span class="text-[10px] text-gray-500 uppercase">Tue</span>
      <span class="text-[10px] text-gray-500 uppercase">Wed</span>
      <span class="text-[10px] text-gray-500 uppercase">Thu</span>
      <span class="text-[10px] text-gray-500 uppercase">Fri</span>
      <span class="text-[10px] text-gray-500 uppercase">Sat</span>
      <span class="text-[10px] text-gray-500 uppercase">Sun</span>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-7 gap-1 content-start flex-1">
      <div 
        v-for="day in history" 
        :key="day.dateStr"
        class="aspect-square rounded-sm border transition-all duration-300 hover:scale-110 relative group"
        :class="getColor(day.status)"
      >
        <!-- Tooltip -->
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {{ day.dateStr }}
          <span v-if="day.status === 'good'" class="text-emerald-400 block font-bold">Productive</span>
          <span v-if="day.status === 'bad'" class="text-red-400 block font-bold">Decay</span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-4 mt-4 text-[10px] text-gray-400 uppercase tracking-widest justify-center">
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-400/50"></div>
        <span>Active</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-red-500/50 border border-red-400/50"></div>
        <span>Decay</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-white/5 border border-white/10"></div>
        <span>Inactive</span>
      </div>
    </div>
  </div>
</template>
