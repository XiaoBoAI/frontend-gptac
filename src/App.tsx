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
import { Input, ConfigProvider, Space, Button, List, Avatar, Layout, Card, Row, Col } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons';
import './App.css';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import MainContent from './components/MainContent';
import InputArea from './components/InputArea';

const { Header, Content, Footer } = Layout;

// 历史记录接口
interface HistoryRecord {
  id: string;
  module: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  model: string;
}

// 主应用组件
function App() {
  const [currentModule, setCurrentModule] = useState('ai_chat');
  const [ui_maininput, set_ui_maininput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState('deep');
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  
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
  const [url] = useState('ws://localhost:28000/main');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    (messagesEndRef.current as unknown as HTMLDivElement)?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 修复类型错误：将HTMLInputElement改为HTMLTextAreaElement
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    set_ui_maininput(e.target.value);
    MainUserComInterface.current.main_input = e.target.value;
  };

  const handleSendMessage = async () => {
    if (!ui_maininput.trim()) return;
    
    // 添加用户消息到当前对话
    const userMessage: ChatMessage = { sender: 'user', text: ui_maininput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // 如果是新对话，创建历史记录
    if (!currentHistoryId) {
      const newHistoryId = Date.now().toString();
      const newRecord: HistoryRecord = {
        id: newHistoryId,
        module: currentModule,
        title: ui_maininput.substring(0, 30) + (ui_maininput.length > 30 ? '...' : ''),
        messages: [userMessage],
        timestamp: Date.now(),
        model: selectedModel
      };
      setHistoryRecords(prev => [newRecord, ...prev]);
      setCurrentHistoryId(newHistoryId);
    } else {
      // 更新现有历史记录
      setHistoryRecords(prev => prev.map(record => 
        record.id === currentHistoryId 
          ? { ...record, messages: updatedMessages }
          : record
      ));
    }

    // 清空输入框
    set_ui_maininput('');
    MainUserComInterface.current.main_input = '';

    begin_contact_websocket_server({
      initial_message: {
        ...MainUserComInterface.current,
        main_input: userMessage.text,
        llm_kwargs: { model: selectedModel }
      },
      url: url,
      receive_callback_fn: (parsedMessage: UserInterfaceMsg) => {
        const botMessage = parsedMessage.chatbot;
        const new_message_list: ChatMessage[] = [...updatedMessages];
        for (const conversation of botMessage) {
          new_message_list.push(
            { sender: 'user' as const, text: conversation[0] },
            { sender: 'bot' as const, text: conversation[1] }
          );
        }
        setMessages(new_message_list);
        MainUserComInterface.current.history = parsedMessage.history;
        
        // 更新历史记录中的消息
        if (currentHistoryId) {
          setHistoryRecords(prev => prev.map(record => 
            record.id === currentHistoryId 
              ? { ...record, messages: new_message_list }
              : record
          ));
        }
      }
    });
  };

  const handleClear = () => {
    setMessages([]);
    setCurrentHistoryId(null);
  };

  const handleHistorySelect = (historyId: string) => {
    const record = historyRecords.find(r => r.id === historyId);
    if (record) {
      setMessages(record.messages);
      setCurrentModule(record.module);
      setCurrentHistoryId(historyId);
      setSelectedModel(record.model);
    }
  };

  const handleModuleChange = (module: string) => {
    setCurrentModule(module);
    setMessages([]);
    setCurrentHistoryId(null);
  };

  return (
    <div className="App overflow-hidden h-screen w-screen flex flex-row">
      <Sidebar 
        onSelectModule={handleModuleChange}
        currentModule={currentModule}
        historyRecords={historyRecords}
        onHistorySelect={handleHistorySelect}
        currentHistoryId={currentHistoryId}
      />
      <div className="flex flex-col flex-1 relative bg-white">
        {/* 右上角个人账号入口 */}
        <div className="absolute top-4 right-8 flex items-center z-20">
          <Avatar size={28} src={null} />
          <span className="ml-2 font-medium text-base">张某某</span>
        </div>
        {/* 内容区 */}
        <MainContent 
          currentModule={currentModule} 
          messages={messages} 
          messagesEndRef={messagesEndRef}
          isEmpty={messages.length === 0}
        />
        <InputArea 
          value={ui_maininput} 
          onChange={handleInputChange} 
          onSend={handleSendMessage} 
          onClear={handleClear}
          currentModule={currentModule}
          isEmpty={messages.length === 0}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>
    </div>
  );
}

export default App
