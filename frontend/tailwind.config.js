/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          sand: "#f4efe6",
          clay: "#bf7f4f",
          ink: "#1f252f",
          moss: "#4d6a57",
          coral: "#e7684f",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(18, 24, 32, 0.12)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        riseIn: "riseIn 0.7s ease-out forwards",
      },
    },
  },
  plugins: [],
};
