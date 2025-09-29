import React, { useEffect, useState } from 'react';
import { Copy, Save, MessageSquare, Image } from 'lucide-react';
import { SummaryResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { useAutoScroll } from '../hooks/useAutoScroll';
import ImagePreviewModal from './ImagePreviewModal';

interface SummaryContainerProps {
  summary: SummaryResult;
  onStartChat: () => void;
  streamingContent?: string; // 流式内容
  isGenerating?: boolean; // 是否正在生成
}

const SummaryContainer: React.FC<SummaryContainerProps> = ({ 
  summary, 
  onStartChat, 
  streamingContent,
  isGenerating 
}) => {
  // 图片预览模态框状态
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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