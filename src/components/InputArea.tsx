import { Input, Button, Dropdown, Menu, Tooltip, message, Upload } from 'antd';
import { SendOutlined, GlobalOutlined, DownOutlined, ClearOutlined, LoadingOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';

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
const StopCircleIcon: React.FC<{size?:number}> = ({size=22}) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" stroke="#222" strokeWidth="2" fill="none"/>
    <rect x="7.5" y="7.5" width="7" height="7" rx="2" fill="#222" />
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
}) => {
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


  // 防抖处理用户输入
  const debouncedValue = useDebounce(value, 1000);

  // 预测用户输入的API调用
  const predictUserInput = async (inputText: string) => {
    try {
      const httpUrl = import.meta.env.VITE_HTTP_URL || 'http://localhost:28000';

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

  // 发送按钮样式
  const sendDisabled = !value.trim();
  const sendBtnStyle = {
    position: 'absolute' as const,
    right: 12,
    bottom: -40,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px #e0e0e0',
    border: 'none',
    background: isStreaming ? '#ff4d4f' : (sendDisabled ? '#f3f3f3' : '#1677ff'),
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: isEmpty ? 80 : 24 }}>



      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 2px 16px #eee',
          padding: 0,
          width: '80%',
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          border: '2px solid #f3f3f3',
          marginBottom: 10,
          marginLeft: 10,
          marginRight: 10,
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          {/* 流式回复状态指示器 */}
          {isStreaming && (
            <div style={{
              position: 'absolute',
              top: 8,
              left: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#1677ff',
              zIndex: 1,
            }}>
              <LoadingOutlined style={{ fontSize: 12 }} />
              <span>回复中...</span>
            </div>
          )}
        {/* 用户输入预测提示 */}
        {showPrediction && predictions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              transform: 'translateY(-100%)',
              background: '#f0f8ff',
              border: '1px solid #d0e7ff',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 12,
              color: '#1677ff',
              zIndex: 20,
              maxWidth: 500,
              wordWrap: 'break-word',
              boxShadow: '0 2px 8px rgba(22, 119, 255, 0.1)',
            }}
          >
            <div style={{ marginBottom: 6, fontSize: 11, color: '#666' }}>
              💡 AI补全建议 (Tab或Ctrl+数字键应用)
            </div>
            {predictions.slice(0, 5).map((prediction, index) => (
              <div
                key={index}
                style={{
                  marginBottom: index === predictions.length - 1 ? 0 : 4,
                  padding: '4px 8px',
                  background: index === 0 ? '#e6f3ff' : '#f8f9fa',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: index === 0 ? '1px solid #bae7ff' : '1px solid #e9ecef',
                  transition: 'all 0.2s',
                }}
                onClick={() => applyPrediction(index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e6f3ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index === 0 ? '#e6f3ff' : '#f8f9fa';
                }}
              >
                <span style={{ fontWeight: 'bold', marginRight: 6 }}>
                  {index === 0 ? 'Tab' : `Ctrl+${index + 1}`}:
                </span>
                <span>{prediction}</span>
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
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={false}
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'transparent',
              fontSize: 17,
              padding: isStreaming ? '32px 64px 24px 24px' : '24px 64px 24px 24px',
              borderRadius: 24,
              resize: 'none',
              color: '#222',
            }}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); onSend(); } }}
          />

          {/* 发送/停止按钮 */}
          <Tooltip title={isStreaming ? "停止生成" : "发送"}>
            <Button
                type="primary"
                shape="circle"
                icon={
                isStreaming
                    ? <StopCircleIcon size={22} />
                    : <SendOutlined rotate={-90} style={{fontSize:16}} />
                }
                size="small"
                disabled={isStreaming ? false : sendDisabled}
                onClick={isStreaming ? onStopStreaming : onSend}
                style={sendBtnStyle}
            />
            </Tooltip>
        </div>

        {/* 底部控制栏 */}
        <div style={{ display: 'flex', gap: 12, margin: '18px 0 6px 18px', alignItems: 'center' }}>
          <Dropdown 
            menu={{ 
              items: menuItems, 
              selectedKeys: [selectedModel], 
              onClick: handleMenuClick 
            }} 
            trigger={['click']}
          >
            <Button
              icon={modelList.find(m => m.key === selectedModel)?.icon || <span style={{fontSize:14}}>🧠</span>}
              type="default"
              shape="round"
              size="middle"
              style={{ borderWidth: 1, fontWeight: 500, fontSize: 14, background: '#fff' }}
            >
              {modelList.find(m => m.key === selectedModel)?.label || '深度思考'} <DownOutlined />
            </Button>
          </Dropdown>

          <Upload
            multiple
            showUploadList={false}
            customRequest={onFileUpload}
          >
            <Button icon={<UploadOutlined />}>上传文件</Button>
          </Upload>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
