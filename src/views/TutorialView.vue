<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft, Swords, TrendingUp, Flame, CalendarDays, Shield, Zap, Clock, Brain, Star, Palette } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen">
    <!-- Sticky Header -->
    <div class="sticky top-0 z-20 bg-astral-void/90 backdrop-blur-md border-b border-white/5">
      <div class="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
        <button @click="router.push('/dashboard')"
          class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft class="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-6 py-10">
      <!-- Title -->
      <div class="mb-12 text-center">
        <h1 class="text-3xl md:text-4xl font-display font-bold text-white mb-3">How Entropy Tower Works</h1>
        <p class="text-gray-400 text-lg">A complete guide to the quest, leveling, and decay systems.</p>
      </div>

      <!-- Section: Quests -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-astral-glow/10">
            <Swords class="w-5 h-5 text-astral-glow" />
          </div>
          <h2 class="text-xl font-bold text-white">Quests</h2>
        </div>
        <div class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-4">
          <div>
            <h3 class="text-white font-bold mb-1 flex items-center gap-2">
              <Brain class="w-4 h-4 text-path-preservation" /> AI Assist
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed">
              Describe what you need to accomplish and AI will generate structured quests for you, each with a title, XP
              reward, and deadline. Great for breaking large projects into actionable steps.
            </p>
          </div>
          <div>
            <h3 class="text-white font-bold mb-1 flex items-center gap-2">
              <Star class="w-4 h-4 text-path-erudition" /> Manual Override
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed">
              Create quests manually by entering a title, XP value, due date, and time. The deadline time matters — your
              quest goes overdue at the exact time you set, not just at end of day.
            </p>
          </div>
          <div>
            <h3 class="text-white font-bold mb-1 flex items-center gap-2">
              <Clock class="w-4 h-4 text-path-harmony" /> Deadline Behavior
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed">
              Quests are sorted by deadline (soonest first). When you complete a quest, you earn XP and it's logged to
              your heatmap. You can also edit or delete quests at any time.
            </p>
          </div>
        </div>
      </section>

      <!-- Section: XP & Leveling -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-path-erudition/10">
            <TrendingUp class="w-5 h-5 text-path-erudition" />
          </div>
          <h2 class="text-xl font-bold text-white">XP & Leveling</h2>
        </div>
        <div
          class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Completing quests earns you <span class="text-path-erudition font-bold">XP</span>. XP fills your tower, and
            when it reaches the threshold, you level up.</p>
          <div class="bg-black/20 rounded-lg p-4 font-mono text-xs text-gray-300">
            XP to next level = 100 + (Current Level × 20)
          </div>
          <p>As you level up, your tower progresses through <span class="font-bold text-white">material ages</span>:</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            <div class="bg-gray-600/20 border border-gray-500/30 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-300 font-bold">Stone</div>
              <div class="text-[10px] text-gray-500">Lv 1–9</div>
            </div>
            <div class="bg-slate-400/20 border border-slate-400/30 rounded-lg p-3 text-center">
              <div class="text-xs text-slate-300 font-bold">Iron</div>
              <div class="text-[10px] text-gray-500">Lv 10–19</div>
            </div>
            <div class="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 text-center">
              <div class="text-xs text-yellow-300 font-bold">Gold</div>
              <div class="text-[10px] text-gray-500">Lv 20–29</div>
            </div>
            <div class="bg-cyan-400/20 border border-cyan-400/30 rounded-lg p-3 text-center">
              <div class="text-xs text-cyan-300 font-bold">Diamond</div>
              <div class="text-[10px] text-gray-500">Lv 30–39</div>
            </div>
            <div class="bg-astral-glow/20 border border-astral-glow/30 rounded-lg p-3 text-center">
              <div class="text-xs text-astral-glow font-bold">Astral</div>
              <div class="text-[10px] text-gray-500">Lv 40–49</div>
            </div>
            <div class="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 text-center">
              <div class="text-xs text-purple-300 font-bold">Void</div>
              <div class="text-[10px] text-gray-500">Lv 50–59</div>
            </div>
            <div class="bg-amber-400/20 border border-amber-300/30 rounded-lg p-3 text-center">
              <div class="text-xs text-amber-300 font-bold">Celestial</div>
              <div class="text-[10px] text-gray-500">Lv 60–69</div>
            </div>
            <div class="bg-teal-400/20 border border-teal-300/30 rounded-lg p-3 text-center">
              <div class="text-xs text-teal-300 font-bold">Ethereal</div>
              <div class="text-[10px] text-gray-500">Lv 70–79</div>
            </div>
            <div class="bg-emerald-400/20 border border-emerald-300/30 rounded-lg p-3 text-center">
              <div class="text-xs text-emerald-300 font-bold">Mythic</div>
              <div class="text-[10px] text-gray-500">Lv 80–89</div>
            </div>
            <div class="bg-rose-400/20 border border-rose-300/30 rounded-lg p-3 text-center">
              <div class="text-xs text-rose-300 font-bold">Transcendent</div>
              <div class="text-[10px] text-gray-500">Lv 90–99</div>
            </div>
            <div class="bg-white/10 border border-white/30 rounded-lg p-3 text-center">
              <div class="text-xs text-white font-bold">Omega</div>
              <div class="text-[10px] text-gray-500">Lv 100</div>
            </div>
          </div>
          <p class="mt-2">Each tier has its own <span class="text-astral-glow font-bold">ambient page background</span>.
            You can mix and match tower designs and page backgrounds using the <span class="text-white font-bold">Theme
              Selector</span> (palette icon in the header).</p>
          <p>If decay pushes your XP below zero, you <span class="text-red-400 font-bold">de-level</span>. Your tower
            literally crumbles.</p>
        </div>
      </section>

      <!-- Section: Decay & Entropy -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-red-500/10">
            <Flame class="w-5 h-5 text-red-400" />
          </div>
          <h2 class="text-xl font-bold text-white">Decay & Entropy</h2>
        </div>
        <div
          class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>When a quest goes past its deadline time, <span class="text-red-400 font-bold">entropy</span> kicks in. XP
            is deducted and your streak is reset to zero.</p>
          <div>
            <p class="font-bold text-white mb-2">Penalty scales by level — initial hit + daily escalation from day 2:
            </p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold text-xs">Lv 1–19</div>
              <div class="text-[10px] text-gray-500">10% + 5%/day</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold text-xs">Lv 20–39</div>
              <div class="text-[10px] text-gray-500">15% + 5%/day</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold text-xs">Lv 40–59</div>
              <div class="text-[10px] text-gray-500">20% + 10%/day</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold text-xs">Lv 60–79</div>
              <div class="text-[10px] text-gray-500">25% + 10%/day</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold text-xs">Lv 80–99</div>
              <div class="text-[10px] text-gray-500">25% + 15%/day</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold text-xs">Lv 100+</div>
              <div class="text-[10px] text-gray-500">30% + 20%/day</div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Example at Lv 1–19: Day 1 = 10%, Day 2 = 15%, Day 3 = 20%, Day 4 = 25%.
            Cumulative by day 3 = 45%.</p>
          <p class="mt-2">
            <span class="text-white font-bold">First-hit penalty:</span> The first decay penalty applies at the
            <span class="text-astral-glow">exact deadline time</span> you set. Escalation begins from day 2 onward.
          </p>
          <p><span class="text-white font-bold">No escape:</span> Editing is <span
              class="text-red-400 font-bold">disabled</span> while a quest is decaying. Deleting an overdue quest still
            triggers the current day's <span class="text-red-400 font-bold">decay penalty</span> and resets your streak.
          </p>
          <p>After 5 days overdue, the quest becomes <span class="text-red-400 font-bold">corrupted</span> — shown with
            a red border and maximum urgency.</p>
        </div>
      </section>

      <!-- Section: Streaks & Multipliers -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-path-abundance/10">
            <Zap class="w-5 h-5 text-path-abundance" />
          </div>
          <h2 class="text-xl font-bold text-white">Streaks & Multipliers</h2>
        </div>
        <div
          class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Your streak counts <span class="text-white font-bold">consecutive days</span> with at least one completed
            quest and <span class="text-white font-bold">no missed deadlines</span>.</p>
          <p>The streak is computed from your heatmap history — counting back from today. If today has no activity yet,
            it counts from yesterday.</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <div class="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div class="text-white font-bold">0–2 days</div>
              <div class="text-xs text-gray-500">×1.0</div>
            </div>
            <div class="bg-path-abundance/10 border border-path-abundance/20 rounded-lg p-3 text-center">
              <div class="text-path-abundance font-bold">3–4 days</div>
              <div class="text-xs text-gray-500">×1.3</div>
            </div>
            <div class="bg-path-harmony/10 border border-path-harmony/20 rounded-lg p-3 text-center">
              <div class="text-path-harmony font-bold">5–6 days</div>
              <div class="text-xs text-gray-500">×1.6</div>
            </div>
            <div class="bg-path-erudition/10 border border-path-erudition/20 rounded-lg p-3 text-center">
              <div class="text-path-erudition font-bold">7–13 days</div>
              <div class="text-xs text-gray-500">×2.0</div>
            </div>
          </div>
          <div class="mt-2 bg-path-erudition/10 border border-path-erudition/20 rounded-lg p-3 text-center">
            <div class="text-path-erudition font-bold">14+ days</div>
            <div class="text-xs text-gray-500">×2.5</div>
          </div>
          <p class="mt-2">Each day a quest remains overdue counts as a <span class="text-red-400 font-bold">separate
              miss</span> on that day. This means lingering overdue quests will <span
              class="text-red-400 font-bold">break your streak every single day</span> they stay unresolved.</p>
          <p>Any overdue quest <span class="text-red-400 font-bold">immediately resets</span> your streak to zero.</p>
        </div>
      </section>

      <!-- Section: Boss Gates -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-path-preservation/10">
            <Shield class="w-5 h-5 text-path-preservation" />
          </div>
          <h2 class="text-xl font-bold text-white">Boss Gates</h2>
        </div>
        <div
          class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Every <span class="text-white font-bold">10 levels</span> (Level 9, 19, 29, 39...), your XP is capped and a
            <span class="text-red-400 font-bold">Gatekeeper</span> appears.
          </p>
          <p>When the Boss Gate is active:</p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>XP from completing quests goes toward <span class="text-red-400 font-bold">dealing damage</span> to the
              Gatekeeper</li>
            <li>This XP is <span class="text-white font-bold">consumed</span> — it does not contribute to your next
              level</li>
            <li>A fullscreen overlay shows the boss HP bar and your progress</li>
            <li>When you've dealt enough damage, the gate <span class="text-path-abundance font-bold">automatically
                opens</span></li>
          </ul>
          <div>
            <p class="font-bold text-white mb-2">Boss HP (scales linearly):</p>
            <div class="bg-black/20 rounded-lg p-4 font-mono text-xs text-gray-300">
              Boss HP = 150 × Boss Number
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold">Boss #1</div>
              <div class="text-xs text-gray-500">150 HP (Lv 9)</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold">Boss #2</div>
              <div class="text-xs text-gray-500">300 HP (Lv 19)</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold">Boss #3</div>
              <div class="text-xs text-gray-500">450 HP (Lv 29)</div>
            </div>
            <div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-center">
              <div class="text-red-400 font-bold">Boss #4</div>
              <div class="text-xs text-gray-500">600 HP (Lv 39)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Theme Selector -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-path-erudition/10">
            <Palette class="w-5 h-5 text-path-erudition" />
          </div>
          <h2 class="text-xl font-bold text-white">Theme Selector</h2>
        </div>
        <div
          class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Tap the <span class="text-white font-bold">palette icon</span> in the dashboard header to open the Theme
            Selector.</p>
          <p>You can customize two things independently:</p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li><span class="text-white font-bold">Tower Design</span> — change your tower's visual style to any tier
              you've reached</li>
            <li><span class="text-white font-bold">Page Background</span> — apply ambient effects from any unlocked tier
              across the whole page</li>
          </ul>
          <p>Tiers you haven't reached yet appear <span class="text-gray-500 font-bold">dimmed with a lock icon</span>.
            Once unlocked, a tier stays available forever — even if you de-level.</p>
          <p>Your selections are <span class="text-astral-glow font-bold">saved automatically</span> and persist across
            sessions. Select your current tier to reset back to auto mode.</p>
        </div>
      </section>

      <!-- Section: Heatmap -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-path-harmony/10">
            <CalendarDays class="w-5 h-5 text-path-harmony" />
          </div>
          <h2 class="text-xl font-bold text-white">Consistency Heatmap</h2>
        </div>
        <div
          class="bg-astral-nebula/30 border border-white/5 rounded-xl p-6 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>The heatmap shows your activity calendar by month. Each day is color-coded:</p>
          <div class="flex flex-wrap items-center gap-4 mt-2">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-sm bg-emerald-500/50 border border-emerald-400/50"></div>
              <span class="text-xs text-gray-300">Completed quests only</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-sm bg-red-500/40 border border-red-400/50"></div>
              <span class="text-xs text-gray-300">Missed deadlines only</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-sm border border-yellow-400/50"
                style="background: linear-gradient(135deg, rgba(16,185,129,0.5) 50%, rgba(239,68,68,0.5) 50%)"></div>
              <span class="text-xs text-gray-300">Both completed & missed</span>
            </div>
          </div>
          <p class="mt-2">Click (or tap on mobile) any day to see the exact count of completed and missed quests.
            Navigate between months using the arrow buttons.</p>
        </div>
      </section>

      <!-- Bottom CTA -->
      <div class="text-center pt-4 pb-8">
        <button @click="router.push('/dashboard')"
          class="bg-astral-glow hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-all hover:scale-105 shadow-lg shadow-astral-glow/20">
          Return to Dashboard
        </button>
      </div>
    </div>
  </div>
</template>
