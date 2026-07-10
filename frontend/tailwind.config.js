/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#08080a',
        darkCard: 'rgba(13, 13, 16, 0.7)',
        accentPurple: '#f97316', // Aesthetic Orange
        accentCyan: '#e05315',   // Dark Orange
        accentPink: '#ea580c',   // Warm Coral Orange
        borderGlow: 'rgba(249, 115, 22, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
