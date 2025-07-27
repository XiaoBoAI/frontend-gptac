import { Avatar, Menu, List, Typography, Badge, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState, useEffect } from 'react';
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from '../Com';
import {
  EditOutlined,
  TranslationOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const CACHE_KEY = 'core_functional_cache';
const CACHE_DURATION = 10; // 10 ms

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
  const [selectedBasicFunction, setSelectedBasicFunction] = useState<string | null>(null);
  const [basicFunctionItems, setBasicFunctionItems] = useState([
    { key: 'paper_write', label: '1', icon: <EditOutlined /> },
    { key: 'paper_translate', label: '2', icon: <TranslationOutlined /> },
    { key: 'document_analysis', label: '3', icon: <FileTextOutlined /> },
  ]);

  const fetchCoreFunctional = async () => {
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
        return;
      }

      const response = await fetch('/core_functional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
      }
    } catch (error) {
      console.error('Failed to fetch core functional items:', error);
    }
  };

  useEffect(() => {
    fetchCoreFunctional();
  }, []);

  const handleClick: MenuProps['onClick'] = (e) => {
    setSelectedBasicFunction(e.key);
    setCurrentModule('basic');
    setSpecialKwargs({
      ...specialKwargs,
      core_function: e.key,
    })
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedBasicFunction ? [selectedBasicFunction] : []}
      style={{ borderRight: 0, flex: 'none' }}
      className="border-b border-gray-100"
      items={basicFunctionItems.map(item => ({
        key: item.key,
        label: (
          <div className="flex items-center">
            <span className="mr-2 text-gray-600">{item.icon}</span>
            {item.label}
          </div>
        ),
      }))}
      onClick={handleClick}
    />
  );
};

export default BasicFunctions;


