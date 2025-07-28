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
  const [ws, setWs] = useState<WebSocket | null>(null);

  // 在组件顶部添加 ref
  const currentSessionIdRef = useRef<string | null>(null);

  // 同步 ref 和 state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);


  

  const CreateNewSession = () => {
    //console.log('currentSessionId:', currentSessionId);
    // if (currentSessionId) {
    //   UpdateSessionRecord();
    // }
    const newSessionId = Date.now().toString();
    setChatbot([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    setChatbotCookies({}); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    setHistory([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新

    setCurrentSessionId(newSessionId);
    //console.log('CreateNewSession:', newSessionId);
    setSessionRecords(prev => [
      ...prev,
      {
        id: newSessionId,
        module: currentModule,
        title: MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : ''),
        user_com: lodash.cloneDeep(AUTO_USER_COM_INTERFACE.current),
        streamingText: '',
        timestamp: Date.now(),
        isStreaming: true, // 新会话默认在流式回复中
        messages: [
          {
            sender: 'user',
            text: MainInput
          }
        ]
      }
    ]);
  }

  // 修复类型错误：将HTMLInputElement改为HTMLTextAreaElement
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainInput(e.target.value);
  };

  const UpdateSessionRecord = () => {
    setSessionRecords(prev => prev.map(record =>
      record.id === currentSessionId
        ? {
            ...record,  // 保持所有原有属性
            module: currentModule,
            title: MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : ''),
            user_com: lodash.cloneDeep(AUTO_USER_COM_INTERFACE.current),
            streamingText: '',
            timestamp: Date.now(),
            isStreaming: true,
            messages: [...record.messages,
              {
                sender: 'user',
                text: MainInput
              }
            ]
          }
        : record  // 其他记录保持不变
    ));
  }

  // 修改 CloseSessionRecord 函数
  const CloseSessionRecord = () => {
    const sessionId = currentSessionIdRef.current; // 使用 ref 中的最新值
    console.log('currentSessionId:', sessionId);
    setChatbot([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    setChatbotCookies({}); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    setHistory([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    
    if (!sessionId) return; // 添加安全检查


    setSessionRecords(prev => prev.map(record => {
      if (record.id === sessionId && record.isStreaming && record.streamingText) {
        return {
          ...record,
          messages: [...record.messages, { sender: 'bot', text: record.streamingText}],
          isStreaming: false,
          streamingText: undefined
        };
      }
      return record;
    }));
  };

  const UpdateStreamingText = () => {
    const sessionId = currentSessionIdRef.current;
    const current_chatbot = AUTO_USER_COM_INTERFACE.current.chatbot;
    const lastConversation = current_chatbot[current_chatbot.length - 1];
    if (lastConversation && lastConversation.length > 1) {
      const aiResponse = lastConversation[1];
      console.log('aiResponse:', aiResponse);

      // 只有在有实际内容时才取消等待状态
      if (aiResponse && aiResponse.trim().length > 0) {
        setIsWaiting(false);
      }

      // 更新历史记录中的流式回复
      setSessionRecords(prev => prev.map(record => {
        if (record.id === sessionId) {
          // 直接更新流式回复的临时文本
          return {
            ...record,
            streamingText: aiResponse,
            isStreaming: true
          };
        }
        return record;
      }));
    }
  };


  const onFileUpload = async (uploadRequest: UploadRequestOption) => {
    // const { file, onProgress, onSuccess, onError } = options;
    handleSendMessage(true, uploadRequest);
  }
  

  const handleSendMessage = async (isUploadMode: boolean = false, uploadRequest: UploadRequestOption | null = null) => {
    if (currentSessionId === null) {
      CreateNewSession(); 
    }
    else{
      UpdateSessionRecord();
    }
    //UpdateSessionRecord();
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
        UpdateStreamingText();
      },
      // onOpen callback
      () => {
        // console.log('WebSocket connection opened for history:', usedSessionId);
      },
      // onError callback
      (event) => {
        console.log('WebSocket connection error');
        setIsWaiting(false);
        CloseSessionRecord();
      },
      // onClose callback
      (event) => {
        console.log('WebSocket connection closed');
        setIsWaiting(false);
        CloseSessionRecord();
      }
    );
    setWs(ws);

  };

  const handleClear = () => {
    CreateNewSession();
  };

  const handleSessionTypeChange = (sessionType: string) => {
    setCurrentSessionType(sessionType);
    setCurrentSessionId(null);
    // setChatbot([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    // setChatbotCookies({}); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    // setHistory([]); // 这会自动触发 AUTO_USER_COM_INTERFACE 的更新
    //CreateNewSession();
  };

  // 停止当前流式回复
  const handleForceStop = () => {

    ws?.close();

    CloseSessionRecord();
  };

  const handleHistorySelect = (historyId: string) => {
    const sessionRecord = sessionRecords.find(record => record.id === historyId);
    if (sessionRecord) {
      //onComReceived(sessionRecord.user_com);
      setCurrentSessionId(historyId);
      setChatbot(sessionRecord.user_com.chatbot);
      setChatbotCookies(sessionRecord.user_com.chatbot_cookies);
      setHistory(sessionRecord.user_com.history);
      setSelectedModel(sessionRecord.user_com.llm_kwargs.llm_model);
    }
  };

  // 删除历史记录
  const handleDeleteHistory = (historyId: string) => {
    setSessionRecords(prev => prev.filter(record => record.id !== historyId));
    // 如果删除的是当前选中的历史记录，创建新会话
    if (currentSessionId === historyId) {
      setCurrentSessionId(null);
    }
  };

  // 获取当前历史记录的消息
  const getCurrentMessages = (): ChatMessage[] => {
    if (!currentSessionId) return [];
    const record = sessionRecords.find(r => r.id === currentSessionId);
    if (!record) return [];

    // 如果有流式回复，添加临时消息
    if (record.isStreaming && record.streamingText) {
      return [...record.messages, { sender: 'bot', text: record.streamingText }];
    }

    return record.messages;
  };

  const currentMessages = getCurrentMessages();


  return (
    <div className="App overflow-hidden h-screen w-screen flex flex-row">
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
      <div className="flex flex-col flex-1 relative bg-white">
        {/* 右上角个人账号入口 */}
        {/* <div className="absolute top-4 right-8 flex items-center z-20">
          <Avatar size={28} src={null} />
          <span className="ml-2 font-medium text-base">张某某</span>
        </div> */}
        {/* 内容区 */}
        <MainContent
          currentSessionType={currentSessionType}
          currentMessages={currentMessages}
          isEmpty={currentMessages.length === 0}
          isStreaming={sessionRecords.find(r => r.id === currentSessionId)?.isStreaming || false}
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
          isEmpty={currentMessages.length === 0}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isStreaming={sessionRecords.find(r => r.id === currentSessionId)?.isStreaming || false}
        />
      </div>
    </div>
  );
}

export default App
