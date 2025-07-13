import { Input, Button, Dropdown, Menu } from 'antd';
import { SendOutlined, GlobalOutlined, DownOutlined, ClearOutlined } from '@ant-design/icons';
import React, { useRef } from 'react';

const { TextArea } = Input;

const modelList = [
  { key: 'deep', label: '深度思考', icon: <span style={{fontSize:18}}>🧠</span>, description: '适合复杂推理和深度分析' },
  { key: 'search', label: '全网搜索', icon: <GlobalOutlined />, description: '实时搜索最新信息' },
  { key: 'creative', label: '创意写作', icon: <span style={{fontSize:18}}>✨</span>, description: '适合创意和写作任务' },
  { key: 'academic', label: '学术助手', icon: <span style={{fontSize:18}}>🎓</span>, description: '专注于学术研究和论文' },
];

interface InputAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onClear: () => void;
  currentModule?: string;
  isEmpty?: boolean;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
}

const modulePlaceholders: Record<string, string> = {
  ai_chat: '与AI进行智能对话，输入您的问题...',
  academic_chat: '进行学术讨论，输入您的学术问题...',
  paper_qa: '针对论文内容提问，帮助理解学术文献...',
  paper_write: '输入您的写作需求，AI将协助您完成论文...',
  paper_translate: '输入需要翻译的论文内容...',
};

const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onClear,
  currentModule = 'ai_chat',
  isEmpty = false,
  selectedModel = 'deep',
  setSelectedModel,
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
    background: sendDisabled ? '#f3f3f3' : '#1677ff',
    color: sendDisabled ? '#bfbfbf' : '#fff',
    cursor: sendDisabled ? 'not-allowed' : 'pointer',
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
          <TextArea
            ref={inputRef}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'transparent',
              fontSize: 17,
              padding: '24px 64px 24px 24px',
              borderRadius: 24,
              resize: 'none',
              color: '#222',
            }}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); onSend(); } }}
          />
          {/* 发送按钮 */}
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined rotate={-90} style={{fontSize:16}} />}
            size="small"
            disabled={sendDisabled}
            onClick={onSend}
            style={sendBtnStyle}
          />
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
          
          {/* 清空按钮 */}
          <Button
            icon={<ClearOutlined />}
            type="text"
            size="small"
            onClick={onClear}
            style={{ color: '#666', fontSize: 12 }}
          >
            清空对话
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputArea; 