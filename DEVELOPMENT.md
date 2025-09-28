# 开发文档

## 项目概述

智能摘要助手是一个基于AI的Chrome浏览器扩展，旨在帮助用户快速理解网页内容。本项目采用Chrome Extension Manifest V3架构，集成多种AI服务，提供智能摘要和问答功能。

## 技术栈

- **Chrome Extension API**: Manifest V3, Side Panel, Content Scripts, Service Worker
- **前端技术**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **AI服务**: OpenAI GPT, Anthropic Claude, Google Gemini
- **存储**: Chrome Storage API (sync + local)
- **网络请求**: Fetch API
- **模块化**: ES6 Modules

## 架构设计

### 1. 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   Service       │    │   Side Panel    │
│   Script        │◄──►│   Worker        │◄──►│   (UI)          │
│                 │    │   (Background)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Page      │    │   AI Services   │    │   Chrome APIs   │
│   Content       │    │   (OpenAI,      │    │   (Storage,     │
│                 │    │   Claude, etc.) │    │   Tabs, etc.)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. 消息通信流程

```
Web Page ──(select text)──► Content Script
                                   │
                                   ▼
                            Service Worker ──(API call)──► AI Service
                                   │                           │
                                   ▼                           │
                            Storage Manager ◄─────────────────┘
                                   │
                                   ▼
Side Panel ◄──(update UI)──── Service Worker
```

## 核心模块详解

### 1. Service Worker (`src/background/service-worker.js`)

**职责**：
- Chrome扩展的后台核心，处理所有业务逻辑
- 管理与AI服务的API通信
- 协调各组件间的消息传递
- 处理右键菜单和扩展图标点击事件

**关键类**：
```javascript
class BackgroundService {
  constructor() {
    this.aiService = new AIService();
    this.storageManager = new StorageManager();
    this.setupEventListeners();
  }
}
```

**主要功能**：
- `handleGetPageContent()`: 获取网页内容
- `handleGenerateSummary()`: 生成摘要
- `handleChatMessage()`: 处理对话消息
- `setupContextMenus()`: 设置右键菜单

### 2. Content Script (`src/content/content-script.js`)

**职责**：
- 在网页上下文中运行，负责内容提取和用户交互
- 智能识别网页主要内容区域
- 检测用户选中的文本
- 与页面DOM进行交互

**关键类**：
```javascript
class ContentExtractor {
  extractMainContent() {
    // 智能内容提取算法
    const content = this.findMainContent(document);
    return this.cleanAndFormatContent(content);
  }
}
```

**内容提取策略**：
1. **智能区域识别**: 使用多种CSS选择器识别主要内容区域
2. **内容评分算法**: 基于文本长度、段落数、标题数等指标评分
3. **噪音过滤**: 自动移除广告、导航、评论等无关内容
4. **结构化提取**: 提取标题、图片、链接、表格等结构化数据

### 3. Side Panel (`src/sidepanel/`)

**职责**：
- 提供主要的用户交互界面
- 显示摘要结果和对话历史
- 处理用户设置和配置

**关键文件**：
- `sidepanel.html`: 界面结构
- `sidepanel.css`: 样式定义，支持主题切换
- `sidepanel.js`: 界面逻辑和事件处理

**UI组件架构**：
```javascript
class SidePanelManager {
  // 视图管理
  showView(viewName) { /* 切换不同视图 */ }
  
  // 摘要处理
  displaySummary(summaryData) { /* 显示摘要结果 */ }
  
  // 对话管理
  sendChatMessage() { /* 发送聊天消息 */ }
  addChatMessage(content, role) { /* 添加消息到界面 */ }
}
```

### 4. AI服务模块 (`src/utils/ai-service.js`)

**职责**：
- 提供统一的AI服务接口
- 支持多种AI提供商（OpenAI、Claude、Gemini）
- 处理API调用、错误处理和缓存

