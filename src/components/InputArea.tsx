import { Input, Button, Dropdown, Menu, Tooltip, message, Upload } from 'antd';
import { SendOutlined, GlobalOutlined, DownOutlined, ClearOutlined, LoadingOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import ModelSettings from './ModelSettings';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import { useTheme } from '@/hooks/useTheme';

const { TextArea } = Input;

const modelList = [
  { key: 'deepseek-chat', label: 'Deepseek-Chat', icon: <span style={{fontSize:18}}>🎓</span>, description: '适合对话和写作' },
  { key: 'deepseek-reasoner', label: 'Deepseek-R1', icon: <span style={{fontSize:18}}>🧠</span>, description: '适合复杂推理和深度分析' },
  { key: 'gpt-4o', label: 'GPT-4o', icon: <span style={{fontSize:18}}>🤖</span>, description: '适合对话和推理' },
  //{ key: 'search', label: '全网搜索', icon: <GlobalOutlined />, description: '实时搜索最新信息' },
//   { key: 'creative', label: '创意写作', icon: <span style={{fontSize:18}}>✨</span>, description: '适合创意和写作任务' },
//   { key: 'academic', label: '学术助手', icon: <span style={{fontSize:18}}>🎓</span>, description: '专注于学术研究和论文' },
];

interface InputAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onClear: () => void;
  onStopStreaming?: () => void; // 停止流式回复
  currentModule?: string;
  isEmpty?: boolean;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  isStreaming?: boolean; // 是否正在流式回复
  onFileUpload?: (options: RcCustomRequestOptions) => void; // 文件上传处理函数
  // 模型参数相关
  topP?: number;
  setTopP?: (value: number) => void;
  temperature?: number;
  setTemperature?: (value: number) => void;
  maxLength?: number | null;
  setMaxLength?: React.Dispatch<React.SetStateAction<number | null>>;
  systemPrompt?: string;
  setSystemPrompt?: (value: string) => void;
}

// 用户输入预测结果接口
interface PredictionResult {
  future: string[];
}

// 防抖hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const modulePlaceholders: Record<string, string> = {
  ai_chat: '与AI进行智能对话，输入您的问题...',
  academic_chat: '进行学术讨论，输入您的学术问题...',
  paper_qa: '针对论文内容提问，帮助理解学术文献...',
  paper_write: '输入您的写作需求，AI将协助您完成论文...',
  paper_translate: '输入需要翻译的论文内容...',
  document_analysis: '上传或输入文档内容进行分析...',
  calculator: '输入数学表达式或计算问题...',
  image_generator: '描述您想要生成的图像...',
  data_analysis: '输入数据或上传文件进行分析...',
  user_profile: '管理您的个人设置和偏好...',
  help: '搜索帮助文档或常见问题...',
};

// 自定义停止按钮图标
const StopCircleIcon: React.FC<{size?:number, isDark?:boolean}> = ({size=22, isDark=false}) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" stroke={isDark ? '#fff' : '#222'} strokeWidth="2" fill="none"/>
    <rect x="7.5" y="7.5" width="7" height="7" rx="2" fill={isDark ? '#fff' : '#222'} />
  </svg>
);


