import { Avatar, Menu, List, Typography, Badge, Button, Tooltip, Collapse, Spin, message, Modal, Input, Select, Form, Upload } from 'antd';
import type { MenuProps } from 'antd';
import React, { useState, useEffect } from 'react';
import { UserInterfaceMsg, ChatMessage, useUserInterfaceMsg, useWebSocketCom } from '../Com';
import { useTheme } from '../contexts/ThemeContext';
import {
  BookOutlined,
  MessageOutlined,
  CodeOutlined,
  RobotOutlined,
  ApiOutlined,
  LoadingOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadRequestOption } from 'rc-upload/lib/interface';

const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

// 定义菜单项接口
interface MenuItem {
  title: string;
  description: string;
  default_value: string;
  type: 'string' | 'dropdown';
  options?: string[];
}

// 定义函数插件接口
interface FunctionPlugin {
  complex_call_path: string | null;
  complex_menu_def: any | null;
  default_call_path: string;
  description: string;
  group: string;
  important: boolean;
  name: string;
  need_complex_menu: boolean;
  need_simple_menu: boolean;
  simple_menu_def: string | null;
  advanced_arg: any | null;
}

// 分组配置
const groupConfig = {
  '学术': {
    icon: <BookOutlined />,
    color: '#1890ff',
    bgColor: '#f0f8ff'
  },
  '对话': {
    icon: <MessageOutlined />,
    color: '#52c41a',
    bgColor: '#f6ffed'
  },
  '编程': {
    icon: <CodeOutlined />,
    color: '#722ed1',
    bgColor: '#f9f0ff'
  },
  '智能体': {
    icon: <RobotOutlined />,
    color: '#fa8c16',
    bgColor: '#fff7e6'
  }
};

const CACHE_KEY = 'crazy_functional_cache';
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

interface CrazyFunctionsProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  setCurrentModule: (module: string) => void;
  setSpecialKwargs: (kwargs: any) => void;
  setPluginKwargs: (kwargs: any) => void;
  specialKwargs: any;
  isStreaming?: boolean;
  isWaiting?: boolean;
  setMainInput: (input: string) => void;
  handleSendMessage: () => void;
  onFileUpload?: (options: UploadRequestOption) => void;
}

const CrazyFunctions: React.FC<CrazyFunctionsProps> = ({
  currentModule,
  onSelectModule,
  setCurrentModule,
  setSpecialKwargs,
  setPluginKwargs,
  specialKwargs,
  isStreaming = false,
  isWaiting = false,
  setMainInput,
  handleSendMessage,
  onFileUpload,
}) => {
  const { theme } = useTheme();
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [functionPlugins, setFunctionPlugins] = useState<FunctionPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupedPlugins, setGroupedPlugins] = useState<Record<string, FunctionPlugin[]>>({});
  
  // 菜单相关状态
  const [isSimpleMenuVisible, setIsSimpleMenuVisible] = useState(false);
  const [isComplexMenuVisible, setIsComplexMenuVisible] = useState(false);
  const [isNoMenuVisible, setIsNoMenuVisible] = useState(false);
  const [currentPlugin, setCurrentPlugin] = useState<FunctionPlugin | null>(null);
  const [simpleMenuForm] = Form.useForm();
  const [complexMenuForm] = Form.useForm();
  const [noMenuForm] = Form.useForm();



  useEffect(() => {
    console.log('crazy functions specialKwargs', specialKwargs);

    if (specialKwargs.uploaded_file_path && currentPlugin && needsFileUpload(currentPlugin)) {
      setMainInput(specialKwargs.uploaded_file_path);
      
      // 将文件路径赋值给当前插件菜单栏里面的输入框
      if (currentPlugin.need_simple_menu) {
        simpleMenuForm.setFieldsValue({ 
          main_input: specialKwargs.uploaded_file_path,
          //advanced_arg: specialKwargs.uploaded_file_path 
        });
      } else if (currentPlugin.need_complex_menu) {
        // 为复杂菜单中需要路径的字段设置值
        const complexValues: any = {};
        Object.entries(currentPlugin.complex_menu_def || {}).forEach(([key, item]: [string, any]) => {
          if (item.title?.toLowerCase().includes('路径') || 
              item.description?.toLowerCase().includes('路径') ||
              key.toLowerCase().includes('path') ||
              key.toLowerCase().includes('file')) {
            complexValues[key] = specialKwargs.uploaded_file_path;
          }
        });
        complexMenuForm.setFieldsValue(complexValues);
      } else {
        // 无菜单插件
        noMenuForm.setFieldsValue({ user_input: specialKwargs.uploaded_file_path });
      }
    }
  }, [specialKwargs,currentPlugin]);


