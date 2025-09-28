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
    const title = document.title || '未知页面';
    const url = window.location.href;
    
    // 尝试提取主要内容
    let content = this.extractMainContent();
    
    // 如果没有找到主要内容，使用备用方法
    if (!content || content.length < 100) {
      content = this.extractFallbackContent();
    }
    
    // 清理内容
    content = this.cleanContent(content);
    
    return {
      title,
      content,
      url,
      type: this.detectContentType(content, url),
      wordCount: this.countWords(content),
      language: this.detectLanguage(content)
    };
  }

  // 提取选中内容
  static extractSelectedContent(): ExtractedContent | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      return null;
    }

    const cleanedContent = this.cleanContent(selectedText);
    
    return {
      title: '选中内容',
      content: cleanedContent,
      url: window.location.href,
      type: 'general',
      wordCount: this.countWords(cleanedContent),
      language: this.detectLanguage(cleanedContent)
    };
  }

  // 提取主要内容
  private static extractMainContent(): string {
    // 优先级顺序的选择器
    const selectors = [
      // 语义化标签
      'main',
      'article',
      '[role=\"main\"]',
      
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
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = this.extractTextFromElement(element as HTMLElement);
        if (text && text.length > 200) {
          return text;
        }
      }
    }

    return '';
  }

  // 备用内容提取
  private static extractFallbackContent(): string {
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

    const bodyClone = document.body.cloneNode(true) as HTMLElement;
    
    unwantedSelectors.forEach(selector => {
      const elements = bodyClone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    return this.extractTextFromElement(bodyClone);
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
      .replace(/\\s+/g, ' ')
      // 移除多余的换行
      .replace(/\\n\\s*\\n/g, '\\n\\n')
      // 移除开头和结尾的空白
      .trim()
      // 限制长度（防止过长）
      .substring(0, 50000);
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
    const chineseChars = content.match(/[\\u4e00-\\u9fa5]/g);
    const chineseCount = chineseChars ? chineseChars.length : 0;

    // 英文单词统计
    const englishWords = content.match(/[a-zA-Z]+/g);
    const englishCount = englishWords ? englishWords.length : 0;

    // 返回总字数（中文字符 + 英文单词）
    return chineseCount + englishCount;
  }

  // 检测语言
  private static detectLanguage(content: string): string {
    const chineseChars = content.match(/[\\u4e00-\\u9fa5]/g);
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
    return !!(selection && selection.toString().trim());
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