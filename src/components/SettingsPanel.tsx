import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader, Plus, Edit2, Trash2, Copy, Settings, Zap } from 'lucide-react';
import { AppSettings, AIProvider, APIValidationStatus, AIProviderConfig, CustomStyle } from '../types/index';
import { AIService } from '../utils/ai-service';
import { StorageManager } from '../utils/storage-manager';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [validationStatus, setValidationStatus] = useState<APIValidationStatus>({
    isValidating: false
  });
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIProviderConfig | null>(null);
  const [storageManager] = useState(() => new StorageManager());

  // 自定义风格表单状态
  const [showStyleForm, setShowStyleForm] = useState(false);
  const [editingStyle, setEditingStyle] = useState<CustomStyle | null>(null);
  const [styleForm, setStyleForm] = useState({
    name: '',
    description: ''
  });

  const aiProviders: AIProvider[] = [
    { 
      id: 'openai', 
      name: 'OpenAI', 
      models: [ 'gpt-5-nano', 'gpt-5-mini', 'gpt-5-chat-latest', 'gpt-4o-mini', 'gpt-4o', 'deepseek-chat'],
      defaultModel: 'gpt-5-chat-latest'
    },
    { 
      id: 'claude', 
      name: 'Claude', 
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20240620'],
      defaultModel: 'claude-3-sonnet-20240229'
    },
    { 
      id: 'gemini', 
      name: 'Gemini', 
      models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      defaultModel: 'gemini-pro'
    }
  ];

  // 配置表单状态
  const [configForm, setConfigForm] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: ''
  });

  useEffect(() => {
    // 迁移旧设置格式
    storageManager.migrateOldSettings();
  }, [storageManager]);

  const handleSave = () => {
    onSave(localSettings);
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      ai: {
        configs: [],
        defaultConfigId: undefined
      },
      summary: {
        length: 'medium',
        style: 'bullet',
        language: 'auto',
        customStyles: []
      },
      quickReply: {
        enabled: true,
        replies: []
      },
      ui: {
        theme: 'auto',
        fontSize: 'medium'
      }
    };
    setLocalSettings(defaultSettings);
    setValidationStatus({ isValidating: false });
  };

  const updateSummarySettings = (key: keyof AppSettings['summary'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      summary: { ...prev.summary, [key]: value }
    }));
  };

  const updateUISettings = (key: keyof AppSettings['ui'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      ui: { ...prev.ui, [key]: value }
    }));
  };

  // ===== 自定义风格管理方法 =====

  // 生成唯一风格ID
  const generateStyleId = (): string => {
    return `style_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // 处理风格表单提交
  const handleStyleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStyle) {
      // 更新现有风格
      const updatedStyles = localSettings.summary.customStyles.map(s => 
        s.id === editingStyle.id 
          ? { ...s, name: styleForm.name, description: styleForm.description, updatedAt: Date.now() }
          : s
      );
      setLocalSettings(prev => ({
        ...prev,
        summary: { ...prev.summary, customStyles: updatedStyles }
      }));
    } else {
      // 添加新风格
      const newStyle: CustomStyle = {
        id: generateStyleId(),
        name: styleForm.name,
        description: styleForm.description,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setLocalSettings(prev => ({
        ...prev,
        summary: { 
          ...prev.summary, 
          customStyles: [...(prev.summary.customStyles || []), newStyle]
        }
      }));
    }
    
    resetStyleForm();
  };

  // 重置风格表单
  const resetStyleForm = () => {
    setStyleForm({ name: '', description: '' });
    setShowStyleForm(false);
    setEditingStyle(null);
  };

  // 编辑风格
  const handleEditStyle = (style: CustomStyle) => {
    setStyleForm({
      name: style.name,
      description: style.description
    });
    setEditingStyle(style);
    setShowStyleForm(true);
  };

  // 删除风格
  const handleDeleteStyle = (styleId: string) => {
    if (confirm('确定要删除这个自定义风格吗？')) {
      const updatedStyles = localSettings.summary.customStyles.filter(s => s.id !== styleId);
      setLocalSettings(prev => ({
        ...prev,
        summary: { 
          ...prev.summary, 
          customStyles: updatedStyles,
          // 如果当前选中的风格被删除，切换到默认风格
          style: prev.summary.style === styleId ? 'bullet' : prev.summary.style
        }
      }));
    }
  };

  // 获取当前选中的AI提供商信息
  const getProviderInfo = (providerId: string) => {
    return aiProviders.find(p => p.id === providerId);
  };

  // 处理配置表单提交
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const providerInfo = getProviderInfo(configForm.provider);
      const model = configForm.model || providerInfo?.defaultModel || '';
      
      if (editingConfig) {
        // 更新现有配置
        const updatedConfig = await storageManager.updateAIConfig(editingConfig.id, {
          name: configForm.name,
          provider: configForm.provider,
          apiKey: configForm.apiKey,
          baseUrl: configForm.baseUrl,
          model: model
        });
        
        // 更新本地设置
        const configIndex = localSettings.ai.configs.findIndex(c => c.id === editingConfig.id);
        if (configIndex >= 0) {
          const newConfigs = [...localSettings.ai.configs];
          newConfigs[configIndex] = updatedConfig;
          setLocalSettings(prev => ({
            ...prev,
            ai: { ...prev.ai, configs: newConfigs }
          }));
        }
      } else {
        // 添加新配置
        const newConfig = await storageManager.addAIConfig({
          name: configForm.name,
          provider: configForm.provider,
          apiKey: configForm.apiKey,
          baseUrl: configForm.baseUrl,
          model: model,
          isDefault: localSettings.ai.configs.length === 0 // 第一个配置自动设为默认
        });
        
        // 更新本地设置
        setLocalSettings(prev => ({
          ...prev,
          ai: {
            configs: [...prev.ai.configs, newConfig],
            defaultConfigId: prev.ai.configs.length === 0 ? newConfig.id : prev.ai.defaultConfigId
          }
        }));
      }
      
      // 重置表单
      resetConfigForm();
    } catch (error) {
      console.error('Failed to save config:', error);
      // 这里可以添加错误提示
    }
  };

  // 重置配置表单
  const resetConfigForm = () => {
    setConfigForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: ''
    });
    setShowConfigForm(false);
    setEditingConfig(null);
  };

  // 编辑配置
  const handleEditConfig = (config: AIProviderConfig) => {
    setConfigForm({
      name: config.name,
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || '',
      model: config.model || ''
    });
    setEditingConfig(config);
    setShowConfigForm(true);
  };

  // 删除配置
  const handleDeleteConfig = async (configId: string) => {
    if (confirm('确定要删除这个配置吗？')) {
      try {
        await storageManager.deleteAIConfig(configId);
        
        // 更新本地设置
        const newConfigs = localSettings.ai.configs.filter(c => c.id !== configId);
        let newDefaultId = localSettings.ai.defaultConfigId;
        if (localSettings.ai.defaultConfigId === configId) {
          newDefaultId = newConfigs.length > 0 ? newConfigs[0].id : undefined;
        }
        
        setLocalSettings(prev => ({
          ...prev,
          ai: {
            configs: newConfigs,
            defaultConfigId: newDefaultId
          }
        }));
      } catch (error) {
        console.error('Failed to delete config:', error);
      }
    }
  };

  // 复制配置
  const handleDuplicateConfig = async (config: AIProviderConfig) => {
    try {
      const newConfig = await storageManager.duplicateAIConfig(config.id);
      
      // 更新本地设置
      setLocalSettings(prev => ({
        ...prev,
        ai: {
          ...prev.ai,
          configs: [...prev.ai.configs, newConfig]
        }
      }));
    } catch (error) {
      console.error('Failed to duplicate config:', error);
    }
  };

  // 设置默认配置
  const handleSetDefaultConfig = async (configId: string) => {
    try {
      await storageManager.setDefaultAIConfig(configId);
      
      // 更新本地设置
      setLocalSettings(prev => ({
        ...prev,
        ai: {
          ...prev.ai,
          defaultConfigId: configId,
          configs: prev.ai.configs.map(c => ({
            ...c,
            isDefault: c.id === configId
          }))
        }
      }));
    } catch (error) {
      console.error('Failed to set default config:', error);
    }
  };

  // 验证指定配置的API
  const handleValidateConfig = async (config: AIProviderConfig) => {
    if (!config.apiKey) {
      setValidationStatus({
        isValidating: false,
        result: {
          isValid: false,
          error: '请先输入API密钥'
        }
      });
      return;
    }

    setValidationStatus({ isValidating: true });

    try {
      const aiService = new AIService({
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model
      });
      
      const result = await aiService.validateAPI();
      
      setValidationStatus({
        isValidating: false,
        lastValidated: Date.now(),
        result
      });
    } catch (error) {
      setValidationStatus({
        isValidating: false,
        lastValidated: Date.now(),
        result: {
          isValid: false,
          error: error instanceof Error ? error.message : '验证过程中发生错误'
        }
      });
    }
  };

  // 渲染验证状态
  const renderValidationStatus = () => {
    if (validationStatus.isValidating) {
      return (
        <div className="validation-status validating">
          <Loader size={16} className="spinning" />
          <span>验证中...</span>
        </div>
      );
    }

    if (validationStatus.result) {
      const { isValid, error, modelSupported } = validationStatus.result;
      
      if (isValid) {
        return (
          <div className="validation-status success">
            <CheckCircle size={16} />
            <span>
              API连接正常
              {modelSupported !== undefined && !modelSupported && ' (模型可能不支持)'}
            </span>
          </div>
        );
      } else {
        return (
          <div className="validation-status error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h4>设置</h4>
        <button className="icon-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="settings-content">
        {/* AI服务配置管理 */}
        <div className="setting-group">
          <div className="setting-group-header">
            <h5>AI服务配置</h5>
            <button 
              className="primary-btn small-btn setting-add-btn"
              onClick={() => setShowConfigForm(true)}
            >
              <Plus size={16} />
              添加配置
            </button>
          </div>

          {/* 配置列表 */}
          <div className="config-list">
            {localSettings.ai.configs.map(config => (
              <div 
                key={config.id} 
                className={`config-item ${config.id === localSettings.ai.defaultConfigId ? 'default' : ''}`}
              >
                <div className="config-info">
                  <div className="config-name">
                    {config.name}
                    {config.id === localSettings.ai.defaultConfigId && (
                      <span className="default-badge">默认</span>
                    )}
                  </div>
                  <div className="config-details">
                    {getProviderInfo(config.provider)?.name} • {config.model}
                  </div>
                </div>
                
                <div className="config-actions">
                  {config.id !== localSettings.ai.defaultConfigId && (
                    <button 
                      className="icon-btn small"
                      onClick={() => handleSetDefaultConfig(config.id)}
                      title="设为默认"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                  <button 
                    className="icon-btn small"
                    onClick={() => handleValidateConfig(config)}
                    title="验证API"
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button 
                    className="icon-btn small"
                    onClick={() => handleDuplicateConfig(config)}
                    title="复制配置"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    className="icon-btn small"
                    onClick={() => handleEditConfig(config)}
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="icon-btn small danger"
                    onClick={() => handleDeleteConfig(config.id)}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            
            {localSettings.ai.configs.length === 0 && (
              <div className="empty-state">
                <p>暂无AI配置，请添加一个配置以开始使用</p>
              </div>
            )}
          </div>

          {/* API验证状态 */}
          {renderValidationStatus()}

          {/* 配置表单 */}
          {showConfigForm && (
            <div className="config-form-overlay">
              <div className="config-form">
                <div className="form-header">
                  <h6>{editingConfig ? '编辑配置' : '添加配置'}</h6>
                  <button className="icon-btn" onClick={resetConfigForm}>
                    <X size={16} />
                  </button>
                </div>
                
                <form onSubmit={handleConfigSubmit}>
                  <div className="form-row">
                    <label htmlFor="configName">配置名称</label>
                    <input
                      type="text"
                      id="configName"
                      value={configForm.name}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：OpenRouter、DeepSeek"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="configProvider">服务提供商</label>
                    <select
                      id="configProvider"
                      value={configForm.provider}
                      onChange={(e) => {
                        const provider = aiProviders.find(p => p.id === e.target.value);
                        setConfigForm(prev => ({
                          ...prev,
                          provider: e.target.value,
                          model: provider?.defaultModel || ''
                        }));
                      }}
                    >
                      {aiProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label htmlFor="configModel">AI模型</label>
                    <select
                      id="configModel"
                      value={configForm.model}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, model: e.target.value }))}
                    >
                      {getProviderInfo(configForm.provider)?.models.map(model => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label htmlFor="configApiKey">API密钥</label>
                    <input
                      type="password"
                      id="configApiKey"
                      value={configForm.apiKey}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="输入您的API密钥"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="configBaseUrl">API Base URL (可选)</label>
                    <input
                      type="text"
                      id="configBaseUrl"
                      value={configForm.baseUrl}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="自定义API端点，如 https://openrouter.ai/api/v1"
                    />
                    <small className="form-hint">
                      支持OpenRouter、本地API等兼容服务
                    </small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editingConfig ? '更新配置' : '添加配置'}
                    </button>
                    <button type="button" className="secondary-btn" onClick={resetConfigForm}>
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 摘要设置 */}
        <div className="setting-group">
          <h5>摘要设置</h5>
          
          <div className="setting-item">
            <label htmlFor="summaryLength">摘要长度</label>
            <select 
              id="summaryLength"
              value={localSettings.summary.length}
              onChange={(e) => updateSummarySettings('length', e.target.value)}
            >
              <option value="short">简短</option>
              <option value="medium">中等</option>
              <option value="long">详细</option>
            </select>
          </div>
          
          <div className="setting-item">
            <div className="setting-group-header" style={{marginBottom: '8px'}}>
              <label htmlFor="summaryStyle">摘要风格</label>
              <button 
                className="primary-btn small-btn setting-add-btn"
                onClick={() => setShowStyleForm(true)}
                style={{fontSize: '12px', padding: '4px 8px'}}
              >
                <Plus size={14} />
                自定义
              </button>
            </div>
            <select 
              id="summaryStyle"
              value={localSettings.summary.style}
              onChange={(e) => updateSummarySettings('style', e.target.value)}
            >
              <optgroup label="内置风格">
                <option value="bullet">要点式</option>
                <option value="paragraph">段落式</option>
                <option value="qa">问答式</option>
                <option value="xiaohongshu">小红书风格</option>
                <option value="zhihu">知乎风格</option>
                <option value="weibo">微博风格</option>
                <option value="douyin">抖音风格</option>
                <option value="academic">学术论文风格</option>
              </optgroup>
              {localSettings.summary.customStyles && localSettings.summary.customStyles.length > 0 && (
                <optgroup label="自定义风格">
                  {localSettings.summary.customStyles.map(style => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 自定义风格管理 */}
          {localSettings.summary.customStyles && localSettings.summary.customStyles.length > 0 && (
            <div className="setting-item">
              <div className="setting-label">自定义风格列表</div>
              <div className="custom-style-list">
                {localSettings.summary.customStyles.map(style => (
                  <div key={style.id} className="custom-style-item">
                    <div className="style-info">
                      <div className="style-name">{style.name}</div>
                      <div className="style-description">{style.description}</div>
                    </div>
                    <div className="style-actions">
                      <button 
                        className="icon-btn small"
                        onClick={() => handleEditStyle(style)}
                        title="编辑"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        className="icon-btn small danger"
                        onClick={() => handleDeleteStyle(style.id)}
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 自定义风格表单 */}
          {showStyleForm && (
            <div className="config-form-overlay">
              <div className="config-form">
                <div className="form-header">
                  <h6>{editingStyle ? '编辑自定义风格' : '添加自定义风格'}</h6>
                  <button className="icon-btn" onClick={resetStyleForm}>
                    <X size={16} />
                  </button>
                </div>
                
                <form onSubmit={handleStyleSubmit}>
                  <div className="form-row">
                    <label htmlFor="styleName">风格名称</label>
                    <input
                      type="text"
                      id="styleName"
                      value={styleForm.name}
                      onChange={(e) => setStyleForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：新闻报道风格"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="styleDescription">风格描述</label>
                    <textarea
                      id="styleDescription"
                      value={styleForm.description}
                      onChange={(e) => setStyleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="详细描述摘要的风格要求，例如：使用新闻报道风格，客观陈述事实，采用倒金字塔结构，包含5W1H要素，语言简洁明了"
                      rows={4}
                      required
                    />
                    <small className="form-hint">
                      描述越详细，AI生成的摘要越符合您的要求
                    </small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editingStyle ? '更新风格' : '添加风格'}
                    </button>
                    <button type="button" className="secondary-btn" onClick={resetStyleForm}>
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <div className="setting-item">
            <label htmlFor="outputLanguage">输出语言</label>
            <select 
              id="outputLanguage"
              value={localSettings.summary.language}
              onChange={(e) => updateSummarySettings('language', e.target.value)}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="auto">自动检测</option>
            </select>
          </div>
        </div>

        {/* 快捷回复设置 */}
        <div className="setting-group">
          <div className="setting-group-header">
            <h5>
              <Zap size={16} style={{marginRight: '8px', display: 'inline'}} />
              快捷回复
            </h5>
          </div>
          
          <div className="setting-item">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={localSettings.quickReply.enabled}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  quickReply: { ...prev.quickReply, enabled: e.target.checked }
                }))}
              />
              启用快捷回复
            </label>
            <small className="setting-hint">在对话页面显示快捷回复按钮</small>
          </div>

          {localSettings.quickReply.enabled && (
            <div className="setting-item">
              <div className="setting-label">快捷回复列表</div>
                <div className="quick-reply-management">
                  {localSettings.quickReply.replies.map((reply, index) => (
                    <div key={reply.id} className="quick-reply-item">
                      <span className="quick-reply-text">{reply.text}</span>
                      <div className="quick-reply-actions">
                        {!reply.isDefault && (
                          <button 
                            className="icon-btn small danger"
                            onClick={() => {
                              setLocalSettings(prev => ({
                                ...prev,
                                quickReply: {
                                  ...prev.quickReply,
                                  replies: prev.quickReply.replies.filter(r => r.id !== reply.id)
                                }
                              }));
                            }}
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="add-quick-reply">
                    <input
                      type="text"
                      placeholder="输入新的快捷回复..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newReply = {
                            id: `custom-${Date.now()}`,
                            text: e.currentTarget.value.trim(),
                            isDefault: false,
                            createdAt: Date.now()
                          };
                          setLocalSettings(prev => ({
                            ...prev,
                            quickReply: {
                              ...prev.quickReply,
                              replies: [...prev.quickReply.replies, newReply]
                            }
                          }));
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <small className="setting-hint">按回车键添加快捷回复</small>
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* 界面设置 */}
        <div className="setting-group">
          <h5>界面设置</h5>
          
          <div className="setting-item">
            <label htmlFor="theme">主题</label>
            <select 
              id="theme"
              value={localSettings.ui.theme}
              onChange={(e) => updateUISettings('theme', e.target.value)}
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>
          
          <div className="setting-item">
            <label htmlFor="fontSize">字体大小</label>
            <select 
              id="fontSize"
              value={localSettings.ui.fontSize}
              onChange={(e) => updateUISettings('fontSize', e.target.value)}
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>
        </div>

        <div className="settings-actions">
          <button className="primary-btn" onClick={handleSave}>
            保存设置
          </button>
          <button className="secondary-btn" onClick={handleReset}>
            重置默认
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;