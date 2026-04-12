/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Identidad MimiPlay (logo: negro / blanco) — UI base */
        mimi: {
          black: "#000000",
          void: "#0a0a0a",
          surface: "#121212",
          elevated: "#1a1a1a",
          muted: "#a3a3a3",
          subtle: "#737373",
        },
        "tcr-dark": "#001c23",
        "tcr-teal": "#008ba3",
        "tcr-purple": "#802d7d",
        "tcr-red": "#e31b5d",
        "tcr-bg": "#f3f7f8",
        "tcr-border": "#e2e8f0",
        "tcr-text-muted": "#64748b",
        "tcr-hero-tint": "#e8f4f7",
      },
      borderRadius: {
        mimi: "10px",
      },
      fontFamily: {
        manrope: ["Manrope", "system-ui", "sans-serif"],
      },
      keyframes: {
        "mimi-marquee": {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(-50%, 0, 0)" },
        },
      },
      animation: {
        "mimi-marquee": "mimi-marquee 52s linear infinite",
      },
    },
  },
  plugins: [],
};
