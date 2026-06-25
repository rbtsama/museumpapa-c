import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        price: ['"Barlow Semi Condensed"', 'Inter', 'sans-serif'],
      },
      colors: {
        // MuseumPapa warm palette (from waitlist theme.css)
        bg: '#fff1e6',
        bg2: '#ffe7d4',
        ink: '#16352a',
        'ink-soft': '#4c6357',
        'ink-faint': '#7e9488',
        brand: '#1b5740',
        'brand-2': '#1b6b49',
        'brand-soft': '#c4ddcf',
        peach: '#ffb097',
        'peach-soft': '#ffd7a4',
        edge: 'rgba(27,87,64,.12)',
      },
      boxShadow: {
        card: '0 10px 26px -18px rgba(120,80,40,.28)',
        float: '0 18px 44px -16px rgba(120,80,40,.4)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: '#1b5740', foreground: '#fbfffc' },
            focus: '#1b5740',
          },
        },
      },
    }),
  ],
};
