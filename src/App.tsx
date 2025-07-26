// 导入必要的React钩子
import { useState, useRef, useEffect } from 'react'
import { begin_contact_websocket_server } from './bridge';
import useWebSocket from './ws';
import UpdateElectron from '@/components/update'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import { UserInterfaceMsg, ChatMessage } from './Com'
import { Input, ConfigProvider, Space, Button, List, Avatar, Layout, Card, Row, Col, Dropdown, Typography, Badge, Tooltip } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  DownOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './App.css';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import MainContent from './components/MainContent';
import InputArea from './components/InputArea';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// 历史记录接口
interface HistoryRecord {
  id: string;
  module: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  model: string;
  isStreaming?: boolean; // 是否正在流式回复
  streamingText?: string; // 流式回复的临时文本
}

// 主应用组件
function App() {
  const [currentModule, setCurrentModule] = useState('ai_chat');
  const [ui_maininput, set_ui_maininput] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // 修改默认值为 'deepseek-chat'
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false); // 添加等待状态
  const currentHistoryIdRef = useRef<string | null>(null);

  // 存储每个历史记录的WebSocket连接
  const websocketConnections = useRef<Map<string, WebSocket>>(new Map());

  const MainUserComInterface = useRef<UserInterfaceMsg>({
    function: 'chat',
    main_input: '',
    llm_kwargs: {},
    plugin_kwargs: {},
    chatbot: [],
    history: [],
    system_prompt: '',
    user_request: '',
    special_kwargs: {}
  });
  const [url] = useState(import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:28000/main');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    currentHistoryIdRef.current = currentHistoryId;
  }, [currentHistoryId]);

  // 获取当前历史记录的消息
  const getCurrentMessages = (): ChatMessage[] => {
    if (!currentHistoryId) return [];
    const record = historyRecords.find(r => r.id === currentHistoryId);
    if (!record) return [];

    // 如果有流式回复，添加临时消息
    if (record.isStreaming && record.streamingText) {
      return [...record.messages, { sender: 'bot', text: record.streamingText }];
    }

    return record.messages;
  };

  useEffect(() => {
    (messagesEndRef.current as unknown as HTMLDivElement)?.scrollIntoView({ behavior: "smooth" });
  }, [getCurrentMessages()]);

  // 组件卸载时清理WebSocket连接
  useEffect(() => {
    return () => {
      websocketConnections.current.forEach((ws, historyId) => {
        console.log('Cleaning up WebSocket connection for history:', historyId);
        ws.close();
      });
      websocketConnections.current.clear();
    };
  }, []);

  // 修复类型错误：将HTMLInputElement改为HTMLTextAreaElement
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    set_ui_maininput(e.target.value);
    MainUserComInterface.current.main_input = e.target.value;
  };

  const handleSendMessage = async () => {
    if (!ui_maininput.trim()) return;

    // 添加用户消息到当前对话
    const userMessage: ChatMessage = { sender: 'user', text: ui_maininput };

    // 如果是新对话，创建历史记录
    let usedHistoryId = currentHistoryId;
    if (!currentHistoryId) {
      const newHistoryId = Date.now().toString();
      const newRecord: HistoryRecord = {
        id: newHistoryId,
        module: currentModule,
        title: ui_maininput.substring(0, 30) + (ui_maininput.length > 30 ? '...' : ''),
        messages: [userMessage],
        timestamp: Date.now(),
        model: selectedModel,
        isStreaming: false
      };
      setHistoryRecords(prev => [newRecord, ...prev]);
      setCurrentHistoryId(newHistoryId);
      usedHistoryId = newHistoryId;
    } else {
      // 更新现有历史记录
      setHistoryRecords(prev => prev.map(record =>
        record.id === usedHistoryId
          ? {
              ...record,
              messages: [...record.messages, userMessage],
              isStreaming: true,
              streamingText: ''
            }
          : record
      ));
    }

    // 清空输入框
    set_ui_maininput('');
    MainUserComInterface.current.main_input = '';

    // 设置等待状态
    setIsWaiting(true);

    // 创建WebSocket连接
    const ws = new WebSocket(url);
    websocketConnections.current.set(usedHistoryId!, ws);

    // 用于检测大模型是否停止回复的定时器
    let responseTimeoutId: NodeJS.Timeout | null = null;

    const resetResponseTimeout = () => {
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
      }
      // 如果3秒内没有收到新消息，认为回复结束
      responseTimeoutId = setTimeout(() => {
        console.log('大模型停止回复，关闭连接');
        //ws.close();
      }, 1000);
    };

    ws.onopen = () => {
      console.log('WebSocket connection opened for history:', usedHistoryId);

      console.log('selectedModel:', selectedModel);
      ws.send(JSON.stringify({
        ...MainUserComInterface.current,
        main_input: userMessage.text,
        llm_kwargs: {llm_model: selectedModel}
      }));
    };

    ws.onmessage = (event) => {
      try {
        const parsedMessage: UserInterfaceMsg = JSON.parse(event.data);
        //console.log('parsedMessage:', parsedMessage);
        const botMessage = parsedMessage.chatbot;

        if (botMessage && botMessage.length > 0) {
          const lastConversation = botMessage[botMessage.length - 1];
          if (lastConversation && lastConversation.length > 1) {
            const aiResponse = lastConversation[1];

            // 重置回复超时定时器
            resetResponseTimeout();

            // 更新历史记录中的流式回复
            setHistoryRecords(prev => prev.map(record => {
              if (record.id === usedHistoryId) {
                // 直接更新流式回复的临时文本
                return {
                  ...record,
                  streamingText: aiResponse,
                  isStreaming: true
                };
              }
              return record;
            }));

            // 只有在有实际内容时才取消等待状态
            if (aiResponse && aiResponse.trim().length > 0) {
              setIsWaiting(false);
            }
          }
        }

        MainUserComInterface.current.history = parsedMessage.history;
      } catch (error) {
        console.error('Error parsing message:', error);
        setIsWaiting(false); // 出错时也要取消等待状态
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed for history:', usedHistoryId, event);
      websocketConnections.current.delete(usedHistoryId!);

      // 清除回复超时定时器
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
      }

      // 取消等待状态
      setIsWaiting(false);

      // WebSocket连接关闭时，将流式回复转换为最终消息
      setHistoryRecords(prev => prev.map(record => {
        if (record.id === usedHistoryId && record.isStreaming && record.streamingText) {
          return {
            ...record,
            messages: [...record.messages, { sender: 'bot', text: record.streamingText }],
            isStreaming: false,
            streamingText: undefined
          };
        }
        return record;
      }));
    };

    ws.onerror = (event) => {
      console.error('WebSocket error for history:', usedHistoryId, event);
      websocketConnections.current.delete(usedHistoryId!);

      // 清除回复超时定时器
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
      }

      // 出错时取消等待状态
      setIsWaiting(false);
    };
  };

  const handleClear = () => {
    setCurrentHistoryId(null);
  };

  // 停止当前流式回复
  const handleStopStreaming = () => {
    if (currentHistoryId) {
      const ws = websocketConnections.current.get(currentHistoryId);
      if (ws) {
        ws.close();
        websocketConnections.current.delete(currentHistoryId);
      }

      // 停止流式回复时，将当前流式文本转换为最终消息
      setHistoryRecords(prev => prev.map(record => {
        if (record.id === currentHistoryId && record.isStreaming && record.streamingText) {
          return {
            ...record,
            messages: [...record.messages, { sender: 'bot', text: record.streamingText }],
            isStreaming: false,
            streamingText: undefined
          };
        }
        return record;
      }));
    }
  };

  const handleHistorySelect = (historyId: string) => {
    const record = historyRecords.find(r => r.id === historyId);
    if (record) {
      setCurrentModule(record.module);
      setCurrentHistoryId(historyId);
      setSelectedModel(record.model);
    }
  };

  const handleModuleChange = (module: string) => {
    setCurrentModule(module);
    setCurrentHistoryId(null);
    // 清空输入框，准备新对话
    set_ui_maininput('');
    MainUserComInterface.current.main_input = '';
  };

  // 删除历史记录
  const handleDeleteHistory = (historyId: string) => {
    setHistoryRecords(prev => prev.filter(record => record.id !== historyId));

    // 如果删除的是当前选中的历史记录，清空当前选择
    if (currentHistoryId === historyId) {
      setCurrentHistoryId(null);
    }
  };

  // 获取当前显示的消息
  const currentMessages = getCurrentMessages();

  return (
    <div className="App overflow-hidden h-screen w-screen flex flex-row">
      <Sidebar
        onSelectModule={handleModuleChange}
        currentModule={currentModule}
        historyRecords={historyRecords}
        onHistorySelect={handleHistorySelect}
        currentHistoryId={currentHistoryId}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        onDeleteHistory={handleDeleteHistory}
      />
      <div className="flex flex-col flex-1 relative bg-white">
        {/* 右上角个人账号入口 */}
        {/* <div className="absolute top-4 right-8 flex items-center z-20">
          <Avatar size={28} src={null} />
          <span className="ml-2 font-medium text-base">张某某</span>
        </div> */}
        {/* 内容区 */}
        <MainContent
          currentModule={currentModule}
          messages={currentMessages}
          messagesEndRef={messagesEndRef}
          isEmpty={currentMessages.length === 0}
          isStreaming={historyRecords.find(r => r.id === currentHistoryId)?.isStreaming || false}
          isWaiting={isWaiting} // 传递等待状态
        />
        <InputArea
          value={ui_maininput}
          onChange={handleInputChange}
          onSend={handleSendMessage}
          onClear={handleClear}
          onStopStreaming={handleStopStreaming}
          currentModule={currentModule}
          isEmpty={currentMessages.length === 0}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isStreaming={historyRecords.find(r => r.id === currentHistoryId)?.isStreaming || false}
        />
      </div>
    </div>
  );
}

export default App
