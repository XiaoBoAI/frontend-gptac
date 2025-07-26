import { Input, Button, Dropdown, Menu, Tooltip, message, Upload } from 'antd';
import { SendOutlined, GlobalOutlined, DownOutlined, ClearOutlined, LoadingOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import type { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';

const { TextArea } = Input;

const modelList = [
  { key: 'deepseek-chat', label: '深度对话', icon: <span style={{fontSize:18}}>🎓</span>, description: '适合对话和写作' },
  { key: 'deepseek-reasoner', label: '深度思考', icon: <span style={{fontSize:18}}>🧠</span>, description: '适合复杂推理和深度分析' },
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
}

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

// 处理文件上传
const handleUpload = async (options: RcCustomRequestOptions) => {
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
        message.success(`${(file as File).name} 上传成功`);
        onSuccess?.(result);
      } else {
        throw new Error(`上传失败: ${xhr.statusText}`);
      }
    });

    xhr.addEventListener('error', () => {
      const error = new Error('上传失败');
      console.error('上传错误:', error);
      message.error(`${(file as File).name} 上传失败`);
      onError?.(error);
    });

    xhr.open('POST', uploadUrl, true);
    xhr.send(formData);
  } catch (error) {
    console.error('上传错误:', error);
    message.error(`${(file as File).name} 上传失败`);
    onError?.(error as Error);
  }
};

const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onClear,
  onStopStreaming,
  currentModule = 'ai_chat',
  isEmpty = false,
  selectedModel = 'deepseek-chat',
  setSelectedModel,
  isStreaming = false,
}) => {
  const inputRef = useRef(null);
  const placeholder = modulePlaceholders[currentModule] || modulePlaceholders['ai_chat'];

  // 下拉菜单
  const menu = (
    <Menu selectedKeys={[selectedModel]} onClick={({ key }) => setSelectedModel && setSelectedModel(key)}>
      {modelList.map(m => (
        <Menu.Item key={m.key} icon={m.icon}>
          <div>
            <div className="font-medium">{m.label}</div>
            <div className="text-xs text-gray-500">{m.description}</div>
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );

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
          width: 600,
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          border: '2px solid #f3f3f3',
          marginBottom: 10,
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
              <span>AI正在回复中...</span>
            </div>
          )}
          <TextArea
            ref={inputRef}
            value={value}
            onChange={onChange}
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
          <Dropdown overlay={menu} trigger={['click']}>
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
            customRequest={handleUpload}
          >
            <Button icon={<UploadOutlined />}>上传文件</Button>
          </Upload>

        </div>
      </div>
    </div>
  );
};

export default InputArea;
