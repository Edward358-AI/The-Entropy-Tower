<script setup>
import { onMounted, ref } from 'vue'
import { useQuestStore } from '../stores/questStore'
import { formatDistanceToNow, format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { CheckCircle, AlertTriangle, ShieldAlert, Trash2, Loader2, Pencil, X, Check, Skull } from 'lucide-vue-next'
import { usePlayerStore } from '../stores/playerStore'
import { useTime } from '../composables/useTime'

const questStore = useQuestStore()
const playerStore = usePlayerStore()
const { now } = useTime()

// Edit state
const editingId = ref(null)
const editTitle = ref('')
const editXP = ref(0)
const editDeadline = ref('')
const editTime = ref('23:59')

onMounted(() => {
  questStore.loadQuests()
})

const getDeadlineText = (timestamp) => {
  if (!timestamp) return ''
  // Touch now.value so Vue re-evaluates this when the clock ticks
  const _tick = now.value
  const date = new Date(timestamp.seconds * 1000)
  return formatDistanceToNow(date, { addSuffix: true })
}

const CARD_STYLES = {
  cardGilded: {
    border: '1px solid rgba(251, 191, 36, 0.6)',
    background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.2), rgba(113, 63, 18, 0.1))',
    boxShadow: '0 0 12px rgba(251, 191, 36, 0.15)',
  },
  cardPhantom: {
    border: '1px solid rgba(129, 140, 248, 0.3)',
    background: 'rgba(49, 46, 129, 0.2)',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.12), inset 0 0 30px rgba(99, 102, 241, 0.05)',
  },
  cardRunic: {
    border: '1px solid rgba(139, 92, 246, 0.4)',
    background: 'rgba(76, 29, 149, 0.15)',
    boxShadow: 'inset 0 1px 0 rgba(167, 139, 250, 0.2), 0 0 15px rgba(139, 92, 246, 0.1)',
  },
}

const getStatusColor = (quest) => {
  if (quest.status === 'corrupted') return 'border-red-500 bg-red-900/20'
  if (quest.daysOverdue >= 3) return 'border-orange-500 bg-orange-900/10'
  if (quest.daysOverdue > 0) return 'border-yellow-500 bg-yellow-900/10'
  const style = playerStore.selectedCosmetics?.cardStyle
  if (style && CARD_STYLES[style]) return '' // handled by inline style
  return 'border-white/10 bg-astral-nebula/40 hover:border-astral-glow/50'
}

const getCardStyle = (quest) => {
  if (quest.status === 'corrupted' || quest.daysOverdue > 0) return {}
  const style = playerStore.selectedCosmetics?.cardStyle
  if (style && CARD_STYLES[style]) return CARD_STYLES[style]
  return {}
}

const startEdit = (quest) => {
  editingId.value = quest.id
  editTitle.value = quest.title
  editXP.value = quest.xpReward
  // Convert Firestore timestamp to YYYY-MM-DD for date input
  if (quest.deadline?.seconds) {
    const d = new Date(quest.deadline.seconds * 1000)
    editDeadline.value = format(d, 'yyyy-MM-dd')
    editTime.value = format(d, 'HH:mm')
  } else {
    editDeadline.value = ''
    editTime.value = '23:59'
  }
}

const cancelEdit = () => {
  editingId.value = null
  editTitle.value = ''
  editXP.value = 0
  editDeadline.value = ''
  editTime.value = '23:59'
}

const saveEdit = async () => {
  if (!editTitle.value.trim()) return
  const updates = {
    title: editTitle.value.trim(),
    xpReward: Number(editXP.value) || 10
  }
  if (editDeadline.value) {
    updates.deadline = Timestamp.fromDate(new Date(editDeadline.value + 'T' + editTime.value + ':00'))
  }
  await questStore.editQuest(editingId.value, updates)
  editingId.value = null
}

const areAllSubtasksComplete = (quest) => {
  if (!quest.subtasks || quest.subtasks.length === 0) return true
  return quest.subtasks.every(st => st.completed)
}
</script>

