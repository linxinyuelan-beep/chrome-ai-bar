// 类型定义文件
export type ViewType = 
  | 'welcome' 
  | 'loading' 
  | 'summary' 
  | 'chat' 
  | 'error' 
  | 'settings' 
  | 'history';

export interface AppState {
  currentView: ViewType;
  isLoading: boolean;
  error: string | null;
}

export interface SummaryResult {
  id: string;
  title: string;
  content: string;
  url: string;
  timestamp: number;
  wordCount: number;
  type: 'page' | 'selection';
}

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
  context?: string;
  timestamp: number;
}

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface SummarySettings {
  length: 'short' | 'medium' | 'long';
  style: 'bullet' | 'paragraph' | 'qa';
  language: 'zh' | 'en' | 'auto';
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
}

export interface AppSettings {
  ai: AIConfig;
  summary: SummarySettings;
  ui: UISettings;
}

// Chrome扩展消息类型
export interface ContentMessage {
  type: 'GET_PAGE_CONTENT' | 'GET_SELECTION' | 'SUMMARIZE_PAGE' | 'SUMMARIZE_SELECTION' | 'SELECTION_CHANGED';
  data?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}