<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuestStore } from '../stores/questStore'
import { breakDownGoal } from '../services/aiService'
import { Timestamp } from 'firebase/firestore'
import { addDays, format } from 'date-fns'
import { Sparkles, PenTool, Plus } from 'lucide-vue-next'

const questStore = useQuestStore()
const mode = ref('ai') // 'ai' | 'manual'

// AI Data
const aiInput = ref('')
const isProcessing = ref(false)

// Manual Data
const manualTitle = ref('')
const manualXP = ref(20)
const manualDate = ref('')

// Set default date to tomorrow on mount
onMounted(() => {
  const tomorrow = addDays(new Date(), 1)
  manualDate.value = format(tomorrow, 'yyyy-MM-dd')
})

const isValidManual = computed(() => {
  return manualTitle.value.trim().length > 0 && manualDate.value
})

const handleAIBuild = async () => {
  if (!aiInput.value.trim()) return

  isProcessing.value = true
  try {
    const microQuests = await breakDownGoal(aiInput.value)
    for (const mq of microQuests) {
      await questStore.addQuest({
        title: mq.title,
        xpReward: mq.xp,
        deadline: Timestamp.fromDate(addDays(new Date(), mq.deadlineOffset || 1)),
        isBoss: false
      })
    }
    aiInput.value = ''
  } catch (err) {
    console.error(err)
    alert("The Architect is unresponsive. Try again.")
  } finally {
    isProcessing.value = false
  }
}

const handleManualAdd = async () => {
  if (!isValidManual.value) return

  try {
    const selectedDate = new Date(manualDate.value + 'T23:59:59')

    await questStore.addQuest({
      title: manualTitle.value,
      xpReward: parseInt(manualXP.value) || 20,
      deadline: Timestamp.fromDate(selectedDate),
      isBoss: false
    })

    // Reset form
    manualTitle.value = ''
    manualXP.value = 20
    const tomorrow = addDays(new Date(), 1)
    manualDate.value = format(tomorrow, 'yyyy-MM-dd')
  } catch (err) {
    console.error(err)
    alert("Failed to create quest: " + err.message)
  }
}
</script>

<template>
  <div class="bg-astral-nebula/40 border border-white/5 rounded-xl p-4 transition-all duration-300">
    <!-- Tabs -->
    <div class="flex gap-4 mb-4 border-b border-white/5 pb-2">
      <button @click="mode = 'ai'" class="flex items-center gap-2 text-sm font-bold pb-2 transition-colors relative"
        :class="mode === 'ai' ? 'text-astral-glow' : 'text-gray-500 hover:text-white'">
        <Sparkles class="w-4 h-4" />
        AI Assist
        <div v-if="mode === 'ai'" class="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-astral-glow"></div>
      </button>

      <button @click="mode = 'manual'" class="flex items-center gap-2 text-sm font-bold pb-2 transition-colors relative"
        :class="mode === 'manual' ? 'text-astral-glow' : 'text-gray-500 hover:text-white'">
        <PenTool class="w-4 h-4" />
        Manual Override
        <div v-if="mode === 'manual'" class="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-astral-glow"></div>
      </button>
    </div>

    <!-- AI Mode -->
    <div v-if="mode === 'ai'" class="space-y-4">
      <textarea v-model="aiInput" @keydown.ctrl.enter="handleAIBuild"
        placeholder="e.g., 'I have a history paper due on Friday. I need to research, outline, and write it.'"
        class="w-full h-24 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-astral-glow transition-all placeholder-gray-600 resize-none text-sm"
        :disabled="isProcessing"></textarea>

      <div class="flex justify-between items-center">
        <p class="text-xs text-gray-500">Ctrl + Enter to submit</p>
        <button @click="handleAIBuild"
          class="bg-astral-cosmic hover:bg-astral-glow disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors font-medium border border-white/5 flex items-center gap-2"
          :disabled="isProcessing">
          <Sparkles class="w-4 h-4" />
          {{ isProcessing ? 'Constructing...' : 'Generate Quests' }}
        </button>
      </div>
    </div>

    <!-- Manual Mode -->
    <div v-else class="space-y-3">
      <input v-model="manualTitle" @keyup.enter="handleManualAdd" type="text" placeholder="Quest Title (Required)"
        class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-astral-glow transition-all placeholder-gray-600" />

      <div class="flex flex-wrap gap-2">
        <!-- Custom XP Input -->
        <div class="relative w-32 flex-shrink-0">
          <input v-model="manualXP" type="number" min="1" placeholder="XP"
            class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-astral-glow" />
          <span class="absolute right-3 top-2 text-xs text-gray-500 font-bold pointer-events-none">XP</span>
        </div>

        <!-- Date Picker -->
        <input v-model="manualDate" type="date"
          class="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-astral-glow flex-1 min-w-[140px]" />

        <button @click="handleManualAdd" :disabled="!isValidManual"
          class="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          :class="isValidManual ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'">
          <Plus class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
