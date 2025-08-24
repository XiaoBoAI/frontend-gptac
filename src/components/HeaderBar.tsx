import React from 'react';
import { Avatar, Badge, Button, message } from 'antd';
import { ShareAltOutlined, BellOutlined } from '@ant-design/icons';
import { useAvatar } from './AvatarContext';

interface HeaderBarProps {
  username?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ username = '张某某' }) => {
  const { avatarUrl, generateNewAvatar } = useAvatar();

  const handleButtonClick = () => {
    message.info('功能正在开发中，敬请期待');
  };

  const handleAvatarClick = () => {
    generateNewAvatar();
    message.success('头像已更新');
  };

  return (
    <div className="header-bar h-14 px-3 flex items-center justify-between bg-white">
      {/* 左侧内容 */}
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold text-gray-800 mb-0 leading-tight drop-shadow-sm">与学术GPT科研</h1>
        <p className="text-xs text-gray-500 mt-0 leading-tight font-medium">内容由 AI 生成</p>
      </div>
      
      {/* 右侧内容 */}
      <div className="flex items-center space-x-1">
        {/* 分享按钮 */}
        <Button 
          type="text" 
          icon={<ShareAltOutlined className="text-gray-500 text-base" />} 
          className="flex items-center justify-center w-7 h-7 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-all duration-200 border border-transparent hover:border-blue-200 hover:scale-105"
          onClick={handleButtonClick}
        />
        
        {/* 通知按钮 */}
        <Badge dot color="#3b82f6" size="small" offset={[-2, 2]}>
          <Button 
            type="text" 
            icon={<BellOutlined className="text-gray-500 text-base" />} 
            className="flex items-center justify-center w-7 h-7 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-all duration-200 border border-transparent hover:border-orange-200 hover:scale-105"
            onClick={handleButtonClick}
          />
        </Badge>
        
        {/* 用户头像 */}
        <Avatar 
          size={26} 
          src={avatarUrl}
          className="cursor-pointer border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-100 hover:scale-105 ml-1"
          onClick={handleAvatarClick}
        />
      </div>
    </div>
  );
};

export default HeaderBar;