# 智能摘要助手 Chrome 扩展 - AI 代理指导文档

## 项目概述

这是一个基于 React + TypeScript 的 Chrome 扩展，使用 Manifest V3 架构，支持网页内容智能摘要和AI问答对话。核心架构包括Service Worker、Content Script、Side Panel界面三大模块。

## 核心架构模式

### Chrome 扩展通信模式
- **Service Worker** (`src/background/service-worker.ts`): 处理扩展生命周期、右键菜单、侧边栏控制
- **Content Script** (`src/content/content-script.ts`): 注入页面，处理内容提取、选中文本监听、浮动按钮交互
- **Side Panel** (`src/sidepanel/App.tsx`): React应用主界面，状态管理和视图切换

关键通信模式：
```typescript
// Content Script → Service Worker
chrome.runtime.sendMessage({ type: 'SELECTION_CHANGED', data: {...} });

// Side Panel → Content Script  
chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTENT' });
```

### React 状态管理模式
主应用使用 `ViewType` 枚举驱动视图切换：
- `'welcome'` → `'loading'` → `'summary'` → `'chat'`
- 设置和历史记录作为独立视图：`'settings'`, `'history'`

## 开发工作流

### 构建系统
```bash
npm run dev          # 开发模式，监听文件变化
npm run build        # 生产构建
npm run type-check   # TypeScript 类型检查
```

**重要**：修改代码后必须在 `chrome://extensions/` 点击"重新加载"才能看到效果。

### 调试策略
- **Service Worker**: Chrome DevTools → 扩展详情页 → "Service Worker" 链接
- **Content Script**: 页面右键 → 检查 → Console 查看
- **Side Panel**: 侧边栏内右键 → 检查元素

## 项目特定约定

### 文件组织模式
```
src/
├── background/          # Service Worker 相关
├── content/            # Content Script
├── sidepanel/          # React 主应用
├── components/         # React 组件
├── utils/             # 工具类（AI服务、存储、内容提取）
└── types/             # TypeScript 类型定义
```

### AI 服务抽象
`AIService` 类支持多AI提供商（OpenAI、Claude、Gemini），使用策略模式：
```typescript
// 配置不同AI服务
const config = { provider: 'openai', apiKey: '...', model: 'gpt-4' };
const aiService = new AIService(config);
```

### 存储模式
使用 `StorageManager` 封装 Chrome Storage API，支持设置、历史记录的持久化存储。

### 内容提取策略
`ContentExtractor.extractPageContent()` 实现智能内容识别，过滤广告、导航等噪音内容。

## 关键集成点

### Chrome Side Panel API
要求 Chrome 116+，在 `manifest.json` 中配置：
```json
{
  "minimum_chrome_version": "116",
  "permissions": ["sidePanel"],
  "side_panel": { "default_path": "sidepanel.html" }
}
```

### Webpack 配置特点
- 多入口点：`sidepanel`, `service-worker`, `content-script`
- 路径别名：`@/components`, `@/utils`, `@/types`
- 代码分割：仅对side panel启用，background和content script不分割

### TypeScript 类型系统
核心类型定义在 `src/types/index.ts`：
- `ViewType`: 视图状态枚举
- `SummaryResult`: 摘要结果数据结构
- `ChatSession`: 对话会话数据
- `AppSettings`: 应用配置结构

## 常见开发任务

### 添加新的AI提供商
1. 在 `AIService` 类中添加新的 `call[Provider]()` 方法
2. 更新 `AIConfig` 类型和相关UI组件
3. 在设置面板中添加对应选项

### 扩展内容提取功能
1. 修改 `ContentExtractor.extractPageContent()` 
2. 为特定网站添加专门的提取逻辑（参考 `detectPageType()` 模式）
3. 在 content script 中添加对应的增强函数

### 添加新视图组件
1. 创建新的 React 组件
2. 在 `ViewType` 枚举中添加新类型
3. 在 `App.tsx` 中添加对应的视图切换逻辑

### Chrome 权限扩展
修改 `manifest.json` 中的 `permissions` 和 `host_permissions`，注意 Manifest V3 的限制。

## 错误处理模式

- AI API 调用失败：显示友好错误信息，提供重试选项
- 内容提取失败：回退到基础文本提取
- 存储失败：静默处理，不影响核心功能
- 权限不足：在相关功能入口显示权限请求提示

## 性能优化考虑

- AI 响应缓存（1小时过期）
- 频率限制（每分钟30次请求）
- 大文件内容截断处理
- 选中内容变化的防抖处理

## 多语言支持

项目支持中英文，AI 摘要可配置输出语言。UI 文本主要使用中文，但代码注释和变量名使用英文以提高国际化。