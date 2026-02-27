/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        background: "#050509",
        surface: "#0B0B10",
        accent: {
          DEFAULT: "#22C55E",
          muted: "#16A34A"
        },
        danger: "#EF4444",
        border: "#1F2933"
      }
    }
  },
  plugins: []
};

