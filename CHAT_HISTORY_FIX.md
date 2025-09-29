# 对话历史界面修复说明

## 问题描述

用户反馈：点击对话历史记录时，会先显示摘要页面，然后才跳转到对话页面，体验不够直观。

## 问题原因

在 `App.tsx` 的 `handleSelectHistoryChat` 方法中，代码执行顺序导致了界面闪现问题：

```typescript
// 问题代码
setCurrentSummary(summaryFromContext);  // 这会触发摘要页面显示
setCurrentChatSession(chat);
setCurrentView('chat');  // 然后才跳转到聊天页面
```

## 解决方案

调整了执行顺序，确保直接跳转到聊天界面：

```typescript
// 修复后的代码
setCurrentChatSession(chat);
setCurrentView('chat');  // 立即跳转到聊天页面

// 延迟设置摘要上下文，避免影响视图切换
if (chat.context && !currentSummary) {
  setTimeout(() => {
    setCurrentSummary(summaryFromContext);
  }, 0);
}
```

## 修复效果

- ✅ 点击对话历史记录直接进入聊天界面
- ✅ 保持摘要上下文的恢复功能
- ✅ "返回摘要"按钮正常工作
- ✅ 用户体验更加流畅

## 测试验证

1. 创建一个包含摘要的对话会话
2. 从历史记录中选择该对话
3. 验证直接进入聊天界面，而不是先显示摘要页面
4. 确认可以继续在对话中发送消息
5. 验证"返回摘要"功能正常