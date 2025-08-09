import { useState, useRef, useEffect } from 'react';
import type { UploadRequestOption } from 'rc-upload/lib/interface';

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
    console.log('currentModule', currentModule);
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
    //console.log('selectedModel', selectedModel);
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
  const [systemPrompt, setSystemPrompt] = useState('');
  useEffect(() => {
    AUTO_USER_COM_INTERFACE.current.system_prompt = systemPrompt;
  }, [systemPrompt]);

  // ------------------------ special_kwargs (map to UserInterfaceMsg.special_kwargs) -------------------------
  const [specialKwargs, setSpecialKwargs] = useState<Record<string, any>>({});
  useEffect(() => {
    AUTO_USER_COM_INTERFACE.current.special_kwargs = specialKwargs;
  }, [specialKwargs]);


  const onComReceived = (received_msg: UserInterfaceMsg) => {
    // 更新状态
    setCurrentModule(received_msg.function);
    setMainInput(received_msg.main_input);
    setSelectedModel(received_msg.llm_kwargs.llm_model);
    setChatbot(received_msg.chatbot);
    setHistory(received_msg.history);
    setChatbotCookies(received_msg.chatbot_cookies);
    setSystemPrompt(received_msg.system_prompt);
    setSpecialKwargs(received_msg.special_kwargs);
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
    chatbotCookies,
    setChatbotCookies,
    systemPrompt,
    setSystemPrompt,
    specialKwargs,
    setSpecialKwargs,
    onComReceived,
  };
}

function buildUploadUserComInterface(AUTO_USER_COM_INTERFACE: UserInterfaceMsg, files: Array<string> = [], error: string = ''): UserInterfaceMsg {
  if (files.length === 0) {
    const UPLOAD_USER_COM_INTERFACE = {
      ...AUTO_USER_COM_INTERFACE,
      function: 'upload',
      main_input: error? error: '正在上传文件，请稍候...',
    }
    return UPLOAD_USER_COM_INTERFACE;
  } else {
    const UPLOAD_USER_COM_INTERFACE = {
      ...AUTO_USER_COM_INTERFACE,
      function: 'upload_done',
      main_input: error? error: '上传完毕',
      special_kwargs: {
        files: files,
      }
    }
    return UPLOAD_USER_COM_INTERFACE;
  }
}

export function useWebSocketCom() {
  const [url] = useState(import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:28000/main');

  const beginWebSocketCom = async (
    AUTO_USER_COM_INTERFACE: UserInterfaceMsg,
    isUploadMode: boolean = false,
    uploadRequest: UploadRequestOption | null = null,
    onMessageCallback: (event: MessageEvent) => void,
    onOpenCallback: () => void,
    onErrorCallback: (event: Event) => void,
    onCloseCallback: (event: CloseEvent) => void
  ) => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      if (isUploadMode && uploadRequest) {
        ws.send(JSON.stringify(buildUploadUserComInterface(AUTO_USER_COM_INTERFACE)));
        beginHttpUpload(
          uploadRequest,
          (files: Array<string>, error: string) => {
            ws.send(JSON.stringify(buildUploadUserComInterface(AUTO_USER_COM_INTERFACE, files, error)));
          }
        );
      } else {
        ws.send(JSON.stringify(AUTO_USER_COM_INTERFACE));
      }
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



// 处理文件上传
const beginHttpUpload = async (options: UploadRequestOption, finishCallback: any) => {
  const { file, onProgress, onSuccess, onError } = options;
  const formData = new FormData();
  formData.append('files', file);
  // 使用代理路径
  const uploadUrl = '/upload';

  try {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress?.({ percent });
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText);

        const paths: any = [];
        result.files.forEach(file => {
          paths.push(file.path); // 提取每个对象的 path 属性并添加到数组中
        });
        console.log('上传成功:', paths);
        finishCallback(paths, '')
        onSuccess?.(result);
      } else {
        throw new Error(`上传失败: ${xhr.statusText}`);
      }
    });

    xhr.addEventListener('error', () => {
      const error = new Error('上传失败');
      finishCallback([], '上传失败')
      onError?.(error);
    });

    xhr.open('POST', uploadUrl, true);
    xhr.send(formData);
  } catch (error) {
    finishCallback([], '上传失败');
    onError?.(error as Error);
  }
};