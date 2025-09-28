import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { ChatSession, ChatMessage, AIConfig } from '../types';
import { AIService } from '../utils/ai-service';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatContainerProps {
  session: ChatSession;
  onUpdateSession: (session: ChatSession) => void;
  aiConfig: AIConfig;
  summaryContext?: string; // 摘要内容作为对话上下文
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  session, 
  onUpdateSession,
  aiConfig,
  summaryContext 
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: 'user',
      timestamp: Date.now()
    };

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage]
    };

    onUpdateSession(updatedSession);
    setInputText('');
    setIsLoading(true);

    try {
      // 创建AI服务实例
      const aiService = new AIService(aiConfig);
      
      // 重置流式内容
      setStreamingContent('');
      
      // 调用AI服务生成回复（流式）
      const aiResponse = await aiService.generateChatResponseStream(
        updatedSession.messages,
        summaryContext,
        (chunk: string) => {
          // 实时更新流式内容
          setStreamingContent(prev => prev + chunk);
        }
      );

      // 创建AI回复消息
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: Date.now()
      };

      // 更新会话
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage]
      };

      onUpdateSession(finalSession);
      setIsLoading(false);
      setStreamingContent(''); // 清除流式内容
    } catch (err) {
      console.error('Chat error:', err);
      
      // 显示错误消息
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `抱歉，发生了错误：${err instanceof Error ? err.message : '未知错误'}`,
        role: 'assistant',
        timestamp: Date.now()
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage]
      };

      onUpdateSession(errorSession);
      setIsLoading(false);
      setStreamingContent(''); // 清除流式内容
    }
  };

  const handleClearChat = () => {
    const clearedSession = {
      ...session,
      messages: []
    };
    onUpdateSession(clearedSession);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h4>智能问答</h4>
        <button className="icon-btn" onClick={handleClearChat} title="清空对话">
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="chat-messages">
        {session.messages.map((message, index) => {
          // 判断是否是摘要消息（第一条消息且以📋开头）
          const isSummaryMessage = index === 0 && message.role === 'assistant' && message.content.startsWith('📋');
          
          return (
            <div 
              key={message.id} 
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'} ${isSummaryMessage ? 'summary-message' : ''}`}
            >
              <div className="message-content">
                {message.role === 'assistant' ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  message.content
                )}
              </div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              {streamingContent ? (
                <MarkdownRenderer content={streamingContent} />
              ) : (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="针对摘要内容提问..."
          rows={2}
          disabled={isLoading}
        />
        <button 
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatContainer;