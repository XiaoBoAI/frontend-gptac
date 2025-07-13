import { Avatar, Menu } from 'antd';
import type { MenuProps } from 'antd';
import React from 'react';

const modules = [
  { key: 'ai_chat', label: 'AI对话' },
  { key: 'academic_chat', label: '学术对话' },
  { key: 'paper_qa', label: '论文问答' },
  { key: 'paper_write', label: '论文写作' },
  { key: 'paper_translate', label: '论文翻译' },
];

interface SidebarProps {
  onSelectModule: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectModule }) => {
  const handleClick: MenuProps['onClick'] = (e) => {
    onSelectModule(e.key);
  };
  return (
    <div className="sidebar w-64 h-screen bg-white border-r flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Avatar size={40} src={null} />
        <span className="ml-2 font-bold text-lg">学术GPT</span>
      </div>
      <Menu
        mode="inline"
        defaultSelectedKeys={['ai_chat']}
        style={{ borderRight: 0, flex: 1 }}
        items={modules}
        onClick={handleClick}
      />
      <div className="flex-1 overflow-auto p-2">
        <div className="font-semibold text-xs text-gray-400 mb-2">历史对话</div>
        {/* 这里可以渲染历史对话列表 */}
        <div className="text-gray-300 text-center">暂无历史</div>
      </div>
    </div>
  );
};

export default Sidebar; 