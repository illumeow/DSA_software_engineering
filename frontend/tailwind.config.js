/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      keyframes: {
        'float-out': {
          '0%': { opacity: 1, transform: 'translateY(0) scale(1)' },
          '80%': { opacity: 1, transform: 'translateY(-60px) scale(1.2)' },
          '100%': { opacity: 0, transform: 'translateY(-120px) scale(0.8)' },
        }
      },
      animation: {
        'float-out': 'float-out 1.5s cubic-bezier(0.4,0,0.2,1) forwards'
      }
    },
  },
  plugins: [],
}

