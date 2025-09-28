import React from 'react';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { AppSettings, AIProvider, APIValidationStatus } from '../types/index';
import { AIService } from '../utils/ai-service';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [validationStatus, setValidationStatus] = React.useState<APIValidationStatus>({
    isValidating: false
  });

  const aiProviders: AIProvider[] = [
    { 
      id: 'openai', 
      name: 'OpenAI', 
      models: [ 'gpt-5-nano', 'gpt-5-mini', 'gpt-5-chat-latest', 'gpt-4o-mini', 'gpt-4o'],
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

  const handleSave = () => {
    onSave(localSettings);
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      ai: {
        provider: 'openai',
        apiKey: '',
        baseUrl: '',
        model: 'gpt-3.5-turbo'
      },
      summary: {
        length: 'medium',
        style: 'bullet',
        language: 'auto'
      },
      ui: {
        theme: 'auto',
        fontSize: 'medium'
      }
    };
    setLocalSettings(defaultSettings);
    // 清除验证状态
    setValidationStatus({ isValidating: false });
  };

  const updateAISettings = (key: keyof AppSettings['ai'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, [key]: value }
    }));
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

  // 获取当前选中的AI提供商
  const getCurrentProvider = () => {
    return aiProviders.find(p => p.id === localSettings.ai.provider);
  };

  // 处理提供商变更，自动设置默认模型
  const handleProviderChange = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    setLocalSettings(prev => ({
      ...prev,
      ai: { 
        ...prev.ai, 
        provider: providerId,
        model: provider?.defaultModel || provider?.models[0] || ''
      }
    }));
    // 清除之前的验证状态
    setValidationStatus({ isValidating: false });
  };

  // 验证API连接
  const handleValidateAPI = async () => {
    if (!localSettings.ai.apiKey) {
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
      const aiService = new AIService(localSettings.ai);
      const result = await aiService.validateAPI();
      
      setValidationStatus({
        isValidating: false,
        lastValidated: Date.now(),
        result
      });

      // 如果验证成功且返回了可用的模型列表，更新当前提供商的模型列表
      if (result.isValid && result.availableModels && result.availableModels.length > 0) {
        const currentProvider = getCurrentProvider();
        if (currentProvider) {
          currentProvider.models = result.availableModels;
          // 如果当前选中的模型不在可用列表中，设置为第一个可用模型
          if (result.availableModels.indexOf(localSettings.ai.model || '') === -1) {
            setLocalSettings(prev => ({
              ...prev,
              ai: { ...prev.ai, model: result.availableModels[0] }
            }));
          }
        }
      }
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
        {/* AI服务配置 */}
        <div className="setting-group">
          <h5>AI服务配置</h5>
          
          <div className="setting-item">
            <label htmlFor="aiProvider">AI服务提供商</label>
            <select 
              id="aiProvider"
              value={localSettings.ai.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {aiProviders.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="aiModel">AI模型</label>
            <select 
              id="aiModel"
              value={localSettings.ai.model || ''}
              onChange={(e) => updateAISettings('model', e.target.value)}
            >
              {getCurrentProvider()?.models.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <small className="setting-hint">选择要使用的AI模型</small>
          </div>
          
          <div className="setting-item">
            <label htmlFor="apiKey">API密钥</label>
            <input 
              type="password" 
              id="apiKey"
              value={localSettings.ai.apiKey}
              onChange={(e) => updateAISettings('apiKey', e.target.value)}
              placeholder="输入您的API密钥"
            />
          </div>
          
          <div className="setting-item">
            <label htmlFor="apiBaseUrl">API Base URL</label>
            <input 
              type="text" 
              id="apiBaseUrl"
              value={localSettings.ai.baseUrl || ''}
              onChange={(e) => updateAISettings('baseUrl', e.target.value)}
              placeholder="自定义API端点 (可选)"
            />
            <small className="setting-hint">支持OpenRouter、本地API等兼容服务</small>
          </div>

          <div className="setting-item">
            <div className="setting-label">API连接验证</div>
            <div className="api-validation-container">
              <button 
                type="button"
                className="validate-btn"
                onClick={handleValidateAPI}
                disabled={validationStatus.isValidating || !localSettings.ai.apiKey}
              >
                {validationStatus.isValidating ? '验证中...' : '验证API'}
              </button>
              {renderValidationStatus()}
            </div>
            <small className="setting-hint">验证API密钥和连接是否正常</small>
          </div>
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
            <label htmlFor="summaryStyle">摘要风格</label>
            <select 
              id="summaryStyle"
              value={localSettings.summary.style}
              onChange={(e) => updateSummarySettings('style', e.target.value)}
            >
              <option value="bullet">要点式</option>
              <option value="paragraph">段落式</option>
              <option value="qa">问答式</option>
            </select>
          </div>
          
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