import { Readability } from '@mozilla/readability';

export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  type: 'article' | 'blog' | 'news' | 'documentation' | 'general';
  wordCount: number;
  language: string;
}

export class ContentExtractor {
  // 提取页面内容
  static async extractPageContent(): Promise<ExtractedContent> {
    console.log('🚀 ContentExtractor.extractPageContent 开始执行');
    
    let title = document.title || '未知页面';
    const url = window.location.href;
    
    console.log('📄 页面基本信息:', { title, url });
    
    // 优先尝试定制化网站内容提取
    console.log('🎯 优先检查是否为定制化网站...');
    let content = this.extractCustomSiteContent();
    
    if (content) {
      console.log('✅ 定制化内容提取成功:', {
        内容长度: content.length,
        内容预览: content.substring(0, 100) + '...'
      });
    } else {
      console.log('� 尝试使用 Readability 提取内容...');
      const readabilityResult = this.extractWithReadability();

      if (readabilityResult && readabilityResult.content.length > 0) {
        content = readabilityResult.content;
        if (readabilityResult.title) {
          title = readabilityResult.title;
        }

        console.log('✅ Readability 提取成功:', {
          内容长度: content.length,
          内容预览: content.substring(0, 100) + '...'
        });
      } else {
        console.log('⚠️ Readability 未能提取到有效内容，回退到通用算法...');
        // 使用通用的主要内容提取
        content = this.extractMainContent();
        console.log('📊 通用内容提取结果:', {
          是否成功: !!content,
          内容长度: content.length,
          内容预览: content.substring(0, 100) + '...'
        });
        
        // 如果通用方法也没有找到足够内容，使用备用方法
        if (!content || content.length < 100) {
          console.log('⚠️ 主要内容不足，使用备用提取方法...');
          content = this.extractFallbackContent();
          console.log('📊 备用内容提取结果:', {
            内容长度: content.length,
            内容预览: content.substring(0, 100) + '...'
          });
        }
      }
    }
    
    // 清理内容
    console.log('🧹 开始清理内容...');
    const cleanedContent = this.cleanContent(content);
    console.log('✨ 内容清理完成:', {
      清理前长度: content.length,
      清理后长度: cleanedContent.length
    });
    
    const result = {
      title,
      content: cleanedContent,
      url,
      type: this.detectContentType(cleanedContent, url),
      wordCount: this.countWords(cleanedContent),
      language: this.detectLanguage(cleanedContent)
    };
    
    console.log('🎉 页面内容提取完成:', {
      标题: result.title,
      内容长度: result.content.length,
      字符数: result.wordCount,
      内容类型: result.type,
      语言: result.language
    });
    
    return result;
  }

  private static extractWithReadability(): { title?: string; content: string } | null {
    try {
      const clonedDocument = document.cloneNode(true) as Document;
      const reader = new Readability(clonedDocument);
      const article = reader.parse();

      if (!article) {
        console.log('ℹ️ Readability 未返回解析结果');
        return null;
      }

      const textContent = article.textContent?.trim();

      if (!textContent) {
        console.log('ℹ️ Readability 返回的正文为空');
        return null;
      }

      return {
        title: article.title || undefined,
        content: textContent
      };
    } catch (error) {
      console.error('❌ Readability 提取内容时发生异常:', error);
      return null;
    }
  }

  // 提取选中内容
  static extractSelectedContent(): ExtractedContent | null {
    console.log('🖱️ ContentExtractor.extractSelectedContent 开始执行');
    
    const selection = window.getSelection();
    console.log('🔍 选择对象状态:', {
      selection存在: !!selection,
      rangeCount: selection?.rangeCount || 0
    });
    
    if (!selection || selection.rangeCount === 0) {
      console.log('❌ 没有有效的选择对象');
      return null;
    }

    const selectedText = selection.toString().trim();
    console.log('📝 原始选中文本:', {
      长度: selectedText.length,
      预览: selectedText.substring(0, 100) + '...'
    });
    
    if (!selectedText) {
      console.log('❌ 选中文本为空');
      return null;
    }

    console.log('🧹 开始清理选中内容...');
    const cleanedContent = this.cleanContent(selectedText);
    console.log('✨ 选中内容清理完成:', {
      清理前长度: selectedText.length,
      清理后长度: cleanedContent.length
    });
    
    const result = {
      title: document.title || '未知页面',
      content: cleanedContent,
      url: window.location.href,
      type: 'general' as const,
      wordCount: this.countWords(cleanedContent),
      language: this.detectLanguage(cleanedContent)
    };
    
    console.log('🎉 选中内容提取完成:', {
      内容长度: result.content.length,
      字符数: result.wordCount,
      语言: result.language
    });
    
    return result;
  }