//   useEffect(() => {
//     console.log('groupedPlugins', groupedPlugins);
//   }, [groupedPlugins]);

//   useEffect(() => {
//     console.log('functionPlugins', functionPlugins);
//   }, [functionPlugins]);

  const fetchCrazyFunctional = async () => {
    try {
      const cachedData = getFromCache();
      if (cachedData) {
        setFunctionPlugins(cachedData);
        groupPlugins(cachedData);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/crazy_functional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setToCache(data);
        setFunctionPlugins(data);
        groupPlugins(data);
      } else {
        message.error('获取函数插件列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch crazy functional items:', error);
      message.error('获取函数插件列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const groupPlugins = (plugins: FunctionPlugin[]) => {
    const grouped: Record<string, FunctionPlugin[]> = {};
    
    plugins.forEach(plugin => {
      const group = plugin.group || '其他';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(plugin);
    });

    setGroupedPlugins(grouped);
  };

  useEffect(() => {
    fetchCrazyFunctional();
  }, []);

  // 判断插件是否需要文件上传功能
  const needsFileUpload = (plugin: FunctionPlugin) => {
    if (!plugin.description) return false;
    const description = plugin.description.toLowerCase();
    return description.includes('路径') || 
           description.includes('文件') ||
           description.includes('path') ||
           description.includes('file') ||
           description.includes('上传') ||
           description.includes('upload');
  };

  const handlePluginClick = (plugin: FunctionPlugin) => {
    // 如果正在流式回复或等待中，阻止切换
    if (isStreaming || isWaiting) {
      message.warning('请等待模型回复结束，或提前中断当前对话');
      return;
    }

    

    setCurrentPlugin(plugin);
    setSelectedPlugin(plugin.name);

    // 根据插件类型显示不同的菜单
    if (plugin.need_simple_menu) {
      // 显示简单菜单
      setIsSimpleMenuVisible(true);
      // 设置表单默认值，如果有上传文件路径则使用文件路径
      const defaultValues: any = {};
      if (specialKwargs.uploaded_file_path && needsFileUpload(plugin)) {
        defaultValues.main_input = specialKwargs.uploaded_file_path;
        //defaultValues.advanced_arg = specialKwargs.uploaded_file_path;
      }
      simpleMenuForm.setFieldsValue(defaultValues);
    } else if (plugin.need_complex_menu) {
      // 显示复杂菜单
      setIsComplexMenuVisible(true);
      // 设置表单默认值
      if (plugin.complex_menu_def) {
        const defaultValues: any = {};
        
        Object.entries(plugin.complex_menu_def).forEach(([key, item]: [string, any]) => {
          let defaultValue = item.default_value || item.default_val || '';
          
          // 如果输入框需要路径，且 specialKwargs 中存在上传的文件路径，则自动填充
          if (specialKwargs.uploaded_file_path && 
              (item.title?.toLowerCase().includes('路径') || 
               item.description?.toLowerCase().includes('路径') ||
               key.toLowerCase().includes('path') ||
               key.toLowerCase().includes('file'))) {
            defaultValue = specialKwargs.uploaded_file_path;
          }
          
          defaultValues[key] = defaultValue;
        });
        complexMenuForm.setFieldsValue(defaultValues);
      }
    } else {
      // 无菜单插件，显示简单输入弹窗
      setIsNoMenuVisible(true);
      // 设置表单默认值，如果有上传文件路径则使用文件路径
      const defaultValues: any = {};
      if (specialKwargs.uploaded_file_path && needsFileUpload(plugin)) {
        defaultValues.user_input = specialKwargs.uploaded_file_path;
      }
      noMenuForm.setFieldsValue(defaultValues);
    }
  };

  // 执行插件的函数
  const executePlugin = (plugin: FunctionPlugin, menuData: any) => {
    


    // 第1种：无菜单插件
    // setMainInput('测试')
    // setCurrentModule("crazy_functions.询问多个大语言模型->同时问询"); // 读取 default_call_path
    // handleSendMessage();

    // 第2种：简易版菜单插件
    // setMainInput('测试')
    // setCurrentModule("crazy_functions.批量文件询问->批量文件询问"); // 读取 default_call_path
    // setPluginKwargs({
    //   "advanced_arg": "some_file_name", // 第2种插件的拓展参数槽位固定是 advanced_arg
    // });
    // handleSendMessage();

    // // // 第3种：复杂菜单调用实例: 保存的对话
    // setMainInput('')
    // setCurrentModule("crazy_functions.Conversation_To_File->Conversation_To_File_Wrap"); // 读取 complex_call_path
    // setPluginKwargs({
    //     "file_name": "some_file_name",  // 第3种插件的拓展参数槽位不固定，读取complex_menu_def获取拓展参数槽位清单
    // });
    // handleSendMessage();

    
    // console.log('plugin', plugin);
    // console.log('menuData', menuData);

    // // 检查插件描述是否提到路径参数，且specialKwargs中存在路径
    // if (plugin.description && 
    //   (plugin.description.toLowerCase().includes('路径') || 
    //    plugin.description.toLowerCase().includes('文件') ||
    //    plugin.description.toLowerCase().includes('path') ||
    //    plugin.description.toLowerCase().includes('file')) &&
    //   specialKwargs.uploaded_file_path) {
    // setMainInput(specialKwargs.uploaded_file_path);
    // }

    
    if (plugin.need_simple_menu) {
      setCurrentModule(plugin.default_call_path);
      // 简单菜单：用户输入赋值给 advanced_arg
      setPluginKwargs({
          "advanced_arg": menuData.advanced_arg || '', // 第2种插件的拓展参数槽位固定是 advanced_arg
        });
    } else if (plugin.need_complex_menu) {
      // 复杂菜单：根据 complex_menu_def 设置参数
      if (plugin.complex_call_path) {
        setCurrentModule(plugin.complex_call_path);
        // 将 plugin.complex_menu_def 中每个 key 的默认值替换为 menuData 中的值
        const updatedComplexMenuDef = Object.fromEntries(
          Object.entries(plugin.complex_menu_def).map(([key, item]: [string, any]) => [
            key,
            {
              ...item,
              default_value: menuData[key] ?? item.default_value
            }
          ])
        );
        
        plugin.complex_menu_def = updatedComplexMenuDef;
        console.log('updatedComplexMenuDef', updatedComplexMenuDef);
        setPluginKwargs(updatedComplexMenuDef);
      }
    } else {
      // 无菜单插件
      setCurrentModule(plugin.default_call_path);
    }
  };

  // 处理简单菜单确认
  const handleSimpleMenuOk = () => {
    simpleMenuForm.validateFields().then((values) => {
      if (currentPlugin) {
        // 设置主输入内容
        const mainInput = values.main_input?.trim() || '';
        console.log('mainInput', mainInput);
        if (mainInput) {
          setMainInput(mainInput);
        }
        //console.log('values', values);
        
        // 用户输入的内容作为 advanced_arg，如果为空则使用空字符串
        const finalValues = {
          advanced_arg: values.advanced_arg?.trim() || ''
        };
        executePlugin(currentPlugin, finalValues);
        // 直接触发输入框的提交按钮
        handleSendMessage();
        setIsSimpleMenuVisible(false);
        simpleMenuForm.resetFields();
      }
    });
  };

  // 处理复杂菜单确认
  const handleComplexMenuOk = () => {
    complexMenuForm.validateFields().then((values) => {
      if (currentPlugin) {
        // 获取第一个输入框的内容并赋值给 setMainInput
        const firstKey = Object.keys(currentPlugin.complex_menu_def)[0];
        const firstInputValue = values[firstKey]?.trim() || '';
        if (firstInputValue) {
          setMainInput(firstInputValue);
        }
        
        // 记录用户输入的值，如果为空则使用默认值
        const finalValues: any = {};
        Object.entries(currentPlugin.complex_menu_def).forEach(([key, item]: [string, any]) => {
          const userValue = values[key]?.trim();
          const defaultValue = item.default_value || item.default_val || '';
          finalValues[key] = userValue || defaultValue;
        });
        executePlugin(currentPlugin, finalValues);
        // 直接触发输入框的提交按钮
        handleSendMessage();
        setIsComplexMenuVisible(false);
        complexMenuForm.resetFields();
      }
    });
  };

  // 处理无菜单确认
  const handleNoMenuOk = () => {
    noMenuForm.validateFields().then((values) => {
      if (currentPlugin) {
        // 将用户输入的内容赋值给setMainInput，如果有上传文件路径则使用文件路径
        const userInput = values.user_input?.trim() || '';
        //const finalInput = specialKwargs.uploaded_file_path || userInput;
        setMainInput(userInput);
        console.log('userInput', userInput);
        // 执行插件
        executePlugin(currentPlugin, {});
        // 直接触发输入框的提交按钮
        handleSendMessage();
        setIsNoMenuVisible(false);
        noMenuForm.resetFields();
      }
    });
  };

  // 处理菜单取消
  const handleMenuCancel = () => {
    setIsSimpleMenuVisible(false);
    setIsComplexMenuVisible(false);
    setIsNoMenuVisible(false);
    simpleMenuForm.resetFields();
    complexMenuForm.resetFields();
    noMenuForm.resetFields();
    setCurrentPlugin(null);
  };

  // 渲染简单菜单
  const renderSimpleMenu = () => {
    if (!currentPlugin || !currentPlugin.simple_menu_def) return null;

    return (
      <Modal
        title={`${currentPlugin.name} - 参数设置`}
        open={isSimpleMenuVisible}
        onOk={handleSimpleMenuOk}
        onCancel={handleMenuCancel}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={simpleMenuForm} layout="vertical">
          {/* 主输入内容提示区域 - 显示插件描述 */}
          {currentPlugin.description && (
            <div 
              style={{
                background: '#f6f8fa',
                border: '1px solid #e1e4e8',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#24292e',
                fontStyle: 'italic',
                fontWeight: '500'
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#586069', 
                marginBottom: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                💡 输入内容提示
              </div>
              {currentPlugin.description}
            </div>
          )}
          
          <Form.Item
            label="主输入内容"
            name="main_input"
            rules={[{ required: false }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入主要内容"
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </Form.Item>
          
          {/* 文件上传按钮 - 仅在插件需要文件上传时显示 */}
          {needsFileUpload(currentPlugin) && onFileUpload && (
            <Form.Item label="文件上传">
              <Upload
                showUploadList={false}
                customRequest={onFileUpload}
                accept="*/*"
              >
                <Button 
                  icon={<UploadOutlined />}
                  type="default"
                  style={{ 
                    width: '100%',
                    borderStyle: 'dashed',
                    borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                    backgroundColor: theme === 'dark' ? '#374151' : '#fafafa',
                    color: theme === 'dark' ? '#e5e7eb' : '#374151'
                  }}
                >
                  点击上传文件
                </Button>
              </Upload>
            </Form.Item>
          )}
          
          {/* 提示词显示区域 - 针对额外参数 */}
          {currentPlugin.simple_menu_def && (
            <div 
              style={{
                background: '#f6f8fa',
                border: '1px solid #e1e4e8',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#24292e',
                fontStyle: 'italic',
                fontWeight: '500'
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#586069', 
                marginBottom: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                💡 额外参数提示
              </div>
              {currentPlugin.simple_menu_def}
            </div>
          )}
          
          <Form.Item
            label="额外参数"
            name="advanced_arg"
            rules={[{ required: false }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入额外参数"
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // 渲染复杂菜单
  const renderComplexMenu = () => {
    if (!currentPlugin || !currentPlugin.complex_menu_def) return null;

    return (
      <Modal
        title={`${currentPlugin.name} - 参数设置`}
        open={isComplexMenuVisible}
        onOk={handleComplexMenuOk}
        onCancel={handleMenuCancel}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={complexMenuForm} layout="vertical">
          
          
          
          {Object.entries(currentPlugin.complex_menu_def).map(([key, item]: [string, any], index) => {
            // 判断是否为文本框类型
            const isTextArea = key === 'advanced_arg' || item.description?.length > 50;
            
            return (
              <div key={key}>
                {/* 只为文本框显示提示词 */}
                {isTextArea && item.description && (
                  <div 
                    style={{
                      background: '#f6f8fa',
                      border: '1px solid #e1e4e8',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      marginBottom: '8px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      color: '#24292e',
                      fontStyle: 'italic',
                      fontWeight: '500'
                    }}
                  >
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#586069', 
                      marginBottom: '2px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      💡 提示
                    </div>
                    {item.description}
                  </div>
                )}
                
                <Form.Item
                  label={item.title || key}
                  name={key}
                  rules={[{ required: false }]}
                >
                  {item.type === 'dropdown' ? (
                    <Select placeholder={`请选择${item.title || key}`}>
                      {item.options?.map((option: string) => (
                        <Option key={option} value={option}>
                          {option}
                        </Option>
                      ))}
                    </Select>
                  ) : (
                    // 根据字段类型决定使用单行输入框还是多行文本框
                    isTextArea ? (
                      <TextArea
                        rows={4}
                        placeholder={`请输入${item.title || key}`}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                    ) : (
                      <Input
                        placeholder={item.description || `请输入${item.title || key}`}
                      />
                    )
                  )}
                </Form.Item>

                {/* 在第一个输入框下面添加文件上传按钮 */}
                {index === 0 && needsFileUpload(currentPlugin) && onFileUpload && (
                  <Form.Item label="文件上传">
                    <Upload
                      showUploadList={false}
                      customRequest={onFileUpload}
                      accept="*/*"
                    >
                      <Button 
                        icon={<UploadOutlined />}
                        type="default"
                        style={{ 
                          width: '100%',
                          borderStyle: 'dashed',
                          borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                          backgroundColor: theme === 'dark' ? '#374151' : '#fafafa',
                          color: theme === 'dark' ? '#e5e7eb' : '#374151'
                        }}
                      >
                        点击上传文件
                      </Button>
                    </Upload>
                  </Form.Item>
                )}
                
              </div>
            );
          })}
        </Form>
      </Modal>
    );
  };

  // 渲染无菜单弹窗
  const renderNoMenu = () => {
    if (!currentPlugin) return null;

    return (
      <Modal
        title={`${currentPlugin.name} - 输入内容`}
        open={isNoMenuVisible}
        onOk={handleNoMenuOk}
        onCancel={handleMenuCancel}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={noMenuForm} layout="vertical">
          {/* 插件描述提示区域 */}
          {currentPlugin.description && (
            <div 
              style={{
                background: '#f6f8fa',
                border: '1px solid #e1e4e8',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#24292e',
                fontStyle: 'italic',
                fontWeight: '500'
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#586069', 
                marginBottom: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                💡 插件描述
              </div>
              {currentPlugin.description}
            </div>
          )}
          
          <Form.Item
            label="输入内容"
            name="user_input"
            rules={[{ required: false }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入内容"
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </Form.Item>
          
          {/* 文件上传按钮 - 仅在插件需要文件上传时显示 */}
          {needsFileUpload(currentPlugin) && onFileUpload && (
            <Form.Item label="文件上传">
              <Upload
                showUploadList={false}
                customRequest={onFileUpload}
                accept="*/*"
              >
                <Button 
                  icon={<UploadOutlined />}
                  type="default"
                  style={{ 
                    width: '100%',
                    borderStyle: 'dashed',
                    borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                    backgroundColor: theme === 'dark' ? '#374151' : '#fafafa',
                    color: theme === 'dark' ? '#e5e7eb' : '#374151'
                  }}
                >
                  点击上传文件
                </Button>
              </Upload>
            </Form.Item>
          )}
        </Form>
      </Modal>
    );
  };

  const getGroupIcon = (groupName: string) => {
    return groupConfig[groupName as keyof typeof groupConfig]?.icon || <ApiOutlined />;
  };

  const getGroupColor = (groupName: string) => {
    return groupConfig[groupName as keyof typeof groupConfig]?.color || '#666';
  };

  const getGroupBgColor = (groupName: string) => {
    return groupConfig[groupName as keyof typeof groupConfig]?.bgColor || '#f5f5f5';
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 h-full ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>加载函数插件中...</span>
      </div>
    );
  }

  // 如果没有数据，显示空状态
  if (functionPlugins.length === 0) {
    return (
      <div className={`text-center p-8 h-full ${
        theme === 'dark' ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'
      }`}>
        <ApiOutlined className="text-2xl mb-2" />
        <div>暂无函数插件</div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto p-2 crazy-functions-container ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`} style={{ 
      height: '100%'
    }}>
      <Collapse 
        defaultActiveKey={[]} 
        ghost 
        size="small"
        className="crazy-functions-collapse"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
        }}
      >
        {Object.entries(groupedPlugins).map(([groupName, plugins]) => (
          <Panel
            key={groupName}
            header={
              <div className="flex items-center">
                <span 
                  className="mr-2" 
                  style={{ color: getGroupColor(groupName) }}
                >
                  {getGroupIcon(groupName)}
                </span>
                <span className="font-semibold text-base" style={{ color: getGroupColor(groupName) }}>{groupName}</span>
                <Badge 
                  count={plugins.length} 
                  size="small" 
                  style={{ 
                    backgroundColor: getGroupColor(groupName),
                    marginLeft: 'auto'
                  }} 
                />
              </div>
            }
            style={{
              backgroundColor: getGroupBgColor(groupName),
              marginBottom: '8px',
              borderRadius: '6px',
            }}
          >
            <div className="space-y-0.5">
              {plugins.map((plugin, index) => (
                <div
                  key={`${groupName}-${index}`}
                  className={`p-2 rounded cursor-pointer transition-all duration-200 group plugin-item ${
                    selectedPlugin === plugin.name
                      ? theme === 'dark' 
                        ? 'bg-blue-900/30 border border-blue-700/50' 
                        : 'bg-blue-50 border border-blue-200'
                      : theme === 'dark'
                        ? 'hover:bg-gray-800/50 hover:shadow-sm'
                        : 'hover:bg-white hover:shadow-sm'
                  }`}
                  onClick={() => handlePluginClick(plugin)}
                  style={{
                    border: selectedPlugin === plugin.name 
                      ? theme === 'dark' 
                        ? '1px solid #374151' 
                        : '1px solid #d1d5db' 
                      : '1px solid transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className={`font-medium text-sm truncate plugin-name ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {plugin.name}
                        </span>
                        {plugin.important && (
                          <Badge 
                            color="red" 
                            size="small" 
                            className="ml-1"
                            title="重要插件"
                          />
                        )}
                        {/* 显示菜单类型指示器 */}
                        {(plugin.need_simple_menu || plugin.need_complex_menu) && (
                          <SettingOutlined 
                            className="ml-1 text-gray-400" 
                            style={{ fontSize: '12px' }}
                            title={plugin.need_simple_menu ? '简单菜单' : '复杂菜单'}
                          />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 plugin-description">
                        {plugin.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </Collapse>

      {/* 渲染菜单组件 */}
      {renderSimpleMenu()}
      {renderComplexMenu()}
      {renderNoMenu()}
    </div>
  );
};

export default CrazyFunctions;

// 添加样式
const styles = `
  /* 滚动条样式优化 */
  .crazy-functions-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .crazy-functions-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .crazy-functions-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  
  .crazy-functions-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  /* Collapse 样式优化 */
  .crazy-functions-collapse .ant-collapse-item {
    border: none !important;
    background: transparent !important;
  }
  
  .crazy-functions-collapse .ant-collapse-header {
    padding: 8px 12px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    position: relative !important;
  }
  
  /* 自定义箭头样式 */
  .crazy-functions-collapse .ant-collapse-arrow {
    color: inherit !important;
    font-size: 14px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    opacity: 0.6 !important;
    margin-right: 8px !important;
  }
  
  /* 暗色主题下箭头为白色 */
  .dark .crazy-functions-collapse .ant-collapse-arrow {
    color: white !important;
  }
  
  .crazy-functions-collapse .ant-collapse-header:hover .ant-collapse-arrow {
    opacity: 0.9 !important;
    transform: scale(1.05) !important;
  }
  
  /* 暗色主题下悬浮时箭头保持白色 */
  .dark .crazy-functions-collapse .ant-collapse-header:hover .ant-collapse-arrow {
    color: white !important;
  }
  
  /* 展开时的箭头旋转效果 */
  .crazy-functions-collapse .ant-collapse-item-active .ant-collapse-arrow {
    transform: rotate(90deg) !important;
    opacity: 1 !important;
  }
  
  /* 暗色主题下展开时箭头保持白色 */
  .dark .crazy-functions-collapse .ant-collapse-item-active .ant-collapse-arrow {
    color: white !important;
  }
  
  /* 箭头图标优化 */
  .crazy-functions-collapse .ant-collapse-arrow svg {
    width: 14px !important;
    height: 14px !important;
    fill: currentColor !important;
  }
  
  /* 分组标题悬浮效果 */
  .crazy-functions-collapse .ant-collapse-header:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 6px !important;
  }
  
  /* 展开状态的分组标题样式 */
  .crazy-functions-collapse .ant-collapse-item-active .ant-collapse-header {
    background: rgba(255, 255, 255, 0.15) !important;
    border-radius: 6px 6px 0 0 !important;
  }
  
  .crazy-functions-collapse .ant-collapse-content {
    border: none !important;
    background: transparent !important;
  }
  
  .crazy-functions-collapse .ant-collapse-content-box {
    padding: 8px 12px 12px 12px !important;
  }
  
  /* 插件项样式优化 */
  .plugin-item {
    position: relative;
    overflow: hidden;
  }
  
  .plugin-item:hover .plugin-name {
    color: #1890ff !important;
  }
  
  .plugin-item:hover .plugin-description {
    color: #666 !important;
  }
  
  /* 悬浮时显示完整内容 */
  .plugin-item:hover .plugin-name {
    white-space: normal !important;
    word-break: break-word !important;
  }
  
  .plugin-item:hover .plugin-description {
    -webkit-line-clamp: unset !important;
    white-space: normal !important;
    word-break: break-word !important;
  }
  
  /* 默认状态保持截断 */
  .plugin-name {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  
  .plugin-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// 动态添加样式到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
