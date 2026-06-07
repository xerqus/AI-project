/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#f1f5f9',
          card: '#ffffff',
          primary: 'var(--brand-primary, #2563eb)', // vibrant brand blue
          accent: '#dc2626', // secondary red highlights
          dark: '#1e293b', // charcoal navy headers
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
