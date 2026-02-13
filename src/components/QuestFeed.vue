<script setup>
import { onMounted, ref } from 'vue'
import { useQuestStore } from '../stores/questStore'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, AlertTriangle, ShieldAlert, Trash2, Loader2, Pencil, X, Check } from 'lucide-vue-next'

const questStore = useQuestStore()

// Edit state
const editingId = ref(null)
const editTitle = ref('')
const editXP = ref(0)

onMounted(() => {
  questStore.loadQuests()
})

const getDeadlineText = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp.seconds * 1000)
  return formatDistanceToNow(date, { addSuffix: true })
}

const getStatusColor = (quest) => {
  if (quest.status === 'corrupted') return 'border-red-500 bg-red-900/20'
  if (quest.daysOverdue >= 3) return 'border-orange-500 bg-orange-900/10'
  if (quest.daysOverdue > 0) return 'border-yellow-500 bg-yellow-900/10'
  return 'border-white/10 bg-astral-nebula/40 hover:border-astral-glow/50'
}

const startEdit = (quest) => {
  editingId.value = quest.id
  editTitle.value = quest.title
  editXP.value = quest.xpReward
}

const cancelEdit = () => {
  editingId.value = null
  editTitle.value = ''
  editXP.value = 0
}

const saveEdit = async () => {
  if (!editTitle.value.trim()) return
  await questStore.editQuest(editingId.value, {
    title: editTitle.value.trim(),
    xpReward: Number(editXP.value) || 10
  })
  editingId.value = null
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
      <div 
        v-for="quest in questStore.quests" 
        :key="quest.id"
        class="border rounded-xl p-4 transition-all duration-300 group relative overflow-hidden"
        :class="getStatusColor(quest)"
      >
        <!-- Normal View -->
        <div v-if="editingId !== quest.id" class="flex justify-between items-start relative z-10">
          <div class="flex-1">
            <h3 class="font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert v-if="quest.status === 'corrupted'" class="w-4 h-4 text-red-500" />
              <AlertTriangle v-else-if="quest.daysOverdue > 0" class="w-4 h-4 text-orange-400" />
              {{ quest.title }}
            </h3>
            
            <div class="flex items-center gap-3 text-xs text-gray-400">
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
          </div>

          <div class="flex items-center gap-1">
            <button 
              @click.stop="startEdit(quest)"
              class="p-2 rounded-full hover:bg-blue-500/20 text-gray-600 hover:text-blue-400 transition-colors opacity-40 hover:opacity-100"
              title="Edit Quest"
            >
              <Pencil class="w-4 h-4" />
            </button>

            <button 
              @click.stop="questStore.deleteQuest(quest.id)"
              class="p-2 rounded-full hover:bg-red-500/20 text-gray-600 hover:text-red-500 transition-colors opacity-40 hover:opacity-100"
              title="Abandon Quest"
            >
              <Trash2 class="w-4 h-4" />
            </button>

            <button 
              @click="questStore.completeQuest(quest.id)"
              class="p-2 rounded-full bg-white/5 hover:bg-astral-glow hover:text-white text-gray-400 transition-colors"
              title="Complete Quest"
            >
              <CheckCircle class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Edit View -->
        <div v-else class="relative z-10 space-y-3">
          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Quest Title</label>
            <input 
              v-model="editTitle"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-astral-glow/50 transition-colors"
              placeholder="Quest title..."
              autofocus
            />
          </div>
          
          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">XP Reward</label>
            <input 
              v-model.number="editXP"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
              type="number"
              min="1"
              max="500"
              class="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-astral-glow text-sm font-mono focus:outline-none focus:border-astral-glow/50 transition-colors"
            />
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button 
              @click="saveEdit"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-astral-glow/20 hover:bg-astral-glow/40 text-astral-glow text-xs font-bold transition-colors"
            >
              <Check class="w-3 h-3" />
              Save
            </button>
            <button 
              @click="cancelEdit"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors"
            >
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
