import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AvatarContextType {
  avatarUrl: string;
  botAvatarUrl: string;
  generateNewAvatar: () => void;
  generateNewBotAvatar: () => void;
  updateBotAvatarForNewConversation: () => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
};

interface AvatarProviderProps {
  children: ReactNode;
}

const AvatarProvider: React.FC<AvatarProviderProps> = ({ children }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [botAvatarUrl, setBotAvatarUrl] = useState<string>('');

  const generateNewAvatar = () => {
    // 生成随机种子
    const randomSeed = Math.random().toString(36).substring(7);
    const randomBg = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd', '98d8c8', 'f7dc6f', 'bb8fce', '85c1e9'];
    const randomBgColor = randomBg[Math.floor(Math.random() * randomBg.length)];
    
    const newAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=${randomBgColor}`;
    setAvatarUrl(newAvatarUrl);
  };

  const generateNewBotAvatar = () => {
    // 生成随机种子
    const randomSeed = Math.random().toString(36).substring(7);
    const randomBg = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd', '98d8c8', 'f7dc6f', 'bb8fce', '85c1e9'];
    const randomBgColor = randomBg[Math.floor(Math.random() * randomBg.length)];
    
    const newBotAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=${randomBgColor}`;
    setBotAvatarUrl(newBotAvatarUrl);
  };

  const updateBotAvatarForNewConversation = () => {
    // 为新对话生成新的机器人头像
    generateNewBotAvatar();
  };

  useEffect(() => {
    // 初始化时生成头像
    generateNewAvatar();
    generateNewBotAvatar();
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarUrl, botAvatarUrl, generateNewAvatar, generateNewBotAvatar, updateBotAvatarForNewConversation }}>
      {children}
    </AvatarContext.Provider>
  );
};

export { AvatarProvider, useAvatar };
