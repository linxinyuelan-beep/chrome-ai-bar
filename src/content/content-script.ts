// Content Script - 注入到网页中的脚本
import { ContentMessage } from '../types';
import { ContentExtractor } from '../utils/content-extractor';

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((message: ContentMessage, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'GET_PAGE_CONTENT':
      handleGetPageContent()
        .then(content => sendResponse({ success: true, data: content }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 异步响应

    case 'GET_SELECTION':
      handleGetSelection()
        .then(selection => sendResponse({ success: true, data: selection }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 异步响应
  }
});

// 获取页面内容
async function handleGetPageContent() {
  try {
    console.log('🔍 开始提取页面内容...');
    console.log('📍 当前页面URL:', window.location.href);
    console.log('📄 页面标题:', document.title);
    
    const result = await ContentExtractor.extractPageContent();
    
    console.log('✅ 页面内容提取完成:');
    console.log('📊 提取结果统计:', {
      标题: result.title,
      URL: result.url,
      内容长度: result.content.length,
      字符数: result.wordCount,
      内容类型: result.type,
      语言: result.language
    });
    console.log('📝 提取的内容预览:', result.content.substring(0, 200) + '...');
    
    return result;
  } catch (error) {
    console.error('❌ 页面内容提取失败:', error);
    throw new Error('无法提取页面内容');
  }
}

// 获取选中内容
async function handleGetSelection() {
  try {
    console.log('🖱️ 开始提取选中内容...');
    
    const selection = window.getSelection();
    console.log('🔍 选择对象状态:', {
      是否有选择: !!selection,
      选择范围数量: selection?.rangeCount || 0,
      原始选中文本长度: selection?.toString().length || 0
    });
    
    const extracted = ContentExtractor.extractSelectedContent();
    
    if (extracted) {
      console.log('✅ 选中内容提取完成:');
      console.log('📊 选中内容统计:', {
        内容长度: extracted.content.length,
        字符数: extracted.wordCount,
        语言: extracted.language
      });
      console.log('📝 选中内容预览:', extracted.content.substring(0, 200) + '...');
      return extracted.content;
    } else {
      console.log('⚠️ 没有检测到选中内容');
      return '';
    }
  } catch (error) {
    console.error('❌ 选中内容提取失败:', error);
    throw new Error('无法提取选中内容');
  }
}

// 检查选中内容变化
let lastSelection = '';
function checkSelectionChange() {
  const currentSelection = window.getSelection()?.toString().trim() || '';
  
  if (currentSelection !== lastSelection) {
    lastSelection = currentSelection;
    
    // 通知background script选中内容发生变化
    chrome.runtime.sendMessage({
      type: 'SELECTION_CHANGED',
      data: { hasSelection: currentSelection.length > 0 }
    }).catch(error => {
      // 忽略发送失败的错误（可能是background script未准备好）
      console.debug('Failed to send selection change message:', error);
    });
  }
}

// 监听选中内容变化
document.addEventListener('selectionchange', checkSelectionChange);
document.addEventListener('mouseup', checkSelectionChange);
document.addEventListener('keyup', checkSelectionChange);

// 初始检查
checkSelectionChange();

// 监听键盘事件（Ctrl+Shift+S 快捷键）
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'S') {
    event.preventDefault();
    
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      chrome.runtime.sendMessage({
        type: 'SUMMARIZE_SELECTION',
        data: { content: selection }
      });
    } else {
      // 如果没有选中内容，摘要整个页面
      chrome.runtime.sendMessage({
        type: 'SUMMARIZE_PAGE'
      });
    }
  }
});

// 页面加载完成时的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  console.log('Smart Summary Assistant content script loaded for:', window.location.href);
  
  // 检查页面类型并可能添加特定的增强功能
  const pageType = detectPageType();
  console.log('Detected page type:', pageType);
  
  // 根据页面类型添加特定功能
  switch (pageType) {
    case 'github':
      enhanceGitHubPage();
      break;
    case 'stackoverflow':
      enhanceStackOverflowPage();
      break;
    case 'medium':
      enhanceMediumPage();
      break;
  }
}

function detectPageType(): string {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('github.com')) return 'github';
  if (hostname.includes('stackoverflow.com')) return 'stackoverflow';
  if (hostname.includes('medium.com')) return 'medium';
  if (hostname.includes('wikipedia.org')) return 'wikipedia';
  if (hostname.includes('reddit.com')) return 'reddit';
  
  return 'general';
}

function enhanceGitHubPage() {
  // 为GitHub页面添加特定增强功能
  console.log('Enhancing GitHub page');
  // TODO: 添加README摘要按钮等
}

function enhanceStackOverflowPage() {
  // 为Stack Overflow页面添加特定增强功能
  console.log('Enhancing Stack Overflow page');
  // TODO: 添加问题摘要功能等
}

function enhanceMediumPage() {
  // 为Medium页面添加特定增强功能
  console.log('Enhancing Medium page');
  // TODO: 添加文章摘要功能等
}

// 导出到全局作用域（用于调试）
(window as any).smartSummaryContentScript = {
  extractPageContent: handleGetPageContent,
  extractSelection: handleGetSelection
};