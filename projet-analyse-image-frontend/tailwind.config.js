const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // Enable class-based dark mode
  safelist: [
    // Status classes to prevent purging since they're dynamically generated
    'status-Preparing',
    'status-Active', 
    'status-Completed',
    'status-On-Hold',
    'status-Review',
    'status-Cancelled',
    // Legacy status classes for backward compatibility
    'status-Intake',
    'status-In-Progress',
    'status-Waiting',
    'status-Pending',
    'status-Planning',
    'status-Archived',
    'status-badge',
    // Badge variants
    { pattern: /status-(Preparing|Active|Completed|On-Hold|Review|Cancelled|Intake|In-Progress|Waiting|Pending|Planning|Archived)/ },
    { pattern: /status-badge/ }
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors (Pandora Daytime)
        'silver': { 
          DEFAULT: '#FAF4F0', 
          100: '#272a2e', 
          200: '#4d555c', 
          300: '#747f8a', 
          400: '#a2a9b1', 
          500: '#FAF4F0', 
          600: '#d9dcdf', 
          700: '#e3e5e7', 
          800: '#eceeef', 
          900: '#f6f6f7' 
        },
        
        // Dark theme colors (Pandora Nighttime - Bioluminescent)
        'night': {
          DEFAULT: '#0A1225', 
          100: '#E1FFFF',  // Bright cyan text
          200: '#B8E6FF',  // Light cyan
          300: '#7DD3FC',  // Medium cyan
          400: '#45A5B8',  // Deep cyan
          500: '#394867',  // Muted blue
          600: '#2A3655',  // Dark blue
          700: '#1E2A44',  // Deeper blue
          800: '#141B32',  // Very dark blue
          900: '#0A1225'   // Darkest blue-black
        },
        'bioluminescent': {
          DEFAULT: '#05D59F',
          100: '#F0FDFA',  // Very light emerald
          200: '#CCFBF1',  // Light emerald
          300: '#99F6E4',  // Medium emerald
          400: '#5EEAD4',  // Bright emerald
          500: '#05D59F',  // Core bioluminescent green
          600: '#059669',  // Darker emerald
          700: '#047857',  // Deep emerald
          800: '#065F46',  // Very deep emerald
          900: '#064E3B',  // Darkest emerald
          'cyan': '#00F7FF' // Bright bioluminescent cyan for highlighting
        },
        'purple': {
          DEFAULT: '#9B4F96',
          100: '#FAF5FF',  // Very light purple
          200: '#E9D5FF',  // Light purple
          300: '#C4B5FD',  // Medium purple
          400: '#A78BFA',  // Bright purple
          500: '#9B4F96',  // Core bioluminescent purple
          600: '#7C3AED',  // Darker purple
          700: '#6D28D9',  // Deep purple
          800: '#5B21B6',  // Very deep purple
          900: '#4C1D95'   // Darkest purple
        },
        'indigo': { 
          DEFAULT: '#144B7B', 
          100: '#040f19', 
          200: '#081e31', 
          300: '#0c2d4a', 
          400: '#103c62', 
          500: '#144b7b', 
          600: '#1e71ba', 
          700: '#4296e0', 
          800: '#81b9ea', 
          900: '#c0dcf5' 
        },
        'cyan': { 
          DEFAULT: '#499BA0', 
          100: '#0f1f20', 
          200: '#1e3f40', 
          300: '#2c5e60', 
          400: '#3b7d81', 
          500: '#499ba0', 
          600: '#68b6ba', 
          700: '#8ec8cb', 
          800: '#b4dadc', 
          900: '#d9edee' 
        },
        'forest': { 
          DEFAULT: '#134734', 
          100: '#040f0b', 
          200: '#081d15', 
          300: '#0c2c20', 
          400: '#0f3a2a', 
          500: '#134734', 
          600: '#258b65', 
          700: '#39ca95', 
          800: '#7bdcb8', 
          900: '#bdeddc' 
        },

        // Semantic color mapping - Light and Dark variants
        'primary': {
          light: '#499BA0',    // cyan-500
          DEFAULT: '#499BA0',  // cyan-500
          dark: '#3b7d81',     // cyan-400
        },
        'background': {
          light: '#f6f6f7',    // silver-900 (light mode)
          DEFAULT: '#f6f6f7',  // silver-900 (light mode)
          dark: '#0A1225',     // night-900 (dark mode)
        },
        'surface': {
          light: '#ffffff',    // light mode cards
          DEFAULT: '#ffffff',  // light mode cards
          dark: '#141B32',     // night-800 (dark mode cards)
        },
        'border': {
          light: '#e3e5e7',    // silver-700 (light mode)
          DEFAULT: '#e3e5e7',  // silver-700 (light mode) 
          dark: '#2A3655',     // night-600 (dark mode)
        },
        'text': {
          light: '#272a2e',    // silver-100 (light mode)
          DEFAULT: '#272a2e',  // silver-100 (light mode)
          muted: '#a2a9b1',    // silver-400 (light mode)
          inverted: '#ffffff', 
          dark: '#E1FFFF',     // night-100 (dark mode primary text)
          'dark-muted': '#B8E6FF', // night-200 (dark mode muted text)
        },
        
        // Status colors - Both light and dark variants
        'success': {
          light: '#7bdcb8',    // forest-800
          DEFAULT: '#39ca95',  // forest-700
          dark: '#05D59F',     // bioluminescent-500
        },
        'warning': {
          light: '#f0b898',    // warning light
          DEFAULT: '#f97316',  // warning
          dark: '#FBBF24',     // amber for dark mode
        },
        'error': {
          light: '#fca5a5',    // error light
          DEFAULT: '#ef4444',  // error
          dark: '#F87171',     // red for dark mode
        },
        'info': {
          light: '#81b9ea',    // indigo-800
          DEFAULT: '#4296e0',  // indigo-700
          dark: '#45A5B8',     // night-400 cyan
        }
      },
      fontFamily: {
        'sans': ['Roboto', ...defaultTheme.fontFamily.sans],
        'display': ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      spacing: {
        'form-input': '0.5rem 0.75rem', // Consistent form input padding
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
      boxShadow: {
        'none': 'none',
        'sm': 'none',
        'DEFAULT': 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
        '2xl': 'none',
        'inner': 'none',
        'card': 'none',
        'card-hover': 'none',
        'card-active': 'none',
      },
      maxWidth: {
        'project-details': '1000px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