**设计模式**：策略模式 + 工厂模式
```javascript
class AIService {
  async generateSummary(content, options) {
    const provider = this.settings.aiProvider;
    switch (provider) {
      case 'openai': return await this.generateSummaryWithOpenAI(content, options);
      case 'claude': return await this.generateSummaryWithClaude(content, options);
      case 'gemini': return await this.generateSummaryWithGemini(content, options);
    }
  }
}
```

**特性**：
- **多提供商支持**: 无缝切换不同AI服务
- **智能缓存**: 避免重复API调用
- **频率限制**: 防止API滥用
- **错误恢复**: 自动重试和降级处理

### 5. 存储管理 (`src/utils/storage-manager.js`)

**职责**：
- 管理扩展的本地数据存储
- 处理设置、历史记录的持久化
- 提供数据导入导出功能

**存储策略**：
- **同步存储**: 用户设置（Chrome Sync）
- **本地存储**: 历史记录、缓存数据（Chrome Local）
- **数据加密**: 敏感信息（API密钥）简单加密

```javascript
class StorageManager {
  // 设置管理
  async getSettings() { /* 获取用户设置 */ }
  async saveSettings(settings) { /* 保存设置 */ }
  
  // 历史记录管理
  async saveSummary(summaryData) { /* 保存摘要 */ }
  async saveChat(chatData) { /* 保存对话 */ }
  
  // 数据维护
  async cleanupExpiredData() { /* 清理过期数据 */ }
}
```

### 6. 聊天引擎 (`src/utils/chat-engine.js`)

**职责**：
- 管理多轮对话的上下文和状态
- 维护对话会话的生命周期
- 提供对话质量分析

**会话管理**：
```javascript
class ChatEngine {
  // 会话管理
  createSession(context, metadata) { /* 创建新会话 */ }
  switchToSession(sessionId) { /* 切换会话 */ }
  
  // 消息管理
  addMessage(role, content) { /* 添加消息 */ }
  getMessagesForAPI() { /* 获取API格式的消息 */ }
  
  // 上下文管理
  trimMessagesForContext(messages) { /* 控制上下文长度 */ }
}
```

## 关键算法

### 1. 内容提取算法

**评分机制**：
```javascript
scoreContentElement(element) {
  let score = 0;
  
  // 文本长度评分
  score += Math.min(element.textContent.length / 10, 500);
  
  // 结构化内容评分
  score += element.querySelectorAll('p').length * 10;
  score += element.querySelectorAll('h1,h2,h3,h4,h5,h6').length * 15;
  
  // 链接密度惩罚
  const linkDensity = calculateLinkDensity(element);
  if (linkDensity > 0.3) score *= (1 - linkDensity);
  
  return score;
}
```

**内容清理流程**：
1. 移除脚本、样式、广告等无关元素
2. 智能识别主要内容区域
3. 提取并格式化文本内容
4. 生成结构化数据（标题、图片、链接等）

### 2. 智能提示词生成

**系统提示词模板**：
```javascript
getSystemPrompt(type, options) {
  let prompt = '你是一个专业的内容摘要助手...';
  
  // 根据语言、长度、风格等参数定制提示词
  if (options.language === 'zh') prompt += '- 使用中文输出\n';
  if (options.length === 'short') prompt += '- 摘要长度：简短（50-150字）\n';
  if (options.style === 'bullet') prompt += '- 输出格式：要点列表\n';
  
  return prompt;
}
```

### 3. 缓存策略

**多级缓存**：
```javascript
// 1. 内存缓存（最快）
this.cache = new Map();

// 2. 本地存储缓存（持久）
await chrome.storage.local.set({cacheKey: data});

// 3. 缓存失效策略
const cacheKey = this.generateCacheKey(content, options);
if (Date.now() - cached.timestamp > 3600000) {
  this.cache.delete(cacheKey);
}
```

## 安全考虑

### 1. API密钥安全

- **本地存储**: API密钥仅存储在用户本地
- **简单加密**: 使用Base64编码（生产环境建议更强加密）
- **权限最小**: 仅申请必要的Chrome权限

