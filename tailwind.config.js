/** @type {import('tailwindcss').Config} */
module.exports = {
  // The app toggles a `.dark` class on <html> and on the app wrapper.
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
