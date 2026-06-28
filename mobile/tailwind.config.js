/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          light: '#FAF7F2',
          DEFAULT: '#F5ECE1', // Nude suave para fundo/detalhes
          dark: '#E1D3BF',
        },
        terracotta: {
          light: '#E58A67',
          DEFAULT: '#C0532E', // Marrom terracota rústico (cor do pão assado)
          dark: '#8D3618',
        },
        tiffany: {
          light: '#84D2D0',
          DEFAULT: '#44A09E', // Tiffany vibrante para contraste e acentos modernos
          dark: '#2C7371',
        },
        gold: {
          light: '#F8D87E',
          DEFAULT: '#E1AF31', // Dourado premium para destaques e favoritos
          dark: '#A67D16',
        }
      },
    },
  },
  plugins: [],
}
