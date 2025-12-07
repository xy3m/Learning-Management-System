/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#121212', // Main background
          800: '#1E1E1E', // Card background
          700: '#2C2C2C', // Hover state
        },
        accent: {
          500: '#6366f1', // Indigo for buttons
        }
      },
      boxShadow: {
        'glow': '0 0 15px rgba(255, 255, 255, 0.1)',
        'sharp': '5px 5px 0px 0px rgba(0,0,0,1)', // Retro shadow style
      }
    },
  },
  plugins: [],
}