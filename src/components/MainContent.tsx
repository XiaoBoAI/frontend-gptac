import React, { useRef, useState, useEffect } from 'react';
import { Avatar, Typography, message as antdMessage } from 'antd';
import { UserOutlined, RobotOutlined, LoadingOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import 'github-markdown-css';
import './MainContent.css';

const { Text } = Typography;

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

// 代码块组件，包含高亮和复制功能
const CodeBlock: React.FC<{ children: string; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  
  // 从className中提取语言类型
  const language = className ? className.replace('language-', '') : 'text';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      antdMessage.success('代码已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      antdMessage.error('复制失败');
    }
  };

  // 语言名称映射
  const getLanguageName = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'py': 'Python',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'ruby': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'rust': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'sql': 'SQL',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'toml': 'TOML',
      'ini': 'INI',
      'sh': 'Shell',
      'bash': 'Bash',
      'zsh': 'Zsh',
      'ps1': 'PowerShell',
      'powershell': 'PowerShell',
      'dockerfile': 'Dockerfile',
      'docker': 'Dockerfile',
      'gitignore': 'Git Ignore',
      'gitattributes': 'Git Attributes',
      'markdown': 'Markdown',
      'md': 'Markdown',
      'txt': 'Text',
      'text': 'Text'
    };
    return languageMap[lang.toLowerCase()] || lang;
  };

  return (
    <div className="relative group my-4">
      {/* 复制按钮 */}
              <button
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 p-2 rounded-md bg-gray-700 text-gray-300 opacity-100 transition-all duration-200 hover:bg-gray-600 hover:scale-105"
          title="复制代码"
        >
        {copied ? (
          <CheckOutlined style={{ fontSize: 16 }} />
        ) : (
          <CopyOutlined style={{ fontSize: 16 }} />
        )}
      </button>
      
      {/* 语言标签 */}
      {/* {language !== 'text' && (
        <div className="absolute -top-1 left-1 z-10 px-2 py-1 text-xs bg-gray-700 text-blue-500 rounded-md opacity-90 font-medium">
          {getLanguageName(language)}
        </div>
      )} */}
      
      {/* 代码高亮 */}
      <SyntaxHighlighter
        language={language === 'text' ? undefined : language}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '12px',
          fontSize: '14px',
          lineHeight: '1.6',
          padding: '20px',
          //paddingTop: language !== 'text' ? '35px' : '20px',
          paddingRight: '50px',
          backgroundColor: '#1a202c',
          border: 'none',
          boxShadow: 'none'
        }}
        showLineNumbers={language !== 'text'}
        wrapLines={true}
        lineNumberStyle={{
          color: '#718096',
          fontSize: '12px',
          paddingRight: '16px',
          minWidth: '2.5em'
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

interface MainContentProps {
  currentSessionType: string;
  chatbot: string[][];
  //currentMessages: ChatMessage[];
  // isEmpty: boolean;
  isStreaming?: boolean; // 是否正在流式回复
  isWaiting?: boolean; // 是否正在等待回复
}

const MainContent: React.FC<MainContentProps> = ({
  currentSessionType,
  chatbot,
  isStreaming = false,
  isWaiting = false
}) => {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef(null);
  const [showWaiting, setShowWaiting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    // loop chatbot, convert to ChatMessage[]
    //console.log('chatbot update');
    const message_buffer: ChatMessage[] = [];
    console.log('chatbot', chatbot);
    for (let i = 0; i < chatbot.length; i++) {
      const user_str_msg: string = chatbot[i][0];
      const ai_str_msg: string = chatbot[i][1];
      if (user_str_msg && user_str_msg !== '') {
        message_buffer.push({
          sender: 'user',
          text: user_str_msg
        });
      }
      if (ai_str_msg && ai_str_msg !== '') {
        message_buffer.push({
          sender: 'bot',
          text: ai_str_msg
        });
      }
    }
    setMessages(message_buffer);
    // set messages
    (messagesEndRef.current as unknown as HTMLDivElement)?.scrollIntoView({ behavior: "smooth" });
  }, [chatbot]);

  useEffect(() => {
    setIsEmpty(chatbot.length === 0);
  }, [chatbot]);


  useEffect(() => {
    // 消息更新后滚动到底部
    const element = messagesEndRef.current as unknown as HTMLDivElement;
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // 监听等待状态变化
  useEffect(() => {
    if (isWaiting) {
      setShowWaiting(true);
    } else {
      setShowWaiting(false);
    }
  }, [isWaiting]);

  // 监听消息变化和流式状态，滚动到底部
  useEffect(() => {
    const element = messagesEndRef.current as unknown as HTMLDivElement;
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isStreaming]);



  const getModuleTitle = (module: string) => {
    const titles = {
      'ai_chat': 'AI对话',
      'academic_chat': '学术对话',
      'paper_qa': '快速论文解读',
      'paper_write': '论文写作',
      'paper_translate': '论文翻译',
      'document_analysis': '文档分析',
      'calculator': '计算器',
      'image_generator': '图像生成',
      'data_analysis': '数据分析',
      'user_profile': '个人中心',
      'help': '帮助文档'
    };
    return titles[module as keyof typeof titles] || 'AI对话';
  };

  const getModuleDescription = (module: string) => {
    const descriptions = {
      'ai_chat': '与AI进行智能对话，获取各种问题的答案',
      'academic_chat': '专注于学术领域的深度对话和讨论',
      'paper_qa': '针对论文进行快速解读，帮助理解学术文献',
      'paper_write': '辅助论文写作，提供写作建议和内容生成',
      'paper_translate': '学术论文翻译服务，支持多语言互译',
      'document_analysis': '智能分析文档内容，提取关键信息',
      'calculator': '智能计算器，支持复杂数学运算',
      'image_generator': 'AI图像生成，根据描述创建图片',
      'data_analysis': '数据分析工具，帮助理解和可视化数据',
      'user_profile': '管理个人设置和偏好',
      'help': '查看使用指南和常见问题'
    };
    return descriptions[module as keyof typeof descriptions] || '与AI进行智能对话';
  };

  const getModuleIcon = (module: string) => {
    const icons = {
      'ai_chat': '🤖',
      'academic_chat': '🎓',
      'paper_qa': '❓',
      'paper_write': '✍️',
      'paper_translate': '��',
      'document_analysis': '📄',
      'calculator': '🧮',
      'image_generator': '🎨',
      'data_analysis': '📊',
      'user_profile': '��',
      'help': '❓'
    };
    return icons[module as keyof typeof icons] || '💬';
  };

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-6">{getModuleIcon(currentSessionType)}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {getModuleTitle(currentSessionType)}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {getModuleDescription(currentSessionType)}
          </p>
          <div className="mt-8 text-sm text-gray-500">
            在下方输入框中开始您的对话...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#d1d5db transparent',
      // WebKit滚动条样式
      '--scrollbar-width': '6px',
      '--scrollbar-track': 'transparent',
      '--scrollbar-thumb': '#d1d5db',
      '--scrollbar-thumb-hover': '#9ca3af'
    } as React.CSSProperties}>
      <div className="max-w-4xl mx-auto px-6 py-2" style={{
        // 内联样式定义滚动条
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db transparent'
      }}>
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
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-white text-gray-800 border-l-4 border-r-4 border-b-4 border-t-8 border-blue-200'
                  }`}
                  style={{
                    wordBreak: 'break-word',
                    lineHeight: '1.6'
                  }}
                >
                  {message.sender === 'bot' ? (
                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[
                          remarkGfm,
                          [remarkMath, { singleDollarTextMath: true }]
                        ]}
                        rehypePlugins={[
                          rehypeRaw,
                          [rehypeKatex, {
                            strict: false,
                            throwOnError: false,
                            errorColor: '#cc0000',
                            macros: {
                              "\\RR": "\\mathbb{R}",
                              "\\NN": "\\mathbb{N}",
                              "\\ZZ": "\\mathbb{Z}",
                              "\\QQ": "\\mathbb{Q}",
                              "\\CC": "\\mathbb{C}"
                            }
                          }]
                        ]}
                        remarkRehypeOptions={{
                          footnoteLabel: '参考文献',
                          footnoteBackLabel: '返回正文'
                        }}
                        components={{
                          p: ({ children }) => <div className="mb-0.5 last:mb-0">{children}</div>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            if (isInline) {
                              return (
                                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm text-gray-800 font-mono">
                                  {children}
                                </code>
                              );
                            }
                            // 使用自定义的代码块组件
                            return <CodeBlock className={className}>{String(children)}</CodeBlock>;
                          },
                          ul: ({ children }) => <ul className="list-disc list-outside mb-1 ml-4 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-outside mb-1 ml-4 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="mb-0.5 leading-relaxed pl-1">{children}</li>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-1 leading-tight">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mb-1 leading-tight">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold mb-1 leading-tight">{children}</h3>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-1">
                              {children}
                            </blockquote>
                          ),
                          hr: () => (
                            <hr className="my-2 border-gray-300" style={{ border: 'none', borderTop: '1px solid #e5e7eb', height: '1px' }} />
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
                      {/* 如果是最后一条消息且正在流式回复，显示光标 */}
                      {/* {index === messages.length - 1 && isStreaming && (
                        <span className="inline-block w-2 h-5 bg-green-500 ml-1 animate-pulse"></span>
                      )} */}
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                  )}
                </div>

                {/* 发送时间 - 只在用户消息显示 */}
                {/* {message.sender === 'user' && (
                  <div className="text-xs text-gray-400 mt-2 text-right">
                    {new Date().toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )} */}

                {/* 用户消息的复制按钮 */}
                {message.sender === 'user' && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.text).then(() => {
                          antdMessage.success('已复制到剪贴板');
                          setCopiedMessageId(message.text);
                          setTimeout(() => {
                            setCopiedMessageId(null);
                          }, 2000);
                        }).catch(() => {
                          antdMessage.error('复制失败');
                        });
                      }}
                      className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none shadow-none"
                      style={{ padding: 0, outline: 'none' }}
                      title="复制"
                    >
                      {copiedMessageId === message.text ? (
                        <CheckOutlined style={{ fontSize: 12, fontWeight: 'bold' }} />
                      ) : (
                        <CopyOutlined style={{ fontSize: 12, fontWeight: 'bold' }} />
                      )}
                    </button>
                  </div>
                )}

                {/* AI回复的复制按钮 - 只在回复结束后显示 */}
                {message.sender === 'bot' && !isStreaming && (
                  <div className="flex justify-start mt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.text).then(() => {
                          antdMessage.success('已复制到剪贴板');
                          setCopiedMessageId(message.text);
                          setTimeout(() => {
                            setCopiedMessageId(null);
                          }, 2000);
                        }).catch(() => {
                          antdMessage.error('复制失败');
                        });
                      }}
                      className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none shadow-none"
                      style={{ padding: 0, outline: 'none' }}
                      title="复制"
                    >
                      {copiedMessageId === message.text ? (
                        <CheckOutlined style={{ fontSize: 12, fontWeight: 'bold' }} />
                      ) : (
                        <CopyOutlined style={{ fontSize: 12, fontWeight: 'bold' }} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 等待回复的动态图标 */}
        {showWaiting && (
          <div key="waiting-message" className="flex justify-start mb-6">
            <div className="flex max-w-3xl flex-row">
              {/* 机器人头像 */}
              <div className="flex-shrink-0 mr-3">
                <Avatar
                  size={40}
                  icon={<RobotOutlined />}
                  style={{
                    backgroundColor: '#52c41a',
                    color: 'white'
                  }}
                />
              </div>

              {/* 等待动画 */}
              <div className="flex-1 text-left">
                <div className="inline-block px-6 py-4 rounded-2xl bg-white text-gray-800 border-l-4 border-r-4 border-b-4 border-t-8 border-blue-200">
                  <div className="flex items-center space-x-2">
                    <LoadingOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                    <span className="text-gray-600">正在回复中...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MainContent;