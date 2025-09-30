// AI服务相关类型
export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  defaultModel?: string;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// 单个AI提供商的完整配置
export interface AIProviderConfig {
  id: string; // 唯一标识符
  name: string; // 用户自定义名称
  provider: string; // 提供商类型 (openai, claude, gemini 等)
  apiKey: string;
  baseUrl?: string;
  model?: string;
  isDefault?: boolean; // 是否为默认配置
  createdAt: number;
  updatedAt: number;
}

// 多配置管理
export interface MultiAIConfig {
  configs: AIProviderConfig[];
  defaultConfigId?: string; // 当前选中的默认配置ID
}

// API验证相关类型
export interface APIValidationResult {
  isValid: boolean;
  error?: string;
  modelSupported?: boolean;
  availableModels?: string[];
}

export interface APIValidationStatus {
  isValidating: boolean;
  lastValidated?: number;
  result?: APIValidationResult;
}

// 摘要相关类型
export interface SummaryResult {
  id: string;
  title: string;
  content: string;
  url: string;
  timestamp: number;
  wordCount: number;
  type: 'page' | 'selection';
  aiConfigId?: string; // 使用的AI配置ID
  aiProvider?: string; // AI提供商名称
  aiModel?: string; // AI模型名称
}

// 自定义风格
export interface CustomStyle {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SummarySettings {
  length: 'short' | 'medium' | 'long';
  style: string; // 内置风格或自定义风格ID
  language: 'zh' | 'en' | 'auto';
  customStyles: CustomStyle[]; // 自定义风格列表
}

// 聊天相关类型
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  context?: string; // 摘要内容作为上下文
  timestamp: number;
  currentAIConfigId?: string; // 当前使用的AI配置ID
  aiProvider?: string; // 当前AI提供商名称
  aiModel?: string; // 当前AI模型名称
}

// 快捷回复相关类型
export interface QuickReply {
  id: string;
  text: string;
  isDefault: boolean;
  createdAt: number;
}

export interface QuickReplySettings {
  enabled: boolean;
  replies: QuickReply[];
}

// 设置相关类型
export interface AppSettings {
  ai: MultiAIConfig; // 改为多配置支持
  summary: SummarySettings;
  quickReply: QuickReplySettings;
  ui: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
  };
}

// 应用状态类型
export type ViewType = 'welcome' | 'loading' | 'summary' | 'chat' | 'error' | 'settings' | 'history';

export interface AppState {
  currentView: ViewType;
  currentSummary: SummaryResult | null;
  currentChatSession: ChatSession | null;
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

// Chrome扩展相关类型
export interface ContentMessage {
  type: 'GET_PAGE_CONTENT' | 'GET_SELECTION' | 'CONTENT_RESPONSE' | 'SELECTION_RESPONSE' | 'TRIGGER_PAGE_SUMMARY' | 'TRIGGER_SELECTION_SUMMARY';
  data?: any;
}
