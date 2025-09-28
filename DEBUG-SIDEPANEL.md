# Chrome扩展侧边栏调试指南

## 问题诊断步骤

### 1. 重新加载扩展

1. 打开 `chrome://extensions/`
2. 找到"智能摘要助手"扩展
3. 点击刷新按钮 🔄
4. 确保扩展已启用

### 2. 检查扩展是否正常加载

1. 在扩展页面点击"详细信息"
2. 点击"检查视图 service worker"
3. 在控制台中应该能看到：
   ```
   Extension installed: {reason: "install"}
   ```

### 3. 测试侧边栏功能

#### 方法1: 点击扩展图标
1. 点击浏览器工具栏中的扩展图标
2. 侧边栏应该会在右侧打开

#### 方法2: 使用右键菜单
1. 在任意网页上右键
2. 选择"智能摘要 > 总结整个页面"
3. 或者选中一些文字后右键选择"智能摘要 > 总结选中内容"

### 4. 如果侧边栏不显示

#### 检查Chrome版本
- 确保Chrome版本 ≥ 116
- Side Panel API需要较新的Chrome版本

#### 检查manifest.json配置
确保以下配置正确：
```json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

#### 检查service worker错误
1. 在 `chrome://extensions/` 页面
2. 点击扩展的"检查视图 service worker"
3. 查看控制台是否有错误信息

### 5. 常见问题和解决方案

#### 问题1: 点击图标无反应
**解决方案:**
- 确保在manifest.json中配置了action
- 检查service worker中的action.onClicked监听器

#### 问题2: 侧边栏显示空白
**解决方案:**
- 检查sidepanel.html文件是否正确生成
- 查看sidepanel的控制台错误（右键点击侧边栏 → 检查）

#### 问题3: TypeScript编译错误
**解决方案:**
- 检查@types/chrome包版本
- 可能需要更新Chrome类型定义

### 6. 手动测试步骤

1. **重新构建项目:**
   ```bash
   npm run build:dev
   ```

2. **重新加载扩展:**
   - 在chrome://extensions/页面刷新扩展

3. **测试基本功能:**
   - 点击扩展图标
   - 检查侧边栏是否出现
   - 查看React应用是否正常渲染

4. **检查控制台:**
   - Service Worker控制台
   - 侧边栏页面控制台（右键检查）
   - 网页控制台（F12）

### 7. 应急方案

如果侧边栏仍然无法显示，可以尝试以下应急方案：

1. **使用popup代替sidepanel:**
   在manifest.json中添加：
   ```json
   "action": {
     "default_popup": "sidepanel.html"
   }
   ```

2. **或者创建新标签页:**
   ```javascript
   chrome.tabs.create({ url: 'sidepanel.html' });
   ```

### 8. 调试命令

在service worker控制台中执行：
```javascript
// 手动打开侧边栏
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  chrome.sidePanel.setOptions({
    tabId: tabs[0].id,
    enabled: true,
    path: 'sidepanel.html'
  });
});
```

如果以上步骤都无法解决问题，请提供：
1. Chrome版本号
2. Service worker控制台的错误信息
3. 扩展是否在chrome://extensions/页面显示为已启用