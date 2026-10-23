/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: { fontFamily: { sans: ["Poppins", "sans-serif"] }, colors: { roomo: { navy: "#183B56", blue: "#2563A6", gold: "#D6B46A", ink: "#212529" } }, borderRadius: { roomo: "8px" } } },
  plugins: []
};