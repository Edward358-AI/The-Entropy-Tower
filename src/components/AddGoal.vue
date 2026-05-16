<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuestStore } from '../stores/questStore'
import { usePlayerStore } from '../stores/playerStore'
import { breakDownGoal, breakDownProject } from '../services/aiService'
import { useTime } from '../composables/useTime'
import { Timestamp } from 'firebase/firestore'
import { addDays, differenceInCalendarDays, format } from 'date-fns'
import { Sparkles, PenTool, Plus, X, FolderKanban, Upload, FileText, Image, Trash2 } from 'lucide-vue-next'

const { now, todayStr } = useTime()

const questStore = useQuestStore()
const playerStore = usePlayerStore()
const mode = ref('ai') // 'ai' | 'manual' | 'project'

// Card cosmetic styles for the panel
const PANEL_STYLES = {
  cardGilded: { border: '1px solid rgba(251, 191, 36, 0.35)', background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.15), rgba(26, 26, 46, 0.3))', boxShadow: '0 0 15px rgba(251, 191, 36, 0.08)' },
  cardPhantom: { border: '1px solid rgba(129, 140, 248, 0.2)', background: 'rgba(49, 46, 129, 0.15)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.08), inset 0 0 40px rgba(99, 102, 241, 0.03)' },
  cardRunic: { border: '1px solid rgba(139, 92, 246, 0.25)', background: 'rgba(76, 29, 149, 0.1)', boxShadow: 'inset 0 1px 0 rgba(167, 139, 250, 0.12), 0 0 18px rgba(139, 92, 246, 0.06)' },
}
const panelStyle = computed(() => {
  const style = playerStore.selectedCosmetics?.cardStyle
  return (style && PANEL_STYLES[style]) ? PANEL_STYLES[style] : {}
})

// AI Data
const aiInput = ref('')
const isProcessing = ref(false)

// Manual Data
const manualTitle = ref('')
const manualXP = ref(20)
const manualDate = ref('')
const manualTime = ref('23:59')
const enableSubtasks = ref(false)
const manualSubtasks = ref(['']) // Array of strings for subtask titles

const addSubtask = () => {
  manualSubtasks.value.push('')
}

const removeSubtask = (index) => {
  manualSubtasks.value.splice(index, 1)
  if (manualSubtasks.value.length === 0) {
    enableSubtasks.value = false
    manualSubtasks.value = ['']
  }
}

// Project Planner Data
const projectDesc = ref('')
const projectDeadline = ref('')
const projectFiles = ref([])
const projectFileInput = ref(null)
const isDragging = ref(false)

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

const projectDaysRemaining = computed(() => {
  if (!projectDeadline.value) return 0
  const deadline = new Date(projectDeadline.value + 'T23:59:00')
  const days = differenceInCalendarDays(deadline, now.value)
  return Math.max(1, days)
})

const isValidProject = computed(() => {
  return projectDesc.value.trim().length > 0 && projectDeadline.value && projectDaysRemaining.value > 0
})

const handleFileDrop = (e) => {
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer.files)
  addFiles(droppedFiles)
}

const handleFileSelect = (e) => {
  const selected = Array.from(e.target.files)
  addFiles(selected)
  // Reset input so same file can be re-selected
  if (projectFileInput.value) projectFileInput.value.value = ''
}

