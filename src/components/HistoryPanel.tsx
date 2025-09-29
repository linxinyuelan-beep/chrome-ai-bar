import React, { useState, useEffect } from 'react';
import { X, Search, Trash2 } from 'lucide-react';
import { SummaryResult, ChatSession } from '../types';
import { StorageManager } from '../utils/storage-manager';

interface HistoryPanelProps {
  onClose: () => void;
  onSelectSummary: (summary: SummaryResult) => void;
  onSelectChat: (chat: ChatSession) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  onClose, 
  onSelectSummary, 
  onSelectChat 
}) => {
  const [activeTab, setActiveTab] = useState<'summaries' | 'chats'>('summaries');
  const [summaries, setSummaries] = useState<SummaryResult[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const storageManager = new StorageManager();
      
      // 从存储中加载真实历史记录
      const [savedSummaries, savedChats] = await Promise.all([
        storageManager.getSummaries(),
        storageManager.getChats()
      ]);

      console.log('Loaded history:', {
        summariesCount: savedSummaries.length,
        chatsCount: savedChats.length
      });

      setSummaries(savedSummaries);
      setChats(savedChats);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSummary = async (e: React.MouseEvent, summaryId: string) => {
    e.stopPropagation(); // 防止触发选择事件
    try {
      const storageManager = new StorageManager();
      await storageManager.deleteSummary(summaryId);
      
      // 更新本地状态
      setSummaries(prev => prev.filter(s => s.id !== summaryId));
    } catch (err) {
      console.error('Failed to delete summary:', err);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // 防止触发选择事件
    try {
      const storageManager = new StorageManager();
      await storageManager.deleteChat(chatId);
      
      // 更新本地状态
      setChats(prev => prev.filter(c => c.id !== chatId));
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const filteredSummaries = summaries.filter(summary =>
    summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - timestamp;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const handleSelectSummary = (summary: SummaryResult) => {
    onSelectSummary(summary);
    onClose();
  };

  const handleSelectChat = (chat: ChatSession) => {
    console.log('🎯 [HistoryPanel] handleSelectChat 被调用:', {
      chatId: chat.id,
      chatTitle: chat.title,
      messageCount: chat.messages.length,
      hasContext: !!chat.context
    });
    onSelectChat(chat);
    onClose();
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h4>历史记录</h4>
        <button className="icon-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="history-content">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索历史记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="history-tabs">
          <button 
            className={`tab-btn ${activeTab === 'summaries' ? 'active' : ''}`}
            onClick={() => setActiveTab('summaries')}
          >
            摘要历史
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            对话历史
          </button>
        </div>
        
        <div className="history-list">
          {activeTab === 'summaries' && (
            <>
              {isLoading && (
                <div className="empty-state">
                  <p>正在加载历史记录...</p>
                </div>
              )}
              
              {!isLoading && filteredSummaries.length === 0 && (
                <div className="empty-state">
                  <p>{searchTerm ? '没有找到匹配的摘要' : '暂无摘要历史'}</p>
                </div>
              )}
              
              {!isLoading && filteredSummaries.length > 0 && (
                filteredSummaries.map(summary => (
                  <button 
                    key={summary.id} 
                    className="history-item"
                    onClick={() => handleSelectSummary(summary)}
                  >
                    <div className="item-content">
                      <div className="item-header">
                        <h6 title={summary.title}>{summary.title}</h6>
                        <button 
                          className="delete-btn"
                          onClick={(e) => handleDeleteSummary(e, summary.id)}
                          title="删除这条摘要"
                          aria-label="删除摘要"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="item-preview" title={summary.content}>
                        {summary.content.length > 120 
                          ? `${summary.content.substring(0, 120)}...` 
                          : summary.content
                        }
                      </p>
                      <div className="item-meta">
                        <span>{formatDate(summary.timestamp)}</span>
                        <span>{summary.wordCount} 字</span>
                        <span className={`type-badge ${summary.type}`}>
                          {summary.type === 'page' ? '页面' : '选中'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
          
          {activeTab === 'chats' && (
            <>
              {isLoading && (
                <div className="empty-state">
                  <p>正在加载对话记录...</p>
                </div>
              )}
              
              {!isLoading && filteredChats.length === 0 && (
                <div className="empty-state">
                  <p>{searchTerm ? '没有找到匹配的对话' : '暂无对话历史'}</p>
                </div>
              )}
              
              {!isLoading && filteredChats.length > 0 && (
                filteredChats.map(chat => (
                  <button 
                    key={chat.id} 
                    className="history-item"
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="item-content">
                      <div className="item-header">
                        <h6 title={chat.title}>{chat.title}</h6>
                        <button 
                          className="delete-btn"
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          title="删除这个对话"
                          aria-label="删除对话"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="item-preview">
                        {chat.messages.length} 条消息
                        {chat.messages.length > 0 && (
                          <span className="last-message">
                            - {chat.messages[chat.messages.length - 1]?.content.substring(0, 50)}...
                          </span>
                        )}
                      </p>
                      <div className="item-meta">
                        <span>{formatDate(chat.timestamp)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;