import { Avatar, Menu, List, Typography, Badge } from 'antd';
import type { MenuProps } from 'antd';
import React from 'react';
import { ClockCircleOutlined, MessageOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const modules = [
  { key: 'ai_chat', label: 'AI对话', icon: '🤖' },
  { key: 'academic_chat', label: '学术对话', icon: '🎓' },
  { key: 'paper_qa', label: '论文问答', icon: '❓' },
  { key: 'paper_write', label: '论文写作', icon: '✍️' },
  { key: 'paper_translate', label: '论文翻译', icon: '🌐' },
];

// 历史记录接口
interface HistoryRecord {
  id: string;
  module: string;
  title: string;
  messages: any[];
  timestamp: number;
  model: string;
  isStreaming?: boolean;
  streamingText?: string;
}

interface SidebarProps {
  onSelectModule: (key: string) => void;
  currentModule: string;
  historyRecords: HistoryRecord[];
  onHistorySelect: (historyId: string) => void;
  currentHistoryId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onSelectModule, 
  currentModule, 
  historyRecords, 
  onHistorySelect, 
  currentHistoryId 
}) => {
  const handleClick: MenuProps['onClick'] = (e) => {
    onSelectModule(e.key);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  const getModuleIcon = (moduleKey: string) => {
    return modules.find(m => m.key === moduleKey)?.icon || '💬';
  };

  // 获取显示标题，如果正在流式回复则显示实时内容
  const getDisplayTitle = (record: HistoryRecord) => {
    if (record.isStreaming && record.streamingText) {
      const streamingPreview = record.streamingText.substring(0, 20);
      return `${record.title} (正在回复: ${streamingPreview}...)`;
    }
    return record.title;
  };

  return (
    <div className="sidebar w-64 h-screen bg-white border-r flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Avatar size={40} src={null} />
        <span className="ml-2 font-bold text-lg">学术GPT</span>
      </div>
      
      {/* 模块菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[currentModule]}
        style={{ borderRight: 0, flex: 'none' }}
        items={modules.map(module => ({
          key: module.key,
          label: (
            <div className="flex items-center">
              <span className="mr-2">{module.icon}</span>
              {module.label}
            </div>
          ),
        }))}
        onClick={handleClick}
      />
      
      {/* 历史记录区域 */}
      <div className="flex-1 overflow-auto p-2 border-t">
        <div className="font-semibold text-xs text-gray-500 mb-3 flex items-center">
          <ClockCircleOutlined className="mr-1" />
          历史对话
        </div>
        
        {historyRecords.length === 0 ? (
          <div className="text-gray-400 text-center text-sm py-8">
            <MessageOutlined className="text-2xl mb-2 block" />
            暂无历史对话
          </div>
        ) : (
          <List
            size="small"
            dataSource={historyRecords}
            renderItem={(record) => (
              <List.Item
                className={`cursor-pointer rounded-lg mb-1 transition-colors ${
                  currentHistoryId === record.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                } ${record.isStreaming ? 'border-l-4 border-l-green-400' : ''}`}
                onClick={() => onHistorySelect(record.id)}
                style={{ padding: '8px 12px', border: '1px solid transparent' }}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="text-xs mr-1">{getModuleIcon(record.module)}</span>
                      {record.isStreaming && (
                        <Badge 
                          dot 
                          color="green" 
                          className="mr-1"
                          title="正在回复"
                        />
                      )}
                    </div>
                    <Text className="text-xs text-gray-400">{formatTime(record.timestamp)}</Text>
                  </div>
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {getDisplayTitle(record)}
                  </div>
                  {record.isStreaming && (
                    <div className="text-xs text-green-600 mt-1 flex items-center">
                      <LoadingOutlined className="mr-1" />
                      正在回复中...
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar; 