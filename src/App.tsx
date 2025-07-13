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

// 主应用组件
function App() {
  const [currentModule, setCurrentModule] = useState('chat');
  const [ui_maininput, set_ui_maininput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_ui_maininput(e.target.value);
    MainUserComInterface.current.main_input = e.target.value;
  };

  const handleSendMessage = async () => {
    begin_contact_websocket_server({
      initial_message: MainUserComInterface.current,
      url: url,
      receive_callback_fn: (parsedMessage: UserInterfaceMsg) => {
        const botMessage = parsedMessage.chatbot;
        const new_message_list: ChatMessage[] = [];
        for (const conversation of botMessage) {
          new_message_list.push(
            { sender: 'user' as const, text: conversation[0] },
            { sender: 'bot' as const, text: conversation[1] }
          );
        }
        setMessages(new_message_list);
        MainUserComInterface.current.history = parsedMessage.history;
      }
    });
  };

  const handleClear = () => setMessages([]);

  return (
    <div className="App overflow-hidden h-screen w-screen flex flex-row">
      <Sidebar onSelectModule={setCurrentModule} />
      <div className="flex flex-col flex-1 relative">
        {/* 右上角个人账号入口 */}
        <div className="absolute top-4 right-8 flex items-center z-20">
          <Avatar size={28} src={null} />
          <span className="ml-2 font-medium text-base">张某某</span>
        </div>
        {/* 内容区 */}
        <MainContent currentModule={currentModule} messages={messages} messagesEndRef={messagesEndRef} />
        <InputArea value={ui_maininput} onChange={handleInputChange} onSend={handleSendMessage} onClear={handleClear} />
      </div>
    </div>
  );
}

export default App
