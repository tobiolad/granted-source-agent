/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#08080a",
        surface: "#111113",
        surface2: "#15151a",
        border: "#1f1f24",
        accent: {
          DEFAULT: "#8b5cf6",
          soft: "#a78bfa",
          dim: "#2a1f45"
        },
        ink: {
          primary: "#f4f4f6",
          secondary: "#a1a1aa",
          muted: "#6b6b74"
        },
        signal: {
          high: "#34d399",
          medium: "#fbbf24",
          low: "#f87171",
          info: "#60a5fa"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl: "14px"
      }
    }
  },
  plugins: []
};
