/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#faf9f6',
        darkCard: 'rgba(250, 249, 246, 0.8)',
        accentPurple: '#ff6b35', // Premium Brand Orange
        accentCyan: '#e05315',   // Deep Coral Orange
        accentPink: '#ff8c5a',   // Soft Warm Orange
        borderGlow: 'rgba(255, 107, 53, 0.08)',
        zinc: {
          50: '#09090b',
          100: '#18181b',
          200: '#27272a',
          300: '#3f3f46',
          400: '#52525b',
          500: '#71717a',
          600: '#a1a1aa',
          700: '#d4d4d8',
          800: '#e4e4e7',
          850: '#f1f1f3',
          900: '#f4f4f5',
          950: '#fafafa',
        },
        gray: {
          50: '#030712',
          100: '#1f2937',
          200: '#374151',
          300: '#4b5563',
          400: '#6b7280',
          500: '#9ca3af',
          600: '#d1d5db',
          700: '#e5e7eb',
          800: '#f3f4f6',
          900: '#f9fafb',
          950: '#ffffff',
        },
        slate: {
          50: '#0f172a',
          100: '#1e293b',
          200: '#334155',
          300: '#475569',
          400: '#64748b',
          500: '#94a3b8',
          600: '#cbd5e1',
          700: '#e2e8f0',
          800: '#f1f5f9',
          900: '#f8fafc',
          950: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
