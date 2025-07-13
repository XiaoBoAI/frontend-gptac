import React from 'react';
import AISearch from './modules/AISearch';
import AIWriting from './modules/AIWriting';
import AIProgramming from './modules/AIProgramming';
import Chat from './modules/Chat';
import AIChat from './modules/AIChat';
import AcademicChat from './modules/AcademicChat';
import PaperQA from './modules/PaperQA';
import PaperWrite from './modules/PaperWrite';
import PaperTranslate from './modules/PaperTranslate';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface MainContentProps {
  currentModule: string;
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MainContent: React.FC<MainContentProps> = ({ currentModule, messages, messagesEndRef }) => {
  switch (currentModule) {
    case 'ai_chat':
      return <AIChat messages={messages} messagesEndRef={messagesEndRef} />;
    case 'academic_chat':
      return <AcademicChat />;
    case 'paper_qa':
      return <PaperQA />;
    case 'paper_write':
      return <PaperWrite />;
    case 'paper_translate':
      return <PaperTranslate />;
    default:
      return <Chat messages={messages} messagesEndRef={messagesEndRef} />;
  }
};

export default MainContent; 