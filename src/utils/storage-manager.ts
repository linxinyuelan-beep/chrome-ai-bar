import { AppSettings, SummaryResult, ChatSession, AIProviderConfig, MultiAIConfig } from '../types/index';

interface StorageKeys {
  settings: 'settings';
  summaries: 'summaries';
  chats: 'chats';
}

export class StorageManager {
  private defaultSettings: AppSettings = {
    ai: {
      configs: [],
      defaultConfigId: undefined
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

  // ===== AI配置管理方法 =====

  // 生成唯一配置ID
  private generateConfigId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // 添加AI配置
  async addAIConfig(config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIProviderConfig> {
    try {
      const settings = await this.getSettings() || this.defaultSettings;
      const now = Date.now();
      
      const newConfig: AIProviderConfig = {
        ...config,
        id: this.generateConfigId(),
        createdAt: now,
        updatedAt: now
      };

      settings.ai.configs.push(newConfig);
      
      // 如果这是第一个配置，设为默认
      if (settings.ai.configs.length === 1 || config.isDefault) {
        settings.ai.defaultConfigId = newConfig.id;
        // 确保只有一个默认配置
        settings.ai.configs.forEach(c => {
          c.isDefault = c.id === newConfig.id;
        });
      }

      await this.saveSettings(settings);
      return newConfig;
    } catch (error) {
      console.error('Failed to add AI config:', error);
      throw new Error('无法添加AI配置');
    }
  }

  // 更新AI配置
  async updateAIConfig(configId: string, updates: Partial<Omit<AIProviderConfig, 'id' | 'createdAt'>>): Promise<AIProviderConfig> {
    try {
      const settings = await this.getSettings() || this.defaultSettings;
      const configIndex = settings.ai.configs.findIndex(c => c.id === configId);
      
      if (configIndex === -1) {
        throw new Error('配置不存在');
      }

      const updatedConfig = {
        ...settings.ai.configs[configIndex],
        ...updates,
        updatedAt: Date.now()
      };

      settings.ai.configs[configIndex] = updatedConfig;

      // 如果设为默认，更新defaultConfigId并取消其他默认
      if (updates.isDefault) {
        settings.ai.defaultConfigId = configId;
        settings.ai.configs.forEach(c => {
          c.isDefault = c.id === configId;
        });
      }

      await this.saveSettings(settings);
      return updatedConfig;
    } catch (error) {
      console.error('Failed to update AI config:', error);
      throw new Error('无法更新AI配置');
    }
  }

  // 删除AI配置
  async deleteAIConfig(configId: string): Promise<void> {
    try {
      const settings = await this.getSettings() || this.defaultSettings;
      const configIndex = settings.ai.configs.findIndex(c => c.id === configId);
      
      if (configIndex === -1) {
        throw new Error('配置不存在');
      }

      const isDefault = settings.ai.defaultConfigId === configId;
      settings.ai.configs.splice(configIndex, 1);

      // 如果删除的是默认配置，设置新的默认
      if (isDefault && settings.ai.configs.length > 0) {
        settings.ai.defaultConfigId = settings.ai.configs[0].id;
        settings.ai.configs[0].isDefault = true;
      } else if (settings.ai.configs.length === 0) {
        settings.ai.defaultConfigId = undefined;
      }

      await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to delete AI config:', error);
      throw new Error('无法删除AI配置');
    }
  }

  // 设置默认AI配置
  async setDefaultAIConfig(configId: string): Promise<void> {
    try {
      const settings = await this.getSettings() || this.defaultSettings;
      const config = settings.ai.configs.find(c => c.id === configId);
      
      if (!config) {
        throw new Error('配置不存在');
      }

      settings.ai.defaultConfigId = configId;
      settings.ai.configs.forEach(c => {
        c.isDefault = c.id === configId;
      });

      await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to set default AI config:', error);
      throw new Error('无法设置默认配置');
    }
  }

  // 获取默认AI配置
  async getDefaultAIConfig(): Promise<AIProviderConfig | null> {
    try {
      const settings = await this.getSettings();
      if (!settings?.ai.defaultConfigId) {
        return null;
      }

      return settings.ai.configs.find(c => c.id === settings.ai.defaultConfigId) || null;
    } catch (error) {
      console.error('Failed to get default AI config:', error);
      return null;
    }
  }

  // 获取所有AI配置
  async getAllAIConfigs(): Promise<AIProviderConfig[]> {
    try {
      const settings = await this.getSettings();
      return settings?.ai.configs || [];
    } catch (error) {
      console.error('Failed to get AI configs:', error);
      return [];
    }
  }

  // 复制AI配置
  async duplicateAIConfig(configId: string, newName?: string): Promise<AIProviderConfig> {
    try {
      const settings = await this.getSettings() || this.defaultSettings;
      const originalConfig = settings.ai.configs.find(c => c.id === configId);
      
      if (!originalConfig) {
        throw new Error('配置不存在');
      }

      const duplicatedConfig = {
        ...originalConfig,
        name: newName || `${originalConfig.name} (副本)`,
        isDefault: false // 副本不设为默认
      };

      return await this.addAIConfig(duplicatedConfig);
    } catch (error) {
      console.error('Failed to duplicate AI config:', error);
      throw new Error('无法复制AI配置');
    }
  }

  // 迁移旧配置到新格式
  async migrateOldSettings(): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings) return;

      // 检查是否是旧格式（ai字段包含provider等属性）
      const oldAI = settings.ai as any;
      if (oldAI.provider && oldAI.apiKey !== undefined) {
        // 创建新的多配置格式
        const migratedConfig: AIProviderConfig = {
          id: this.generateConfigId(),
          name: `${oldAI.provider} (迁移)`,
          provider: oldAI.provider,
          apiKey: oldAI.apiKey || '',
          baseUrl: oldAI.baseUrl || '',
          model: oldAI.model || '',
          isDefault: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const newSettings: AppSettings = {
          ...settings,
          ai: {
            configs: [migratedConfig],
            defaultConfigId: migratedConfig.id
          }
        };

        await this.saveSettings(newSettings);
        console.log('Successfully migrated old AI settings to new format');
      }
    } catch (error) {
      console.error('Failed to migrate old settings:', error);
    }
  }
}