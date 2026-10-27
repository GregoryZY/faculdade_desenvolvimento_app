/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#1C1E1B",
          soft: "#3A3D38",
        },
        paper: {
          DEFAULT: "#FAFAF8",
          dim: "#F1F0EA",
        },
        pine: {
          50: "#EAF3F0",
          100: "#CDE4DC",
          300: "#6FA895",
          500: "#0F5B52",
          600: "#0C4A43",
          700: "#093A35",
        },
        amber: {
          100: "#FBEACB",
          400: "#E8A33D",
          600: "#B87A1F",
        },
        clay: {
          100: "#F6DED4",
          500: "#C4432B",
          600: "#9E3220",
        },
        slate: {
          100: "#EDEEEC",
          300: "#C7CAC5",
          500: "#6B7280",
          700: "#454842",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,30,27,0.06), 0 1px 1px rgba(28,30,27,0.04)",
        pop: "0 12px 32px rgba(28,30,27,0.18)",
      },
      borderRadius: {
        xs: "4px",
        card: "10px",
        panel: "16px",
      },
    },
  },
  plugins: [],
};
