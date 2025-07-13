import React from 'react';
import { Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Text } = Typography;

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface MainContentProps {
  currentModule: string;
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isEmpty: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ 
  currentModule, 
  messages, 
  messagesEndRef, 
  isEmpty 
}) => {
  const getModuleTitle = (module: string) => {
    const titles = {
      'ai_chat': 'AI对话',
      'academic_chat': '学术对话',
      'paper_qa': '论文问答',
      'paper_write': '论文写作',
      'paper_translate': '论文翻译'
    };
    return titles[module as keyof typeof titles] || 'AI对话';
  };

  const getModuleDescription = (module: string) => {
    const descriptions = {
      'ai_chat': '与AI进行智能对话，获取各种问题的答案',
      'academic_chat': '专注于学术领域的深度对话和讨论',
      'paper_qa': '针对论文内容进行问答，帮助理解学术文献',
      'paper_write': '辅助论文写作，提供写作建议和内容生成',
      'paper_translate': '学术论文翻译服务，支持多语言互译'
    };
    return descriptions[module as keyof typeof descriptions] || '与AI进行智能对话';
  };

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-6">💬</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {getModuleTitle(currentModule)}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {getModuleDescription(currentModule)}
          </p>
          <div className="mt-8 text-sm text-gray-500">
            在下方输入框中开始您的对话...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex mb-6 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex max-w-3xl ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* 头像 */}
              <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                <Avatar
                  size={40}
                  icon={message.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: message.sender === 'user' ? '#1677ff' : '#52c41a',
                    color: 'white'
                  }}
                />
              </div>
              
              {/* 消息内容 */}
              <div
                className={`flex-1 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-6 py-4 rounded-2xl max-w-full ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  style={{
                    wordBreak: 'break-word',
                    lineHeight: '1.6'
                  }}
                >
                  {message.sender === 'bot' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <div className="mb-3 last:mb-0">{children}</div>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
                              <code>{children}</code>
                            </pre>
                          );
                        },
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-3">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-3">
                            <table className="min-w-full border border-gray-300">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-300 px-3 py-2">{children}</td>
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                  )}
                </div>
                
                {/* 发送时间 */}
                <div
                  className={`text-xs text-gray-400 mt-2 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {new Date().toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MainContent; 