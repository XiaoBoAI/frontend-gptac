import React, { useState } from 'react';
import { Button, Modal, Slider, Input, Space, Typography, Divider } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ModelSettingsProps {
  topP: number;
  setTopP: (value: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  maxLength: number | null;
  setMaxLength: React.Dispatch<React.SetStateAction<number | null>>;
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
  topP,
  setTopP,
  temperature,
  setTemperature,
  maxLength,
  setMaxLength,
  systemPrompt,
  setSystemPrompt,
}) => {
  const { isDark } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempTopP, setTempTopP] = useState(topP);
  const [tempTemperature, setTempTemperature] = useState(temperature);
  const [tempMaxLength, setTempMaxLength] = useState(maxLength);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(systemPrompt);

  const showModal = () => {
    // 打开模态框时，将当前值复制到临时状态
    setTempTopP(topP);
    setTempTemperature(temperature);
    setTempMaxLength(maxLength);
    setTempSystemPrompt(systemPrompt);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    // 确认时，将临时状态的值同步到实际状态
    setTopP(tempTopP);
    setTemperature(tempTemperature);
    setMaxLength(tempMaxLength);
    setSystemPrompt(tempSystemPrompt);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    // 取消时，不保存更改
    setIsModalVisible(false);
  };

  return (
    <>
      <Button
        className="input-area-button"
        icon={<SettingOutlined style={{ fontSize: 'clamp(12px, 1.2vw, 14px)' }} />}
        type="default"
        shape="round"
        size="middle"
        onClick={showModal}
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
          模型参数
        </span>
      </Button>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ color: '#1677ff' }} />
            <span>模型参数设置</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
        okText="确认"
        cancelText="取消"
        style={{ top: 20 }}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Top-p 设置 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong style={{ color: '#52c41a' }}>Top-p (nucleus sampling)</Text>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>{tempTopP}</Text>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={tempTopP}
              onChange={setTempTopP}
              trackStyle={{ backgroundColor: '#52c41a' }}
              handleStyle={{ borderColor: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              控制输出的随机性，值越高输出越随机，值越低输出越确定
            </Text>
          </div>

          <Divider />

          {/* Temperature 设置 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ color: '#52c41a' }}>Temperature</Text>
              </div>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>{tempTemperature}</Text>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={tempTemperature}
              onChange={setTempTemperature}
              trackStyle={{ backgroundColor: '#52c41a' }}
              handleStyle={{ borderColor: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              控制输出的创造性，值越高输出越有创意，值越低输出越保守
            </Text>
          </div>

          <Divider />

          {/* Max Length 设置 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong style={{ color: '#52c41a' }}>Local LLM MaxLength</Text>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>{tempMaxLength || 3584}</Text>
            </div>
            <Slider
              min={512}
              max={32768}
              step={512}
              value={tempMaxLength || 3584}
              onChange={setTempMaxLength}
              trackStyle={{ backgroundColor: '#52c41a' }}
              handleStyle={{ borderColor: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              设置模型输出的最大长度，值越大输出越长但可能更慢
            </Text>
          </div>

          <Divider />

          {/* System Prompt 设置 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#52c41a' }}>System prompt</Text>
            </div>
            <TextArea
              value={tempSystemPrompt}
              onChange={(e) => setTempSystemPrompt(e.target.value)}
              rows={4}
              placeholder="输入系统提示词，用于指导AI的行为..."
              style={{
                border: isDark ? '1px solid #4b5563' : '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: isDark ? '#374151' : '#fff',
                color: isDark ? '#e5e7eb' : '#000',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              设置AI的系统提示词，影响AI的回复风格和行为
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ModelSettings;