  // 提取主要内容（通用方法）
  private static extractMainContent(): string {
    console.log('🎯 开始通用内容提取，按优先级尝试选择器...');
    
    // 优先级顺序的选择器
    const selectors = [
      // 语义化标签
      'main',
      'article',
       '[role="main"]',
      
      // 常见的内容容器
      '.content',
      '#content',
      '.main-content',
      '.article-content',
      '.post-content',
      '.entry-content',
      
      // 特定网站的选择器
      '.markdown-body', // GitHub
      '.post-message', // 论坛
      '.answer', // Stack Overflow
      '.wiki-content', // Confluence
      
      // 更通用的选择器
      '.container',
      '.wrapper',
      'body'
    ];

    for (const selector of selectors) {
      console.log(`🔍 尝试选择器: ${selector}`);
      const elements = document.querySelectorAll(selector);
      console.log(`📍 找到 ${elements.length} 个匹配元素`);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        const text = this.extractTextFromElement(element);
        console.log(`📄 元素 ${i + 1} 提取文本长度: ${text.length}`);
        
        if (text && text.length > 200) {
          console.log(`✅ 选择器 "${selector}" 提取成功，文本长度: ${text.length}`);
          console.log('📝 提取内容预览:', text.substring(0, 150) + '...');
          return text;
        }
      }
    }

