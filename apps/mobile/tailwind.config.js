/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Marca
        primary: "#7C6FCD",
        "primary-dark": "#6358B5",
        "primary-light": "#A78BFA",

        // Superfícies
        surface: "#F5F0FF",
        "surface-card": "#FFFFFF",

        // Acento
        "accent-light": "#EDE9FE",

        // Texto
        foreground: "#111827",
        "foreground-secondary": "#374151",
        muted: "#9CA3AF",
        "on-primary": "#FFFFFF",
        "on-phase": "#3D2B8A", // texto legível sobre qualquer fundo de fase

        // Borda
        border: "rgba(124,111,205,0.15)",

        // Fundos de fase (usados via style prop para valores dinâmicos)
        "phase-menstrual": "#EDE9FE",
        "phase-follicular": "#DDD6FE",
        "phase-ovulatory": "#C4B5FD",
        "phase-luteal": "#EDE9FE",

        // Feedback
        success: "#10B981",
        "success-light": "#D1FAE5",
        warning: "#F59E0B",
        "warning-light": "#FEF3C7",
        danger: "#EF4444",
        "danger-light": "#FEE2E2",
      },
    },
  },
  plugins: [],
};
