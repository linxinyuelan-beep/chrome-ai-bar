import React, { useEffect, useState } from 'react';
import { Copy, Save, MessageSquare, Image, RefreshCw } from 'lucide-react';
import { SummaryResult, MultiAIConfig } from '../types/index';
import MarkdownRenderer from './MarkdownRenderer';
import { useAutoScroll } from '../hooks/useAutoScroll';
import ImagePreviewModal from './ImagePreviewModal';

interface SummaryContainerProps {
  summary: SummaryResult;
  onStartChat: () => void;
  streamingContent?: string; // 流式内容
  isGenerating?: boolean; // 是否正在生成
  aiConfig?: MultiAIConfig; // AI配置，用于切换模型
  onRegenerateWithModel?: (configId: string) => void; // 使用指定模型重新生成
}

const SummaryContainer: React.FC<SummaryContainerProps> = ({ 
  summary, 
  onStartChat, 
  streamingContent,
  isGenerating,
  aiConfig,
  onRegenerateWithModel
}) => {
  // 图片预览模态框状态
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  // 模型切换下拉菜单状态
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // 自动滚动Hook，仅在生成摘要时启用
  const { scrollRef, scrollToBottom, isAutoScrolling } = useAutoScroll({
    enabled: isGenerating,
    delay: 50,
    behavior: 'smooth',
    threshold: 20
  });
  
  const handleCopy = async () => {
    try {
      const contentToCopy = isGenerating && streamingContent ? streamingContent : summary.content;
      await navigator.clipboard.writeText(contentToCopy);
      console.log('复制成功');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async () => {
    console.log('Save summary:', summary);
  };

  // 生成分享图片
  const handleGenerateImage = () => {
    setIsImageModalOpen(true);
  };

  // 切换模型重新生成
  const handleRegenerateWithModel = (configId: string) => {
    setIsModelMenuOpen(false);
    onRegenerateWithModel?.(configId);
  };

  // 获取当前使用的模型信息
  const getCurrentModelInfo = () => {
    if (summary.aiProvider && summary.aiModel) {
      return `${summary.aiProvider} - ${summary.aiModel}`;
    }
    return '未知模型';
  };

  // 获取可用的其他模型
  const getAvailableModels = () => {
    if (!aiConfig?.configs) return [];
    return aiConfig.configs.filter(config => 
      config.id !== summary.aiConfigId && config.apiKey // 排除当前模型和未配置API Key的
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 当流式内容更新时触发滚动
  useEffect(() => {
    if (isGenerating && streamingContent && isAutoScrolling) {
      scrollToBottom();
    }
  }, [streamingContent, isGenerating, isAutoScrolling, scrollToBottom]);

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h4>{summary.title}</h4>
        <div className="summary-actions">
          <button className="icon-btn" onClick={handleCopy} title="复制">
            <Copy size={16} />
          </button>
          <button className="icon-btn" onClick={handleSave} title="保存">
            <Save size={16} />
          </button>
          <button className="icon-btn" onClick={handleGenerateImage} title="生成分享图片">
            <Image size={16} />
          </button>
        </div>
      </div>
      
      {/* AI模型信息显示 */}
      {summary.aiProvider && summary.aiModel && (
        <div className="summary-model-info">
          <span className="model-label">使用模型：</span>
          <span className="model-name">{getCurrentModelInfo()}</span>
          {onRegenerateWithModel && getAvailableModels().length > 0 && (
            <div className="model-switch-container">
              <button 
                className="model-switch-btn"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                disabled={isGenerating}
                title="切换模型重新生成"
              >
                <RefreshCw size={14} />
                <span style={{ marginLeft: '4px' }}>切换模型</span>
              </button>
              {isModelMenuOpen && (
                <div className="model-menu">
                  <div className="model-menu-header">选择模型重新生成</div>
                  {getAvailableModels().map(config => (
                    <button
                      key={config.id}
                      className="model-menu-item"
                      onClick={() => handleRegenerateWithModel(config.id)}
                    >
                      <div className="model-menu-item-name">{config.name}</div>
                      <div className="model-menu-item-detail">
                        {config.provider} - {config.model}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="summary-content" ref={scrollRef}>
        {isGenerating && streamingContent ? (
          <MarkdownRenderer content={streamingContent} />
        ) : (
          <MarkdownRenderer content={summary.content} />
        )}
      </div>
      
      <div className="summary-meta">
        <span className="meta-text">{formatDate(summary.timestamp)}</span>
        <span className="meta-text">{summary.wordCount} 字</span>
      </div>
      
      <button className="primary-btn chat-btn" onClick={onStartChat}>
        <MessageSquare size={18} />
        开始对话
      </button>

      {/* 图片预览模态框 */}
      <ImagePreviewModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        summary={summary}
      />
    </div>
  );
};

export default SummaryContainer;