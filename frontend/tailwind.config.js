import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,jsx}'),
  ],
  theme: {
    extend: {
      colors: {
        codenap: {
          canvas: '#F1F5F9',
          surface: '#FFFFFF',
          subtle: '#F8FAFC',
          navy: '#1E3A5F',
          steel: '#2B4C7E',
          steelHover: '#233F69',
          tint: '#EEF2F6',
          tintStrong: '#E2E8F0',
          border: '#E2E8F0',
          borderStrong: '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        flat: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        receipt: '0 1px 3px 0 rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
