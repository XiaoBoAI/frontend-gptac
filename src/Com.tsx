import { useState, useRef, useEffect } from 'react';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';

export interface UserInterfaceMsg {
  function: string;
  main_input: string;
  llm_kwargs: Record<string, any>;
  plugin_kwargs: Record<string, any>;
  chatbot: string[][];
  chatbot_cookies:  Record<string, any>;
  history: string[];
  system_prompt: string;
  user_request: Record<string, any>;
  special_kwargs: Record<string, any>;
}

// 定义消息类型接口
export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

// Custom hook for managing UserInterfaceMsg state
export function useUserInterfaceMsg() {
  // ------------------------ main --------------------------------
  const AUTO_USER_COM_INTERFACE = useRef<UserInterfaceMsg>({
    function: 'chat',
    main_input: '',
    llm_kwargs: {},
    plugin_kwargs: {},
    chatbot: [],
    chatbot_cookies: {},
    history: [],
    system_prompt: '',
    user_request: {'username': 'default_user'},
    special_kwargs: {}
  });
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE

  // ------------------------ module (map to UserInterfaceMsg.function) -------------------------
  const [currentModule, setCurrentModule] = useState('chat');
  useEffect(() => {
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE
    AUTO_USER_COM_INTERFACE.current.function = currentModule;
  }, [currentModule]);

  // ------------------------ MainInput (map to UserInterfaceMsg.function) -------------------------
  const [MainInput, setMainInput] = useState('');
  useEffect(() => {
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE
    AUTO_USER_COM_INTERFACE.current.main_input = MainInput;
  }, [MainInput]);

  // ------------------------ selectedModel (map to UserInterfaceMsg.llm_kwargs.llm_model) -------------------------
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // 修改默认值为 'deepseek-chat'
  useEffect(() => {
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE
    AUTO_USER_COM_INTERFACE.current.llm_kwargs.llm_model = selectedModel;
  }, [selectedModel]);

  // ------------------------ chatbot (map to UserInterfaceMsg.chatbot) -------------------------
  const [chatbot, setChatbot] = useState<string[][]>([]);
  useEffect(() => {
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE
    AUTO_USER_COM_INTERFACE.current.chatbot = chatbot;
  }, [chatbot]);

  // ------------------------ history (map to UserInterfaceMsg.history) -------------------------
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE
    AUTO_USER_COM_INTERFACE.current.history = history;
  }, [history]);

  // ------------------------ cookie (map to UserInterfaceMsg.chatbot_cookies) -------------------------
  const [chatbotCookies, setChatbotCookies] = useState<Record<string, any>>({});
  useEffect(() => {
  // 请不要在 Com.tsx 源文件外面修改 AUTO_USER_COM_INTERFACE
    AUTO_USER_COM_INTERFACE.current.chatbot_cookies = chatbotCookies;
  }, [chatbotCookies]);

  // ------------------------ system_prompt (map to UserInterfaceMsg.system_prompt) -------------------------
  // 这里可以添加 system_prompt 的状态和处理逻辑，如果需要的话
  const [systemPrompt, setSystemPrompt] = useState('');
  useEffect(() => {
    AUTO_USER_COM_INTERFACE.current.system_prompt = systemPrompt;
  }, [systemPrompt]);


  const onComReceived = (received_msg: UserInterfaceMsg) => {
    // 更新状态
    setCurrentModule(received_msg.function);
    setMainInput(received_msg.main_input);
    setSelectedModel(received_msg.llm_kwargs.llm_model);
    setChatbot(received_msg.chatbot);
    setHistory(received_msg.history);
    setChatbotCookies(received_msg.chatbot_cookies);
    setSystemPrompt(received_msg.system_prompt);
    // 这里可以添加其他处理逻辑，比如更新 UI 或者触发其他副作用
  }


  return {
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
    onComReceived,
    setChatbotCookies,
  };
}


export function useWebSocketCom() {
  const [url] = useState(import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:28000/main');

  const beginWebSocketCom = async (
    AUTO_USER_COM_INTERFACE: UserInterfaceMsg,
    onMessageCallback: (event: MessageEvent) => void,
    onOpenCallback: () => void,
    onErrorCallback: (event: Event) => void,
    onCloseCallback: (event: CloseEvent) => void
  ) => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      ws.send(JSON.stringify(AUTO_USER_COM_INTERFACE));
      onOpenCallback();
    };

    ws.onmessage = (event) => {
      onMessageCallback(event);
    };

    ws.onerror = (event) => {
      onErrorCallback(event);
    };

    ws.onclose = (event) => {
      onCloseCallback(event);
    }
    return ws;
  };

  return {
    beginWebSocketCom
  };
}