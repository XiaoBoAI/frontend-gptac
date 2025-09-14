import React from 'react';
import { Avatar, Badge, Button, message } from 'antd';
import { ShareAltOutlined, BellOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useAvatar } from './AvatarContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderBarProps {
  username?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ username = '张某某' }) => {
  const { avatarUrl, generateNewAvatar } = useAvatar();
  const { theme, toggleTheme } = useTheme();

  const handleButtonClick = () => {
    message.info('功能正在开发中，敬请期待');
  };

  const handleAvatarClick = () => {
    generateNewAvatar();
    message.success('头像已更新');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    message.success(`已切换到${theme === 'light' ? '暗色' : '亮色'}主题`);
  };

  return (
    <div className={`header-bar h-14 px-3 flex items-center justify-between border-b ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* 左侧内容 */}
      <div className="flex flex-col">
        <h1 className={`text-sm font-semibold mb-0 leading-tight drop-shadow-sm ${
          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        }`}>与学术GPT科研</h1>
        <p className={`text-xs mt-0 leading-tight font-medium ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>内容由 AI 生成</p>
      </div>
      
      {/* 右侧内容 */}
      <div className="flex items-center space-x-1">
        {/* 主题切换按钮 */}
        <Button 
          type="text" 
          icon={theme === 'light' ? <MoonOutlined className="text-base" /> : <SunOutlined className="text-base" />} 
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 border border-transparent hover:scale-105 ${
            theme === 'dark'
              ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400 hover:border-gray-600'
              : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
          }`}
          onClick={handleThemeToggle}
          title={theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'}
        />
        
        {/* 分享按钮 */}
        <Button 
          type="text" 
          icon={<ShareAltOutlined className="text-base" />} 
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 border border-transparent hover:scale-105 ${
            theme === 'dark'
              ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400 hover:border-gray-600'
              : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
          }`}
          onClick={handleButtonClick}
        />
        
        {/* 通知按钮 */}
        <Badge dot color="#3b82f6" size="small" offset={[-2, 2]}>
          <Button 
            type="text" 
            icon={<BellOutlined className="text-base" />} 
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 border border-transparent hover:scale-105 ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-700 hover:text-orange-400 hover:border-gray-600'
                : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
            }`}
            onClick={handleButtonClick}
          />
        </Badge>
        
        {/* 用户头像 */}
        <Avatar 
          size={26} 
          src={avatarUrl}
          className={`cursor-pointer border-2 hover:shadow-lg transition-all duration-200 shadow-sm hover:scale-105 ml-1 ${
            theme === 'dark'
              ? 'border-gray-600 hover:border-blue-500 bg-gradient-to-br from-gray-700 to-gray-600'
              : 'border-gray-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-100'
          }`}
          onClick={handleAvatarClick}
        />
      </div>
    </div>
  );
};

export default HeaderBar;