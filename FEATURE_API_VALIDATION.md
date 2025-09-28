# API模型选择和验证功能

## 实现的新功能

### 1. 默认AI模型选择
- 在设置页面添加了AI模型选择器
- 支持为每个AI提供商选择不同的模型
- 当切换提供商时，会自动设置该提供商的默认模型

### 2. API服务可用性验证
- 添加了"验证API"按钮，可以测试API连接是否正常
- 验证过程包括：
  - API密钥有效性检查
  - 连接状态验证
  - 模型支持度检查
  - 获取可用模型列表（如果支持）

### 3. 支持的AI提供商和模型

#### OpenAI
- 默认模型：`gpt-3.5-turbo`
- 支持模型：`gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`, `gpt-4o`, `gpt-4o-mini`
- 支持获取动态模型列表

#### Claude (Anthropic)
- 默认模型：`claude-3-sonnet-20240229`
- 支持模型：`claude-3-haiku-20240307`, `claude-3-sonnet-20240229`, `claude-3-opus-20240229`, `claude-3-5-sonnet-20240620`

#### Gemini (Google)
- 默认模型：`gemini-pro`
- 支持模型：`gemini-pro`, `gemini-pro-vision`, `gemini-1.5-pro`, `gemini-1.5-flash`

## 验证状态显示

验证按钮会显示以下状态之一：

1. **验证中...** - 显示加载图标，正在进行验证
2. **API连接正常** - 绿色勾号，验证成功
3. **错误信息** - 红色警告图标，显示具体错误原因

## 使用方法

1. 在设置页面选择AI服务提供商
2. 输入API密钥
3. 选择要使用的AI模型（可选，会使用默认模型）
4. 点击"验证API"按钮测试连接
5. 根据验证结果调整配置
6. 保存设置

## 技术实现

### 新增类型定义
- `APIValidationResult`: API验证结果
- `APIValidationStatus`: 验证状态管理
- `AIProvider`: 增加了`defaultModel`字段

### 新增方法
- `AIService.validateAPI()`: 主验证方法
- `AIService.validateOpenAI()`: OpenAI专用验证
- `AIService.validateClaude()`: Claude专用验证
- `AIService.validateGemini()`: Gemini专用验证

### UI增强
- 模型选择下拉框
- API验证按钮和状态显示
- 响应式布局支持
- 无障碍访问支持

## 错误处理

验证过程中可能出现的错误：
- API密钥为空或无效
- 网络连接问题
- API端点不可用
- 选中的模型不支持
- 配额限制或权限问题

所有错误都会显示用户友好的错误信息，帮助用户快速定位和解决问题。