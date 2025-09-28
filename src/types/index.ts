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
}

export interface SummarySettings {
  length: 'short' | 'medium' | 'long';
  style: 'bullet' | 'paragraph' | 'qa';
  language: 'zh' | 'en' | 'auto';
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
}

// 设置相关类型
export interface AppSettings {
  ai: AIConfig;
  summary: SummarySettings;
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
