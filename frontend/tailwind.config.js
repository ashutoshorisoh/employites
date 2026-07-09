/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#09090b',
        darkCard: 'rgba(17, 17, 17, 0.7)',
        accentPurple: '#8b5cf6',
        accentCyan: '#06b6d4',
        accentPink: '#ec4899',
        borderGlow: 'rgba(139, 92, 246, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
