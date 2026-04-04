/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4A843',
        'gold-light': '#F2D06B',
        'gold-dark': '#A67C2E',
        silver: '#C0C0C0',
        'silver-light': '#E8E8E8',
        platinum: '#7A7A8E',
        'platinum-dark': '#4A4A5A',
        'bg-deep': '#0A0A0F',
        'bg-card': '#111118',
        'bg-card-hover': '#16161F',
        'neon-white': '#F0F0FF',
        'text-muted': '#8888A0',
        'metallic-grey': '#2A2A38',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'orb-float': 'orbFloat 20s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'fade-up': 'fadeUp 1s ease-out both',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-dot': 'pulse 2s ease-in-out infinite',
        'scroll-pulse': 'scrollPulse 2s ease-in-out infinite',
      },
      keyframes: {
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(60px, -40px) scale(1.1)' },
          '50%': { transform: 'translate(-30px, 60px) scale(0.95)' },
          '75%': { transform: 'translate(40px, 30px) scale(1.05)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3', transform: 'scaleX(0.8)' },
          '50%': { opacity: '1', transform: 'scaleX(1)' },
        },
        scrollPulse: {
          '0%, 100%': { opacity: '1', transform: 'scaleY(1)' },
          '50%': { opacity: '0.3', transform: 'scaleY(0.6)' },
        },
      },
    },
  },
  plugins: [],
}
