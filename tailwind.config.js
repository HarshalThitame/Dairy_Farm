/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        devanagari: ["var(--font-noto-devanagari)", "sans-serif"]
      },
      colors: {
        sheti: "#16a34a",
        tatkal: "#dc2626",
        athavan: "#ca8a04"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.1)"
      }
    }
  },
  plugins: []
};
