/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#111111',
        light: '#f3f4f6',
      },
      fontFamily: {
  sans: ['"Exo 2"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        southside: {
          primary: '#111111',
          secondary: '#f3f4f6',
          accent: '#111111',
          'base-100': '#ffffff',
          'base-content': '#111111',
        },
      },
    ],
    darkTheme: 'southside',
  },
};
