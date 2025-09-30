import React, { useState, useEffect } from 'react';
import { Send, Trash2, ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import { ChatSession, ChatMessage, MultiAIConfig, QuickReplySettings } from '../types/index';
import { AIService } from '../utils/ai-service';
import { StorageManager } from '../utils/storage-manager';
import MarkdownRenderer from './MarkdownRenderer';
import { useAutoScroll } from '../hooks/useAutoScroll';

interface ChatContainerProps {
  session: ChatSession;
  onUpdateSession: (session: ChatSession) => void;
  aiConfig: MultiAIConfig;
  summaryContext?: string; // 摘要内容作为对话上下文
  onBackToSummary?: () => void; // 返回摘要页面的回调
  quickReplySettings: QuickReplySettings; // 快捷回复设置
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  session, 
  onUpdateSession,
  aiConfig,
  summaryContext,
  onBackToSummary,
  quickReplySettings 
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // 自动滚动Hook
  const { scrollRef, scrollToBottom, isAutoScrolling, resetAutoScroll } = useAutoScroll({
    enabled: true,
    delay: 100,
    behavior: 'smooth',
    threshold: 30
  });

  // 自动保存聊天会话
  const saveChatSession = async (updatedSession: ChatSession) => {
    try {
      const storageManager = new StorageManager();
      await storageManager.saveChat(updatedSession);
      console.log('Chat session saved:', updatedSession.id);
    } catch (error) {
      console.error('Failed to save chat session:', error);
    }
  };

  // 生成智能标题
  const generateSmartTitle = (messages: ChatMessage[], context?: string): string => {
    // 如果有上下文（摘要内容），基于摘要生成标题
    if (context) {
      const contextWords = context.split(' ').slice(0, 8).join(' ');
      return `关于“${contextWords}${context.length > 50 ? '...' : ''}”的对话`;
    }
    
    // 查找第一条用户消息
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const messagePreview = firstUserMessage.content.length > 20 
        ? firstUserMessage.content.substring(0, 20) + '...' 
        : firstUserMessage.content;
      return `关于“${messagePreview}”的对话`;
    }
    
    return '新的对话';
  };

  // 获取当前使用的模型信息
  const getCurrentModelInfo = () => {
    if (session.aiProvider && session.aiModel) {
      return `${session.aiProvider} - ${session.aiModel}`;
    }
    // 如果没有记录，使用当前默认配置
    const defaultConfig = aiConfig.configs.find(c => c.id === aiConfig.defaultConfigId);
    if (defaultConfig) {
      return `${defaultConfig.provider} - ${defaultConfig.model}`;
    }
    return '未知模型';
  };

  // 获取可用的其他模型
  const getAvailableModels = () => {
    if (!aiConfig?.configs) return [];
    const currentConfigId = session.currentAIConfigId || aiConfig.defaultConfigId;
    return aiConfig.configs.filter(config => 
      config.id !== currentConfigId && config.apiKey
    );
  };

  // 切换模型
  const handleSwitchModel = async (configId: string) => {
    setIsModelMenuOpen(false);
    
    const newConfig = aiConfig.configs.find(c => c.id === configId);
    if (!newConfig) return;

    // 更新session的AI配置信息
    const updatedSession = {
      ...session,
      currentAIConfigId: newConfig.id,
      aiProvider: newConfig.provider,
      aiModel: newConfig.model
    };

    onUpdateSession(updatedSession);
    await saveChatSession(updatedSession);
  };

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
      messages: [...session.messages, userMessage],
      // 更新标题（基于第一条用户消息）
      title: session.messages.length === 0 ? generateSmartTitle([userMessage], summaryContext) : session.title
    };

    onUpdateSession(updatedSession);
    await saveChatSession(updatedSession);
    setInputText('');
    setIsLoading(true);

    try {
      // 使用当前session的AI配置，如果没有则使用默认配置
      const currentConfigId = session.currentAIConfigId || aiConfig.defaultConfigId;
      const tempAIConfig = {
        ...aiConfig,
        defaultConfigId: currentConfigId
      };
      
      const aiService = AIService.fromMultiConfig(tempAIConfig);
      if (!aiService) {
        throw new Error('AI配置不可用，请检查设置');
      }
      
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
      await saveChatSession(finalSession);
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
      await saveChatSession(errorSession);
      setIsLoading(false);
      setStreamingContent(''); // 清除流式内容
    }
  };

  const handleClearChat = async () => {
    const clearedSession = {
      ...session,
      messages: []
    };
    onUpdateSession(clearedSession);
    await saveChatSession(clearedSession);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = async (text: string) => {
    if (isLoading) return;

    // 直接创建用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      role: 'user',
      timestamp: Date.now()
    };

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
      // 更新标题（基于第一条用户消息）
      title: session.messages.length === 0 ? generateSmartTitle([userMessage], summaryContext) : session.title
    };

    onUpdateSession(updatedSession);
    await saveChatSession(updatedSession);
    setIsLoading(true);
    setShowQuickReplies(false);

    try {
      // 使用当前session的AI配置，如果没有则使用默认配置
      const currentConfigId = session.currentAIConfigId || aiConfig.defaultConfigId;
      const tempAIConfig = {
        ...aiConfig,
        defaultConfigId: currentConfigId
      };
      
      const aiService = AIService.fromMultiConfig(tempAIConfig);
      if (!aiService) {
        throw new Error('AI配置不可用，请检查设置');
      }
      
      // 重置流式内容
      setStreamingContent('');
      
      const response = await aiService.generateChatResponseStream(
        updatedSession.messages,
        summaryContext,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: Date.now()
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage]
      };

      onUpdateSession(finalSession);
      await saveChatSession(finalSession);
      setStreamingContent('');
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，生成回复时出现错误，请重试。',
        role: 'assistant',
        timestamp: Date.now()
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage]
      };

      onUpdateSession(errorSession);
      await saveChatSession(errorSession);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const toggleQuickReplies = () => {
    setShowQuickReplies(!showQuickReplies);
  };

  // 当消息列表或流式内容更新时触发滚动
  useEffect(() => {
    if (isAutoScrolling) {
      scrollToBottom();
    }
  }, [session.messages, streamingContent, isAutoScrolling, scrollToBottom]);

  // 清空对话时重置滚动状态
  const handleClearChatWithScroll = async () => {
    await handleClearChat();
    resetAutoScroll();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          {onBackToSummary && (
            <button className="icon-btn" onClick={onBackToSummary} title="返回摘要">
              <ArrowLeft size={16} />
            </button>
          )}
          <h4>智能问答</h4>
        </div>
        <button className="icon-btn" onClick={handleClearChatWithScroll} title="清空对话">
          <Trash2 size={16} />
        </button>
      </div>
      
      {/* AI模型信息显示 */}
      <div className="chat-model-info">
        <span className="model-label">当前模型：</span>
        <span className="model-name">{getCurrentModelInfo()}</span>
        {getAvailableModels().length > 0 && (
          <div className="model-switch-container">
            <button 
              className="model-switch-btn"
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              disabled={isLoading}
              title="切换模型"
            >
              <RefreshCw size={14} />
              <span style={{ marginLeft: '4px' }}>切换模型</span>
            </button>
            {isModelMenuOpen && (
              <div className="model-menu">
                <div className="model-menu-header">选择模型</div>
                {getAvailableModels().map(config => (
                  <button
                    key={config.id}
                    className="model-menu-item"
                    onClick={() => handleSwitchModel(config.id)}
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
      
      <div className="chat-messages" ref={scrollRef}>
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
      
      {quickReplySettings.enabled && quickReplySettings.replies.length > 0 && (
        <div className="quick-replies-container">
          <div className="quick-replies-header">
            <span className="quick-replies-title">
              <Zap size={14} />
              快捷回复
            </span>
            <button 
              className="quick-replies-toggle"
              onClick={toggleQuickReplies}
              title={showQuickReplies ? '收起' : '展开'}
            >
              {showQuickReplies ? '−' : '+'}
            </button>
          </div>
          {showQuickReplies && (
            <div className="quick-replies-list">
              {quickReplySettings.replies.map((reply) => (
                <button
                  key={reply.id}
                  className="quick-reply-btn"
                  onClick={() => handleQuickReply(reply.text)}
                  disabled={isLoading}
                  title="点击直接发送"
                >
                  <span className="quick-reply-text">{reply.text}</span>
                  <Send size={12} className="quick-reply-icon" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="chat-input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="针对摘要内容提问... (⌘+回车发送)"
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