import { Avatar, Menu, List, Typography, Badge, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState, useEffect } from 'react';
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from '../Com'
import {
  ClockCircleOutlined,
  MessageOutlined,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  MessageOutlined as ChatIcon,
  AppstoreOutlined,
  ApiOutlined,
  SettingOutlined,
  RobotOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  EditOutlined,
  TranslationOutlined,
  ToolOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  PictureOutlined,
  UserOutlined,
  InfoCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// 定义四个主要导航区域
const navigationSections = [
  {
    key: 'chat',
    label: '对话',
    icon: <ChatIcon />,
    color: '#1890ff',
    items: [
      { key: 'ai_chat', label: 'AI对话', icon: <RobotOutlined /> },
      { key: 'academic_chat', label: '学术对话', icon: <BookOutlined /> },
      { key: 'paper_qa', label: '论文问答', icon: <QuestionCircleOutlined /> },
    ]
  },
  {
    key: 'basic',
    label: '基础功能区',
    icon: <AppstoreOutlined />,
    color: '#52c41a',
    items: [
      { key: 'paper_write', label: '论文写作', icon: <EditOutlined /> },
      { key: 'paper_translate', label: '论文翻译', icon: <TranslationOutlined /> },
      { key: 'document_analysis', label: '文档分析', icon: <FileTextOutlined /> },
    ]
  },
  {
    key: 'plugins',
    label: '函数插件区',
    icon: <ApiOutlined />,
    color: '#722ed1',
    items: [
      { key: 'calculator', label: '计算器', icon: <CalculatorOutlined /> },
      { key: 'image_generator', label: '图像生成', icon: <PictureOutlined /> },
      { key: 'data_analysis', label: '数据分析', icon: <ToolOutlined /> },
    ]
  },
  {
    key: 'others',
    label: '其他',
    icon: <SettingOutlined />,
    color: '#fa8c16',
    items: [
      { key: 'user_profile', label: '个人中心', icon: <UserOutlined /> },
      { key: 'help', label: '帮助文档', icon: <InfoCircleOutlined /> },
    ]
  }
];

// 历史记录接口
export interface AdvancedSessionRecord {
  id: string;
  module: string;
  title: string;
  timestamp: number;
  isStreaming?: boolean;
  streamingText?: string;
  user_com: UserInterfaceMsg;
}

interface SidebarProps {
  onSelectSessionType: (key: string) => void;
  currentSessionType: string;
  AdvancedSessionRecords: AdvancedSessionRecord[];
  onHistorySelect: (historyId: string) => void;
  currentSessionId: string | null;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onDeleteHistory?: (historyId: string) => void; // 添加删除历史记录的回调
}

const Sidebar: React.FC<SidebarProps> = ({
  onSelectSessionType,
  currentSessionType,
  AdvancedSessionRecords,
  onHistorySelect,
  currentSessionId,
  collapsed = false,
  onCollapse,
  onDeleteHistory
}) => {
  const [activeSection, setActiveSection] = useState('chat');

  // 根据当前模块自动设置活跃的导航区域
  useEffect(() => {
    const currentSection = navigationSections.find(section =>
      section.items.some(item => item.key === currentSessionType)
    );
    if (currentSection) {
      setActiveSection(currentSection.key);
    }
  }, [currentSessionType]);

  const handleClick: MenuProps['onClick'] = (e) => {
    onSelectSessionType(e.key);
    //console.log('currentSessionType:', currentSessionType);
    //console.log('e.key:', e.key);
  };

  // 处理底部导航区域切换
  const handleSectionChange = (sectionKey: string) => {
    setActiveSection(sectionKey);
    // 切换到该区域的第一个模块
    const section = navigationSections.find(s => s.key === sectionKey);
    if (section && section.items.length > 0) {
      onSelectSessionType(section.items[0].key);
    }
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
    const allItems = navigationSections.flatMap(section => section.items);
    const item = allItems.find(item => item.key === moduleKey);
    return item?.icon || <MessageOutlined />;
  };

  const getDisplayTitle = (record: AdvancedSessionRecord) => {
    if (record.isStreaming && record.streamingText) {
      const streamingPreview = record.streamingText.substring(0, 20);
      return `${record.title} (正在回复: ${streamingPreview}...)`;
    }
    return record.title;
  };

  const getCurrentSection = () => {
    return navigationSections.find(section =>
      section.items.some(item => item.key === currentSessionType)
    ) || navigationSections[0];
  };

  const currentSection = getCurrentSection();

  // 处理删除历史记录
  const handleDeleteHistory = (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发选择事件
    onDeleteHistory?.(historyId);
  };

  return (
    <div className="flex relative">
      {/* 主侧边栏 */}
      <div className={`sidebar bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${
        collapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'
      }`}>
        {/* 头部区域 */}
        <div className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <Avatar size={32} src={null} className="bg-blue-500" />
            <span className="ml-2 font-bold text-lg text-gray-800">学术GPT</span>
          </div>
        </div>

        {/* 当前区域的菜单项 */}
        <Menu
          mode="inline"
          selectedKeys={[currentSessionType]}
          style={{ borderRight: 0, flex: 'none' }}
          className="border-b border-gray-100"
          items={currentSection.items.map(item => ({
            key: item.key,
            label: (
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">{item.icon}</span>
                {item.label}
              </div>
            ),
          }))}
          onClick={handleClick}
        />

        {/* 历史记录区域 - 使用固定高度，确保底部导航固定 */}
        <div className="flex-1 overflow-auto p-2" style={{ height: 'calc(100vh - 280px)' }}>
          <div className="font-semibold text-xs text-gray-500 mb-2 flex items-center">
            <ClockCircleOutlined className="mr-1" />
            历史对话
          </div>

          {AdvancedSessionRecords.length === 0 ? (
            <div className="text-gray-400 text-center text-xs py-4">
              <MessageOutlined className="text-lg mb-1 block" />
              暂无历史对话
            </div>
          ) : (
            <List
              size="small"
              dataSource={AdvancedSessionRecords.slice(0, 8)} // 限制显示数量
              renderItem={(record) => (
                <List.Item
                  className={`group cursor-pointer rounded-md mb-1 transition-colors ${
                    currentSessionId === record.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  } ${record.isStreaming ? 'border-l-2 border-l-green-400' : ''}`}
                  onClick={() => onHistorySelect(record.id)}
                  style={{ padding: '6px 8px', border: '1px solid transparent' }}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <span className="text-xs mr-1 text-gray-500">
                          {getModuleIcon(record.module)}
                        </span>
                        {record.isStreaming && (
                          <Badge
                            dot
                            color="green"
                            className="mr-1"
                            title="正在回复"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Text className="text-xs text-gray-400">{formatTime(record.timestamp)}</Text>
                        {/* 删除按钮 - 只在非流式回复时显示 */}
                        {!record.isStreaming && (
                          <Tooltip title="删除对话">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => handleDeleteHistory(e, record.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                              style={{
                                fontSize: '10px',
                                padding: '2px 4px',
                                minWidth: 'auto',
                                height: 'auto',
                                color: '#999'
                              }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-700 truncate">
                      {getDisplayTitle(record)}
                    </div>
                    {record.isStreaming && (
                      <div className="text-xs text-green-600 mt-1 flex items-center">
                        <LoadingOutlined className="mr-1" />
                        回复中...
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* 底部导航区域切换 - 固定在底部 */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-100 bottom-nav-container bg-white">
          <div className="flex justify-center space-x-1">
            {navigationSections.map(section => (
              <Tooltip key={section.key} title={section.label} placement="top">
                <Button
                  type={activeSection === section.key ? 'primary' : 'text'}
                  size="small"
                  icon={section.icon}
                  onClick={() => handleSectionChange(section.key)}
                  className={`w-10 h-10 flex items-center justify-center bottom-nav-btn ${
                    activeSection === section.key
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: activeSection === section.key ? section.color : 'transparent',
                    borderColor: activeSection === section.key ? section.color : 'transparent'
                  }}
                />
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* 收起/展开按钮 - 使用箭头图标 */}
      <div className="flex items-center">
        <Tooltip title={collapsed ? "展开侧边栏" : "收起侧边栏"} placement="right">
          <Button
            type="text"
            icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={() => onCollapse?.(!collapsed)}
            className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 sidebar-toggle-btn"
            style={{
              borderRadius: '0 6px 6px 0',
              boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
              fontSize: '12px'
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default Sidebar;