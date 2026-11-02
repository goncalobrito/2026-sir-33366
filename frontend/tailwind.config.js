/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#131313',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1b1b1b',
        'surface-container': '#1f1f1f',
        'surface-container-high': '#2a2a2a',
        'on-surface': '#e2e2e2',
        'on-surface-variant': '#c4c7c8',
        outline: '#8e9192',
        'outline-variant': '#444748',
        primary: '#ffffff',
        'on-primary': '#2f3131',
      },
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: [],
};