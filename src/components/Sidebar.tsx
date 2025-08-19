import { Avatar, Menu, List, Typography, Badge, Button, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState, useEffect } from 'react';
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from '../Com'
import BasicFunctions from './BasicFunctions';
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
  DeleteOutlined,
  SaveOutlined
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
      { key: 'chat', label: 'AI对话', icon: <RobotOutlined /> },
      { key: 'academic_chat', label: '学术对话', icon: <BookOutlined /> },
      { key: 'paper_qa', label: '快速论文解读', icon: <QuestionCircleOutlined /> },
    ]
  },
  {
    key: 'basic',
    label: '基础功能区',
    icon: <AppstoreOutlined />,
    color: '#52c41a',
    items: [
      { key: 'paper_write', label: '论文写作', icon: <EditOutlined /> },
      // { key: 'paper_translate', label: '论文翻译', icon: <TranslationOutlined /> },
      // { key: 'document_analysis', label: '文档分析', icon: <FileTextOutlined /> },
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
  session_type: string;
  //messages: ChatMessage[];
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
  onSaveSession?: (historyId: string) => void; // 添加保存会话的回调
  setCurrentModule: any,
  setSpecialKwargs: any,
  specialKwargs: any,
  isStreaming?: boolean; // 是否正在流式回复
  isWaiting?: boolean; // 是否正在等待回复
}

const Sidebar: React.FC<SidebarProps> = ({
  onSelectSessionType,
  currentSessionType,
  AdvancedSessionRecords,
  onHistorySelect,
  currentSessionId,
  collapsed = false,
  onCollapse,
  onDeleteHistory,
  onSaveSession,
  setCurrentModule,
  setSpecialKwargs,
  specialKwargs,
  isStreaming = false,
  isWaiting = false,
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
    // 如果正在流式回复或等待中，阻止切换
    if (isStreaming || isWaiting) {
      message.warning('请等待模型回复结束，或提前中断当前对话');
      return;
    }
    onSelectSessionType(e.key);
    //console.log('currentSessionType:', currentSessionType);
    //console.log('e.key:', e.key);
  };

  // 处理底部导航区域切换
  const handleSectionChange = (sectionKey: string) => {
    // 如果正在流式回复或等待中，阻止切换
    if (isStreaming || isWaiting) {
      message.warning('请等待模型回复结束，或提前中断当前对话');
      return;
    }
    setActiveSection(sectionKey);
    // 只在特定条件下才自动切换模块
    // 例如：只在用户主动点击时才切换，而不是程序自动切换
    // const section = navigationSections.find(s => s.key === sectionKey);
    // if (section && section.items.length > 0) {
    //   onSelectSessionType(section.items[0].key);
    // }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}天前 ` + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
      const title = record.title.length > 10 ? record.title.substring(0, 10) + '...' : record.title;
      return `${title} (正在回复: ${streamingPreview}...)`;
    }
    return record.title.length > 10 ? record.title.substring(0, 10) + '...' : record.title;
  };

  const getCurrentSection = () => {
    // 根据 activeSection 来获取当前区域，而不是根据 currentSessionType
    return navigationSections.find(section => section.key === activeSection) || navigationSections[0];
  };

  const currentSection = getCurrentSection();

  // 处理删除历史记录
  const handleDeleteHistory = (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发选择事件
    onDeleteHistory?.(historyId);
  };

  // 处理保存会话
  const handleSaveSession = (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发选择事件
    onSaveSession?.(historyId);
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
        {activeSection === 'basic' ? (
          <BasicFunctions
            currentModule={currentSessionType}
            onSelectModule={onSelectSessionType}
            setCurrentModule={setCurrentModule}
            setSpecialKwargs={setSpecialKwargs}
            specialKwargs={specialKwargs}
            isStreaming={isStreaming}
            isWaiting={isWaiting}
          />
        ) : (
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
        )}

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
                  className={`group cursor-pointer rounded-md mb-1 transition-colors relative ${
                    currentSessionId === record.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  } ${record.isStreaming ? 'border-l-2 border-l-green-400' : ''}`}
                  onClick={() => {
                    // 如果正在流式回复或等待中，且不是当前会话，阻止切换 && currentSessionId !== record.id
                    if (isStreaming || isWaiting) {
                      message.warning('请等待模型回复结束，或提前中断当前对话');
                      return;
                    }
                    onHistorySelect(record.id);
                  }}
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
                      <Text className="text-xs text-gray-400">{formatTime(record.timestamp)}</Text>
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
                    
                    {/* 右下角按钮区域 */}
                    {!record.isStreaming && (
                      <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip title="删除对话">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDeleteHistory(e, record.id)}
                            className="hover:bg-red-50 hover:text-red-500"
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              minWidth: 'auto',
                              height: 'auto',
                              color: '#999'
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="保存会话">
                          <Button
                            type="text"
                            size="small"
                            icon={<SaveOutlined />}
                            onClick={(e) => handleSaveSession(e, record.id)}
                            className="hover:bg-blue-50 hover:text-blue-500"
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              minWidth: 'auto',
                              height: 'auto',
                              color: '#999'
                            }}
                          />
                        </Tooltip>
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

      {/* 收起/展开按钮 - 美化版本 */}
      <div className="absolute top-1/2 z-10 right-0 translate-x-full transform -translate-y-1/2">
        <Tooltip title={collapsed ? "展开侧边栏" : "收起侧边栏"} placement="right">
          <div
            onClick={() => onCollapse?.(!collapsed)}
            className="w-3 h-6 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-all duration-200 sidebar-toggle-btn group"
            style={{
              borderRadius: '0 12px 12px 0',
              boxShadow: '1px 0 3px rgba(0,0,0,0.04)',
              border: '1px solid #e5e7eb',
              borderLeft: 'none',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              marginLeft: '-1px'
            }}
          >
                      <div className="flex flex-col items-center">
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full mb-0.5 group-hover:bg-blue-500 transition-all duration-300 group-hover:w-1"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full mb-0.5 group-hover:bg-blue-500 transition-all duration-300 group-hover:w-1"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-all duration-300 group-hover:w-1"></div>
          </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default Sidebar;