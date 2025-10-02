import { Avatar, Menu, List, Typography, Badge, Button, Tooltip, message, Flex, Spin } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from '../Com'
import BasicFunctions from './BasicFunctions';
import CrazyFunctions from './CrazyFunctions';
import { useTheme } from '@/hooks/useTheme';
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
  SaveOutlined,
  GlobalOutlined
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
      { key: 'crazy_functions.Internet_GPT->连接网络回答问题', label: '联网搜索并回答', icon: <GlobalOutlined /> },
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
  // {
  //   key: 'others',
  //   label: '其他',
  //   icon: <SettingOutlined />,
  //   color: '#fa8c16',
  //   items: [
  //     { key: 'user_profile', label: '个人中心', icon: <UserOutlined /> },
  //     { key: 'help', label: '帮助文档', icon: <InfoCircleOutlined /> },
  //   ]
  // }
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
  setPluginKwargs: any,
  specialKwargs: any,
  isStreaming?: boolean; // 是否正在流式回复
  isWaiting?: boolean; // 是否正在等待回复
  setMainInput: any,
  handleSendMessage: () => void;
  onFileUpload?: (options: any) => void;
}

const toast = message;

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
  setPluginKwargs,
  specialKwargs,
  isStreaming = false,
  isWaiting = false,
  setMainInput,
  handleSendMessage,
  onFileUpload,
}) => {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState('chat');
  const [splitterPosition, setSplitterPosition] = useState(65); // 分割器位置，默认65%
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';

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

  if (!currentSection) {
    return (
      <div className="w-64 h-full flex items-center justify-center bg-transparent">
        <Spin tip="加载菜单..." />
      </div>
    );
  }

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

  // 处理分割器拖拽
  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sidebarRef.current) return;
      
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newPosition = ((e.clientY - sidebarRect.top) / sidebarRect.height) * 100;
      
      // 限制分割器位置在30%到85%之间，确保上半部分有足够空间
      const clampedPosition = Math.max(30, Math.min(85, newPosition));
      setSplitterPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // 移除拖拽时的样式
      document.body.classList.remove('splitter-dragging');
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // 添加拖拽时的样式
      document.body.classList.add('splitter-dragging');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // 确保清理样式
      document.body.classList.remove('splitter-dragging');
    };
  }, [isDragging]);

  return (
    <div className="flex relative">
      {/* 主侧边栏 */}
      <div 
        ref={sidebarRef}
        className={`sidebar flex flex-col transition-all duration-300 overflow-hidden ${
          collapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'
        } ${
          isDark 
            ? 'bg-slate-800 border-r border-slate-700' 
            : 'bg-white border-r border-gray-200'
        }`}
      >
        {/* 头部区域 */}
        <div className={`flex items-center p-4 border-b ${
          isDark 
            ? 'border-slate-700 bg-gradient-to-r from-slate-700 to-slate-600' 
            : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}>
          <div className="flex items-center">
            <Avatar size={32} src={null} className={isDark ? 'bg-blue-500' : 'bg-blue-500'} />
            <span className={`ml-2 font-bold text-lg ${
              isDark ? 'text-gray-100' : 'text-gray-800'
            }`}>学术GPT</span>
          </div>
        </div>

        {/* 使用 Flex 组件实现可拖拽分割器 */}
        <Flex vertical style={{ height: 'calc(100vh - 120px)' }}>
          {/* 上半部分：当前区域的菜单项 */}
          <div style={{ height: `${splitterPosition}%`, overflow: 'hidden' }}>
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
            ) : activeSection === 'plugins' ? (
              <CrazyFunctions
                currentModule={currentSessionType}
                onSelectModule={onSelectSessionType}
                setCurrentModule={setCurrentModule}
                setSpecialKwargs={setSpecialKwargs}
                setPluginKwargs={setPluginKwargs}
                specialKwargs={specialKwargs}
                isStreaming={isStreaming}
                isWaiting={isWaiting}
                setMainInput={setMainInput}
                handleSendMessage={handleSendMessage}
                onFileUpload={onFileUpload}
              />
            ) : (
              <Menu
                mode="inline"
                selectedKeys={[currentSessionType]}
                style={{ 
                  borderRight: 0, 
                  flex: 'none',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff'
                }}
                className={`border-b ${
                  isDark ? 'border-slate-700' : 'border-gray-100'
                }`}
                theme={menuTheme}
                items={currentSection.items.map(item => ({
                  key: item.key,
                  label: (
                    <div className="flex items-center">
                      <span className={`mr-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>{item.icon}</span>
                      <span className={isDark ? 'text-gray-100' : 'text-gray-800'}>{item.label}</span>
                    </div>
                  ),
                }))}
                onClick={handleClick}
              />
            )}
          </div>

          {/* 分割器 */}
          <div
            className={`splitter-handle ${isDragging ? 'splitter-dragging' : ''}`}
            style={{ height: '4px' }}
            onMouseDown={handleSplitterMouseDown}
          />

          {/* 下半部分：历史对话 */}
          <div style={{ height: `${100 - splitterPosition}%`, overflow: 'hidden' }}>
            <div className="p-2 history-scroll-container" style={{ height: '100%', overflow: 'auto' }}>
              <div className={`font-semibold text-xs mb-2 flex items-center ${
                isDark ? 'text-gray-300' : 'text-gray-500'
              }`}>
                <ClockCircleOutlined className="mr-1" />
                历史对话
              </div>

              {AdvancedSessionRecords.length === 0 ? (
                <div className={`text-center text-xs py-4 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
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
                          ? (isDark ? 'bg-slate-700/50 border-blue-500' : 'bg-blue-50 border-blue-200')
                          : (isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50')
                      } ${record.isStreaming ? (isDark ? 'border-l-2 border-l-green-400' : 'border-l-2 border-l-green-400') : ''}`}
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
                            <span className={`text-xs mr-1 ${
                              isDark ? 'text-gray-300' : 'text-gray-500'
                            }`}>
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
                          <Text className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-400'
                          }`}>{formatTime(record.timestamp)}</Text>
                        </div>
                        <div className={`text-xs font-medium truncate ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {getDisplayTitle(record)}
                        </div>
                        {record.isStreaming && (
                          <div className={`text-xs mt-1 flex items-center ${
                            isDark ? 'text-green-400' : 'text-green-600'
                          }`}>
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
          </div>
        </Flex>

        {/* 底部导航区域切换 - 固定在底部 */}
        <div className={`absolute bottom-0 left-0 right-0 p-2 border-t bottom-nav-container ${
          isDark 
            ? 'border-slate-700 bg-slate-800' 
            : 'border-gray-100 bg-white'
        }`}>
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
                      : (isDark 
                          ? 'text-gray-300 hover:text-blue-400 hover:bg-slate-700' 
                          : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50')
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
            className={`w-3 h-6 flex items-center justify-center cursor-pointer transition-all duration-200 sidebar-toggle-btn group ${
              isDark 
                ? 'bg-slate-700 hover:bg-slate-600' 
                : 'bg-white hover:bg-gray-50'
            }`}
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
            <div className={`w-0.5 h-0.5 rounded-full mb-0.5 group-hover:bg-blue-500 transition-all duration-300 group-hover:w-1 ${
              isDark ? 'bg-gray-500' : 'bg-gray-400'
            }`}></div>
            <div className={`w-0.5 h-0.5 rounded-full mb-0.5 group-hover:bg-blue-500 transition-all duration-300 group-hover:w-1 ${
              isDark ? 'bg-gray-500' : 'bg-gray-400'
            }`}></div>
            <div className={`w-0.5 h-0.5 rounded-full group-hover:bg-blue-500 transition-all duration-300 group-hover:w-1 ${
              isDark ? 'bg-gray-500' : 'bg-gray-400'
            }`}></div>
          </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default Sidebar;

// 添加分割器相关的 CSS 样式
const splitterStyles = `
  .splitter-handle {
    position: relative;
    cursor: row-resize;
    background-color: transparent;
    transition: all 0.15s ease;
    user-select: none;
  }
  
  .splitter-handle:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  .splitter-handle:active {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  /* 添加微妙的边框提示 */
  .splitter-handle::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 2px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 1px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .splitter-handle:hover::before {
    opacity: 1;
  }
  
  /* 暗色主题下的分割器悬浮样式 */
  .dark .splitter-handle::before {
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .dark .splitter-handle:hover::before {
    background-color: rgba(255, 255, 255, 0.6);
  }
  

  
  .splitter-dragging {
    cursor: row-resize !important;
  }
  
  .splitter-dragging * {
    cursor: row-resize !important;
    user-select: none !important;
  }
  
  body.splitter-dragging {
    cursor: row-resize !important;
    user-select: none !important;
  }
  
  body.splitter-dragging * {
    cursor: row-resize !important;
    user-select: none !important;
  }
  
  /* 历史对话滚动条样式 */
  .history-scroll-container::-webkit-scrollbar {
    width: 4px;
  }
  
  .history-scroll-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .history-scroll-container::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.3);
    border-radius: 2px;
  }
  
  .history-scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.5);
  }
  
  /* 暗色模式下的滚动条 */
  .dark .history-scroll-container::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.4);
  }
  
  .dark .history-scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.6);
  }

`;

// 将样式注入到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = splitterStyles;
  document.head.appendChild(styleElement);
}