import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Avatar, Typography, message as antdMessage } from 'antd';
import { UserOutlined, RobotOutlined, LoadingOutlined, CopyOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
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
import { useAvatar } from './AvatarContext';
import { beginHttpDownload } from '../Com';
import { useTheme } from '../contexts/ThemeContext';
import {
  EditMessageDialog,
  DeleteMessageDialog,
  MessageMetadataDialog,
} from '@/components/dialogs';
import { IconCopy, IconCopyCheck, IconRefresh } from '@tabler/icons-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import TokenSpeedIndicator from './TokenSpeedIndicator';
import ThinkingBlock from './ThinkingBlock';
import { useAppState } from '@/hooks/useAppState';

const { Text } = Typography;

interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
  metadata?: Record<string, unknown>;
  isLastMessage?: boolean;
}

// 统一风格的复制按钮组件
const CopyMessageButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      antdMessage.success('已复制到剪贴板');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      antdMessage.error('复制失败');
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer group relative"
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCopy();
            }
          }}
        >
          {copied ? (
            <IconCopyCheck size={16} className="text-blue-600" />
          ) : (
            <IconCopy size={16} />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? '已复制' : '复制'}</p>
      </TooltipContent>
    </Tooltip>
  );
};

// 代码块组件，包含高亮和复制功能
const CodeBlock: React.FC<{ children: string; className?: string }> = ({ children, className }) => {
  const { theme } = useTheme();
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
          className={`absolute top-3 right-3 z-10 p-2 rounded-md opacity-100 transition-all duration-200 hover:scale-105 ${
            theme === 'dark' 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`}
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
        style={theme === 'dark' ? tomorrow : tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '12px',
          fontSize: '14px',
          lineHeight: '1.6',
          padding: '20px',
          //paddingTop: language !== 'text' ? '35px' : '20px',
          paddingRight: '50px',
          backgroundColor: theme === 'dark' ? '#1a202c' : '#f8f9fa',
          border: theme === 'dark' ? 'none' : '1px solid #e9ecef',
          boxShadow: 'none'
        }}
        showLineNumbers={language !== 'text'}
        wrapLines={true}
        lineNumberStyle={{
          color: theme === 'dark' ? '#718096' : '#6c757d',
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
  setSpecialKwargs?: (kwargs: any) => void;
  onDownload?: (fileUrl: string) => void; // 下载处理函数
  onUpdateMessage?: (index: number, text: string) => void; // 消息编辑回调
  onDeleteMessage?: (index: number) => void; // 消息删除回调
}

const MainContent: React.FC<MainContentProps> = ({
  currentSessionType,
  chatbot,
  isStreaming = false,
  isWaiting = false,
  setSpecialKwargs,
  onDownload,
  onUpdateMessage,
  onDeleteMessage
}) => {
  const { theme } = useTheme();
  const { avatarUrl, botAvatarUrl } = useAvatar();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef(null);
  const messageSpeedRef = useRef<Record<string, number>>({});
  const [showWaiting, setShowWaiting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // 获取 token 速度状态
  const tokenSpeedState = useAppState((state) => state.tokenSpeed);
  const streamingContent = useAppState((state) => state.streamingContent);
  const streamingTokenSpeed = tokenSpeedState?.tokenSpeed ?? 0;

  // 智能滚动函数
  const scrollToBottom = (force = false) => {
    const element = messagesEndRef.current as unknown as HTMLDivElement;
    const container = element?.parentElement?.parentElement;

    if (element && container) {
      // 检查用户是否在底部附近
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // 如果用户不在底部附近且不是强制滚动，则不滚动
      if (!isNearBottom && !force && !isStreaming) {
        return;
      }

      // 使用 requestAnimationFrame 确保在正确的时机执行滚动
      requestAnimationFrame(() => {
        // 在流式回复过程中使用 instant 滚动，避免抖动
        const behavior = isStreaming && !force ? "instant" : "smooth";
        element.scrollIntoView({ behavior, block: "end" });
      });
    }
  };

  // 简单的防抖函数
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // 使用 useCallback 优化滚动函数
  const debouncedScrollToBottom = useCallback(
    debounce(() => scrollToBottom(), 100),
    [isStreaming]
  );

  useEffect(() => {
    // loop chatbot, convert to ChatMessage[]
    const message_buffer: ChatMessage[] = [];
    console.log('chatbot', chatbot);
    if (chatbot.length === 0) {
      messageSpeedRef.current = {};
    }

    for (let i = 0; i < chatbot.length; i++) {
      const user_str_msg: string = chatbot[i][0];
      const ai_str_msg: string = chatbot[i][1];
      if (user_str_msg && user_str_msg !== '') {
        message_buffer.push({
          id: `user-${i}-${Date.now()}`,
          sender: 'user',
          text: user_str_msg
        });
      }
      if (ai_str_msg && ai_str_msg !== '') {
        const isLastMessage = i === chatbot.length - 1;
        const messageKey = `bot-${i}`;
        const isStreamingMessage =
          isLastMessage && isStreaming && streamingContent?.thread_id;

        let speedValue: number | undefined;
        if (isStreamingMessage && streamingTokenSpeed > 0) {
          speedValue = streamingTokenSpeed;
          messageSpeedRef.current[messageKey] = streamingTokenSpeed;
        } else if (
          tokenSpeedState?.message === messageKey &&
          tokenSpeedState.tokenSpeed > 0
        ) {
          speedValue = tokenSpeedState.tokenSpeed;
          messageSpeedRef.current[messageKey] = tokenSpeedState.tokenSpeed;
        } else if (messageSpeedRef.current[messageKey] !== undefined) {
          speedValue = messageSpeedRef.current[messageKey];
        }
        message_buffer.push({
          id: `bot-${i}-${Date.now()}`,
          sender: 'bot',
          text: ai_str_msg,
          isLastMessage,
          metadata:
            speedValue && speedValue > 0
              ? { tokenSpeed: { tokenSpeed: speedValue } }
              : {},
        });
      }
    }
    setMessages(message_buffer);
    // set messages
    (messagesEndRef.current as unknown as HTMLDivElement)?.scrollIntoView({ behavior: "smooth" });
  }, [chatbot, isStreaming, tokenSpeedState, streamingContent?.thread_id]);

  useEffect(() => {
    setIsEmpty(chatbot.length === 0);
  }, [chatbot]);

  // 监听等待状态变化
  useEffect(() => {
    if (isWaiting) {
      setShowWaiting(true);
    } else {
      setShowWaiting(false);
    }
  }, [isWaiting]);

  // 统一的滚动处理逻辑
  useEffect(() => {
    // 只有在有新消息时才滚动
    if (messages.length > 0) {
      if (isStreaming) {
        // 流式回复时立即滚动，不使用动画
        scrollToBottom();
      } else {
        // 非流式回复时使用防抖滚动
        debouncedScrollToBottom();
      }
    }
  }, [messages, isStreaming, debouncedScrollToBottom]);



  const getModuleTitle = (module: string) => {
    const titles = {
      'ai_chat': 'AI对话',
      'academic_chat': '学术对话',
      'crazy_functions.Internet_GPT->连接网络回答问题': '联网搜索并回答',
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
      'academic_chat': '专注于学术领域的深度对话和讨论\n例如：寻找2025年强化学习相关论文，并进行总结',
      'crazy_functions.Internet_GPT->连接网络回答问题': '连接网络搜索最新信息，提供实时准确的答案',
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
      'crazy_functions.Internet_GPT->连接网络回答问题': '🌐',
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
      <div className={`flex-1 flex flex-col items-center justify-center px-8 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-6">{getModuleIcon(currentSessionType)}</div>
          <h1 className={`text-3xl font-bold mb-4 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {getModuleTitle(currentSessionType)}
          </h1>
          <p className={`text-lg leading-relaxed whitespace-pre-line ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {getModuleDescription(currentSessionType)}
          </p>
          <div className={`mt-8 text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            在下方输入框中开始您的对话...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-auto ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: theme === 'dark' ? '#4b5563 transparent' : '#d1d5db transparent',
        // WebKit滚动条样式
        '--scrollbar-width': '6px',
        '--scrollbar-track': 'transparent',
        '--scrollbar-thumb': theme === 'dark' ? '#4b5563' : '#d1d5db',
        '--scrollbar-thumb-hover': theme === 'dark' ? '#6b7280' : '#9ca3af',
        // 优化滚动性能
        scrollBehavior: 'auto',
        willChange: 'scroll-position'
      } as React.CSSProperties}
    >
      <div
        className="max-w-4xl mx-auto px-6 py-2"
        style={{
          // 内联样式定义滚动条
          scrollbarWidth: 'thin',
          scrollbarColor: theme === 'dark' ? '#4b5563 transparent' : '#d1d5db transparent',
          // 确保内容不会因为滚动而重排
          contain: 'layout style paint'
        }}
      >
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
                  src={message.sender === 'user' ? avatarUrl : botAvatarUrl}
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
                      ? (theme === 'dark' 
                          ? 'bg-gray-700 text-gray-200' 
                          : 'bg-gray-200 text-gray-800')
                      : (theme === 'dark' 
                          ? 'bg-gray-800 text-gray-200 border-l-4 border-r-4 border-b-4 border-t-8 border-blue-700' 
                          : 'bg-white text-gray-800 border-l-4 border-r-4 border-b-4 border-t-8 border-blue-200')
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
                                <code className={`px-1 py-0.5 rounded text-sm font-mono ${
                                  theme === 'dark' 
                                    ? 'bg-gray-700 text-gray-200' 
                                    : 'bg-gray-200 text-gray-800'
                                }`}>
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
                          h1: ({ children }) => <h1 className={`text-xl font-bold mb-1 leading-tight ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          }`}>{children}</h1>,
                          h2: ({ children }) => <h2 className={`text-lg font-bold mb-1 leading-tight ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          }`}>{children}</h2>,
                          h3: ({ children }) => <h3 className={`text-base font-bold mb-1 leading-tight ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          }`}>{children}</h3>,
                          blockquote: ({ children }) => (
                            <blockquote className={`border-l-4 pl-4 italic mb-1 ${
                              theme === 'dark' 
                                ? 'border-gray-600 text-gray-300' 
                                : 'border-gray-300 text-gray-700'
                            }`}>
                              {children}
                            </blockquote>
                          ),
                          hr: () => (
                            <hr className={`my-2 ${
                              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                            }`} style={{ border: 'none', borderTop: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, height: '1px' }} />
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto mb-3">
                              <table className={`min-w-full border ${
                                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                              }`}>{children}</table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className={`border px-3 py-2 font-semibold ${
                              theme === 'dark' 
                                ? 'border-gray-600 bg-gray-700 text-gray-200' 
                                : 'border-gray-300 bg-gray-50 text-gray-800'
                            }`}>
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className={`border px-3 py-2 ${
                              theme === 'dark' 
                                ? 'border-gray-600 text-gray-200' 
                                : 'border-gray-300 text-gray-800'
                            }`}>{children}</td>
                          ),
                          a: ({ children, href }) => {
                            // 检查是否为下载链接（通过文件扩展名或特殊标识）
                            const isDownloadLink = href && (
                              href.includes('/download') ||
                              href.includes('/file') ||
                              href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz|mp3|mp4|avi|mov|jpg|jpeg|png|gif|svg|txt|csv|json|xml|sql|py|js|ts|java|cpp|c|h|html|css|md|bib|enw)$/i) ||
                              href.includes('download=true') ||
                              href.includes('attachment')
                            );

                            if (isDownloadLink) {
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline inline-flex items-center"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (href && onDownload) {
                                      onDownload(href);
                                    } else if (href) {
                                      beginHttpDownload(href);
                                    }
                                  }}
                                  title="点击下载文件"
                                >
                                  {children}
                                  <DownloadOutlined className="ml-1" style={{ fontSize: '14px' }} />
                                </a>
                              );
                            }

                            // 普通链接
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 dark:text-blue-400 hover:underline"
                              >
                                {children}
                              </a>
                            );
                          }
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

                {/* 用户消息的操作按钮 */}
                {message.sender === 'user' && (
                  <div className="flex items-center justify-end gap-2 text-gray-500 text-xs mt-2">
                    <EditMessageDialog
                      message={message.text}
                      onSave={(newText) => {
                        if (onUpdateMessage) {
                          onUpdateMessage(index, newText);
                        }
                      }}
                    />
                    <DeleteMessageDialog
                      onDelete={() => {
                        if (onDeleteMessage) {
                          onDeleteMessage(index);
                        }
                      }}
                    />
                    <CopyMessageButton text={message.text} />
                  </div>
                )}

                {/* AI回复的操作按钮 - 只在回复结束后显示 */}
                {message.sender === 'bot' && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs mt-2">
                    <div className={`flex items-center gap-2 ${isStreaming ? 'hidden' : ''}`}>
                      <EditMessageDialog
                        message={message.text}
                        onSave={(newText) => {
                          if (onUpdateMessage) {
                            onUpdateMessage(index, newText);
                          }
                        }}
                      />
                      <CopyMessageButton text={message.text} />
                      <DeleteMessageDialog
                        onDelete={() => {
                          if (onDeleteMessage) {
                            onDeleteMessage(index);
                          }
                        }}
                      />
                      <MessageMetadataDialog metadata={message.metadata || {}} />

                      {/* 重新生成按钮 - 仅最后一条消息显示 */}
                      {index === messages.length - 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer group relative"
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                // TODO: 实现重新生成逻辑
                                console.log('Regenerate message');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  // TODO: 实现重新生成逻辑
                                }
                              }}
                            >
                              <IconRefresh size={16} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>重新生成</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Token 速度指示器 */}
                    <TokenSpeedIndicator
                      streaming={isStreaming && index === messages.length - 1}
                      metadata={message.metadata}
                    />
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
                  src={botAvatarUrl}
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