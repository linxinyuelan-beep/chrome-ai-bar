import React from 'react';
import { Settings, History, FileText, Zap } from 'lucide-react';

interface HeaderProps {
  onSummarizePage: () => void;
  onSummarizeSelection: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  hasSelection: boolean;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onSummarizePage,
  onSummarizeSelection,
  onOpenSettings,
  onOpenHistory,
  hasSelection,
  isLoading
}) => {
  return (
    <header className="header">
      <div className="logo">
        <Zap size={24} />
        <span>智能摘要助手</span>
      </div>
      <div className="header-actions">
        <button 
          className="icon-btn" 
          onClick={onOpenSettings}
          title="设置"
          disabled={isLoading}
        >
          <Settings size={18} />
        </button>
        <button 
          className="icon-btn" 
          onClick={onOpenHistory}
          title="历史记录"
          disabled={isLoading}
        >
          <History size={18} />
        </button>
      </div>
      
      <div className="action-section">
        <button 
          className="primary-btn"
          onClick={onSummarizePage}
          disabled={isLoading}
        >
          <FileText size={18} />
          总结整个页面
        </button>
        
        {hasSelection && (
          <button 
            className="secondary-btn"
            onClick={onSummarizeSelection}
            disabled={isLoading}
          >
            <Zap size={18} />
            总结选中内容
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;