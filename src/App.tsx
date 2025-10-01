// 导入必要的React钩子
import { useState, useRef, useEffect } from 'react'
import lodash from 'lodash';
import UpdateElectron from '@/components/update'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom, beginHttpDownload } from './Com'
import { Input, ConfigProvider, Space, Button, List, Avatar, Layout, Card, Row, Col, Dropdown, Typography, Badge, Tooltip, message } from 'antd';
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
import React from 'react';
import { useAvatar } from './components/AvatarContext';
import ProgressBar from './components/ProgressBar';
import { ThemeProvider } from './contexts/ThemeContext';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// 历史记录接口


// 主应用组件
function App() {
  const { updateBotAvatarForNewConversation } = useAvatar();

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
    pluginKwargs,
    setPluginKwargs,
    topP,
    setTopP,
    temperature,
    setTemperature,
    maxLength,
    setMaxLength,
    onComReceived,
  } = useUserInterfaceMsg();

  // Use the WebSocket communication hook
  const { beginWebSocketCom } = useWebSocketCom();

  // 其他状态和引用
  const sessionRecordsRef = useRef<AdvancedSessionRecord[]>([]);
  const [sessionRecords, setSessionRecords] = useState<AdvancedSessionRecord[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSessionType, setCurrentSessionType] = useState('ai_chat'); // 当前会话类型 （ai_chat, academic_chat, paper_qa, paper_write, paper_translate, document_analysis, calculator, image_generator, data_analysis, user_profile, help）
  const [isWaiting, setIsWaiting] = useState(false); // 添加等待状态
  const [isStreaming, setIsStreaming] = useState(false); // 添加流式状态
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  // 上传进度相关状态
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  
  // 下载进度相关状态
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState('');


  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // 同步 sessionRecords 到 ref
  useEffect(() => {
    sessionRecordsRef.current = sessionRecords;
  }, [sessionRecords]);


  useEffect(() => {
    console.log('specialKwargs', specialKwargs);

    if (specialKwargs.uploaded_file_path) {
      if (currentModule == "crazy_functions.gpt_5.快速论文解读->快速论文解读" || currentModule == "paper_qa") {
      setMainInput(specialKwargs.uploaded_file_path);
    }}
  }, [specialKwargs]);



  const CreateNewSession = (sessionType: string): string => {
    if (currentSessionId) {
      UpdateSessionRecord();
    }

    // 为新会话生成新的机器人头像
    updateBotAvatarForNewConversation();

    // 检查是否已有同类型的新会话（标题为"新会话"的会话）
    const existingNewSession = sessionRecords.find(record =>
      record.session_type === sessionType &&
      record.title === '新会话'
    );

    if (existingNewSession) {
      // 如果找到同类型的新会话，直接沿用
      console.log('找到同类型新会话，直接沿用:', existingNewSession.id);
      setCurrentSessionId(existingNewSession.id);

      // 恢复该会话的状态，但保持用户当前的模型选择
      setChatbot(existingNewSession.user_com.chatbot || []);
      setChatbotCookies(existingNewSession.user_com.chatbot_cookies || {});
      setHistory(existingNewSession.user_com.history || []);

      // 注意：这里不调用 onComReceived，避免覆盖用户当前的模型选择
      // 只在必要时更新其他状态
      if (existingNewSession.user_com.system_prompt) {
        setSystemPrompt(existingNewSession.user_com.system_prompt);
      }
      if (existingNewSession.user_com.special_kwargs) {
        setSpecialKwargs(existingNewSession.user_com.special_kwargs);
      }

      return existingNewSession.id; // 返回现有会话ID
    }

    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    console.log('newSessionId', newSessionId);

    console.log('currentSessionId_new', currentSessionId);

    // 先清空所有状态
    setChatbot([]);
    setChatbotCookies({});
    setHistory([]);

    // 创建一个干净的 AUTO_USER_COM_INTERFACE 对象
    // 保持用户当前选择的模型，而不是重置为默认值
    const cleanUserComInterface = {
      function: sessionType,
      main_input: '',
      llm_kwargs: {
        llm_model: selectedModel || 'deepseek-chat', // 确保有默认值
        top_p: topP,
        temperature: temperature,
        max_length: maxLength
      },
      plugin_kwargs: {},
      chatbot: [],
      chatbot_cookies: {},
      history: [],
      system_prompt: systemPrompt,
      user_request: { username: 'default_user' },
      special_kwargs: specialKwargs,
      special_state: {}
    };


    setSessionRecords(prev => {
      const newRecords = [
        ...prev,
        {
          id: newSessionId,
          module: sessionType,
          title: MainInput.trim() ? MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : "") : '新会话',
          user_com: cleanUserComInterface, // 使用干净的接口对象
          streamingText: '',
          timestamp: Date.now(),
          isStreaming: false,
          session_type: sessionType,
        }
      ];
      sessionRecordsRef.current = newRecords;
      return newRecords;
    });
    console.log('sessionRecords', sessionRecords);

    return newSessionId; // 返回新创建的会话ID
  }

  // 修复类型错误：将HTMLInputElement改为HTMLTextAreaElement
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainInput(e.target.value);
  };

  const UpdateSessionRecord = () => {
    const sessionRecord = sessionRecordsRef.current.find(record => record.id === currentSessionIdRef.current);
    // find session record by id
    if (sessionRecord) {
      console.log('更新会话记录' + currentSessionIdRef.current);
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
      sessionRecord.session_type = currentSessionType;
    }
  }


  const onFileUpload = async (uploadRequest: UploadRequestOption) => {
    const { file } = uploadRequest;
    
    // 显示上传进度条
    const fileName = file instanceof File ? file.name : '未知文件';
    setUploadFileName(fileName);
    setUploadProgress(0);
    setShowUploadProgress(true);
    
    // 创建带有进度回调的 uploadRequest
    const uploadRequestWithProgress = {
      ...uploadRequest,
      onProgress: (progress: any) => {
        setUploadProgress(progress.percent);
      },
      onSuccess: () => {
        setShowUploadProgress(false);
        setUploadProgress(0);
      },
      onError: () => {
        setShowUploadProgress(false);
        setUploadProgress(0);
      }
    };
    
    handleSendMessage(true, uploadRequestWithProgress);
  }

   // 带进度条的下载函数
  const downloadWithProgress = async (fileUrl: string) => {
    // 从URL中提取文件名
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || '下载文件';
    
    setDownloadFileName(fileName);
    setDownloadProgress(0);
    setShowDownloadProgress(true);
    
    try {
      await beginHttpDownload(
        fileUrl, 
        (percent: number) => {
          setDownloadProgress(percent);
        },
        (error: string) => {
          // 下载失败，隐藏进度条并显示错误
          setShowDownloadProgress(false);
          setDownloadProgress(0);
          console.error('下载失败:', error);
          // 使用 Ant Design 的 message 组件显示错误
          message.error(`下载失败: ${error}`);
        }
      );
      
      // 下载完成后隐藏进度条
      setTimeout(() => {
        setShowDownloadProgress(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      setShowDownloadProgress(false);
      setDownloadProgress(0);
      console.error('下载失败:', error);
      message.error(`下载失败: ${error}`);
    }
  };


  const handleSendMessage = async (isUploadMode: boolean = false, uploadRequest: UploadRequestOption | null = null) => {
    let sessionId = currentSessionId;

    if (currentSessionId === null) {
      sessionId = CreateNewSession(currentModule);
    }
    console.log('currentSessionId', sessionId);
    console.log('currentModule', currentModule);

    // 使用正确的会话ID更新会话记录
    // const sessionRecord = sessionRecords.find(record => record.id === sessionId);
    // if (sessionRecord) {
    //   console.log('更新会话记录' + sessionId);
    //   sessionRecord.module = currentModule;

    //   // 只有当 MainInput 不为空时才更新标题
    //   if (MainInput.trim()) {
    //     sessionRecord.title = MainInput.substring(0, 30) + (MainInput.length > 30 ? '...' : "");
    //   } else if (!sessionRecord.title || sessionRecord.title === '新会话') {
    //     // 如果 MainInput 为空且当前标题是"新会话"或空，保持"新会话"标题
    //     sessionRecord.title = '新会话';
    //   }
    //   // 如果 MainInput 为空但已有其他标题，保持原有标题不变

    //   sessionRecord.user_com = lodash.cloneDeep(AUTO_USER_COM_INTERFACE.current);
    //   sessionRecord.streamingText = '';
    //   sessionRecord.timestamp = Date.now();
    //   sessionRecord.session_type = currentSessionType;
    // }

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

        parsedMessage.function = currentModule;
        console.log('parsedMessage', parsedMessage);
        onComReceived(parsedMessage);
        setIsStreaming(true);
        setIsWaiting(false);
      },
      // onOpen callback
      () => {
        // console.log('WebSocket connection opened for history:', usedSessionId);
        // 发送消息后清空输入框
        setMainInput('');
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
      },
      // onUploadError callback
      (error: string) => {
        console.error('上传失败:', error);
        setShowUploadProgress(false);
        setUploadProgress(0);
        message.error(`上传失败: ${error}`);
      }
    );
    setWs(ws);
  };

  const handleClear = () => {
    CreateNewSession(currentModule); // 忽略返回值
  };


  const handleSessionTypeChange = (sessionType: string) => {
    setCurrentSessionType(sessionType);
    console.log('handleSessionTypeChange', sessionType);
    //setCurrentSessionId(null);
    setCurrentModule(sessionType);
    CreateNewSession(sessionType); // 忽略返回值
  };

  const handleForceStop = () => {
    ws?.close();
    setIsWaiting(false);
    setIsStreaming(false);
    UpdateSessionRecord();
  };

 

  const handleHistorySelect = (historyId: string) => {
    const sessionRecord = sessionRecords.find(record => record.id === historyId);
    console.log('sessionRecord', sessionRecord);
    if (sessionRecord) {

      // console.log('handleHistorySelect', sessionRecord.user_com);
      console.log('handleHistorySelectId', historyId);
      // console.log('handleHistorySelectmodule', sessionRecord.module);
      setCurrentSessionType(sessionRecord.session_type);
      //console.log('currentSessionType', currentSessionType);
      onComReceived(sessionRecord.user_com);
      console.log('user_com', sessionRecord.user_com);
      setCurrentSessionId(historyId);

    }
  };

  // 删除历史记录
  const handleDeleteHistory = (historyId: string) => {
    setSessionRecords(prev => {
      const newRecords = prev.filter(record => record.id !== historyId);
      sessionRecordsRef.current = newRecords;
      return newRecords;
    });
    // 如果删除的是当前选中的历史记录，创建新会话
    if (currentSessionId === historyId) {
      CreateNewSession(currentModule); // 忽略返回值
    }
  };

  // 保存会话
  const handleSaveSession = async (historyId: string) => {
    const sessionRecord = sessionRecords.find(record => record.id === historyId);

    if (sessionRecord) {
      // console.log('handleHistorySelect', sessionRecord.user_com);
      // console.log('handleHistorySelectId', historyId);
      // console.log('handleHistorySelectmodule', sessionRecord.module);
      setCurrentSessionType(sessionRecord.session_type);
      //console.log('sessionRecord.user_com', sessionRecord.user_com);
      //console.log('currentSessionType', currentSessionType);
      onComReceived(sessionRecord.user_com);
      setCurrentSessionId(historyId);

      setCurrentModule("save_dialog");
      setIsStreaming(true);
      setIsWaiting(true);

      handleSendMessage(false, null);
    }
  };

  const test_function_01 = async () => {
    const response = await fetch('/crazy_functional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    if (response.ok) {
      const data = await response.json();
      console.log('插件列表:', data);
    }
  }
  const test_function_02 = async () => {
    //  # 有三种插件
    //  # 第一种：无菜单插件，need_simple_menu=False, need_complex_menu=False
    //  # - function 走 default_call_path
    //  # 第二种：简易版菜单插件，need_simple_menu=True, need_complex_menu=False
    //  # - function 走 default_call_path
    //  # 第三种：复杂版菜单插件，need_simple_menu=False, need_complex_menu=True
    //  # - function 走 complex_call_path

    // 第1种：无菜单插件
    // setMainInput('测试')
    // setCurrentModule("crazy_functions.询问多个大语言模型->同时问询"); // 读取 default_call_path
    // handleSendMessage();

    // 第2种：简易版菜单插件
    // setMainInput('测试')
    // setCurrentModule("crazy_functions.批量文件询问->批量文件询问"); // 读取 default_call_path
    // setPluginKwargs({
    //   "advanced_arg": "some_file_name", // 第2种插件的拓展参数槽位固定是 advanced_arg
    // });
    // handleSendMessage();

    // // // 第3种：复杂菜单调用实例: 保存的对话
    // setMainInput('')
    // setCurrentModule("crazy_functions.Conversation_To_File->Conversation_To_File_Wrap"); // 读取 complex_call_path
    // setPluginKwargs({
    //   "file_name": "some_file_name",  // 第3种插件的拓展参数槽位不固定，读取complex_menu_def获取拓展参数槽位清单
    // });
    // handleSendMessage();

    setMainInput('private_upload/default_user/2025-08-31-05-33-48/2406.09246v3.pdf')
    setCurrentModule("crazy_functions.gpt_5.快速论文解读->快速论文解读"); // 读取 complex_call_path
    handleSendMessage();
  }

  return (
    <ThemeProvider>
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
          onSaveSession={handleSaveSession}
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
        <div className="flex flex-col h-full flex-1 relative bg-white dark:bg-gray-800 overflow-hidden">
          {/* 顶部HeaderBar */}
          <HeaderBar />
          {/* 内容区 */}
          <MainContent
            currentSessionType={currentSessionType}
            chatbot={chatbot}
            isStreaming={isStreaming} // 传递流式状态
            isWaiting={isWaiting} // 传递等待状态
            setSpecialKwargs={setSpecialKwargs}
            onDownload={downloadWithProgress}
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
            // 传递模型参数
            topP={topP}
            setTopP={setTopP}
            temperature={temperature}
            setTemperature={setTemperature}
            maxLength={maxLength}
            setMaxLength={setMaxLength}
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
          />
          {/* <Button onClick={test_function_01}> 测试获取插件json打印到console </Button> */}
          {/* <Button onClick={test_function_02}> 测试插件调用 </Button> */}
        </div>
        
        {/* 上传进度条 */}
        <ProgressBar
          visible={showUploadProgress}
          percent={uploadProgress}
          title="文件上传中"
          description={`正在上传: ${uploadFileName}`}
          onCancel={() => {
            setShowUploadProgress(false);
            setUploadProgress(0);
          }}
        />
        
        {/* 下载进度条 */}
        <ProgressBar
          visible={showDownloadProgress}
          percent={downloadProgress}
          title="文件下载中"
          description={`正在下载: ${downloadFileName}`}
          onCancel={() => {
            setShowDownloadProgress(false);
            setDownloadProgress(0);
          }}
        />
      </div>
    </ThemeProvider>
  );
}

export default App
