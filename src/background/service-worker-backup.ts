// Chrome扩展后台服务脚本
import { ContentMessage } from '../types';

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details);
  
  // 设置侧边栏默认行为
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error('Failed to set panel behavior:', error);
  }
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'summarize-selection',
    title: '智能摘要 > 总结选中内容',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'summarize-page',
    title: '智能摘要 > 总结整个页面',
    contexts: ['page'],
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  try {
    switch (info.menuItemId) {
      case 'summarize-selection':
        await handleSummarizeSelection(tab.id, info.selectionText || '');
        break;
      case 'summarize-page':
        await handleSummarizePage(tab.id);
        break;
    }
  } catch (error) {
    console.error('Context menu error:', error);
  }
});

// 处理选中内容摘要
async function handleSummarizeSelection(tabId: number, selectionText: string) {
  // 打开侧边栏
  try {
    // 使用setOptions启用侧边栏
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: true,
      path: 'sidepanel.html'
    });
    // 然后使用action.openPopup或直接设置为默认行为
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
  
  // 发送消息到侧边栏
  try {
    await chrome.runtime.sendMessage({
      type: 'SUMMARIZE_SELECTION',
      data: { content: selectionText, tabId }
    });
  } catch (error) {
    console.error('Failed to send selection message:', error);
  }
}

// 处理页面摘要
async function handleSummarizePage(tabId: number) {
  // 打开侧边栏
  try {
    // 使用setOptions启用侧边栏
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: true,
      path: 'sidepanel.html'
    });
    // 然后使用action.openPopup或直接设置为默认行为
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
  
  // 注入内容脚本并获取页面内容
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent,
    });

    if (results[0]?.result) {
      await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_PAGE',
        data: { content: results[0].result, tabId }
      });
    }
  } catch (error) {
    console.error('Failed to extract page content:', error);
  }
}

// 注入到页面中执行的函数
function extractPageContent() {
  // 这个函数会在页面上下文中执行
  const title = document.title || '未知页面';
  const url = window.location.href;
  
  // 尝试提取主要内容
  const selectors = [
    'main',
    'article',
    '[role=\"main\"]',
    '.content',
    '#content',
    '.main-content',
    '.article-content',
    '.post-content',
    '.entry-content',
    'body'
  ];

  let content = '';
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      // 移除不需要的元素
      const clone = element.cloneNode(true) as HTMLElement;
      const unwanted = clone.querySelectorAll('script, style, nav, header, footer, .ads, .advertisement');
      unwanted.forEach(el => el.remove());
      
      content = clone.innerText || clone.textContent || '';
      if (content.length > 200) break;
    }
  }

  // 清理内容
  content = content
    .replace(/\\s+/g, ' ')
    .replace(/\\n\\s*\\n/g, '\\n\\n')
    .trim()
    .substring(0, 50000);

  return {
    title,
    content,
    url,
    wordCount: content.split(/\\s+/).length
  };
}

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((message: ContentMessage, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_PAGE_CONTENT':
      handleGetPageContent(sender.tab?.id)
        .then(content => sendResponse({ success: true, data: content }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 异步响应
      
    case 'GET_SELECTION':
      handleGetSelection(sender.tab?.id)
        .then(selection => sendResponse({ success: true, data: selection }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 异步响应
  }
});

// 获取页面内容
async function handleGetPageContent(tabId?: number): Promise<any> {
  if (!tabId) throw new Error('Tab ID not found');
  
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractPageContent,
  });

  return results[0]?.result || null;
}

// 获取选中内容
async function handleGetSelection(tabId?: number): Promise<string> {
  if (!tabId) throw new Error('Tab ID not found');
  
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection()?.toString() || '',
  });

  return results[0]?.result || '';
}

// 处理扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      // 启用侧边栏
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true,
        path: 'sidepanel.html'
      });
    } catch (error) {
      console.error('Failed to enable side panel:', error);
    }
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 可以在这里添加页面加载完成后的逻辑
    console.log('Tab updated:', tab.url);
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

// 保持service worker活跃
let keepAliveInterval: ReturnType<typeof setInterval>;

function keepAlive() {
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // 这个调用会保持service worker活跃
      if (chrome.runtime.lastError) {
        console.log('Keep alive failed:', chrome.runtime.lastError);
      }
    });
  }, 25000); // 每25秒执行一次
}

// 开始保持活跃
keepAlive();

// 清理定时器
self.addEventListener('beforeunload', () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});