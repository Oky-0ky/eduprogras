/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pastel: {
          blue: '#38BDF8',
          lightblue: '#E0F2FE',
          darkblue: '#0284C7',
          mint: '#34D399',
          lightmint: '#D1FAE5',
          darkmint: '#059669',
          yellow: '#FBBF24',
          lightyellow: '#FEF3C7',
          darkyellow: '#D97706',
          purple: '#A78BFA',
          lightpurple: '#EDE9FE',
          darkpurple: '#7C3AED',
          pink: '#F472B6',
          lightpink: '#FCE7F3',
          darkpink: '#DB2777',
          cream: '#FFFBEB',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },
      // Tambahan untuk mobile optimization
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
