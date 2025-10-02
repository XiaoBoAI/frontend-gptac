import React from 'react'
import { Dropdown, Button } from 'antd'
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons'
import { useTheme } from '@/hooks/useTheme'
import type { MenuProps } from 'antd'

export function ThemeSwitcher() {
  const themeOptions = [
    { value: 'light', label: '亮色', icon: <SunOutlined /> },
    { value: 'dark', label: '暗色', icon: <MoonOutlined /> },
    { value: 'auto', label: '跟随系统', icon: <DesktopOutlined /> },
  ]

  const { setTheme, activeTheme } = useTheme()

  // 获取当前主题的图标
  const getCurrentIcon = () => {
    const current = themeOptions.find((item) => item.value === activeTheme)
    return current?.icon || <DesktopOutlined />
  }

  // 获取当前主题的标签
  const getCurrentLabel = () => {
    const current = themeOptions.find((item) => item.value === activeTheme)
    return current?.label || '跟随系统'
  }

  const menuItems: MenuProps['items'] = themeOptions.map((item) => ({
    key: item.value,
    label: (
      <div className="flex items-center gap-2">
        {item.icon}
        <span>{item.label}</span>
      </div>
    ),
    onClick: () => setTheme(item.value as 'auto' | 'light' | 'dark'),
  }))

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <Button
        type="text"
        icon={getCurrentIcon()}
        className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 border border-transparent hover:scale-105"
        title={`当前主题: ${getCurrentLabel()}`}
      />
    </Dropdown>
  )
}
