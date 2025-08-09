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
import { UploadRequestOption } from 'antd/es/upload/interface';
import React from 'react';

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
  const [currentSessionType, setCurrentSessionType] = useState('ai_chat'); // 当前会话类型 （ai_chat, academic_chat, paper_qa, paper_write, paper_translate, document_analysis, calculator, image_generator, data_analysis, user_profile, help）
  const [isWaiting, setIsWaiting] = useState(false); // 添加等待状态
  const [isStreaming, setIsStreaming] = useState(false); // 添加流式状态
  const [ws, setWs] = useState<WebSocket | null>(null);



  const CreateNewSession = (sessionType: string) => {
    if (currentSessionId) {
      UpdateSessionRecord();
    }

    // 检查是否已有同类型的新会话（标题为"新会话"的会话）
    const existingNewSession = sessionRecords.find(record => 
      record.module === sessionType && 
      record.title === '新会话'
    );

    if (existingNewSession) {
      // 如果找到同类型的新会话，直接沿用
      console.log('找到同类型新会话，直接沿用:', existingNewSession.id);
      setCurrentSessionId(existingNewSession.id);
      
      // 恢复该会话的状态
      setChatbot(existingNewSession.user_com.chatbot || []);
      setChatbotCookies(existingNewSession.user_com.chatbot_cookies || {});
      setHistory(existingNewSession.user_com.history || []);
      
      return; // 直接返回，不创建新会话
    }

    

    const newSessionId = Date.now().toString();
    
    // 先清空所有状态
    setChatbot([]); 
    setChatbotCookies({}); 
    setHistory([]); 
    // setMainInput(''); // 清空输入框内容
    // setIsStreaming(false); // 重置流式状态
    // setIsWaiting(false); // 重置等待状态

    // 创建一个干净的 AUTO_USER_COM_INTERFACE 对象
    const cleanUserComInterface = {
      function: sessionType,
      main_input: '',
      llm_kwargs: { llm_model: selectedModel },
      plugin_kwargs: {},
      chatbot: [],
      chatbot_cookies: {},
      history: [],
      system_prompt: systemPrompt,
      user_request: { username: 'default_user' },
      special_kwargs: specialKwargs
    };

    setCurrentSessionId(newSessionId);
    setSessionRecords(prev => [
      ...prev,
      {
        id: newSessionId,
        module: sessionType,
        title: MainInput.trim() ? MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : "") : '新会话',
        user_com: cleanUserComInterface, // 使用干净的接口对象
        streamingText: '',
        timestamp: Date.now(),
        isStreaming: false,
      }
    ]);
  }

  // 修复类型错误：将HTMLInputElement改为HTMLTextAreaElement
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainInput(e.target.value);
  };

  const UpdateSessionRecord = () => {
    const sessionRecord = sessionRecords.find(record => record.id === currentSessionId);
    // find session record by id
    if (sessionRecord) {
      console.log('更新会话记录' + currentSessionId);
      sessionRecord.module = currentModule;
      
      // 只有当 MainInput 不为空时才更新标题
      if (MainInput.trim()) {
        sessionRecord.title = MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : "");
      } else if (!sessionRecord.title || sessionRecord.title === '新会话') {
        // 如果 MainInput 为空且当前标题是"新会话"或空，保持"新会话"标题
        sessionRecord.title = '新会话';
      }
      // 如果 MainInput 为空但已有其他标题，保持原有标题不变
      
      sessionRecord.user_com = lodash.cloneDeep(AUTO_USER_COM_INTERFACE.current);
      sessionRecord.streamingText = '';
      sessionRecord.timestamp = Date.now();
    }
  }


  const onFileUpload = async (uploadRequest: UploadRequestOption) => {
    // const { file, onProgress, onSuccess, onError } = options;
    handleSendMessage(true, uploadRequest);
  }


  const handleSendMessage = async (isUploadMode: boolean = false, uploadRequest: UploadRequestOption | null = null) => {
    if (currentSessionId === null) { CreateNewSession(currentModule); }
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
        setIsStreaming(true);
        setIsWaiting(false);
      },
      // onOpen callback
      () => {
        // console.log('WebSocket connection opened for history:', usedSessionId);
      },
      // onError callback
      (event) => {
        console.log('WebSocket connection error');
        setIsWaiting(false);
        setIsStreaming(false);
        UpdateSessionRecord();
      },
      // onClose callback
      (event) => {
        console.log('WebSocket connection closed');
        setIsWaiting(false);
        setIsStreaming(false);
        UpdateSessionRecord();
      }
    );
    setWs(ws);
  };

  const handleClear = () => {
    CreateNewSession(currentModule);
  };


  const handleSessionTypeChange = (sessionType: string) => {
    setCurrentSessionType(sessionType);
    //console.log('handleSessionTypeChange', sessionType);
    //setCurrentSessionId(null);
    setCurrentModule(sessionType);
    CreateNewSession(sessionType);
  };

  const handleForceStop = () => {
    ws?.close();
    setIsWaiting(false);
    setIsStreaming(false);
    UpdateSessionRecord();
  };

  const handleHistorySelect = (historyId: string) => {
    const sessionRecord = sessionRecords.find(record => record.id === historyId);
    if (sessionRecord) {
      // console.log('handleHistorySelect', sessionRecord.user_com);
      // console.log('handleHistorySelectId', historyId);
      // console.log('handleHistorySelectmodule', sessionRecord.module);
      setCurrentSessionType(sessionRecord.module);
      //console.log('currentSessionType', currentSessionType);
      onComReceived(sessionRecord.user_com);
      setCurrentSessionId(historyId);
      
    }
  };

  // 删除历史记录
  const handleDeleteHistory = (historyId: string) => {
    setSessionRecords(prev => prev.filter(record => record.id !== historyId));
    // 如果删除的是当前选中的历史记录，创建新会话
    if (currentSessionId === historyId) {
      CreateNewSession(currentModule);
    }
  };


  return (
    <div className="App h-screen w-screen flex flex-row fixed top-0 left-0 overflow-hidden">
      <Sidebar
        onSelectSessionType={handleSessionTypeChange}
        currentSessionType={currentSessionType}
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
      <div className="flex flex-col h-full flex-1 relative bg-white overflow-hidden">
        {/* 右上角个人账号入口 */}
        {/* <div className="absolute top-4 right-8 flex items-center z-20">
          <Avatar size={28} src={null} />
          <span className="ml-2 font-medium text-base">张某某</span>
        </div> */}
        {/* 内容区 */}
        <MainContent
          currentSessionType={currentSessionType}
          chatbot={chatbot}
          isStreaming={isStreaming} // 传递流式状态
          isWaiting={isWaiting} // 传递等待状态
        />
        <InputArea
          value={MainInput}
          onChange={handleInputChange}
          onSend={() => handleSendMessage()}
          onClear={handleClear}
          onStopStreaming={handleForceStop}
          onFileUpload={onFileUpload}
          currentModule={currentModule}
          isEmpty={chatbot.length === 0}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}

export default App
