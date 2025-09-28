import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { SummaryResult, ChatSession } from '../types';

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

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // TODO: 从存储中加载历史记录
      // 暂时使用模拟数据
      const mockSummaries: SummaryResult[] = [
        {
          id: '1',
          title: '示例摘要 1',
          content: '这是一个示例摘要内容...',
          url: 'https://example.com',
          timestamp: Date.now() - 86400000,
          wordCount: 100,
          type: 'page'
        },
        {
          id: '2',
          title: '示例摘要 2',
          content: '这是另一个示例摘要内容...',
          url: 'https://example.com/page2',
          timestamp: Date.now() - 172800000,
          wordCount: 150,
          type: 'selection'
        }
      ];

      const mockChats: ChatSession[] = [
        {
          id: '1',
          title: '关于示例摘要的对话',
          messages: [
            {
              id: '1',
              content: '这个摘要说了什么？',
              role: 'user',
              timestamp: Date.now() - 86400000
            },
            {
              id: '2',
              content: '这个摘要主要讲述了...',
              role: 'assistant',
              timestamp: Date.now() - 86400000 + 1000
            }
          ],
          context: '摘要上下文...',
          timestamp: Date.now() - 86400000
        }
      ];

      setSummaries(mockSummaries);
      setChats(mockChats);
    } catch (err) {
      console.error('Failed to load history:', err);
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
              {filteredSummaries.length === 0 ? (
                <div className="empty-state">
                  <p>暂无摘要历史</p>
                </div>
              ) : (
                filteredSummaries.map(summary => (
                  <div 
                    key={summary.id} 
                    className="history-item"
                    onClick={() => handleSelectSummary(summary)}
                  >
                    <div className="item-content">
                      <h6>{summary.title}</h6>
                      <p>{summary.content.substring(0, 100)}...</p>
                      <div className="item-meta">
                        <span>{formatDate(summary.timestamp)}</span>
                        <span>{summary.wordCount} 字</span>
                        <span className={`type-badge ${summary.type}`}>
                          {summary.type === 'page' ? '页面' : '选中'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
          
          {activeTab === 'chats' && (
            <>
              {filteredChats.length === 0 ? (
                <div className="empty-state">
                  <p>暂无对话历史</p>
                </div>
              ) : (
                filteredChats.map(chat => (
                  <div 
                    key={chat.id} 
                    className="history-item"
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="item-content">
                      <h6>{chat.title}</h6>
                      <p>{chat.messages.length} 条消息</p>
                      <div className="item-meta">
                        <span>{formatDate(chat.timestamp)}</span>
                      </div>
                    </div>
                  </div>
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