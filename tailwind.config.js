/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "tcr-dark": "#001c23",
        "tcr-teal": "#008ba3",
        "tcr-purple": "#802d7d",
        "tcr-red": "#e31b5d",
        "tcr-bg": "#f3f7f8",
        "tcr-border": "#e2e8f0",
        "tcr-text-muted": "#64748b",
        "tcr-hero-tint": "#e8f4f7",
      },
      fontFamily: {
        manrope: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
