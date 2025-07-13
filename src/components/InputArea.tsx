import { Input, Button, Dropdown, Menu } from 'antd';
import { SendOutlined, GlobalOutlined, DownOutlined } from '@ant-design/icons';
import React, { useRef } from 'react';

const { TextArea } = Input;

const modelList = [
  { key: 'deep', label: '深度思考', icon: <span style={{fontSize:18}}>🧠</span> },
  { key: 'search', label: '全网搜索', icon: <GlobalOutlined /> },
];

interface InputAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  currentModule?: string;
  isEmpty?: boolean;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
}

const modulePlaceholders: Record<string, string> = {
  chat: '搜索、提问或发消息',
  ai_search: '搜索、提问或发消息',
  ai_writing: '请输入写作需求...',
  ai_programming: '请输入编程问题或需求...',
};

const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  currentModule = 'chat',
  isEmpty = false,
  selectedModel = 'deep',
  setSelectedModel,
}) => {
  const inputRef = useRef(null);
  const placeholder = modulePlaceholders[currentModule] || modulePlaceholders['chat'];

  // 下拉菜单
  const menu = (
    <Menu selectedKeys={[selectedModel]} onClick={({ key }) => setSelectedModel && setSelectedModel(key)}>
      {modelList.map(m => (
        <Menu.Item key={m.key} icon={m.icon}>{m.label}</Menu.Item>
      ))}
    </Menu>
  );

  // 发送按钮样式
  const sendDisabled = !value.trim();
  const sendBtnStyle = {
    position: 'absolute' as const,
    right: 12,        // 从 16 改为 12
    bottom: -40,       // 从 16 改为 12  
    width: 36,        // 从 44 改为 36
    height: 36,       // 从 44 改为 36
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
          marginBottom: 10, // 新增这一行，设置底部间距
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
        {/* 底部模型选择按钮 */}
        <div style={{ display: 'flex', gap: 12, margin: '18px 0 6px 18px' }}>
          <Dropdown overlay={menu} trigger={['click']}>
            <Button
              icon={<span style={{fontSize:14}}>🧠</span>}
              type="default"
              shape="round"
              size="middle"
              style={{ borderWidth: 1, fontWeight: 500, fontSize: 14, background: '#fff' }}
            >
              {modelList.find(m => m.key === selectedModel)?.label || '深度思考'} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default InputArea; 