const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onClear,
  onStopStreaming,
  onFileUpload,
  currentModule = 'ai_chat',
  isEmpty = false,
  selectedModel = 'deepseek-chat',
  setSelectedModel,
  isStreaming = false,
  // 模型参数相关
  topP = 1,
  setTopP,
  temperature = 1.0,
  setTemperature,
  maxLength = 3584,
  setMaxLength,
  systemPrompt = 'Serve me as a writing and programming assistant. Answer me in Chinese by default.',
  setSystemPrompt,
}) => {
  const { isDark } = useTheme();
  const inputRef = useRef(null);
  const placeholder = modulePlaceholders[currentModule] || modulePlaceholders['ai_chat'];

  // 用户输入预测状态
  const [predictions, setPredictions] = useState<string[]>([]);
  const [showPrediction, setShowPrediction] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [lastInputValue, setLastInputValue] = useState('');
  // create ref to `value`
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const [predictionLoading, setPredictionLoading] = useState(false);
  const predictionControllerRef = useRef<AbortController | null>(null);

  // 防抖处理用户输入
  const debouncedValue = useDebounce(value, 1000);

  // 预测用户输入的API调用
  const predictUserInput = async (inputText: string) => {
    try {
      // 获取最后200个字符
      const mainInput = inputText.slice(-1024);

      const response = await fetch(`/predict_user_input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          main_input: mainInput
        }),
      });

      if (!response.ok) {
        return;
      }

      const result: PredictionResult = await response.json();

      console.log('预测结果:', result);
      // 验证请求完成时用户输入是否已经改变
      if (valueRef.current !== inputText) {
        console.log('用户输入已改变，放弃此次预测', value, inputText);
        return; // 用户输入已改变，放弃此次预测
      }

      if (result.future && result.future.length > 0 && result.future.some(item => item.trim())) {
        setPredictions(result.future.filter(item => item.trim()));
        setShowPrediction(true);
        console.log('成功');
      } else {
        console.warn('预测结果为空或仅包含空格，放弃显示预测');
      }
    } catch (error) {
      console.warn('预测用户输入失败:', error);
      return;
    }
  };

  const handlePredict = useCallback(async (text: string) => {
    if (!text.trim()) {
      setShowPrediction(false);
      setPredictions([]);
      return;
    }

    try {
      predictionControllerRef.current?.abort();
      const controller = new AbortController();
      predictionControllerRef.current = controller;

      setPredictionLoading(true);

      const response = await fetch('/predict_user_input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('预测请求失败');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setPredictions(data);
        setShowPrediction(true);
      } else {
        setPredictions([]);
        setShowPrediction(false);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('预测请求错误:', error);
        setShowPrediction(false);
      }
    } finally {
      setPredictionLoading(false);
    }
  }, []);

  useEffect(() => {
    predictionControllerRef.current?.abort();
    predictionControllerRef.current = null;
  }, []);

  // 监听防抖后的输入变化
  useEffect(() => {
    if (!debouncedValue.trim()) {
      setShowPrediction(false);
      return;
    }

    // // 每5秒只能执行一次限制
    const now = Date.now();
    // if (now - lastRequestTime < 5000) {
    //   return;
    // }

    // 记录当前输入值和请求时间
    setLastInputValue(value);
    setLastRequestTime(now);

    // 隐藏之前的预测
    setShowPrediction(false);

    // 执行预测
    predictUserInput(debouncedValue);
  }, [debouncedValue]);

  // 监听用户输入变化，隐藏预测
  useEffect(() => {
    if (value !== lastInputValue && showPrediction) {
      setShowPrediction(false);
    }
  }, [value, lastInputValue, showPrediction]);

  // 应用预测建议
  const applyPrediction = useCallback((index: number = 0) => {
    if (predictions.length > 0 && predictions[index]) {
      const newValue = value + predictions[index];
      // 模拟onChange事件
      const syntheticEvent = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      setShowPrediction(false);
    }
  }, [predictions, value, onChange]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 检查是否正在使用输入法输入
    if (e.nativeEvent.isComposing) {
      return; // 正在输入法输入中，不处理键盘事件
    }
    
    if (showPrediction && predictions.length > 0) {
      // Tab键应用第一个建议
      if (e.key === 'Tab') {
        e.preventDefault();
        applyPrediction(0);
      }
      // Ctrl+数字键应用对应索引的建议
      else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < predictions.length) {
          applyPrediction(index);
        }
      }
    }
  }, [showPrediction, predictions, applyPrediction]);

  // 下拉菜单 - 使用新的 items API
  const menuItems = modelList.map(m => ({
    key: m.key,
    icon: m.icon,
    label: (
      <div>
        <div className="font-medium">{m.label}</div>
        <div className="text-xs text-gray-500">{m.description}</div>
      </div>
    ),
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedModel && setSelectedModel(key);
  };

  // 发送按钮样式 - 使用响应式设计，不依赖监听
  const sendDisabled = !value.trim();
  const sendBtnStyle = {
    position: 'absolute' as const,
    right: '12px',
    bottom: '-40px',
    width: 'clamp(36px, 4vw, 48px)', // 响应式宽度，最小36px，最大48px
    height: 'clamp(36px, 4vw, 48px)', // 响应式高度
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px #e0e0e0',
    border: 'none',
    background: isStreaming ? '#ff4d4f' : (sendDisabled ? (isDark ? '#4b5563' : '#f3f3f3') : '#1677ff'),
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '50%',
    zIndex: 10,
  };

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      marginTop: isEmpty ? 60 : 0,
      backgroundColor: isDark ? '#1f2937' : 'transparent'
    }}>
      <div
        style={{
          background: isDark ? '#1f2937' : '#fff',
          borderRadius: 24,
          boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px #eee',
          padding: 0,
          width: '80%',
          maxWidth: '900px',
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          border: isDark ? '2px solid #374151' : '2px solid #f3f3f3',
          marginBottom: 15,
          marginLeft: 10,
          marginRight: 10,
          position: 'relative', // 确保相对定位
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
        {/* 用户输入预测提示 */}
        {showPrediction && predictions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              transform: 'translateY(-100%)',
              background: isDark ? '#1e3a8a' : '#f0f8ff',
              border: isDark ? '1px solid #1e40af' : '1px solid #d0e7ff',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 12,
              color: isDark ? '#93c5fd' : '#1677ff',
              zIndex: 20,
              maxWidth: 500,
              wordWrap: 'break-word',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(22, 119, 255, 0.1)',
            }}
          >
            <div style={{ marginBottom: 6, fontSize: 11, color: isDark ? '#9ca3af' : '#666' }}>
              💡 AI补全建议 (Tab或Ctrl+数字键应用)
            </div>
            {predictions.slice(0, 5).map((prediction, index) => (
              <div
                key={index}
                style={{
                  marginBottom: index === predictions.length - 1 ? 0 : 4,
                  padding: '4px 8px',
                  background: index === 0 
                    ? (isDark ? '#1e40af' : '#e6f3ff') 
                    : (isDark ? '#374151' : '#f8f9fa'),
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: index === 0 
                    ? (isDark ? '1px solid #1d4ed8' : '1px solid #bae7ff') 
                    : (isDark ? '1px solid #4b5563' : '1px solid #e9ecef'),
                  transition: 'all 0.2s',
                }}
                onClick={() => applyPrediction(index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? '#1e40af' : '#e6f3ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index === 0 
                    ? (isDark ? '#1e40af' : '#e6f3ff') 
                    : (isDark ? '#374151' : '#f8f9fa');
                }}
              >
                <span style={{ fontWeight: 'bold', marginRight: 6 }}>
                  {index === 0 ? 'Tab' : `Ctrl+${index + 1}`}:
                </span>
                <span>{prediction}</span>
                {predictionLoading && index === 0 && (
                  <LoadingOutlined className="ml-2 text-xs" />
                )}
              </div>
            ))}
          </div>
        )}

          <TextArea
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? '正在回复中，您可以继续输入...' : placeholder}
            rows={1}
            disabled={false}
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'transparent',
              fontSize: 'clamp(15px, 1.5vw, 17px)', // 响应式字体大小
              padding: '24px 80px 24px 24px', // 固定右边距，确保按钮不遮挡文字
              borderRadius: 24,
              resize: 'none',
              color: isDark ? '#e5e7eb' : '#222',
              overflowY: 'auto',
              maxWidth: '100%',
              minHeight: 80,
              lineHeight: 1.5,
            }}
            className={`input-area-textarea ${isDark ? 'dark-placeholder' : 'light-placeholder'}`}
            onPressEnter={e => { 
              // 检查是否正在使用输入法输入
              if (e.nativeEvent.isComposing) {
                return; // 正在输入法输入中，不触发发送
              }
              // 检查输入框是否为空
              if (!value.trim()) {
                return; // 输入框为空，不触发发送
              }
              if (!e.shiftKey) { 
                e.preventDefault(); 
                onSend(); 
              } 
            }}
          />

          {/* 发送/停止按钮 */}
          <Tooltip title={isStreaming ? "停止生成" : "发送"}>
            <Button
                type="primary"
                shape="circle"
                icon={
                isStreaming
                    ? <StopCircleIcon size={Math.max(18, Math.min(22, window.innerWidth * 0.02))} isDark={isDark} />
                    : <SendOutlined rotate={-90} style={{fontSize: Math.max(14, Math.min(16, window.innerWidth * 0.015))}} />
                }
                size="small"
                disabled={isStreaming ? false : sendDisabled}
                onClick={isStreaming ? onStopStreaming : onSend}
                style={sendBtnStyle}
            />
            </Tooltip>
        </div>

        {/* 底部控制栏 */}
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(8px, 1vw, 12px)', 
          margin: 'clamp(12px, 2vw, 18px) 0 clamp(4px, 1vw, 6px) clamp(12px, 2vw, 18px)', 
          alignItems: 'center',
          flexWrap: 'wrap' // 在小屏幕上允许换行
        }}>
          <Dropdown
            menu={{
              items: menuItems,
              selectedKeys: [selectedModel],
              onClick: handleMenuClick
            }}
            trigger={['click']}
          >
            <Button
              icon={modelList.find(m => m.key === selectedModel)?.icon || <span style={{fontSize: 'clamp(12px, 1.2vw, 14px)'}}>🧠</span>}
              type="default"
              shape="round"
              size="middle"
              style={{ 
                borderWidth: 1, 
                fontWeight: 500, 
                fontSize: 'clamp(12px, 1.2vw, 14px)', 
                background: isDark ? '#374151' : '#fff',
                borderColor: isDark ? '#4b5563' : '#d1d5db',
                color: isDark ? '#e5e7eb' : '#374151',
                height: 'clamp(28px, 3.5vw, 36px)',
                padding: `0 clamp(12px, 1.5vw, 16px)`,
                minWidth: 'clamp(80px, 10vw, 120px)',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ 
                fontSize: 'clamp(11px, 1.1vw, 13px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {modelList.find(m => m.key === selectedModel)?.label || '深度思考'}
              </span> 
              <DownOutlined style={{ fontSize: 'clamp(10px, 1vw, 12px)' }} />
            </Button>
          </Dropdown>

          {/* 模型参数设置按钮 */}
          {setTopP && setTemperature && setMaxLength && setSystemPrompt && (
            <ModelSettings
              topP={topP}
              setTopP={setTopP}
              temperature={temperature}
              setTemperature={setTemperature}
              maxLength={maxLength || 3584}
              setMaxLength={setMaxLength}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
            />
          )}

          <Upload
            multiple
            showUploadList={false}
            customRequest={onFileUpload}
          >
            <Button 
              icon={<UploadOutlined style={{ fontSize: 'clamp(12px, 1.2vw, 14px)' }} />}
              type="default"
              shape="round"
              size="middle"
              style={{ 
                borderWidth: 1, 
                fontWeight: 500, 
                fontSize: 'clamp(12px, 1.2vw, 14px)', 
                background: isDark ? '#374151' : '#fff',
                borderColor: isDark ? '#4b5563' : '#d1d5db',
                color: isDark ? '#e5e7eb' : '#374151',
                height: 'clamp(28px, 3.5vw, 36px)',
                padding: `0 clamp(12px, 1.5vw, 16px)`,
                minWidth: 'clamp(70px, 8vw, 100px)',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ 
                fontSize: 'clamp(11px, 1.1vw, 13px)',
                whiteSpace: 'nowrap'
              }}>
                上传文件
              </span>
            </Button>
          </Upload>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
