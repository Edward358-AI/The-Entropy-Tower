import { ref, computed, onUnmounted } from 'vue'

/**
 * Global reactive time source.
 *
 * Provides a `now` ref that ticks every 60 seconds, a `todayStr` computed
 * (YYYY-MM-DD), and a `onDayChange` callback hook that fires exactly once
 * when the local date rolls over (i.e. midnight).
 *
 * Usage:
 *   const { now, todayStr, onDayChange } = useTime()
 *   onDayChange(() => { console.log('New day!') })
 */

// Singleton state — shared across all components that call useTime()
let _now = null
let _intervalId = null
let _listeners = []
let _lastDateStr = null

function _formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function _ensureTimer() {
  if (_now) return // Already initialized

  _now = ref(new Date())
  _lastDateStr = _formatDate(_now.value)

  // Tick every 60 seconds
  _intervalId = setInterval(() => {
    _now.value = new Date()

    // Check if the date rolled over
    const newDateStr = _formatDate(_now.value)
    if (newDateStr !== _lastDateStr) {
      _lastDateStr = newDateStr
      // Fire all registered day-change listeners
      for (const cb of _listeners) {
        try { cb(newDateStr) } catch (e) { console.error('Day change listener error:', e) }
      }
    }
  }, 60_000) // every minute
}

export function useTime() {
  _ensureTimer()

  const todayStr = computed(() => _formatDate(_now.value))

  /**
   * Register a callback that fires when the local date changes (midnight rollover).
   * Automatically cleaned up when the component unmounts.
   */
  const onDayChange = (callback) => {
    _listeners.push(callback)

    // Auto-cleanup when component unmounts
    onUnmounted(() => {
      const idx = _listeners.indexOf(callback)
      if (idx !== -1) _listeners.splice(idx, 1)
    })
  }

  return {
    now: _now,
    todayStr,
    onDayChange,
  }
}
