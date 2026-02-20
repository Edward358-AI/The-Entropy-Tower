<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import { Swords, TrendingUp, Flame, CalendarDays, Shield, Zap } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const isLoggedIn = computed(() => !!authStore.user)

const features = [
  {
    icon: Swords,
    title: 'Quest System',
    description: 'Create quests with AI or manually. Set deadlines, assign XP, and conquer your tasks before entropy takes hold.',
    color: 'text-astral-glow'
  },
  {
    icon: TrendingUp,
    title: 'XP & Leveling',
    description: 'Earn XP by completing quests. Level up through material ages — Stone, Iron, Gold, Diamond, and Astral.',
    color: 'text-path-erudition'
  },
  {
    icon: Flame,
    title: 'Decay & Entropy',
    description: 'Miss a deadline and entropy strikes. XP decays exponentially the longer you wait. Overdue quests reset your streak.',
    color: 'text-red-400'
  },
  {
    icon: CalendarDays,
    title: 'Heatmap & Streaks',
    description: 'Track your consistency over time. Build streaks for multiplier bonuses and see your activity visualized day by day.',
    color: 'text-path-abundance'
  },
  {
    icon: Shield,
    title: 'Boss Gates',
    description: 'Every 10 levels, a Gatekeeper blocks your path. Complete a boss quest to ascend and continue your journey.',
    color: 'text-path-preservation'
  },
  {
    icon: Zap,
    title: 'Real-Time Penalties',
    description: 'Decay applies at the exact deadline time, not just end of day. Stay on top of your quests or watch your tower crumble.',
    color: 'text-path-hunt'
  }
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <!-- Background glow -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-astral-glow/10 rounded-full blur-[120px]"></div>
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div class="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <!-- Left: Text Content -->
          <div class="flex-1 text-center md:text-left">
            <h1 class="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">
              Entropy<br>
              <span class="text-astral-glow">Tower</span>
            </h1>
            <p class="text-lg md:text-xl text-gray-400 mb-3 max-w-md">
              A gamified productivity system where your tasks fuel a rising tower — and neglect causes it to decay.
            </p>
            <p class="text-sm text-gray-500 mb-8 max-w-md">
              Build habits, fight entropy, and ascend through material ages. Every quest completed raises your tower. Every missed deadline crumbles it.
            </p>

            <!-- CTA Buttons -->
            <div class="flex items-center gap-4 justify-center md:justify-start">
              <template v-if="isLoggedIn">
                <router-link to="/dashboard"
                  class="bg-astral-glow hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-all hover:scale-105 shadow-lg shadow-astral-glow/20">
                  Go to Dashboard
                </router-link>
              </template>
              <template v-else>
                <router-link to="/auth"
                  class="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-lg transition-all">
                  Log in
                </router-link>
                <router-link to="/auth?mode=signup"
                  class="bg-astral-glow hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-all hover:scale-105 shadow-lg shadow-astral-glow/20">
                  Sign up
                </router-link>
              </template>
            </div>
          </div>

          <!-- Right: Tower Visual -->
          <div class="flex-shrink-0">
            <div class="relative w-28 h-[320px] md:w-32 md:h-[400px]">
              <!-- Tower Container -->
              <div class="absolute inset-0 bg-astral-nebula/50 border border-white/10 rounded-t-lg overflow-hidden backdrop-blur-sm">
                <!-- Level Label -->
                <div class="absolute top-4 left-0 right-0 text-center z-10">
                  <div class="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Level</div>
                  <div class="text-3xl font-bold font-display text-white">42</div>
                  <div class="text-[10px] text-astral-glow font-bold mt-1">Astral Age</div>
                </div>
                <!-- Fill -->
                <div class="absolute bottom-0 left-0 right-0 h-[70%] bg-astral-glow/70 transition-all">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-white/20"></div>
                </div>
              </div>
              <!-- Glow under tower -->
              <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-astral-glow/30 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="max-w-5xl mx-auto px-6 pb-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="feature in features" :key="feature.title"
          class="bg-astral-nebula/50 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all group">
          <component :is="feature.icon" class="w-8 h-8 mb-4 transition-transform group-hover:scale-110"
            :class="feature.color" />
          <h3 class="text-white font-bold text-lg mb-2">{{ feature.title }}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-white/5 py-8 text-center text-gray-600 text-xs">
      Entropy Tower — Fight the void, one quest at a time.
    </div>
  </div>
</template>
