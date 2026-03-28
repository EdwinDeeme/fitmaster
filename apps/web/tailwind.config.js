/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      padding: {
        'safe': 'env(safe-area-inset-bottom, 1.5rem)',
      },
      colors: {
        primary: {
          DEFAULT: '#C1EF00',
          hover: '#A8D600',
          active: '#8FB800',
        },
        dark: {
          DEFAULT: '#212121',
          light: '#6B7280',
        },
        bone: {
          DEFAULT: '#F1F2F6',
        },
        border: {
          DEFAULT: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

