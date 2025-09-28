# API配置指南

## 支持的API服务

智能摘要助手现在支持多种AI API服务，包括官方API和兼容的第三方服务。

### 官方API服务

#### 1. OpenAI
- **默认Base URL**: `https://api.openai.com/v1`
- **支持模型**: GPT-3.5-turbo, GPT-4, GPT-4-turbo等
- **获取API密钥**: [OpenAI平台](https://platform.openai.com/api-keys)

#### 2. Anthropic Claude
- **默认Base URL**: `https://api.anthropic.com/v1`
- **支持模型**: Claude-3-Sonnet, Claude-3-Opus等
- **获取API密钥**: [Anthropic Console](https://console.anthropic.com/)

#### 3. Google Gemini
- **默认Base URL**: `https://generativelanguage.googleapis.com/v1beta`
- **支持模型**: Gemini-Pro, Gemini-Pro-Vision等
- **获取API密钥**: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 兼容的第三方服务

#### 1. OpenRouter

OpenRouter是一个AI API聚合平台，支持多种模型，通常比官方API更便宜。

**配置步骤**：
1. 注册账号：访问 [OpenRouter](https://openrouter.ai/)
2. 获取API密钥：在控制台创建API密钥
3. 在扩展设置中：
   - **AI服务提供商**: 选择 "OpenAI"
   - **API密钥**: 输入OpenRouter的API密钥
   - **API Base URL**: 输入 `https://openrouter.ai/api/v1`

**推荐模型**：
- `openai/gpt-3.5-turbo` - 性价比高
- `anthropic/claude-3-sonnet` - 质量更好
- `google/gemini-pro` - Google的模型
- `meta-llama/llama-2-70b-chat` - 开源模型

#### 2. Together AI

Together AI提供各种开源模型的API访问。

**配置步骤**：
1. 注册账号：访问 [Together AI](https://api.together.xyz/)
2. 获取API密钥
3. 在扩展设置中：
   - **AI服务提供商**: 选择 "OpenAI"
   - **API密钥**: 输入Together AI的API密钥
   - **API Base URL**: 输入 `https://api.together.xyz/v1`

#### 3. Groq

Groq提供超快速的推理速度。

**配置步骤**：
1. 注册账号：访问 [Groq](https://console.groq.com/)
2. 获取API密钥
3. 在扩展设置中：
   - **AI服务提供商**: 选择 "OpenAI"
   - **API密钥**: 输入Groq的API密钥
   - **API Base URL**: 输入 `https://api.groq.com/openai/v1`

#### 4. 本地API服务

支持本地部署的OpenAI兼容API。

**Ollama + litellm配置**：
1. 安装并运行Ollama
2. 安装litellm: `pip install litellm`
3. 启动litellm代理: `litellm --model ollama/llama2`
4. 在扩展设置中：
   - **AI服务提供商**: 选择 "OpenAI"
   - **API密钥**: 输入任意值（如"local"）
   - **API Base URL**: 输入 `http://localhost:8000`

**LocalAI配置**：
1. 部署LocalAI服务
2. 在扩展设置中：
   - **AI服务提供商**: 选择 "OpenAI"
   - **API密钥**: 根据LocalAI配置
   - **API Base URL**: 输入LocalAI的地址（如 `http://localhost:8080/v1`）

## 配置说明

### API Base URL格式

- 必须是完整的URL，包含协议（http://或https://）
- 不要在末尾包含斜杠
- 确保URL可访问

**正确格式示例**：
```
https://api.openai.com/v1
https://openrouter.ai/api/v1
http://localhost:8000
```

**错误格式示例**：
```
api.openai.com/v1          # 缺少协议
https://openrouter.ai/api/v1/  # 末尾有多余斜杠
localhost:8000             # 缺少协议
```

### 模型名称

不同服务支持的模型名称可能不同：

**OpenAI官方**：
- `gpt-3.5-turbo`
- `gpt-4`
- `gpt-4-turbo`

**OpenRouter**：
- `openai/gpt-3.5-turbo`
- `anthropic/claude-3-sonnet`
- `google/gemini-pro`
- `meta-llama/llama-2-70b-chat`

**本地模型**：
- `llama2`
- `codellama`
- `mistral`

### API密钥安全

- API密钥仅存储在本地浏览器中
- 使用Base64简单编码存储
- 不会上传到任何第三方服务器
- 建议定期更换API密钥

## 故障排除

### 常见错误

#### 1. "API密钥配置错误"
- 检查API密钥是否正确
- 确认API密钥有效且未过期
- 验证账户余额充足

#### 2. "网络连接失败"
- 检查API Base URL是否正确
- 确认网络连接正常
- 验证防火墙设置

#### 3. "不支持的模型"
- 检查模型名称是否正确
- 确认所选服务支持该模型
- 尝试使用默认模型

#### 4. "请求频率限制"
- 降低使用频率
- 升级API计划
- 等待限制重置

### 测试配置

保存设置后，可以通过以下方式测试：

1. **生成摘要测试**：
   - 打开任意网页
   - 点击"总结整个页面"
   - 检查是否正常生成摘要

2. **对话测试**：
   - 在有摘要的基础上
   - 输入简单问题
   - 验证AI回复是否合理

3. **错误处理测试**：
   - 临时输入错误的API密钥
   - 验证错误提示是否友好

## 性能优化建议

### 1. 选择合适的模型

**速度优先**：
- GPT-3.5-turbo
- Groq的模型
- 本地轻量级模型

**质量优先**：
- GPT-4
- Claude-3-Sonnet
- Claude-3-Opus

**成本优先**：
- OpenRouter的开源模型
- 本地部署模型
- Together AI的模型

### 2. 调整请求参数

- **Temperature**: 0.7（平衡创造性和准确性）
- **Max Tokens**: 根据需要调整摘要长度
- **Frequency Penalty**: 减少重复内容

### 3. 使用缓存

扩展自动缓存相同内容的摘要结果，避免重复API调用。

## 高级配置

### 自定义提示词

可以通过修改扩展代码自定义系统提示词，适应特定使用场景。

### 多服务切换

可以为不同的任务配置不同的AI服务：
- 摘要任务：使用快速便宜的模型
- 深度问答：使用高质量模型

### 企业部署

对于企业用户，可以：
- 部署私有API网关
- 使用企业级API密钥管理
- 配置内网API服务

## 联系支持

如果在配置过程中遇到问题，可以：
1. 查看浏览器开发者工具的控制台错误
2. 检查网络请求是否正常
3. 验证API服务状态
4. 参考各服务商的官方文档

---

*此文档会随着支持的服务增加而更新*