const addFiles = (newFiles) => {
  for (const file of newFiles) {
    if (projectFiles.value.length >= MAX_FILES) break
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      alert(`Unsupported file type: ${file.type}\nAccepted: PDF, PNG, JPG, WebP, GIF, TXT`)
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`)
      continue
    }
    projectFiles.value.push(file)
  }
}

const removeFile = (index) => {
  projectFiles.value.splice(index, 1)
}

const getFileIcon = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  return 'file'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Set default date to tomorrow on mount
onMounted(() => {
  const tomorrow = addDays(new Date(), 1)
  manualDate.value = format(tomorrow, 'yyyy-MM-dd')
  // Default project deadline to 7 days from now
  const weekOut = addDays(new Date(), 7)
  projectDeadline.value = format(weekOut, 'yyyy-MM-dd')
})

// todayDateString is now provided by useTime() as todayStr — reactive and auto-updates at midnight

const isValidManual = computed(() => {
  return manualTitle.value.trim().length > 0 && manualDate.value
})

const handleAIBuild = async () => {
  if (!aiInput.value.trim()) return

  isProcessing.value = true
  try {
    const microQuests = await breakDownGoal(aiInput.value)
    for (const mq of microQuests) {
      const offset = mq.deadlineOffset !== undefined ? Number(mq.deadlineOffset) : 1
      const targetDate = addDays(new Date(), offset)
      targetDate.setHours(23, 59, 59, 999)

      const questData = {
        title: mq.title,
        xpReward: mq.xp,
        deadline: Timestamp.fromDate(targetDate),
      }
      
      // If AI returned subtasks, format them
      if (mq.subtasks && Array.isArray(mq.subtasks) && mq.subtasks.length > 0) {
        questData.subtasks = mq.subtasks.map(st => ({ title: st, completed: false }))
      }

      await questStore.addQuest(questData)
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
    const selectedDate = new Date(manualDate.value + 'T' + manualTime.value + ':00')

    const questData = {
      title: manualTitle.value,
      xpReward: parseInt(manualXP.value) || 20,
      deadline: Timestamp.fromDate(selectedDate),
    }

    if (enableSubtasks.value) {
      const validSubtasks = manualSubtasks.value.filter(st => st.trim() !== '')
      if (validSubtasks.length > 0) {
        questData.subtasks = validSubtasks.map(st => ({ title: st.trim(), completed: false }))
      }
    }

    await questStore.addQuest(questData)

    // Reset form
    manualTitle.value = ''
    manualXP.value = 20
    const tomorrow = addDays(new Date(), 1)
    manualDate.value = format(tomorrow, 'yyyy-MM-dd')
    manualTime.value = '23:59'
    enableSubtasks.value = false
    manualSubtasks.value = ['']
  } catch (err) {
    console.error(err)
    alert("Failed to create quest: " + err.message)
  }
}

const handleProjectBuild = async () => {
  if (!isValidProject.value) return

  isProcessing.value = true
  try {
    const quests = await breakDownProject(
      projectDesc.value,
      projectDaysRemaining.value,
      projectFiles.value
    )

    for (const mq of quests) {
      const offset = mq.deadlineOffset !== undefined ? Number(mq.deadlineOffset) : 1
      const targetDate = addDays(new Date(), offset)
      targetDate.setHours(23, 59, 59, 999)

      const questData = {
        title: mq.title,
        xpReward: mq.xp,
        deadline: Timestamp.fromDate(targetDate),
      }

      if (mq.subtasks && Array.isArray(mq.subtasks) && mq.subtasks.length > 0) {
        questData.subtasks = mq.subtasks.map(st => ({ title: st, completed: false }))
      }

      await questStore.addQuest(questData)
    }

    // Reset form
    projectDesc.value = ''
    projectFiles.value = []
    const weekOut = addDays(new Date(), 7)
    projectDeadline.value = format(weekOut, 'yyyy-MM-dd')
  } catch (err) {
    console.error(err)
    alert("Project planning failed. Try again.")
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="bg-astral-nebula/40 border border-white/5 rounded-xl p-4 transition-all duration-300 overflow-hidden" :style="panelStyle">
    <!-- Tabs -->
    <div class="flex gap-4 mb-4 border-b border-white/5 pb-2">
      <button @click="mode = 'ai'" class="flex items-center gap-2 text-sm font-bold pb-2 transition-colors relative"
        :class="mode === 'ai' ? 'text-astral-glow' : 'text-gray-500 hover:text-white'">
        <Sparkles class="w-4 h-4" />
        AI Assist
        <div v-if="mode === 'ai'" class="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-astral-glow"></div>
      </button>

      <button @click="mode = 'project'" class="flex items-center gap-2 text-sm font-bold pb-2 transition-colors relative"
        :class="mode === 'project' ? 'text-purple-400' : 'text-gray-500 hover:text-white'">
        <FolderKanban class="w-4 h-4" />
        Project
        <div v-if="mode === 'project'" class="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-purple-400"></div>
      </button>

      <button @click="mode = 'manual'" class="flex items-center gap-2 text-sm font-bold pb-2 transition-colors relative"
        :class="mode === 'manual' ? 'text-astral-glow' : 'text-gray-500 hover:text-white'">
        <PenTool class="w-4 h-4" />
        Manual
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

    <!-- Project Planner Mode -->
    <div v-else-if="mode === 'project'" class="space-y-3">
      <!-- Description -->
      <textarea v-model="projectDesc" @keydown.ctrl.enter="handleProjectBuild"
        placeholder="Describe your project in detail — what's the deliverable, any specific requirements, grading criteria, constraints, etc. The more detail you give, the better the timeline."
        class="w-full h-28 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400/50 transition-all placeholder-gray-600 resize-none text-sm"
        :disabled="isProcessing"></textarea>

      <!-- Deadline & Info Row -->
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <label class="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Final Deadline</label>
          <input v-model="projectDeadline" type="date" :min="todayStr"
            class="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400/50 transition-colors" />
        </div>
        <div v-if="projectDeadline" class="text-xs text-purple-400 font-bold pb-2.5 whitespace-nowrap">
          {{ projectDaysRemaining }} day{{ projectDaysRemaining !== 1 ? 's' : '' }} left
        </div>
      </div>

      <!-- File Drop Zone -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        @click="projectFileInput?.click()"
        class="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all"
        :class="isDragging
          ? 'border-purple-400 bg-purple-500/10'
          : 'border-white/10 hover:border-purple-400/30 hover:bg-white/[0.02]'"
      >
        <input ref="projectFileInput" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt" class="hidden" @change="handleFileSelect" />
        <Upload class="w-5 h-5 mx-auto mb-1.5" :class="isDragging ? 'text-purple-400' : 'text-gray-600'" />
        <p class="text-xs text-gray-500">
          <span class="text-gray-400 font-medium">Drop files</span> or click to upload
        </p>
        <p class="text-[10px] text-gray-600 mt-0.5">PDF, images, or text — syllabus, rubric, instructions (max 10MB each)</p>
      </div>

      <!-- Attached Files List -->
      <div v-if="projectFiles.length > 0" class="space-y-1.5">
        <div v-for="(file, index) in projectFiles" :key="index"
          class="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5 text-sm">
          <FileText v-if="getFileIcon(file) === 'file'" class="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <Image v-else class="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span class="text-gray-300 text-xs truncate flex-1">{{ file.name }}</span>
          <span class="text-[10px] text-gray-600">{{ formatFileSize(file.size) }}</span>
          <button @click.stop="removeFile(index)" class="p-0.5 text-gray-600 hover:text-red-400 transition-colors">
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="flex justify-between items-center pt-1">
        <p class="text-xs text-gray-500">Ctrl + Enter to submit</p>
        <button @click="handleProjectBuild"
          class="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors font-medium border border-purple-400/20 flex items-center gap-2"
          :disabled="isProcessing || !isValidProject">
          <FolderKanban class="w-4 h-4" />
          {{ isProcessing ? 'Planning...' : 'Build Timeline' }}
        </button>
      </div>
    </div>

    <!-- Manual Mode -->
    <div v-else class="space-y-3">
      <input v-model="manualTitle" @keyup.enter="handleManualAdd" type="text" placeholder="Quest Title (Required)"
        class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-astral-glow transition-all placeholder-gray-600" />

      <div class="grid grid-cols-[1fr_auto] gap-2">
        <!-- Custom XP Input -->
        <div class="relative">
          <input v-model="manualXP" type="number" min="1" placeholder="XP"
            class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-astral-glow" />
          <span class="absolute right-3 top-2 text-xs text-gray-500 font-bold pointer-events-none">XP</span>
        </div>

        <!-- Add Button -->
        <button @click="handleManualAdd" :disabled="!isValidManual"
          class="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 row-span-2"
          :class="isValidManual ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'">
          <Plus class="w-5 h-5" />
        </button>

        <!-- Date & Time Row -->
        <div class="flex gap-2 min-w-0">
          <input v-model="manualDate" type="date" :min="todayStr"
            class="bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-astral-glow flex-1 min-w-0" />
          <input v-model="manualTime" type="time"
            class="bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-astral-glow w-[90px] min-w-0" />
        </div>
      </div>

      <!-- Subtasks Toggle -->
      <div class="flex items-center gap-2 mt-2">
        <label class="flex items-center cursor-pointer relative">
          <input type="checkbox" v-model="enableSubtasks" class="sr-only">
          <div class="w-8 h-4 bg-white/10 rounded-full shadow-inner transition-colors" :class="{ 'bg-astral-glow': enableSubtasks }"></div>
          <div class="dot absolute w-3 h-3 bg-white rounded-full top-0.5 left-0.5 transition-transform" :class="{ 'transform translate-x-4': enableSubtasks }"></div>
        </label>
        <span class="text-xs text-gray-400">Add Subtasks</span>
      </div>

      <!-- Subtasks List -->
      <div v-if="enableSubtasks" class="space-y-2 mt-2 pl-2 border-l-2 border-white/10">
        <div v-for="(subtask, index) in manualSubtasks" :key="index" class="flex items-center gap-2">
          <input v-model="manualSubtasks[index]" type="text" :placeholder="`Subtask ${index + 1}`"
            class="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-astral-glow transition-all" />
          <button @click="removeSubtask(index)" class="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>
        <button @click="addSubtask" class="text-xs text-astral-glow hover:text-astral-cosmic font-bold transition-colors">
          + Add another subtask
        </button>
      </div>
    </div>
  </div>
</template>
