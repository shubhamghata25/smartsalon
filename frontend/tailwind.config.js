/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#C9A84C", light: "#E8C96A", dark: "#A07A30" },
        cream: "#F5F0E8",
        charcoal: "#1A1A1A",
        "dark-brown": "#2C1810",
        "mid-brown": "#5C3D2E",
        muted: "#9B8B7A",
        accent: "#8B4513",
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "serif"],
        playfair: ["var(--font-playfair)", "serif"],
        lora: ["var(--font-lora)", "serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        shimmer: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
};
