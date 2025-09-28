# 快速配置OpenRouter指南

## 什么是OpenRouter？

OpenRouter是一个AI API聚合平台，提供：
- 🚀 比官方API更便宜的价格
- 🔄 统一的API接口访问多种模型
- ⚡ 快速响应和高可用性
- 🎯 简单的按使用量付费

## 5分钟快速配置

### 步骤1：获取OpenRouter API密钥

1. 访问 [OpenRouter官网](https://openrouter.ai/)
2. 点击"Sign In"注册或登录
3. 进入控制台，点击"API Keys"
4. 创建新的API密钥并复制

### 步骤2：在扩展中配置

1. 打开Chrome扩展的侧边栏
2. 点击设置按钮（齿轮图标）
3. 配置以下选项：
   - **AI服务提供商**：选择 `OpenAI`
   - **API密钥**：粘贴您的OpenRouter API密钥
   - **API Base URL**：输入 `https://openrouter.ai/api/v1`
4. 点击"保存设置"

### 步骤3：选择合适的模型

在设置中，您可以选择以下模型（在"OpenAI模型"字段中输入）：

**性价比推荐**：
```
openai/gpt-3.5-turbo
```

**质量优先**：
```
anthropic/claude-3-sonnet
anthropic/claude-3-opus
```

**开源选择**：
```
meta-llama/llama-2-70b-chat
mistralai/mistral-7b-instruct
```

**Google模型**：
```
google/gemini-pro
```

## 价格对比

| 模型 | OpenRouter价格 | 官方API价格 | 节省 |
|------|----------------|-------------|------|
| GPT-3.5-turbo | $0.002/1K tokens | $0.002/1K tokens | 相同 |
| Claude-3-Sonnet | $3/1M tokens | $15/1M tokens | 80% |
| GPT-4 | $30/1M tokens | $30/1M tokens | 相同 |
| Llama-2-70B | $0.7/1M tokens | - | 开源免费 |

## 使用技巧

### 1. 模型选择建议

- **日常摘要**：使用 `openai/gpt-3.5-turbo`
- **复杂分析**：使用 `anthropic/claude-3-sonnet`
- **节约成本**：使用 `meta-llama/llama-2-70b-chat`

### 2. 监控使用量

在OpenRouter控制台可以查看：
- 实时使用统计
- 按模型的成本分析
- 设置使用限额

### 3. 错误排除

**常见错误及解决方案**：

```
"Invalid API key"
→ 检查API密钥是否正确复制
```

```
"Model not found"
→ 确认模型名称格式正确（如：openai/gpt-3.5-turbo）
```

```
"Insufficient credits"
→ 在OpenRouter账户中充值
```

## 高级配置

### 自定义Headers（如需要）

如果需要添加自定义请求头，可以在代码中修改：

```javascript
// 在ai-service.js中添加
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
  'HTTP-Referer': 'https://your-domain.com',  // 可选
  'X-Title': 'Smart Summary Assistant'        // 可选
}
```

### 请求参数优化

```javascript
// 针对不同模型优化参数
const requestBody = {
  model: 'anthropic/claude-3-sonnet',
  messages: messages,
  max_tokens: 1500,
  temperature: 0.7,
  top_p: 0.9,                    // 控制输出的多样性
  frequency_penalty: 0.1,        // 减少重复
  presence_penalty: 0.1          // 鼓励新话题
};
```

## 成本优化建议

### 1. 智能模型切换

根据任务复杂度自动选择模型：
- 简单摘要 → 便宜的模型
- 复杂问答 → 高质量模型

### 2. 缓存策略

扩展已内置缓存，相同内容不会重复调用API。

### 3. 长度控制

- 设置合理的 `max_tokens`
- 对长文本进行预处理截断

## 其他兼容服务

除了OpenRouter，还支持：

- **Together AI**: `https://api.together.xyz/v1`
- **Groq**: `https://api.groq.com/openai/v1`
- **本地API**: `http://localhost:8000`

配置方法相同，只需更改API Base URL即可。

---

配置完成后，您就可以享受更便宜、更灵活的AI服务了！🎉