import React from 'react';
import { Copy, Save, MessageSquare } from 'lucide-react';
import { SummaryResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface SummaryContainerProps {
  summary: SummaryResult;
  onStartChat: () => void;
}

const SummaryContainer: React.FC<SummaryContainerProps> = ({ summary, onStartChat }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary.content);
      // TODO: 显示复制成功提示
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async () => {
    // TODO: 实现保存到历史记录
    console.log('Save summary:', summary);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

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
        </div>
      </div>
      
      <div className="summary-content">
        <MarkdownRenderer content={summary.content} />
      </div>
      
      <div className="summary-meta">
        <span className="meta-text">{formatDate(summary.timestamp)}</span>
        <span className="meta-text">{summary.wordCount} 字</span>
      </div>
      
      <button className="primary-btn chat-btn" onClick={onStartChat}>
        <MessageSquare size={18} />
        开始对话
      </button>
    </div>
  );
};

export default SummaryContainer;