// 导入必要的React钩子
import { useState, useRef, useEffect } from 'react'
import lodash from 'lodash';
import UpdateElectron from '@/components/update'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from './Com'
import { Input, ConfigProvider, Space, Button, List, Avatar, Layout, Card, Row, Col, Dropdown, Typography, Badge, Tooltip } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  DownOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './App.css';
import Sidebar, { AdvancedSessionRecord } from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import MainContent from './components/MainContent';
import InputArea from './components/InputArea';
import Main from 'electron/main';
import type { UploadRequestOption } from 'rc-upload/lib/interface';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// 历史记录接口


// 主应用组件
function App() {

  // Use the custom hook for AUTO_USER_COM_INTERFACE state management
  const {
    AUTO_USER_COM_INTERFACE,
    currentModule,
    setCurrentModule,
    MainInput,
    setMainInput,
    selectedModel,
    setSelectedModel,
    chatbot,
    setChatbot,
    history,
    setHistory,
    chatbotCookies,
    setChatbotCookies,
    systemPrompt,
    setSystemPrompt,
    specialKwargs,
    setSpecialKwargs,
    onComReceived,
  } = useUserInterfaceMsg();

  // Use the WebSocket communication hook
  const { beginWebSocketCom } = useWebSocketCom();

  // 其他状态和引用
  const [sessionRecords, setSessionRecords] = useState<AdvancedSessionRecord[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false); // 添加等待状态

  const CreateNewSession = () => {
    if (currentSessionId) {
      UpdateSessionRecord();
    }
    const newSessionId = Date.now().toString();
    setChatbot([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    setChatbotCookies({}); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    setHistory([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新

    setCurrentSessionId(newSessionId);
    setSessionRecords(prev => [
      ...prev,
      {
        id: newSessionId,
        module: currentModule,
        title: '新会话',
        user_com: lodash.cloneDeep(AUTO_USER_COM_INTERFACE.current),
        streamingText: '',
        timestamp: Date.now(),
        isStreaming: false // 新会话默认不在流式回复中
      }
    ]);
  }

  const UpdateSessionRecord = () => {
    const sessionRecord = sessionRecords.find(record => record.id === currentSessionId);
    // find session record by id
    if (sessionRecord) {
      console.log('更新会话记录' + currentSessionId);
      sessionRecord.module = currentModule;
      sessionRecord.title = MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : '');
      sessionRecord.user_com = lodash.cloneDeep(AUTO_USER_COM_INTERFACE.current);
      sessionRecord.streamingText = '';
      sessionRecord.timestamp = Date.now();
    }
  }

  // 修复类型错误：将HTMLInputElement改为HTMLTextAreaElement
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainInput(e.target.value);
  };

  const onFileUpload = async (uploadRequest: UploadRequestOption) => {
    // const { file, onProgress, onSuccess, onError } = options;
    handleSendMessage(true, uploadRequest);
  }

  const handleSendMessage = async (isUploadMode: boolean = false, uploadRequest: UploadRequestOption | null = null) => {
    if (currentSessionId === null) { CreateNewSession(); }
    UpdateSessionRecord();
    setIsWaiting(true);

    // 使用 useWebSocketCom hook 创建 WebSocket 连接
    const ws = await beginWebSocketCom(
      // AUTO_USER_COM_INTERFACE,
      AUTO_USER_COM_INTERFACE.current,
      // isUploadMode
      isUploadMode,
      uploadRequest,
      // onMessage callback
      (event) => {
        const parsedMessage: UserInterfaceMsg = JSON.parse(event.data);
        onComReceived(parsedMessage);
      },
      // onOpen callback
      () => {
        // console.log('WebSocket connection opened for history:', usedSessionId);
      },
      // onError callback
      (event) => {
        console.log('WebSocket connection error');
        setIsWaiting(false);
        UpdateSessionRecord();
      },
      // onClose callback
      (event) => {
        console.log('WebSocket connection closed');
        setIsWaiting(false);
        UpdateSessionRecord();
      }
    );
  };

  const handleClear = () => {
    CreateNewSession();
  };

  const handleModuleChange = (module: string) => {
    CreateNewSession();
  };

  // 停止当前流式回复
  const handleForceStop = () => {
    UpdateSessionRecord();
  };

  const handleHistorySelect = (historyId: string) => {
    const sessionRecord = sessionRecords.find(record => record.id === historyId);
    if (sessionRecord) {
      onComReceived(sessionRecord.user_com);
    }
  };

  // 删除历史记录
  const handleDeleteHistory = (historyId: string) => {
    setSessionRecords(prev => prev.filter(record => record.id !== historyId));
    // 如果删除的是当前选中的历史记录，创建新会话
    if (currentSessionId === historyId) {
      CreateNewSession();
    }
  };


  return (
    <div className="App overflow-hidden h-screen w-screen flex flex-row">
      <Sidebar
        onSelectModule={handleModuleChange}
        currentModule={currentModule}
        AdvancedSessionRecords={sessionRecords}
        onHistorySelect={handleHistorySelect}
        currentSessionId={currentSessionId}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        onDeleteHistory={handleDeleteHistory}
        setCurrentModule={setCurrentModule}
        setSpecialKwargs={setSpecialKwargs}
        specialKwargs={specialKwargs}
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
          chatbot={chatbot}
          isEmpty={chatbot.length === 0}
          isStreaming={sessionRecords.find(r => r.id === currentSessionId)?.isStreaming || false}
          isWaiting={isWaiting} // 传递等待状态
        />
        <InputArea
          value={MainInput}
          onChange={handleInputChange}
          onSend={()=>{handleSendMessage()}}
          onClear={handleClear}
          onStopStreaming={handleForceStop}
          onFileUpload={onFileUpload}
          currentModule={currentModule}
          isEmpty={chatbot.length === 0}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isStreaming={sessionRecords.find(r => r.id === currentSessionId)?.isStreaming || false}
        />
      </div>
    </div>
  );
}

export default App
