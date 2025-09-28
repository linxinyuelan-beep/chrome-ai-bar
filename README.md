# 智能摘要助手 Chrome 扩展

一款基于AI的Chrome浏览器扩展，可以一键总结网页内容并支持智能问答对话。

## 功能特性

### 核心功能
- **一键网页摘要**: 智能抓取并总结网页主要内容
- **选中内容摘要**: 对用户选中的文本进行智能摘要
- **智能问答对话**: 基于摘要内容进行多轮对话
- **Chrome侧边栏集成**: 使用Chrome Side Panel API提供流畅的用户体验

### AI服务支持
- **OpenAI GPT**: 支持GPT-3.5和GPT-4模型
- **Claude**: 支持Anthropic Claude系列模型
- **Gemini**: 支持Google Gemini模型
- **自定义API**: 支持自定义API Base URL，兼容OpenRouter、Together AI、Groq等服务
- **本地部署**: 支持Ollama、LocalAI等本地AI服务

### 智能特性
- **内容智能识别**: 自动识别网页类型并采用相应摘要策略
- **多语言支持**: 自动检测内容语言，支持中文、英文等多语言输出
- **个性化设置**: 支持摘要长度、风格、语言等个性化配置
- **历史记录管理**: 本地保存摘要和对话历史，支持搜索和管理

## 技术架构

### Chrome扩展架构
- **Manifest V3**: 采用最新的Chrome扩展规范
- **Service Worker**: 后台处理逻辑和API调用
- **Content Script**: 网页内容抓取和交互
- **Side Panel**: 主要用户界面
- **Context Menu**: 右键菜单快捷操作

### 核心模块
- **AIService**: AI服务抽象层，支持多种AI提供商
- **ContentExtractor**: 智能内容提取和处理
- **StorageManager**: 本地数据存储和管理
- **SidePanelManager**: 侧边栏界面管理

## 安装和使用

### 开发环境安装

1. 克隆项目
```bash
git clone <repository-url>
cd chrome-extension
```

2. 在Chrome中加载扩展
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目中的 `chrome-extension` 文件夹

3. 配置API密钥
   - 点击扩展图标打开侧边栏
   - 点击设置按钮
   - 选择AI服务提供商并输入API密钥
   - （可选）配置自定义API Base URL以使用OpenRouter等服务
   - 保存设置

### 使用方法

1. **总结整个页面**
   - 点击扩展图标
   - 点击"总结整个页面"按钮

2. **总结选中内容**
   - 在网页上选中一段文字
   - 右键菜单选择"智能摘要 > 总结选中内容"
   - 或在选中文字后点击扩展图标，点击"总结选中内容"

3. **智能问答**
   - 生成摘要后，在底部输入框输入问题
   - 支持多轮连续对话

4. **查看历史**
   - 点击历史记录按钮
   - 可查看摘要历史和对话历史

## 文件结构

```
chrome-extension/
├── manifest.json              # 扩展配置文件
├── src/
│   ├── background/
│   │   └── service-worker.js  # Service Worker
│   ├── content/
│   │   └── content-script.js  # Content Script
│   ├── sidepanel/
│   │   ├── sidepanel.html     # 侧边栏HTML
│   │   ├── sidepanel.css      # 侧边栏样式
│   │   └── sidepanel.js       # 侧边栏逻辑
│   └── utils/
│       ├── ai-service.js      # AI服务模块
│       ├── storage-manager.js # 存储管理模块
│       └── content-extractor.js # 内容提取模块
├── assets/
│   ├── icon16.svg             # 16x16图标
│   ├── icon32.svg             # 32x32图标
│   ├── icon48.svg             # 48x48图标
│   └── icon128.svg            # 128x128图标
└── README.md                  # 项目说明
```

## 开发说明

### 权限说明
- `sidePanel`: 启用侧边栏功能
- `activeTab`: 获取当前标签页内容
- `contextMenus`: 右键菜单功能
- `storage`: 本地数据存储
- `scripting`: 注入内容脚本
- `host_permissions`: 访问网页内容

### API配置
支持以下AI服务提供商：

**OpenAI**
- 端点: `https://api.openai.com/v1/chat/completions`
- 模型: `gpt-3.5-turbo`, `gpt-4`

**Claude (Anthropic)**
- 端点: `https://api.anthropic.com/v1/messages`
- 模型: `claude-3-sonnet-20240229`, `claude-3-opus-20240229`

**Gemini (Google)**
- 端点: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- 模型: `gemini-pro`, `gemini-pro-vision`

### 安全性
- API密钥使用Base64编码存储（生产环境建议使用更强的加密）
- 支持同步存储和本地存储双重备份
- 敏感数据不会上传到第三方服务器

## 更新日志

### v1.0.0 (当前版本)
- 实现基础的网页摘要功能
- 支持多种AI服务提供商
- Chrome Side Panel集成
- 智能问答对话
- 历史记录管理
- 个性化设置

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如果您有任何问题或建议，请通过GitHub Issues联系我们。