import { Avatar, Menu, List, Typography, Badge, Button, Tooltip, Spin, message } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState, useEffect, useMemo } from 'react';
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from '../Com';
import { useTheme } from '@/hooks/useTheme';
import {
  EditOutlined,
  TranslationOutlined,
  FileTextOutlined,
  LoadingOutlined,
  ApiOutlined,
} from '@ant-design/icons';

const CACHE_KEY = 'core_functional_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

const getFromCache = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  return data;
};

const setToCache = (data: any) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

const BasicFunctions: React.FC<any> = ({
  currentModule,
  onSelectModule,
  setCurrentModule,
  setSpecialKwargs,
  specialKwargs,
}) => {
  const { isDark } = useTheme();
  const [selectedBasicFunction, setSelectedBasicFunction] = useState<string | null>(null);
  const [basicFunctionItems, setBasicFunctionItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const menuTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  if (!Array.isArray(basicFunctionItems)) {
    return null;
  }

  const fetchCoreFunctional = async (signal?: AbortSignal) => {
    try {
      const cachedData = getFromCache();
      if (cachedData) {
        const dynamicItems = Object.entries(cachedData).map(([key, value], index) => ({
          key: key.toLowerCase().replace(/\s+/g, '_'),
          label: key,
          icon: index === 0 ? <EditOutlined /> :
                index === 1 ? <TranslationOutlined /> :
                <FileTextOutlined />
        }));
        setBasicFunctionItems(dynamicItems);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/core_functional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        setToCache(data);
        const dynamicItems = Object.entries(data).map(([key, value], index) => ({
          key: key.toLowerCase().replace(/\s+/g, '_'),
          label: key,
          icon: index === 0 ? <EditOutlined /> :
                index === 1 ? <TranslationOutlined /> :
                <FileTextOutlined />
        }));
        setBasicFunctionItems(dynamicItems);
      } else {
        message.error('获取基础功能列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch core functional items:', error);
      message.error('获取基础功能列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        await fetchCoreFunctional(controller.signal);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('加载基础功能失败', err);
        }
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, []);

  const handleClick: MenuProps['onClick'] = (e) => {
    setSelectedBasicFunction(e.key);
    setCurrentModule('basic');
    setSpecialKwargs({
      ...specialKwargs,
      core_function: e.key,
    })
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 h-full ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载基础功能中...</span>
      </div>
    );
  }

  // 如果没有数据，显示空状态
  if (basicFunctionItems.length === 0) {
    return (
      <div className={`text-center p-8 h-full ${
        isDark ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'
      }`}>
        <ApiOutlined className="text-2xl mb-2" />
        <div>暂无基础功能</div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto p-2 basic-functions-container ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      <Menu
        mode="inline"
        selectedKeys={selectedBasicFunction ? [selectedBasicFunction] : []}
        style={{ 
          borderRight: 0, 
          flex: 'none',
          backgroundColor: isDark ? '#111827' : '#ffffff'
        }}
        className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
        theme={menuTheme}
        items={basicFunctionItems.map(item => ({
          key: item.key,
          label: (
            <div className="flex items-center">
              <span className={`mr-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.icon}</span>
              <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{item.label}</span>
            </div>
          ),
        }))}
        onClick={handleClick}
      />
    </div>
  );
};

export default BasicFunctions;

// 添加滚动条样式
const scrollbarStyles = `
  /* 滚动条样式优化 */
  .basic-functions-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .basic-functions-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .basic-functions-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  
  .basic-functions-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

// 动态添加样式到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  document.head.appendChild(styleElement);
}


