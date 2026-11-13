/** @type {import('tailwindcss').Config} */
export default {
  // content указывает Tailwind, в каких файлах искать классы.
  // Если файла нет в этом списке — стили для него НЕ скомпилируются!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Задаем фирменную палитру Белинвестбанка
        bank: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669', // Основной корпоративный изумрудный
          700: '#047857',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}