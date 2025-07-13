import { List, Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatProps {
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const Chat: React.FC<ChatProps> = ({ messages, messagesEndRef }) => {
  return (
    <div className="chat-container flex-grow overflow-y-auto h-full pb-24 bg-gray-50">
      <List
        className="message-list"
        itemLayout="horizontal"
        dataSource={messages}
        renderItem={(item: ChatMessage, index) => (
          <List.Item className={`message-item ${item.sender}`} key={index}>
            <List.Item.Meta
              avatar={
                item.sender === 'bot' ? (
                  <Avatar icon={<RobotOutlined />} className="bot-avatar" />
                ) : (
                  <Avatar icon={<UserOutlined />} className="user-avatar" />
                )
              }
              description={<ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>}
            />
          </List.Item>
        )}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Chat; 