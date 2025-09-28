import { AppSettings, SummaryResult, ChatSession } from '../types';

interface StorageKeys {
  settings: 'settings';
  summaries: 'summaries';
  chats: 'chats';
}

export class StorageManager {
  private defaultSettings: AppSettings = {
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
  };

  // 获取设置
  async getSettings(): Promise<AppSettings | null> {
    try {
      const result = await chrome.storage.sync.get('settings');
      if (result.settings) {
        // 合并默认设置以确保新字段存在
        return { ...this.defaultSettings, ...result.settings };
      }
      return null;
    } catch (error) {
      console.error('Failed to get settings from sync storage:', error);
      // 降级到本地存储
      try {
        const result = await chrome.storage.local.get('settings');
        return result.settings ? { ...this.defaultSettings, ...result.settings } : null;
      } catch (localError) {
        console.error('Failed to get settings from local storage:', localError);
        return null;
      }
    }
  }

  // 保存设置
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await chrome.storage.sync.set({ settings });
      // 同时备份到本地存储
      await chrome.storage.local.set({ settings });
    } catch (error) {
      console.error('Failed to save settings to sync storage:', error);
      // 降级到本地存储
      try {
        await chrome.storage.local.set({ settings });
      } catch (localError) {
        console.error('Failed to save settings to local storage:', localError);
        throw new Error('无法保存设置');
      }
    }
  }

  // 初始化默认设置
  async initializeDefaultSettings(): Promise<AppSettings> {
    try {
      const existingSettings = await this.getSettings();
      const mergedSettings = existingSettings 
        ? { ...this.defaultSettings, ...existingSettings }
        : this.defaultSettings;
      
      await this.saveSettings(mergedSettings);
      return mergedSettings;
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      return this.defaultSettings;
    }
  }

  // 获取摘要历史
  async getSummaries(): Promise<SummaryResult[]> {
    try {
      const result = await chrome.storage.local.get('summaries');
      return result.summaries || [];
    } catch (error) {
      console.error('Failed to get summaries:', error);
      return [];
    }
  }

  // 保存摘要
  async saveSummary(summary: SummaryResult): Promise<void> {
    try {
      const summaries = await this.getSummaries();
      const updated = [summary, ...summaries.slice(0, 99)]; // 保留最近100条
      await chrome.storage.local.set({ summaries: updated });
    } catch (error) {
      console.error('Failed to save summary:', error);
      throw new Error('无法保存摘要');
    }
  }

  // 删除摘要
  async deleteSummary(summaryId: string): Promise<void> {
    try {
      const summaries = await this.getSummaries();
      const filtered = summaries.filter(s => s.id !== summaryId);
      await chrome.storage.local.set({ summaries: filtered });
    } catch (error) {
      console.error('Failed to delete summary:', error);
      throw new Error('无法删除摘要');
    }
  }

  // 获取聊天历史
  async getChats(): Promise<ChatSession[]> {
    try {
      const result = await chrome.storage.local.get('chats');
      return result.chats || [];
    } catch (error) {
      console.error('Failed to get chats:', error);
      return [];
    }
  }

  // 保存聊天会话
  async saveChat(chat: ChatSession): Promise<void> {
    try {
      const chats = await this.getChats();
      const existingIndex = chats.findIndex(c => c.id === chat.id);
      
      if (existingIndex >= 0) {
        chats[existingIndex] = chat;
      } else {
        chats.unshift(chat);
      }
      
      // 保留最近50个会话
      const updated = chats.slice(0, 50);
      await chrome.storage.local.set({ chats: updated });
    } catch (error) {
      console.error('Failed to save chat:', error);
      throw new Error('无法保存对话');
    }
  }

  // 删除聊天会话
  async deleteChat(chatId: string): Promise<void> {
    try {
      const chats = await this.getChats();
      const filtered = chats.filter(c => c.id !== chatId);
      await chrome.storage.local.set({ chats: filtered });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw new Error('无法删除对话');
    }
  }

  // 清除所有数据
  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error('无法清除数据');
    }
  }

  // 导出数据
  async exportData(): Promise<string> {
    try {
      const [settings, summaries, chats] = await Promise.all([
        this.getSettings(),
        this.getSummaries(),
        this.getChats()
      ]);

      const exportData = {
        version: '1.0.0',
        timestamp: Date.now(),
        settings,
        summaries,
        chats
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('无法导出数据');
    }
  }

  // 导入数据
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.settings) {
        await this.saveSettings(data.settings);
      }
      
      if (data.summaries) {
        await chrome.storage.local.set({ summaries: data.summaries });
      }
      
      if (data.chats) {
        await chrome.storage.local.set({ chats: data.chats });
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('无法导入数据，请检查数据格式');
    }
  }
}