    console.log('❌ 所有选择器都未能提取到足够的内容');
    return '';
  }

  // 备用内容提取
  private static extractFallbackContent(): string {
    console.log('🔧 开始备用内容提取...');
    
    // 移除不需要的元素
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.navigation',
      '.sidebar',
      '.ads',
      '.advertisement',
      '.social-share',
      '.comments'
    ];

    console.log('🧹 正在清理不需要的元素...');
    const bodyClone = document.body.cloneNode(true) as HTMLElement;
    
    let removedCount = 0;
    unwantedSelectors.forEach(selector => {
      const elements = bodyClone.querySelectorAll(selector);
      removedCount += elements.length;
      elements.forEach(el => el.remove());
    });
    
    console.log(`✨ 已移除 ${removedCount} 个不需要的元素`);
    
    const result = this.extractTextFromElement(bodyClone);
    console.log(`📝 备用提取结果: ${result.length} 字符`);
    
    return result;
  }

  // 从元素中提取文本
  private static extractTextFromElement(element: HTMLElement): string {
    if (!element) return '';

    // 移除不需要的子元素
    const unwantedTags = ['script', 'style', 'nav', 'aside', 'footer'];
    unwantedTags.forEach(tag => {
      const elements = element.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // 处理特殊元素
    const codeBlocks = element.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      block.innerHTML = `[代码块: ${block.textContent?.substring(0, 50)}...]`;
    });

    // 获取文本内容
    let text = element.innerText || element.textContent || '';
    
    // 保留段落结构
    const paragraphs = element.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
    if (paragraphs.length > 0) {
      text = Array.from(paragraphs)
        .map(p => p.textContent?.trim())
        .filter(t => t && t.length > 10)
        .join('\\n\\n');
    }

    return text;
  }

  // 清理内容
  private static cleanContent(content: string): string {
    return content
      // 移除多余的空白字符
      .replace(/\s+/g, ' ')
      // 移除多余的换行
      .replace(/\n\s*\n/g, '\n\n')
      // 移除开头和结尾的空白
      .trim()
      // 限制长度（防止过长）
      .substring(0, 50000);
  }

  // 定制化网站内容提取
  private static extractCustomSiteContent(): string {
    const hostname = window.location.hostname.toLowerCase();
    
    console.log(`🔍 检测到网站: ${hostname}`);
    
    // V2EX 论坛特殊处理
    if (hostname.includes('v2ex.com')) {
      console.log('💬 检测到 V2EX 论坛，使用定制提取逻辑');
      return this.extractV2EXContent();
    }
    
    return '';
  }

  // V2EX 论坛内容提取
  private static extractV2EXContent(): string {
    console.log('🔧 开始 V2EX 定制化内容提取...');
    
    const parts: string[] = [];
    
    // 1. 提取主题标题
    const titleElement = document.querySelector('h1');
    if (titleElement) {
      const title = titleElement.textContent?.trim();
      if (title) {
        parts.push(`主题: ${title}`);
        console.log(`📝 提取到主题: ${title}`);
      }
    }
    
    // 2. 提取主题内容 (.topic_content)
    const topicContent = document.querySelector('.topic_content');
    if (topicContent) {
      const content = this.extractTextFromElement(topicContent as HTMLElement);
      if (content && content.length > 10) {
        parts.push(`\n\n正文:\n${content}`);
        console.log(`📝 提取到正文内容: ${content.length} 字符`);
      }
    } else {
      console.log('⚠️ 未找到 .topic_content 元素');
    }
    
    // 3. 提取回复内容 (.box)
    const replyBoxes = document.querySelectorAll('.reply_content');
    console.log(`🔍 找到 ${replyBoxes.length} 个 .box 元素`);
    
    let validReplies = 0;
    replyBoxes.forEach((box, index) => {
      const boxElement = box as HTMLElement;
      
      // 过滤掉不相关的 .box 元素（如导航、广告等）
      const boxText = this.extractTextFromElement(boxElement);
      
      // 只保留有意义的回复（长度大于20且不包含导航关键词）
      if (boxText && 
          boxText.length > 20 && 
          !boxText.includes('登录') && 
          !boxText.includes('注册') &&
          !boxText.includes('设置') &&
          !boxText.includes('首页') &&
          !this.isNavigationBox(boxElement)) {
        
        validReplies++;
        parts.push(`\n\n回复 ${validReplies}:\n${boxText}`);
        console.log(`💬 提取到回复 ${validReplies}: ${boxText}`);
        
        // 限制回复数量，避免内容过长
        if (validReplies >= 100) {
          console.log('🔄 达到回复数量限制，停止提取');
          return;
        }
      }
    });
    
    const result = parts.join('');
    console.log(`🎉 V2EX 内容提取完成: 总长度 ${result.length} 字符，包含 ${validReplies} 个回复`);
    
    return result;
  }

  // 判断是否为导航类型的 box 元素
  private static isNavigationBox(element: HTMLElement): boolean {
    // 检查是否包含导航相关的类名或内容
    const className = element.className.toLowerCase();
    const innerHTML = element.innerHTML.toLowerCase();
    
    const navIndicators = [
      'header', 'nav', 'menu', 'sidebar', 'footer',
      '首页', '设置', '登录', '注册', '搜索',
      'home', 'setting', 'login', 'register', 'search'
    ];
    
    return navIndicators.some(indicator => 
      className.includes(indicator) || innerHTML.includes(indicator)
    );
  }

  // 检测内容类型
  private static detectContentType(content: string, url: string): ExtractedContent['type'] {
    const urlLower = url.toLowerCase();
    const contentLower = content.toLowerCase();

    // 基于URL判断
    if (urlLower.includes('github.com') || urlLower.includes('docs.') || urlLower.includes('documentation')) {
      return 'documentation';
    }
    
    if (urlLower.includes('blog') || urlLower.includes('/post/') || urlLower.includes('/article/')) {
      return 'blog';
    }
    
    if (urlLower.includes('news') || urlLower.includes('/news/')) {
      return 'news';
    }
    
    // V2EX 论坛
    if (urlLower.includes('v2ex.com')) {
      return 'article';
    }

    // 基于内容判断
    const articleIndicators = ['作者', 'author', '发布时间', 'published', '阅读量', '转发', 'share'];
    const hasArticleIndicators = articleIndicators.some(indicator => 
      contentLower.includes(indicator)
    );

    if (hasArticleIndicators) {
      return 'article';
    }

    return 'general';
  }

  // 统计字数
  private static countWords(content: string): number {
    // 中文字符统计
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    const chineseCount = chineseChars ? chineseChars.length : 0;

    // 英文单词统计
    const englishWords = content.match(/[a-zA-Z]+/g);
    const englishCount = englishWords ? englishWords.length : 0;

    // 返回总字数（中文字符 + 英文单词）
    return chineseCount + englishCount;
  }

  // 检测语言
  private static detectLanguage(content: string): string {
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    const englishChars = content.match(/[a-zA-Z]/g);
    
    const chineseCount = chineseChars ? chineseChars.length : 0;
    const englishCount = englishChars ? englishChars.length : 0;
    
    if (chineseCount > englishCount) {
      return 'zh';
    } else if (englishCount > chineseCount) {
      return 'en';
    } else {
      return 'auto';
    }
  }

  // 检查页面是否有选中内容
  static hasSelection(): boolean {
    const selection = window.getSelection();
    return !!(selection?.toString().trim());
  }

  // 高亮选中内容（用于调试）
  static highlightSelection(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = 'yellow';
      span.style.padding = '2px';
      
      try {
        range.surroundContents(span);
      } catch (e) {
        console.warn('Cannot highlight complex selection:', e);
      }
    }
  }
}