<template>
  <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
    <div v-if="questStore.loading" class="text-center text-gray-500 py-4">
      Loading Quests...
    </div>

    <div v-else-if="questStore.quests.length === 0" class="text-center text-gray-500 py-8">
      <p>No active quests.</p>
      <p class="text-sm mt-2">The entropy is stable... for now.</p>
    </div>

    <transition-group name="list" tag="div" class="space-y-3">
      <div v-for="quest in questStore.quests" :key="quest.id"
        class="border rounded-xl p-4 transition-all duration-300 group relative overflow-hidden"
        :class="getStatusColor(quest)"
        :style="getCardStyle(quest)">
        <!-- Normal View -->
        <div v-if="editingId !== quest.id" class="flex justify-between items-start relative z-10 gap-2">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-white mb-1 flex items-start gap-2">
              <ShieldAlert v-if="quest.status === 'corrupted'" class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <AlertTriangle v-else-if="quest.daysOverdue > 0" class="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span class="break-words min-w-0 flex-1">{{ quest.title }}</span>
            </h3>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span class="text-astral-glow font-mono font-bold">+{{ quest.xpReward }} XP</span>
              <span v-if="quest.deadline">Due {{ getDeadlineText(quest.deadline) }}</span>

              <!-- Sync Status -->
              <span v-if="quest.id.startsWith('temp-')" class="flex items-center gap-1 text-gray-500 animate-pulse">
                <Loader2 class="w-3 h-3 animate-spin" />
                Syncing...
              </span>
            </div>

            <div v-if="quest.daysOverdue > 0" class="mt-2 text-xs text-red-400 font-bold">
              Rot Level: {{ quest.daysOverdue }} (Decay Active)
            </div>

            <!-- Subtasks Checklist -->
            <div v-if="quest.subtasks && quest.subtasks.length > 0" class="mt-3 space-y-1.5">
              <label v-for="(subtask, index) in quest.subtasks" :key="index" 
                class="flex items-start gap-2 cursor-pointer group">
                <div class="relative flex items-center justify-center w-4 h-4 mt-0.5 border rounded-sm transition-colors shrink-0"
                  :class="subtask.completed ? 'bg-astral-glow border-astral-glow' : 'border-gray-500 group-hover:border-astral-glow'">
                  <Check v-if="subtask.completed" class="w-3 h-3 text-black" />
                  <input type="checkbox" :checked="subtask.completed" @change="questStore.toggleSubtask(quest.id, index)" class="sr-only" />
                </div>
                <span class="text-sm transition-colors break-words min-w-0" :class="subtask.completed ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'">
                  {{ subtask.title }}
                </span>
              </label>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0 self-start">
            <button @click.stop="startEdit(quest)" :disabled="quest.daysOverdue > 0"
              class="p-2 rounded-full transition-colors" :class="quest.daysOverdue > 0
                ? 'text-gray-700 cursor-not-allowed opacity-20'
                : 'hover:bg-blue-500/20 text-gray-600 hover:text-blue-400 opacity-40 hover:opacity-100'"
              :title="quest.daysOverdue > 0 ? 'Cannot edit while decaying' : 'Edit Quest'">
              <Pencil class="w-4 h-4" />
            </button>

            <button @click.stop="questStore.deleteQuest(quest.id)"
              class="p-2 rounded-full hover:bg-red-500/20 text-gray-600 hover:text-red-500 transition-colors opacity-40 hover:opacity-100"
              title="Abandon Quest">
              <Trash2 class="w-4 h-4" />
            </button>

            <button @click="questStore.completeQuest(quest.id)"
              :disabled="!areAllSubtasksComplete(quest)"
              class="p-2 rounded-full transition-colors"
              :class="areAllSubtasksComplete(quest) ? 'bg-white/5 hover:bg-astral-glow hover:text-white text-gray-400' : 'bg-white/5 text-gray-700 opacity-50 cursor-not-allowed'"
              :title="!areAllSubtasksComplete(quest) ? 'Complete all subtasks first' : 'Complete Quest'">
              <CheckCircle class="w-6 h-6" />
            </button>

            <!-- Revival Elixir for corrupted quests -->
            <button v-if="quest.status === 'corrupted' && playerStore.inventory.revivalElixir > 0"
              @click.stop="questStore.reviveQuest(quest.id)"
              class="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 hover:text-purple-300 transition-colors"
              title="Use Revival Elixir">
              <Skull class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Edit View -->
        <div v-else class="relative z-10 space-y-3">
          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Quest Title</label>
            <input v-model="editTitle" @keyup.enter="saveEdit" @keyup.escape="cancelEdit"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-astral-glow/50 transition-colors"
              placeholder="Quest title..." autofocus />
          </div>

          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">XP Reward</label>
            <input v-model.number="editXP" @keyup.enter="saveEdit" @keyup.escape="cancelEdit" type="number" min="1"
              max="500"
              class="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-astral-glow text-sm font-mono focus:outline-none focus:border-astral-glow/50 transition-colors" />
          </div>

          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Due Date</label>
            <div class="flex flex-wrap gap-2">
              <input v-model="editDeadline" @keyup.escape="cancelEdit" type="date"
                class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-astral-glow/50 transition-colors flex-1 min-w-[120px]" />
              <input v-model="editTime" @keyup.escape="cancelEdit" type="time"
                class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-astral-glow/50 transition-colors w-[100px]" />
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button @click="saveEdit"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-astral-glow/20 hover:bg-astral-glow/40 text-astral-glow text-xs font-bold transition-colors">
              <Check class="w-3 h-3" />
              Save
            </button>
            <button @click="cancelEdit"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors">
              <X class="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
</style>
