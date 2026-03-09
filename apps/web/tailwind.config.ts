import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a14',
          card: '#13131f',
          elevated: '#1a1a2e',
          border: 'rgba(255,255,255,0.08)',
        },
        accent: {
          DEFAULT: '#a855f7',
          glow: '#c084fc',
          dim: '#7c3aed',
        },
        brand: {
          DEFAULT: '#a855f7',
          secondary: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-sm': '0 0 10px rgba(168, 85, 247, 0.2)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'gradient-surface':
          'linear-gradient(180deg, #13131f 0%, #0a0a14 100%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(236,72,153,0.05) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
