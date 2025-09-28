import React from 'react';
import { Sparkles, Zap, MessageSquare, BookOpen } from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon">
        <Sparkles size={48} />
      </div>
      <h3>智能摘要助手</h3>
      <p>点击上方按钮开始总结网页内容，或选中文本后右键使用快捷菜单。</p>
      
      <div className="feature-list">
        <div className="feature-item">
          <Zap size={16} />
          <span>一键生成智能摘要</span>
        </div>
        <div className="feature-item">
          <MessageSquare size={16} />
          <span>智能问答对话</span>
        </div>
        <div className="feature-item">
          <BookOpen size={16} />
          <span>历史记录管理</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;