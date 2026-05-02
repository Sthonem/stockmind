import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bg: {
          base:  '#080C14',
          card:  '#0E1420',
          card2: '#141C2B',
          hover: '#1A2333',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          bright:  'rgba(255,255,255,0.12)',
        },
        text: {
          primary:   '#F0F4FF',
          secondary: '#8B96B0',
          dim:       '#4A5568',
        },
        green:  '#22c55e',
        red:    '#f43f5e',
        yellow: '#f59e0b',
        blue:   '#3b82f6',
        purple: '#a78bfa',
        cyan:   '#06b6d4',
      },
    },
  },
  plugins: [],
};
export default config;
