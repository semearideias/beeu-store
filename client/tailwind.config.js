/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f9b233',
        dark: '#161616',
        light: '#f5f5f5'
      }
    }
  },
  plugins: []
}
