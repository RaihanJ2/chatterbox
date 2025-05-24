// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#432439", // Main background
        secondary: "#602a4b", // Sidebar and header background
        accent: "#502040", // Hover color and button backgrounds
        highlight: "#c1a57b", // Text and button highlights
        lightText: "#b09a7d", // Subtext and descriptions
      },
    },
  },
  plugins: [],
};
