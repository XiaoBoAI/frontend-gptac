/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // 启用基于类的暗色模式
  theme: {
    extend: {
      colors: {
        // 新的主题颜色系统（基于 CSS 变量）
        'app': 'var(--color-app)',
        'left-panel-fg': 'var(--color-left-panel-fg)',
        'main-view': 'var(--color-main-view)',
        'main-view-fg': 'var(--color-main-view-fg)',
        'primary': 'var(--color-primary)',
        'primary-fg': 'var(--color-primary-fg)',
        'accent': 'var(--color-accent)',
        'accent-fg': 'var(--color-accent-fg)',
        'destructive': 'var(--color-destructive)',
        'destructive-fg': 'var(--color-destructive-fg)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [require("tailwindcss-animate")],
}
