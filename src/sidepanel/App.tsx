import React, { useState, useEffect } from 'react';
import { ViewType, SummaryResult, ChatSession, ChatMessage, AppSettings } from '../types';
import Header from '../components/Header';
import WelcomeScreen from '../components/WelcomeScreen';
import LoadingScreen from '../components/LoadingScreen';
import SummaryContainer from '../components/SummaryContainer';
import ChatContainer from '../components/ChatContainer';
import ErrorContainer from '../components/ErrorContainer';
import SettingsPanel from '../components/SettingsPanel';
import HistoryPanel from '../components/HistoryPanel';
import { StorageManager } from '../utils/storage-manager';
import { AIService } from '../utils/ai-service';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('welcome');
  const [currentSummary, setCurrentSummary] = useState<SummaryResult | null>(null);
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  // 初始化设置
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 首先加载设置
        const storageManager = new StorageManager();
        const savedSettings = await storageManager.getSettings();
        if (savedSettings) {
          console.log('Settings loaded:', savedSettings.ai.provider, 'API key length:', savedSettings.ai.apiKey ? savedSettings.ai.apiKey.length : 0);
          setSettings(savedSettings);
        }
        
        // 设置加载完成后再检查触发动作
        await checkTriggerAction();
        
      } catch (err) {
        console.error('Failed to initialize app:', err);
      }
    };

    // 监听storage变化来检测触发动作
    const checkTriggerAction = async () => {
      try {
        const result = await chrome.storage.local.get('triggerAction');
        if (result.triggerAction) {
          const action = result.triggerAction;
          const now = Date.now();
          
          // 检查动作是否是最近10秒内触发的（避免重复执行）
          if (now - action.timestamp < 10000) {
            console.log('Executing trigger action:', action);
            
            // 清除已执行的动作（先清除避免重复执行）
            await chrome.storage.local.remove('triggerAction');
            
            // 直接调用相应的触发处理函数，它们会重新获取最新设置
            if (action.type === 'TRIGGER_PAGE_SUMMARY') {
              handleTriggeredPageSummary();
            } else if (action.type === 'TRIGGER_SELECTION_SUMMARY') {
              if (action.data?.selectedText) {
                handleTriggeredSelectionSummary(action.data.selectedText);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to check trigger action:', error);
      }
    };
    
    // 监听storage变化
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.triggerAction) {
        console.log('Storage change detected, checking trigger action...');
        checkTriggerAction();
      }
    };

    initializeApp();
    checkForActiveContent();
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    // 清理函数
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 检查页面选中内容
  const checkForActiveContent = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString().trim() || ''
        });
        
        if (results[0]?.result) {
          setHasSelection(true);
        }
      }
    } catch (err) {
      console.error('Failed to check selection:', err);
    }
  };

  // 处理页面摘要
  const handleSummarizePage = async () => {
    setIsLoading(true);
    setCurrentView('loading');
    setError(null);

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('无法获取当前页面信息');
      }

      console.log('🚀 [Side Panel] 开始执行页面内容提取...');
      
      // 通过content script使用ContentExtractor提取内容
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
      
      if (!response?.success) {
        throw new Error(response?.error || '无法提取页面内容');
      }
      
      console.log('📦 [Side Panel] 内容提取完成，处理结果...');
      const extractedContent = response.data;
      
      console.log('📋 [Side Panel] 提取结果:', {
        是否有结果: !!extractedContent,
        内容长度: extractedContent?.content?.length || 0,
        标题: extractedContent?.title,
        字数: extractedContent?.wordCount
      });
      
      if (!extractedContent?.content) {
        console.error('❌ [Side Panel] 页面内容提取失败：无有效内容');
        throw new Error('无法提取页面内容');
      }
      
      console.log('✅ [Side Panel] 页面内容提取成功，准备发送给AI处理...');

      // 检查AI配置
      if (!settings.ai.apiKey) {
        throw new Error('请先在设置中配置API密钥');
      }

      // 创建AI服务实例并生成摘要
      const aiService = new AIService(settings.ai);
      const summaryContent = await aiService.generateSummary(
        extractedContent.content,
        settings.summary,
        'page'
      );

      // 创建摘要结果
      const summary: SummaryResult = {
        id: Date.now().toString(),
        title: extractedContent.title,
        content: summaryContent,
        url: extractedContent.url,
        timestamp: Date.now(),
        wordCount: extractedContent.wordCount,
        type: 'page'
      };

      // 保存到历史记录
      const storageManager = new StorageManager();
      await storageManager.saveSummary(summary);

      setCurrentSummary(summary);
      setCurrentView('summary');
    } catch (err) {
      console.error('生成页面摘要失败:', err);
      const errorMessage = err instanceof Error ? err.message : '生成摘要失败，请重试';
      setError(errorMessage);
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理选中内容摘要
  const handleSummarizeSelection = async () => {
    console.log('🖱️ [Side Panel] 开始处理选中内容摘要...');
    setIsLoading(true);
    setCurrentView('loading');
    setError(null);

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('无法获取当前页面信息');
      }

      console.log('🚀 [Side Panel] 开始执行选中内容提取...');
      
      // 在页面中执行选中内容提取
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          console.log('🖱️ [Injected Script] 开始选中内容提取...');
          
          const selection = window.getSelection();
          console.log('🔍 [Injected Script] 选择对象状态:', {
            存在: !!selection,
            rangeCount: selection?.rangeCount || 0
          });
          
          if (!selection || selection.rangeCount === 0) {
            console.log('❌ [Injected Script] 没有有效的选择对象');
            return null;
          }

          const selectedText = selection.toString().trim();
          console.log('📝 [Injected Script] 原始选中文本:', {
            长度: selectedText.length,
            预览: selectedText.substring(0, 100) + '...'
          });
          
          if (!selectedText) {
            console.log('❌ [Injected Script] 选中文本为空');
            return null;
          }

          // 清理内容
          console.log('🧹 [Injected Script] 开始清理选中内容...');
          const cleanedContent = selectedText.replace(/\s+/g, ' ').trim().substring(0, 50000);
          console.log('✨ [Injected Script] 内容清理完成:', {
            清理前长度: selectedText.length,
            清理后长度: cleanedContent.length
          });
          
          // 统计字数
          const chineseChars = cleanedContent.match(/[\u4e00-\u9fa5]/g);
          const englishWords = cleanedContent.match(/[a-zA-Z]+/g);
          const wordCount = (chineseChars ? chineseChars.length : 0) + (englishWords ? englishWords.length : 0);
          
          console.log('📊 [Injected Script] 选中内容字数统计:', {
            中文字符: chineseChars ? chineseChars.length : 0,
            英文单词: englishWords ? englishWords.length : 0,
            总字数: wordCount
          });

          const result = {
            content: cleanedContent,
            url: window.location.href,
            wordCount
          };
          
          console.log('🎉 [Injected Script] 选中内容提取完成:', {
            URL: result.url,
            内容长度: result.content.length,
            字数: result.wordCount,
            内容预览: result.content.substring(0, 100) + '...'
          });

          return result;
        }
      });

      console.log('📦 [Side Panel] 选中内容提取脚本执行完成，处理结果...');
      const extractedContent = results[0]?.result;
      
      console.log('📋 [Side Panel] 选中内容提取结果:', {
        是否有结果: !!extractedContent,
        内容长度: extractedContent?.content?.length || 0,
        字数: extractedContent?.wordCount
      });
      
      if (!extractedContent?.content) {
        console.error('❌ [Side Panel] 选中内容提取失败：无有效内容');
        throw new Error('请先选择要摘要的内容');
      }
      
      console.log('✅ [Side Panel] 选中内容提取成功，准备发送给AI处理...');

      // 检查AI配置
      if (!settings.ai.apiKey) {
        throw new Error('请先在设置中配置API密钥');
      }

      // 创建AI服务实例并生成摘要
      const aiService = new AIService(settings.ai);
      const summaryContent = await aiService.generateSummary(
        extractedContent.content,
        settings.summary,
        'selection'
      );

      // 创建摘要结果
      const summary: SummaryResult = {
        id: Date.now().toString(),
        title: '选中内容摘要',
        content: summaryContent,
        url: extractedContent.url,
        timestamp: Date.now(),
        wordCount: extractedContent.wordCount,
        type: 'selection'
      };

      // 保存到历史记录
      const storageManager = new StorageManager();
      await storageManager.saveSummary(summary);

      setCurrentSummary(summary);
      setCurrentView('summary');
    } catch (err) {
      console.error('生成选中内容摘要失败:', err);
      const errorMessage = err instanceof Error ? err.message : '生成摘要失败，请重试';
      setError(errorMessage);
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理传递的选中内容摘要（从右键菜单触发）
  const handleSummarizeSelectionWithText = async (selectedText: string) => {
    setIsLoading(true);
    setCurrentView('loading');
    setError(null);

    try {
      // 获取当前页面URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url || window.location.href;

      // 清理内容
      const cleanedContent = selectedText.replace(/\s+/g, ' ').trim().substring(0, 50000);
      
      // 统计字数
      const chineseChars = cleanedContent.match(/[\u4e00-\u9fa5]/g);
      const englishWords = cleanedContent.match(/[a-zA-Z]+/g);
      const wordCount = (chineseChars ? chineseChars.length : 0) + (englishWords ? englishWords.length : 0);

      // 检查AI配置
      if (!settings.ai.apiKey) {
        throw new Error('请先在设置中配置API密钥');
      }

      // 创建AI服务实例并生成摘要
      const aiService = new AIService(settings.ai);
      const summaryContent = await aiService.generateSummary(
        cleanedContent,
        settings.summary,
        'selection'
      );

      // 创建摘要结果
      const summary: SummaryResult = {
        id: Date.now().toString(),
        title: '选中内容摘要',
        content: summaryContent,
        url: currentUrl,
        timestamp: Date.now(),
        wordCount: wordCount,
        type: 'selection'
      };

      // 保存到历史记录
      const storageManager = new StorageManager();
      await storageManager.saveSummary(summary);

      setCurrentSummary(summary);
      setCurrentView('summary');
    } catch (err) {
      console.error('生成选中内容摘要失败:', err);
      const errorMessage = err instanceof Error ? err.message : '生成摘要失败，请重试';
      setError(errorMessage);
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理右键触发的页面摘要（重新获取最新设置）
  const handleTriggeredPageSummary = async () => {
    setIsLoading(true);
    setCurrentView('loading');
    setError(null);

    try {
      // 重新获取最新设置
      const storageManager = new StorageManager();
      const currentSettings = await storageManager.getSettings();
      if (!currentSettings) {
        throw new Error('无法获取设置信息');
      }
      
      console.log('Triggered page summary with settings:', currentSettings.ai.provider, 'API key length:', currentSettings.ai.apiKey ? currentSettings.ai.apiKey.length : 0);

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('无法获取当前页面信息');
      }

      // 通过content script使用ContentExtractor提取内容
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
      
      if (!response?.success) {
        throw new Error(response?.error || '无法提取页面内容');
      }
      
      const extractedContent = response.data;
      if (!extractedContent?.content) {
        throw new Error('无法提取页面内容');
      }

      // 检查AI配置
      if (!currentSettings.ai.apiKey) {
        throw new Error('请先在设置中配置API密钥');
      }

      // 创建AI服务实例并生成摘要
      const aiService = new AIService(currentSettings.ai);
      const summaryContent = await aiService.generateSummary(
        extractedContent.content,
        currentSettings.summary,
        'page'
      );

      // 创建摘要结果
      const summary: SummaryResult = {
        id: Date.now().toString(),
        title: extractedContent.title,
        content: summaryContent,
        url: extractedContent.url,
        timestamp: Date.now(),
        wordCount: extractedContent.wordCount,
        type: 'page'
      };

      // 保存到历史记录
      await storageManager.saveSummary(summary);

      setCurrentSummary(summary);
      setCurrentView('summary');
    } catch (err) {
      console.error('生成页面摘要失败:', err);
      const errorMessage = err instanceof Error ? err.message : '生成摘要失败，请重试';
      setError(errorMessage);
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理右键触发的选中内容摘要（重新获取最新设置）
  const handleTriggeredSelectionSummary = async (selectedText: string) => {
    setIsLoading(true);
    setCurrentView('loading');
    setError(null);

    try {
      // 重新获取最新设置
      const storageManager = new StorageManager();
      const currentSettings = await storageManager.getSettings();
      if (!currentSettings) {
        throw new Error('无法获取设置信息');
      }
      
      console.log('Triggered selection summary with settings:', currentSettings.ai.provider, 'API key length:', currentSettings.ai.apiKey ? currentSettings.ai.apiKey.length : 0);

      // 获取当前页面URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url || window.location.href;

      // 清理内容
      const cleanedContent = selectedText.replace(/\s+/g, ' ').trim().substring(0, 50000);
      
      // 统计字数
      const chineseChars = cleanedContent.match(/[\u4e00-\u9fa5]/g);
      const englishWords = cleanedContent.match(/[a-zA-Z]+/g);
      const wordCount = (chineseChars ? chineseChars.length : 0) + (englishWords ? englishWords.length : 0);

      // 检查AI配置
      if (!currentSettings.ai.apiKey) {
        throw new Error('请先在设置中配置API密钥');
      }

      // 创建AI服务实例并生成摘要
      const aiService = new AIService(currentSettings.ai);
      const summaryContent = await aiService.generateSummary(
        cleanedContent,
        currentSettings.summary,
        'selection'
      );

      // 创建摘要结果
      const summary: SummaryResult = {
        id: Date.now().toString(),
        title: '选中内容摘要',
        content: summaryContent,
        url: currentUrl,
        timestamp: Date.now(),
        wordCount: wordCount,
        type: 'selection'
      };

      // 保存到历史记录
      await storageManager.saveSummary(summary);

      setCurrentSummary(summary);
      setCurrentView('summary');
    } catch (err) {
      console.error('生成选中内容摘要失败:', err);
      const errorMessage = err instanceof Error ? err.message : '生成摘要失败，请重试';
      setError(errorMessage);
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开设置面板
  const handleOpenSettings = () => {
    setCurrentView('settings');
  };

  // 打开历史记录
  const handleOpenHistory = () => {
    setCurrentView('history');
  };

  // 关闭面板
  const handleClosePanel = () => {
    setCurrentView(currentSummary ? 'summary' : 'welcome');
  };

  // 保存设置
  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const storageManager = new StorageManager();
      await storageManager.saveSettings(newSettings);
      setSettings(newSettings);
      setCurrentView(currentSummary ? 'summary' : 'welcome');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  // 开始聊天
  const handleStartChat = () => {
    if (currentSummary) {
      // 创建摘要内容作为第一条系统消息
      const summaryMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `📋 **摘要内容**\n\n${currentSummary.content}`,
        role: 'assistant',
        timestamp: Date.now()
      };

      const newChatSession: ChatSession = {
        id: Date.now().toString(),
        title: `关于"${currentSummary.title}"的对话`,
        messages: [summaryMessage], // 将摘要作为第一条消息
        context: currentSummary.content,
        timestamp: Date.now()
      };
      
      setCurrentChatSession(newChatSession);
      setCurrentView('chat');
    }
  };

  // 重试操作
  const handleRetry = () => {
    setError(null);
    setCurrentView('welcome');
  };

  return (
    <div className="app">
      <Header
        onSummarizePage={handleSummarizePage}
        onSummarizeSelection={handleSummarizeSelection}
        onOpenSettings={handleOpenSettings}
        onOpenHistory={handleOpenHistory}
        hasSelection={hasSelection}
        isLoading={isLoading}
      />

      <main className="content-area">
        {currentView === 'welcome' && <WelcomeScreen />}
        
        {currentView === 'loading' && (
          <LoadingScreen message="正在生成摘要..." />
        )}
        
        {currentView === 'summary' && currentSummary && (
          <SummaryContainer
            summary={currentSummary}
            onStartChat={handleStartChat}
          />
        )}
        
        {currentView === 'chat' && currentChatSession && (
          <ChatContainer
            session={currentChatSession}
            onUpdateSession={setCurrentChatSession}
            aiConfig={settings.ai}
            summaryContext={currentSummary?.content}
          />
        )}
        
        {currentView === 'error' && (
          <ErrorContainer
            message={error || '操作失败'}
            onRetry={handleRetry}
          />
        )}
        
        {currentView === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSave={handleSaveSettings}
            onClose={handleClosePanel}
          />
        )}
        
        {currentView === 'history' && (
          <HistoryPanel
            onClose={handleClosePanel}
            onSelectSummary={setCurrentSummary}
            onSelectChat={setCurrentChatSession}
          />
        )}
      </main>
    </div>
  );
};

export default App;
