/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'Cinzel', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'monospace'],
      },
      colors: {
        // Mockup primary signature accent: Electric Chartreuse / Lime
        lime: {
          DEFAULT: '#a3e635',
          hover: '#92d825',
          light: '#ecfccb',
          dim: '#84cc16',
          dark: '#1c2e05',
        },
        // Warm tactile paper / bone canvas ground
        parchment: {
          canvas: '#f4efe6',
          surface: '#ffffff',
          subtle: '#faf7f2',
          card: '#fcfbfa',
          border: '#e4ddd3',
          borderSubtle: '#eee7de',
          hover: '#ede6db',
          muted: '#736d64',
        },
        // Dark cosmic stone / void slate
        void: {
          DEFAULT: '#0c0e12',
          surface: '#12161c',
          card: '#161a22',
          border: '#232934',
          muted: '#8b949e',
        },
        // Semantic badges from the 12-screen board
        badge: {
          highBg: '#fee2e2',
          highText: '#b91c1c',
          highBorder: '#fca5a5',
          mediumBg: '#ffedd5',
          mediumText: '#c2410c',
          mediumBorder: '#fed7aa',
          lowBg: '#fef3c7',
          lowText: '#b45309',
          lowBorder: '#fde68a',
          activeBg: '#dcfce7',
          activeText: '#15803d',
          activeBorder: '#86efac',
          reviewBg: '#ffe4e6',
          reviewText: '#be123c',
          reviewBorder: '#fecdd3',
          analysisBg: '#e0f2fe',
          analysisText: '#0369a1',
          analysisBorder: '#bae6fd',
        },
        ink: {
          DEFAULT: '#12161c',
          subtle: '#4b5563',
          muted: '#6b7280',
          faint: '#9ca3af',
        },
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(40, 30, 20, 0.04), 0 1px 2px -1px rgba(40, 30, 20, 0.03)',
        card: '0 2px 6px -1px rgba(40, 30, 20, 0.05), 0 1px 3px -1px rgba(40, 30, 20, 0.03)',
        float: '0 10px 25px -5px rgba(20, 24, 33, 0.12), 0 8px 10px -6px rgba(20, 24, 33, 0.08)',
        limeGlow: '0 0 15px -2px rgba(163, 230, 53, 0.35)',
      },
    },
  },
  plugins: [],
}