### 2. 内容安全

- **输入验证**: 对用户输入进行长度和格式检查
- **XSS防护**: 使用`textContent`而非`innerHTML`
- **CSP策略**: 通过Content Security Policy防止代码注入

### 3. 隐私保护

- **数据不上传**: 用户数据仅用于AI API调用，不存储在第三方服务器
- **可清除性**: 提供完整的数据清除功能
- **透明度**: 明确告知数据处理方式

## 性能优化

### 1. 内容提取优化

```javascript
// 使用Web Worker进行重计算任务（如果需要）
// 分批处理大文档
// 智能截断超长内容
const truncated = content.length > 8000 
  ? content.substring(0, 8000) + '...'
  : content;
```

### 2. API调用优化

- **请求合并**: 批量处理多个请求
- **超时控制**: 设置合理的请求超时时间
- **重试策略**: 指数退避重试机制
- **错误降级**: API失败时提供基础功能

### 3. 内存管理

```javascript
// 限制历史记录数量
if (summaries.length > maxItems) {
  summaries.splice(maxItems);
}

// 定期清理过期缓存
setInterval(() => {
  this.cleanupExpiredData();
}, 60000); // 每分钟清理一次
```

## 测试策略

### 1. 单元测试

```javascript
// 测试内容提取功能
describe('ContentExtractor', () => {
  it('should extract main content correctly', () => {
    const html = '<article><p>Main content</p></article>';
    const content = extractor.extractMainContent(html);
    expect(content).toBe('Main content');
  });
});
```

### 2. 集成测试

- **跨组件通信测试**: 验证Service Worker与Content Script的消息传递
- **API集成测试**: 测试各AI服务的API调用
- **存储一致性测试**: 验证数据的读写一致性

### 3. 用户体验测试

- **响应时间测试**: 确保界面响应时间 < 100ms
- **错误处理测试**: 验证各种异常情况的用户友好提示
- **可访问性测试**: 支持键盘导航和屏幕阅读器

## 部署和发布

### 1. 构建过程

```bash
# 代码检查
npm run lint

# 压缩资源
npm run build

# 生成扩展包
zip -r extension.zip chrome-extension/
```

### 2. Chrome Web Store发布

1. **准备材料**:
   - 扩展包（< 128MB）
   - 图标和截图
   - 详细描述
   - 隐私政策

2. **发布流程**:
   - 上传到Chrome Web Store
   - 填写扩展信息
   - 提交审核
   - 响应审核反馈

### 3. 版本管理

```json
{
  "version": "1.0.0",
  "version_name": "1.0.0 Beta"
}
```

遵循语义化版本规范：
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

## 未来扩展

### 1. 功能扩展

- **本地AI模型**: 支持Ollama等本地部署的模型
- **多模态支持**: 图片内容识别和描述
- **批量处理**: 多标签页批量摘要
- **云同步**: 跨设备数据同步

### 2. 技术改进

- **TypeScript重构**: 提升代码类型安全
- **组件化架构**: 使用框架重构UI
- **服务端支持**: 提供云端API服务
- **移动端支持**: 开发移动浏览器版本

### 3. 商业化考虑

- **免费版限制**: API调用次数限制
- **高级功能**: 更多AI模型、导出格式
- **企业版**: 团队协作、数据分析
- **API服务**: 提供第三方集成接口

## 贡献指南

### 1. 开发环境设置

```bash
git clone <repository>
cd chrome-extension
# 安装开发依赖（如果有）
npm install
```

### 2. 代码规范

- **命名约定**: 使用驼峰命名法
- **注释规范**: JSDoc格式注释
- **代码格式**: 使用Prettier格式化
- **提交信息**: 遵循Conventional Commits

### 3. 提交流程

1. Fork项目
2. 创建特性分支
3. 提交代码变更
4. 创建Pull Request
5. 代码审查
6. 合并主分支

通过以上开发文档，开发者可以快速理解项目架构，参与开发和维护工作。