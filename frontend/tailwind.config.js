/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        secondary: '#1565C0',
        'primary-soft': '#EAF5EB',
        'secondary-soft': '#EAF3FF',
        'bg-light': '#F8F9FA',
        'bg-soft': '#F8F9FF',
        'text-dark': '#212529',
        success: '#28A745',
        danger: '#DC3545',
        surface: '#F8F9FA',
        ink: '#212529',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        civic: '0 4px 16px rgba(21, 101, 192, 0.08)',
      },
    },
  },
  plugins: [],
};