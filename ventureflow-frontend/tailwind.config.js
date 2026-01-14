import plugin from "tailwindcss/plugin";
import scrollbarPlugin from "tailwind-scrollbar";
import lineClampPlugin from "@tailwindcss/line-clamp";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['"IBM Plex Sans"', "sans-serif"], // Overriding poppins to IBM Plex Sans as user requested all fonts change
        sans: ['"IBM Plex Sans"', "sans-serif"],
        sf: ["SF Pro Display", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [
    scrollbarPlugin({ nocompatible: true }),
    lineClampPlugin,
    plugin(function ({ addComponents, theme }) {
      addComponents({
        ".custom-scrollbar": {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme("colors.gray.200", "#E5E7EB"),
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.gray.500", "#888"),
            borderRadius: "10px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: theme("colors.gray.700", "#555"),
          },
        },
      });
    }),
  ],
};