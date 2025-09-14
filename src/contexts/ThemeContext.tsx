import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 主题类型定义
export type Theme = 'light' | 'dark';

// 主题上下文接口
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题Provider组件
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 从localStorage读取保存的主题，默认为light
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme || 'light';
  });

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  // 设置主题
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  // 监听主题变化，更新document的class
  useEffect(() => {
    const root = document.documentElement;
    
    // 移除之前的主题类
    root.classList.remove('light-theme', 'dark-theme', 'dark');
    
    // 添加新的主题类
    root.classList.add(`${theme}-theme`);
    
    // 为Tailwind CSS添加dark类
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    
    // 设置data属性，方便CSS使用
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义hook，用于在组件中使用主题
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
