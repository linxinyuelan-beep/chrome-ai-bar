import { AIConfig, SummarySettings, ChatMessage, APIValidationResult } from '../types/index';

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface StreamChunk {
  delta: string;
  finished: boolean;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class AIService {
  private readonly cache = new Map<string, { data: AIResponse; timestamp: number }>();
  private readonly rateLimiter = new Map<string, RateLimitInfo>();
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  // 更新配置
  updateConfig(config: AIConfig): void {
    this.config = config;
  }

  // 生成摘要（流式输出）
  async generateSummaryStream(
    content: string,
    settings: SummarySettings,
    type: 'page' | 'selection' = 'page',
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!content || content.trim().length === 0) {
      throw new Error('内容不能为空');
    }

    if (!this.config.apiKey) {
      throw new Error('请先配置API密钥');
    }

    // 检查缓存
    const cacheKey = this.getCacheKey('summary', content, settings);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1小时缓存
      // 对于缓存结果，模拟流式输出
      if (onChunk) {
        const chunks = this.simulateStreamChunks(cached.data.content);
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms延迟
          onChunk(chunk);
        }
      }
      return cached.data.content;
    }

    // 检查频率限制
    await this.checkRateLimit('summary');

    // 构建提示词
    const prompt = this.buildSummaryPrompt(content, settings, type);

    // 调用AI服务（流式）
    const fullResponse = await this.callAIStream(prompt, onChunk);

    // 缓存结果
    this.cache.set(cacheKey, {
      data: { content: fullResponse },
      timestamp: Date.now()
    });

    return fullResponse;
  }

  // 生成摘要（非流式，保持向后兼容）
  async generateSummary(
    content: string,
    settings: SummarySettings,
    type: 'page' | 'selection' = 'page'
  ): Promise<string> {
    return this.generateSummaryStream(content, settings, type);
  }

  // 生成聊天回复（流式输出）
  async generateChatResponseStream(
    messages: ChatMessage[],
    context?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('请先配置API密钥');
    }

    // 检查频率限制
    await this.checkRateLimit('chat');

    // 构建对话消息
    const chatMessages = this.buildChatMessages(messages, context);

    // 调用AI服务（流式）
    const fullResponse = await this.callAIStream(chatMessages, onChunk);

    return fullResponse;
  }

  // 生成聊天回复（非流式，保持向后兼容）
  async generateChatResponse(
    messages: ChatMessage[],
    context?: string
  ): Promise<string> {
    return this.generateChatResponseStream(messages, context);
  }

  // 调用AI服务（流式）
  private async callAIStream(messages: any, onChunk?: (chunk: string) => void): Promise<string> {
    const { provider } = this.config;

    switch (provider) {
      case 'openai':
        return this.callOpenAIStream(messages, onChunk);
      case 'claude':
        return this.callClaudeStream(messages, onChunk);
      case 'gemini':
        return this.callGeminiStream(messages, onChunk);
      default:
        throw new Error(`不支持的AI提供商: ${provider}`);
    }
  }

  // 调用AI服务（非流式，保持向后兼容）
  private async callAI(messages: any): Promise<AIResponse> {
    const fullResponse = await this.callAIStream(messages);
    return { content: fullResponse };
  }

  // 获取OpenAI模型的正确token参数名
  private getOpenAITokensParam(model: string, maxTokens: number): object {
    if (model.startsWith('gpt-5-nano') || model.startsWith('gpt-5-mini')) {
      return { max_completion_tokens: maxTokens, temperature: 1 };
    }
    return { max_completion_tokens: maxTokens }
  }

  // OpenAI API调用
  private async callOpenAI(messages: any): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const model = this.config.model || 'gpt-5-mini';

    // 构建请求体，使用正确的token参数
    const requestBody = {
      model,
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      temperature: 0.7,
      ...this.getOpenAITokensParam(model, 2000),
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
    };
  }

  // OpenAI 流式API调用
  private async callOpenAIStream(messages: any, onChunk?: (chunk: string) => void): Promise<string> {
    const response = await this.createOpenAIStreamRequest(messages);
    return this.processOpenAIStreamResponse(response, onChunk);
  }

  // 创建OpenAI流式请求
  private async createOpenAIStreamRequest(messages: any): Promise<Response> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const model = this.config.model || 'gpt-5-mini';

    const requestBody = {
      model,
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      temperature: 0.7,
      stream: true,
      ...this.getOpenAITokensParam(model, 2000),
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API错误: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('响应流不可用');
    }

    return response;
  }

  // 处理OpenAI流式响应
  private async processOpenAIStreamResponse(response: Response, onChunk?: (chunk: string) => void): Promise<string> {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const content = this.parseOpenAIStreamChunk(chunk);
        if (content) {
          fullContent += content;
          onChunk?.(content);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  // 解析OpenAI流式响应块
  private parseOpenAIStreamChunk(chunk: string): string {
    const lines = chunk.split('\n');
    let content = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const deltaContent = parsed.choices?.[0]?.delta?.content || '';
          content += deltaContent;
        } catch (error) {
          console.warn('Failed to parse stream chunk:', error);
        }
      }
    }

    return content;
  }

  // Claude API调用
  private async callClaude(messages: any): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    const model = this.config.model || 'claude-3-sonnet-20240229';

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || '',
      usage: data.usage,
    };
  }

  // Claude 流式API调用 (Claude API暂不支持流式，使用模拟流式输出)
  private async callClaudeStream(messages: any, onChunk?: (chunk: string) => void): Promise<string> {
    // 先获取完整响应
    const response = await this.callClaude(messages);
    
    // 模拟流式输出
    if (onChunk && response.content) {
      const chunks = this.simulateStreamChunks(response.content);
      for (const chunk of chunks) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onChunk(chunk);
      }
    }
    
    return response.content;
  }

  // Gemini API调用
  private async callGemini(messages: any): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = this.config.model || 'gemini-pro';

    const content = Array.isArray(messages)
      ? messages.map(m => m.content).join('\\n\\n')
      : messages;

    const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: content }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    };
  }

  // Gemini 流式API调用 (使用模拟流式输出)
  private async callGeminiStream(messages: any, onChunk?: (chunk: string) => void): Promise<string> {
    // 先获取完整响应
    const response = await this.callGemini(messages);
    
    // 模拟流式输出
    if (onChunk && response.content) {
      const chunks = this.simulateStreamChunks(response.content);
      for (const chunk of chunks) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onChunk(chunk);
      }
    }
    
    return response.content;
  }

  // 构建摘要提示词
  private buildSummaryPrompt(
    content: string,
    settings: SummarySettings,
    type: 'page' | 'selection'
  ): string {
    const { length, style, language } = settings;

    let lengthInstruction = '';
    switch (length) {
      case 'short':
        lengthInstruction = '简洁的摘要（100-200字）';
        break;
      case 'medium':
        lengthInstruction = '中等长度的摘要（200-400字）';
        break;
      case 'long':
        lengthInstruction = '详细的摘要（400-600字）';
        break;
    }

    let styleInstruction = '';
    switch (style) {
      case 'bullet':
        styleInstruction = '使用要点列表的形式';
        break;
      case 'paragraph':
        styleInstruction = '使用段落的形式';
        break;
      case 'qa':
        styleInstruction = '使用问答的形式';
        break;
    }

    let languageInstruction = '';
    switch (language) {
      case 'zh':
        languageInstruction = '用中文回复';
        break;
      case 'en':
        languageInstruction = '用英文回复';
        break;
      case 'auto':
        languageInstruction = '根据内容的主要语言来回复';
        break;
    }

    const typeText = type === 'page' ? '网页内容' : '选中的文本内容';

    return `请对以下${typeText}进行智能摘要。要求：
1. ${lengthInstruction}
2. ${styleInstruction}
3. ${languageInstruction}
4. 提取关键信息和主要观点
5. 保持客观准确

内容：
${content}`;
  }

  // 构建聊天消息
  private buildChatMessages(messages: ChatMessage[], context?: string): any[] {
    const chatMessages = [];

    // 添加系统消息（包含上下文）
    if (context) {
      chatMessages.push({
        role: 'system',
        content: `你是一个智能助手。用户基于以下摘要内容与你对话：

${context}

请基于这个摘要内容回答用户的问题，保持回答的准确性和相关性。`
      });
    }

    // 添加对话历史
    messages.forEach(message => {
      chatMessages.push({
        role: message.role,
        content: message.content
      });
    });

    return chatMessages;
  }

  // 生成缓存键
  private getCacheKey(type: string, content: string, options: any): string {
    const optionsStr = JSON.stringify(options);
    const contentHash = this.simpleHash(content);
    return `${type}_${contentHash}_${this.simpleHash(optionsStr)}`;
  }

  // 简单哈希函数
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  // 检查频率限制
  private async checkRateLimit(type: string): Promise<void> {
    const now = Date.now();
    const limit = this.rateLimiter.get(type);

    if (limit) {
      if (now < limit.resetTime) {
        if (limit.count >= 30) { // 每分钟最多30次请求
          const waitTime = limit.resetTime - now;
          throw new Error(`请求过于频繁，请等待${Math.ceil(waitTime / 1000)}秒`);
        }
        limit.count++;
      } else {
        // 重置计数器
        this.rateLimiter.set(type, {
          count: 1,
          resetTime: now + 60000 // 1分钟后重置
        });
      }
    } else {
      this.rateLimiter.set(type, {
        count: 1,
        resetTime: now + 60000
      });
    }
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
  }

  // 清除频率限制
  clearRateLimit(): void {
    this.rateLimiter.clear();
  }

  // 模拟流式输出的分块函数
  private simulateStreamChunks(content: string): string[] {
    const chunks: string[] = [];
    const chunkSize = Math.max(1, Math.floor(content.length / 50)); // 分成大约50块
    
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    
    return chunks;
  }

  // 验证API服务是否可用
  async validateAPI(): Promise<APIValidationResult> {
    if (!this.config.apiKey) {
      return {
        isValid: false,
        error: 'API密钥不能为空'
      };
    }

    try {
      const testMessage = 'Hello, this is a test message to validate API connection.';

      switch (this.config.provider) {
        case 'openai':
          return await this.validateOpenAI(testMessage);
        case 'claude':
          return await this.validateClaude(testMessage);
        case 'gemini':
          return await this.validateGemini(testMessage);
        default:
          return {
            isValid: false,
            error: `不支持的AI提供商: ${this.config.provider}`
          };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '验证过程中发生未知错误'
      };
    }
  }

  // 验证OpenAI API
  private async validateOpenAI(testMessage: string): Promise<APIValidationResult> {
    try {
      const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
      const model = this.config.model || 'gpt-3.5-turbo';

      // 首先获取可用的模型列表
      let availableModels: string[] = [];
      try {
        const modelsResponse = await fetch(`${baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        });

        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          availableModels = modelsData.data
            ?.filter((m: any) => m.id.includes('gpt'))
            ?.map((m: any) => m.id) || [];
        }
      } catch (error) {
        // 如果获取模型列表失败，继续进行基本验证
        console.warn('Failed to fetch available models:', error);
      }

      // 测试API连接
      const requestBody = {
        model,
        messages: [{ role: 'user', content: testMessage }],
        temperature: 0.7,
        ...this.getOpenAITokensParam(model, 10),
      };

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          isValid: false,
          error: error.error?.message || `API错误: ${response.status}`,
          availableModels
        };
      }

      const data = await response.json();
      const modelSupported = !!data.choices?.[0]?.message;

      return {
        isValid: true,
        modelSupported,
        availableModels
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'OpenAI API验证失败'
      };
    }
  }

  // 验证Claude API
  private async validateClaude(testMessage: string): Promise<APIValidationResult> {
    try {
      const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
      const model = this.config.model || 'claude-3-sonnet-20240229';

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: testMessage }],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          isValid: false,
          error: error.error?.message || `API错误: ${response.status}`
        };
      }

      const data = await response.json();
      const modelSupported = !!data.content?.[0]?.text;

      return {
        isValid: true,
        modelSupported,
        availableModels: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Claude API验证失败'
      };
    }
  }

  // 验证Gemini API
  private async validateGemini(testMessage: string): Promise<APIValidationResult> {
    try {
      const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      const model = this.config.model || 'gemini-pro';

      const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: testMessage }]
          }],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          isValid: false,
          error: error.error?.message || `API错误: ${response.status}`
        };
      }

      const data = await response.json();
      const modelSupported = !!data.candidates?.[0]?.content?.parts?.[0]?.text;

      return {
        isValid: true,
        modelSupported,
        availableModels: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Gemini API验证失败'
      };
    }
  }
}