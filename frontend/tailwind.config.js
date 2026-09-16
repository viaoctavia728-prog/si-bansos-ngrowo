/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        'primary-deep': '#1B5E20',
        'primary-soft': '#E8F5E9',
        civic: '#0288D1',
        warning: '#ED6C02',
        danger: '#D32F2F',
        surface: '#F8FAF8',
        ink: '#1F2937',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        civic: '0 4px 16px rgba(31, 41, 55, 0.08)',
      },
    },
  },
  plugins: [],
};