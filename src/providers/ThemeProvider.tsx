import { useEffect, ReactNode } from 'react'
import { useTheme, checkOSDarkMode } from '@/hooks/useTheme'

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider ensures theme settings are applied on every page load
 * This component should be mounted at the root level of the application
 * It first detects the OS theme preference and applies it accordingly
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { activeTheme, isDark, setIsDark, setTheme } = useTheme()

  // Update DOM class when theme changes
  useEffect(() => {
    const root = document.documentElement
    
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  // Detect OS theme on mount and apply it
  useEffect(() => {
    // If theme is set to auto, detect OS preference
    if (activeTheme === 'auto') {
      const isDarkMode = checkOSDarkMode()
      setIsDark(isDarkMode)
      setTheme('auto')
    }

    // Listen for changes in OS theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Only update if theme is set to auto
      if (activeTheme === 'auto') {
        setIsDark(e.matches)
      }
    }

    // Add event listener
    mediaQuery.addEventListener('change', handleThemeChange)

    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [activeTheme, setIsDark, setTheme])

  return <>{children}</>
}
