# 聊天界面模型切换功能指南

## 功能概述

在聊天对话界面新增了AI模型显示和随时切换功能，支持：
- 显示当前对话使用的AI模型
- 对话过程中随时切换模型
- 每个对话会话记住使用的模型
- 无缝切换，保持对话上下文

## 功能详情

### 1. 模型信息显示

在聊天界面的头部下方，会显示当前对话使用的AI模型：

```
当前模型：OpenAI - gpt-4    [切换模型 ↻]
```

显示内容：
- 模型标签：使用主题色背景，清晰醒目
- 提供商和模型名称
- 位置：聊天头部和消息列表之间

### 2. 切换模型功能

**使用场景：**
- 对话中发现当前模型不适合该话题
- 需要更强大的模型处理复杂问题
- 想要对比不同模型的回答质量

**操作方法：**
1. 点击"切换模型"按钮
2. 从下拉菜单选择新模型
3. 继续对话，AI自动使用新模型

**特性：**
- 🔄 即时生效：下次发送消息立即使用新模型
- 💾 记忆功能：会话会记住当前使用的模型
- 📝 上下文保持：切换模型不影响对话历史
- 🚫 生成中禁用：AI正在回复时无法切换

### 3. 对话持久化

每个对话会话都会保存：
- 使用的AI配置ID
- AI提供商名称
- AI模型名称

**好处：**
- 重新打开历史对话时，继续使用之前的模型
- 可以追踪哪个模型给出了特定回答
- 方便进行模型效果评估

## 技术实现

### 数据结构变更

**ChatSession类型新增字段：**
```typescript
interface ChatSession {
  // ... 原有字段
  currentAIConfigId?: string;  // 当前AI配置ID
  aiProvider?: string;          // AI提供商
  aiModel?: string;            // AI模型
}
```

### 核心逻辑

#### 1. 初始化对话时设置模型
```typescript
// 从默认配置获取当前AI信息
const currentAIConfig = settings.ai.configs.find(
  c => c.id === settings.ai.defaultConfigId
);

const newChatSession: ChatSession = {
  // ... 其他字段
  currentAIConfigId: currentAIConfig?.id,
  aiProvider: currentAIConfig?.provider,
  aiModel: currentAIConfig?.model
};
```

#### 2. 切换模型
```typescript
const handleSwitchModel = async (configId: string) => {
  const newConfig = aiConfig.configs.find(c => c.id === configId);
  
  const updatedSession = {
    ...session,
    currentAIConfigId: newConfig.id,
    aiProvider: newConfig.provider,
    aiModel: newConfig.model
  };
  
  // 保存到存储和更新UI
  onUpdateSession(updatedSession);
  await saveChatSession(updatedSession);
};
```

#### 3. 发送消息时使用当前模型
```typescript
// 使用session中保存的配置ID，如果没有则使用默认
const currentConfigId = session.currentAIConfigId || aiConfig.defaultConfigId;

const tempAIConfig = {
  ...aiConfig,
  defaultConfigId: currentConfigId
};

const aiService = AIService.fromMultiConfig(tempAIConfig);
```

## UI设计

### 布局结构
```
┌─────────────────────────────────────┐
│ [←] 智能问答              [清空对话] │  ← Header
├─────────────────────────────────────┤
│ 当前模型：OpenAI - gpt-4 [切换模型↻]│  ← Model Info (新增)
│                ┌──────────────────┐ │
│                │ 选择模型          │ │
│                ├──────────────────┤ │
│                │ Claude Pro        │ │
│                │ claude-3-sonnet   │ │
│                └──────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│  对话消息列表...                     │
│                                     │
├─────────────────────────────────────┤
│ [快捷回复按钮组]                     │
├─────────────────────────────────────┤
│ [输入框]                    [发送]  │
└─────────────────────────────────────┘
```

### CSS类名
- `.chat-model-info` - 模型信息容器
- `.chat-model-info .model-label` - 标签文字
- `.chat-model-info .model-name` - 模型名称（带背景色）
- `.chat-model-info .model-switch-container` - 切换按钮容器
- `.chat-model-info .model-switch-btn` - 切换按钮

**设计特点：**
- 复用摘要界面的下拉菜单样式（`.model-menu`系列）
- 在聊天界面使用更紧凑的布局
- 与聊天界面的配色方案保持一致

## 使用场景示例

### 场景1：逐步升级模型能力

