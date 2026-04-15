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
        sans: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
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
      },
      boxShadow: {
        "rs-soft":
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px -12px rgba(0,0,0,0.45)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0px rgba(255,60,60,0)" },
          "50%": { boxShadow: "0 0 24px rgba(255,60,60,0.3)" },
        },
        "scan-sweep": {
          "0%":   { transform: "translateX(-120%) skewX(-15deg)" },
          "100%": { transform: "translateX(220%)  skewX(-15deg)" },
        },
        "alarm-pulse": {
          "0%,100%": { opacity: "0", transform: "scale(1)" },
          "50%":     { opacity: "0.6", transform: "scale(1.3)" },
        },
        "alarm-ring": {
          "0%,100%": { boxShadow: "0 0 0px 0px rgba(255,60,60,0)" },
          "50%":     { boxShadow: "0 0 60px 20px rgba(255,60,60,0.15)" },
        },
        "border-gradient-spin": {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "notif-in": {
          "0%":   { opacity: "0", transform: "translateX(-24px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "stat-pop": {
          "0%":   { transform: "scale(0.85)", opacity: "0" },
          "60%":  { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        "float-y": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        "cursor-blink": {
          "0%,49%":   { opacity: "1" },
          "50%,100%": { opacity: "0" },
        },
      },
      animation: {
        "glow-pulse":     "glow-pulse 2s ease-in-out infinite",
        "scan-sweep":     "scan-sweep 0.65s ease-out forwards",
        "alarm-pulse":    "alarm-pulse 2s ease-in-out infinite",
        "alarm-ring":     "alarm-ring 2s ease-in-out infinite",
        "border-spin":    "border-gradient-spin 4s ease infinite",
        "notif-in":       "notif-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "stat-pop":       "stat-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "float-y":        "float-y 4s ease-in-out infinite",
        "cursor-blink":   "cursor-blink 1s step-end infinite",
      },
    }
  },
  plugins: []
};