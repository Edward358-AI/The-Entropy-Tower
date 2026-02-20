/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'desk': '950px',
      },
      colors: {
        astral: {
          void: '#050510',    // Deep background
          nebula: '#1a1a2e',  // Card background
          cosmic: '#16213e',  // Panel background
          glow: '#e94560',    // Accent/active
          star: '#f1f1f1',    // Text/Icons
        },
        path: {
          erudition: '#ffd700',    // Gold
          hunt: '#ff6b35',         // Orange
          harmony: '#4ecdc4',      // Teal
          preservation: '#a78bfa', // Purple
          abundance: '#10b981',    // Green
          nihility: '#6b7280',     // Gray
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