1. **初始对话** - 使用GPT-3.5快速回答
2. **发现问题复杂** - 切换到GPT-4深度分析
3. **需要代码生成** - 切换到Claude（擅长代码）
4. **翻译需求** - 切换回GPT-4（多语言能力强）

### 场景2：模型对比评测

同一个问题，切换不同模型查看回答：

```
用户：请解释量子计算的基本原理

[使用 GPT-4]
AI：量子计算是基于量子力学原理...

[切换到 Claude]
用户：请解释量子计算的基本原理
AI：量子计算利用量子比特的叠加态...

[对比两个回答，选择更满意的]
```

### 场景3：成本优化

- 简单问题：使用经济型模型（GPT-3.5）
- 遇到难题：即时切换到高级模型（GPT-4）
- 灵活调整，节省成本

## 兼容性处理

### 1. 历史对话
- 旧对话没有AI配置信息时，使用当前默认配置
- 逻辑：`session.currentAIConfigId || aiConfig.defaultConfigId`

### 2. 配置缺失
- 如果记录的配置ID已被删除，自动使用默认配置
- `AIService.fromMultiConfig()` 会处理配置无效的情况

### 3. 单配置场景
- 只有一个AI配置时，不显示"切换模型"按钮
- 避免不必要的UI干扰

## 与摘要界面的差异

| 特性 | 摘要界面 | 聊天界面 |
|------|---------|---------|
| 切换效果 | 重新生成摘要 | 下次消息生效 |
| 历史保存 | 生成新摘要记录 | 更新当前会话 |
| 上下文 | 重新提取内容 | 保持对话历史 |
| 禁用条件 | 生成摘要时 | 生成回复时 |

**聊天界面的优势：**
- 更轻量：只更新配置，不重新生成内容
- 更灵活：可以在对话中随时调整
- 更连贯：保持完整的对话上下文

## 注意事项

### 1. 模型切换不会：
- ❌ 重新生成之前的消息
- ❌ 清空对话历史
- ❌ 改变已有的回答

### 2. 模型切换会：
- ✅ 影响下一次AI回复
- ✅ 保存到当前会话
- ✅ 在历史记录中持久化

### 3. 最佳实践：
- 在对话开始时选择合适的模型
- 遇到模型不适合的情况再切换
- 避免频繁切换影响对话连贯性
- 复杂问题建议直接使用高级模型

## 测试建议

### 基本功能测试
1. ✅ 开始新对话，验证显示默认模型
2. ✅ 切换模型，发送消息验证使用新模型
3. ✅ 切换回原模型，验证可以正常切换
4. ✅ 关闭重新打开对话，验证模型保持

### 边界情况测试
1. ✅ 只有1个配置 → 不显示切换按钮
2. ✅ 生成回复中 → 切换按钮禁用
3. ✅ 配置被删除 → 自动使用默认配置
4. ✅ 历史对话无配置信息 → 显示当前默认模型

### 交互测试
1. ✅ 快速多次切换 → 不出错
2. ✅ 切换后立即发送 → 使用新模型
3. ✅ 下拉菜单展开时点击外部 → 菜单关闭
4. ✅ 同时有快捷回复 → 布局正常

## 未来优化方向

1. **智能推荐**
   - 根据问题类型自动推荐最合适的模型
   - 例如：代码问题推荐Claude，翻译推荐GPT-4

2. **效果追踪**
   - 记录每个模型的回答质量评分
   - 统计最常使用的模型组合

3. **自动切换**
   - 检测到模型无法回答时自动切换更强模型
   - 成本预警：接近配额时提示切换经济型模型

4. **可视化对比**
   - 支持"同时用多个模型回答"功能
   - 并排显示不同模型的回答

5. **模型预设**
   - 为不同对话类型设置默认模型
   - 例如：技术问答→Claude，日常聊天→GPT-3.5

## 相关文件

- `/src/types/index.ts` - ChatSession类型定义
- `/src/components/ChatContainer.tsx` - 聊天容器组件
- `/src/sidepanel/App.tsx` - 主应用（handleStartChat）
- `/src/sidepanel/styles.css` - 聊天模型信息样式

## 总结

聊天界面的模型切换功能为用户提供了更大的灵活性，可以根据对话内容和需求随时调整AI模型。这个功能与摘要界面的模型切换相辅相成，共同构建了一个强大的多模型AI助手系统。

**核心价值：**
- 🎯 灵活性：对话中随时切换，适应不同需求
- 💾 记忆性：会话保持配置，体验连贯
- 🔄 实时性：即时生效，无需重启对话
- 📊 可追溯：历史记录包含模型信息
