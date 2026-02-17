/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f9f6',
          100: '#daf1e8',
          200: '#b8e3d3',
          300: '#89ceb5',
          400: '#58b394',
          500: '#36987a',
          600: '#287a63',
          700: '#226251',
          800: '#1e4f42',
          900: '#1c4238',
        },
        slate: {
          850: '#172033',
          950: '#0c1222',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
