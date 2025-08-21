/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#000000',
        accent: '#d1d1d1',
      },
      fontFamily: {
        sans: ['"Orbitron"', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        southside: {
          primary: '#d1d1d1',
          'base-100': '#000000',
          'base-content': '#d1d1d1',
        },
      },
    ],
    darkTheme: 'southside',
  },
};
