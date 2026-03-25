/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D2B48C',    // 主木色
          light: '#DEB887',
          dark: '#BC9F7A',
        },
        board: '#F5DEB3',        // 棋盘色
        black: '#2C2C2C',        // 黑棋
        white: '#FFFFFF',        // 白棋
        accent: '#FFD700',       // 金色强调
        success: '#10B981',      // 成功提示
        warning: '#F59E0B',      // 警告提示
        error: '#EF4444',        // 错误提示
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
