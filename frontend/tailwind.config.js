/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/components/AdminLayout.jsx",
    "./src/pages/admin/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
