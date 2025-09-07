import React from 'react';
import { Progress, Modal } from 'antd';

interface ProgressBarProps {
  visible: boolean;
  percent: number;
  title?: string;
  description?: string;
  onCancel?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  visible,
  percent,
  title = '处理中...',
  description,
  onCancel
}) => {
  return (
    <Modal
      title={title}
      open={visible}
      closable={!!onCancel}
      maskClosable={false}
      footer={null}
      width={400}
      centered
      onCancel={onCancel}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Progress
          percent={Math.round(percent)}
          status={percent >= 100 ? 'success' : 'active'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        {description && (
          <div style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
            {description}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProgressBar;
