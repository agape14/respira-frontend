/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Color principal del sistema (extraído de Figma)
        primary: {
          DEFAULT: '#752568',
          50: '#fdf4f8',
          100: '#fbe8f1',
          200: '#f8d1e4',
          300: '#f3aaca',
          400: '#ea77a8',
          500: '#dd4882',
          600: '#c92d66',
          700: '#ac1f51',
          800: '#8f1d45',
          900: '#752568', // Color principal
          950: '#5a1d4f', // Color secundario del gradiente
        },
        // Color secundario (amarillo/dorado para acentos - de Figma)
        accent: {
          DEFAULT: '#F8AD1D',
          50: '#fefce8',
          100: '#fef4cd',
          200: '#fee89b',
          300: '#fdd969',
          400: '#fcc747',
          500: '#F8AD1D', // ⭐ Color principal de Figma
          600: '#e69400',
          700: '#c07800',
          800: '#9a5e00',
          900: '#7f4d00',
          950: '#4d2e00',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #752568, #5a1d4f)',
        'gradient-primary-hover': 'linear-gradient(to right, #5a1d4f, #752568)',
      },
      boxShadow: {
        'primary': '0 10px 25px -5px rgba(117, 37, 104, 0.3)',
        'primary-lg': '0 20px 40px -10px rgba(117, 37, 104, 0.4)',
      },
    },
  },
  plugins: [],
}

