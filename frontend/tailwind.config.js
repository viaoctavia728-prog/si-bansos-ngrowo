/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#166534',
        'primary-dark': '#14532D',
        'primary-hover': '#15803D',
        secondary: '#1D4ED8',
        'primary-soft': '#F0FDF4',
        'secondary-soft': '#EFF6FF',
        'bg-light': '#F8FAFC',
        'bg-soft': '#F8F9FF',
        'text-dark': '#0F172A',
        success: '#16A34A',
        danger: '#DC2626',
        surface: '#F8FAFC',
        ink: '#0F172A',
        line: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        civic: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
        lift: '0 4px 16px rgba(22, 101, 52, 0.12)',
      },
      borderRadius: {
        civic: '0.75rem',
      },
    },
  },
  plugins: [],
};
