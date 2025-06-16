/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        background: '#191E29',
        'background-secondary': '#132D46',
        'card-dark': '#1E2328',
        'card-light': '#2A2D32',
        
        // Primary colors
        primary: '#01D38D',
        'primary-dark': '#00B577',
        'primary-light': '#33E0A6',
        
        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#696E79',
        'text-muted': '#4A4D52',
        
        // Accent colors
        accent: '#01D38D',
        warning: '#FFB800',
        error: '#FF4757',
        success: '#2ED573',
        
        // Glass effect colors
        'glass-dark': 'rgba(255, 255, 255, 0.1)',
        'glass-light': 'rgba(255, 255, 255, 0.2)',
      },
      fontFamily: {
        'display': ['Inter-Bold'],
        'body': ['Inter-Regular'],
        'mono': ['Inter-Medium'],
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0,-10px,0)' },
          '70%': { transform: 'translate3d(0,-5px,0)' },
          '90%': { transform: 'translate3d(0,-2px,0)' },
        },
      },
    },
  },
  plugins: [],
} 