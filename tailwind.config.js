/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      padding: {
        'max': 'max(24px, calc((100% - 1200px) / 2))',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}
