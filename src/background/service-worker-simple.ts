// 简化的Chrome扩展后台服务脚本 - 专注于侧边栏功能
console.log('Service worker starting...');

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details);
  
  try {
    // 设置侧边栏在点击action时打开
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    console.log('Side panel behavior set successfully');
  } catch (error) {
    console.error('Failed to set panel behavior:', error);
  }
  
  // 创建右键菜单
  try {
    chrome.contextMenus.create({
      id: 'summarize-page',
      title: '智能摘要助手',
      contexts: ['page'],
    });
    console.log('Context menu created');
  } catch (error) {
    console.error('Failed to create context menu:', error);
  }
});

// 处理扩展图标点击 - 这应该会自动打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Action clicked for tab:', tab.id);
  
  if (tab.id) {
    try {
      // 确保侧边栏被启用
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true,
        path: 'sidepanel.html'
      });
      console.log('Side panel enabled for tab:', tab.id);
    } catch (error) {
      console.error('Failed to enable side panel:', error);
    }
  }
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info.menuItemId, 'for tab:', tab?.id);
  
  if (!tab?.id) return;

  try {
    if (info.menuItemId === 'summarize-page') {
      // 启用并打开侧边栏
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true,
        path: 'sidepanel.html'
      });
      console.log('Side panel should open for tab:', tab.id);
    }
  } catch (error) {
    console.error('Context menu error:', error);
  }
});

// 监听扩展启动
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// 处理未捕获的错误
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
});

console.log('Service worker setup complete');