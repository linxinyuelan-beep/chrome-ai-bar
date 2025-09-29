# 对话发送快捷键测试指南

## 更新内容
- 将对话发送快捷键从 `Enter` 改为 `⌘+Enter`（macOS）/ `Ctrl+Enter`（Windows/Linux）
- 更新了输入框的 placeholder 提示文字

## 测试步骤

### 1. 加载更新后的扩展
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 找到"智能摘要助手"扩展
4. 点击"重新加载"按钮

### 2. 测试新的快捷键
1. 打开任意网页
2. 点击扩展图标或右键菜单生成摘要
3. 在摘要完成后，点击"开始对话"进入聊天界面
4. 在输入框中输入测试文本
5. **测试 Cmd+Enter 发送**：
   - 按住 `⌘` 键（Mac）或 `Ctrl` 键（Windows），然后按 `Enter` 键
   - 消息应该被发送
6. **测试单独 Enter 不发送**：
   - 只按 `Enter` 键
   - 消息应该**不会**被发送，而是在输入框中换行

### 3. 验证 UI 提示
- 输入框的 placeholder 应该显示："针对摘要内容提问... (⌘+回车发送)"
- 在 Windows/Linux 系统上会显示 Ctrl 符号

## 预期行为
- ✅ `⌘+Enter`（Mac）/ `Ctrl+Enter`（Win/Linux）：发送消息
- ✅ 单独 `Enter`：在输入框中换行
- ✅ `Shift+Enter`：在输入框中换行
- ✅ 点击发送按钮：正常发送消息

## 问题排查
如果快捷键不生效：
1. 确认扩展已重新加载
2. 检查浏览器控制台是否有错误
3. 尝试重新构建扩展：`npm run build`
4. 确认在正确的输入框中测试（聊天输入框，不是其他输入框）

## 技术细节
- 修改文件：`src/components/ChatContainer.tsx`
- 关键更改：`handleKeyDown` 函数中的条件从 `e.key === 'Enter' && !e.shiftKey` 改为 `e.key === 'Enter' && e.metaKey`
- `e.metaKey` 在 Mac 上对应 `⌘` 键，在 Windows/Linux 上对应 `Ctrl` 键