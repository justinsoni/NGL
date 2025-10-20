export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./api/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'theme-primary': '#578E7E',
        'theme-primary-dark': '#417062',
        'theme-accent': '#123458',
        'theme-dark': '#030303',
        'theme-text-secondary': '#6b7280',
        'theme-light': '#F1EFEC',
        'theme-page-bg': '#ffffff',
        'theme-secondary-bg': '#f9fafb',
        'theme-border': '#e5e7eb',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    }
  },
  plugins: [],
}
