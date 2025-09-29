import html2canvas from 'html2canvas';
import { SummaryResult } from '../types';

export interface ImageTemplate {
  id: string;
  name: string;
  description: string;
  style: 'modern' | 'xiaohongshu' | 'zhihu' | 'weibo' | 'academic';
  dimensions: {
    width: number;
    height: number;
  };
}

export interface GenerateImageOptions {
  template: ImageTemplate;
  quality: number; // 0.1 - 1.0
  format: 'png' | 'jpeg';
  backgroundColor?: string;
}

export class ImageGenerator {
  // 预定义的模板 - 高度现在作为最大高度，支持自适应
  static readonly TEMPLATES: ImageTemplate[] = [
    {
      id: 'modern',
      name: '简洁现代',
      description: '简洁的现代风格，适合商务分享',
      style: 'modern',
      dimensions: { width: 800, height: 800 } // 增加最大高度
    },
    {
      id: 'xiaohongshu',
      name: '小红书风格',
      description: '活泼可爱，适合生活分享',
      style: 'xiaohongshu',
      dimensions: { width: 750, height: 1200 } // 增加最大高度
    },
    {
      id: 'zhihu',
      name: '知乎风格',
      description: '专业理性，适合知识分享',
      style: 'zhihu',
      dimensions: { width: 800, height: 900 } // 增加最大高度
    },
    {
      id: 'weibo',
      name: '微博风格',
      description: '简短精炼，适合快速分享',
      style: 'weibo',
      dimensions: { width: 690, height: 800 } // 适中高度
    },
    {
      id: 'academic',
      name: '学术论文',
      description: '严谨专业，适合学术分享',
      style: 'academic',
      dimensions: { width: 800, height: 1200 } // 增加最大高度
    }
  ];

  /**
   * 根据摘要内容生成分享图片
   */
  static async generateImage(
    summary: SummaryResult,
    options: GenerateImageOptions
  ): Promise<string> {
    console.log('开始生成图片:', { summary: summary.title, template: options.template.name });
    
    // 创建临时容器
    const container = document.createElement('div');
    container.id = 'image-generator-container';
    
    // 应用模板样式
    this.applyTemplateStyles(container, options.template, summary);
    
    // 添加到文档中
    document.body.appendChild(container);
    
    // 检查并处理文本溢出
    await this.handleTextOverflow(container, options.template);
    
    try {
      // 等待DOM渲染完成
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // 调试信息
      console.log('容器信息:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        scrollHeight: container.scrollHeight,
        innerHTML: container.innerHTML.substring(0, 200) + '...'
      });

      // 自适应高度计算 - 为长文本提供更多空间
      const minHeight = 400; // 最小高度
      const maxHeight = Math.max(options.template.dimensions.height, 1500); // 增加最大高度限制，确保长文本显示
      const contentHeight = Math.max(container.scrollHeight, container.offsetHeight);
      
      // 为长文本预留额外空间
      const paddingBuffer = 50; // 额外的缓冲空间
      const actualHeight = Math.min(Math.max(contentHeight + paddingBuffer, minHeight), maxHeight);
      
      console.log('高度计算:', {
        contentHeight,
        minHeight,
        maxHeight,
        actualHeight,
        paddingBuffer
      });

      // 调整容器高度为实际需要的高度
      container.style.height = `${actualHeight}px`;

      // 生成canvas
      const canvas = await html2canvas(container, {
        width: options.template.dimensions.width,
        height: actualHeight,
        scale: 1, // 降低缩放避免内存问题
        backgroundColor: options.backgroundColor || '#ffffff',
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: true, // 开启日志用于调试
        onclone: (clonedDoc) => {
          // 确保克隆文档中的样式正确
          const clonedContainer = clonedDoc.querySelector('div');
          if (clonedContainer) {
            clonedContainer.style.position = 'static';
            clonedContainer.style.left = 'auto';
            clonedContainer.style.top = 'auto';
            clonedContainer.style.visibility = 'visible';
          }
        }
      });
      
      // 转换为数据URL
      const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);
      
      return dataUrl;
    } finally {
      // 清理临时容器
      document.body.removeChild(container);
    }
  }

  /**
   * 应用模板样式
   */
  private static applyTemplateStyles(
    container: HTMLElement,
    template: ImageTemplate,
    summary: SummaryResult
  ): void {
    // 基础样式 - 确保元素可见且有固定尺寸
    container.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    container.style.fontSize = '16px';
    container.style.lineHeight = '1.6';
    container.style.padding = '40px';
    container.style.boxSizing = 'border-box';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#333333';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.overflow = 'hidden';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    container.style.width = `${template.dimensions.width}px`;
    container.style.minHeight = `${Math.min(400, template.dimensions.height)}px`;
    container.style.maxHeight = `${template.dimensions.height}px`;
    
    switch (template.style) {
      case 'modern':
        this.applyModernStyle(container, summary);
        break;
      case 'xiaohongshu':
        this.applyXiaohongshuStyle(container, summary);
        break;
      case 'zhihu':
        this.applyZhihuStyle(container, summary);
        break;
      case 'weibo':
        this.applyWeiboStyle(container, summary);
        break;
      case 'academic':
        this.applyAcademicStyle(container, summary);
        break;
    }
  }

  /**
   * 现代简洁风格
   */
  private static applyModernStyle(container: HTMLElement, summary: SummaryResult): void {
    // 使用简化的HTML结构，自适应高度
    container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    container.style.color = 'white';
    container.style.padding = '30px';
    container.style.borderRadius = '20px';
    container.style.display = 'block'; // 改为block布局，不使用flex
    
    container.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.3; color: white;">
          ${summary.title}
        </h1>
                <div style="font-size: 16px; line-height: 1.5; color: white; opacity: 0.95; margin-bottom: 20px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 600)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: white; opacity: 0.8; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
        <span>智能摘要助手</span>
        <span>${new Date(summary.timestamp).toLocaleDateString('zh-CN')}</span>
      </div>
    `;
  }

  /**
   * 小红书风格
   */
  private static applyXiaohongshuStyle(container: HTMLElement, summary: SummaryResult): void {
    container.style.background = 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)';
    container.style.padding = '20px';
    
    // 创建内部白色卡片，自适应高度
    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.padding = '30px';
    card.style.borderRadius = '25px';
    card.style.minHeight = '300px'; // 最小高度
    card.style.display = 'block';
    
    card.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 20px 0; color: #e91e63;">
          ✨ ${summary.title}
        </h1>
                <div style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 20px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 500)} 💫
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 2px solid #fce4ec; font-size: 13px; color: #e91e63;">
        <span style="font-weight: 600;">📱 智能摘要助手</span>
        <span>#智能摘要 #AI助手</span>
      </div>
    `;
    
    container.appendChild(card);
  }

  /**
   * 知乎风格
   */
  private static applyZhihuStyle(container: HTMLElement, summary: SummaryResult): void {
    container.style.backgroundColor = '#f6f6f6';
    container.style.padding = '20px';
    
    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.padding = '35px';
    card.style.borderRadius = '8px';
    card.style.borderLeft = '4px solid #0084ff';
    card.style.minHeight = '300px'; // 最小高度
    card.style.display = 'block';
    
    card.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 20px 0; color: #1a1a1a; line-height: 1.4;">
          ${summary.title}
        </h1>
        <div style="font-size: 15px; line-height: 1.5; color: #444; margin-bottom: 20px; text-align: justify; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 650)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 13px; color: #8590a6;">
        <span><span style="color: #0084ff; font-weight: 500;">智能摘要助手</span> · ${summary.wordCount} 字</span>
        <span>${new Date(summary.timestamp).toLocaleDateString('zh-CN')}</span>
      </div>
    `;
    
    container.appendChild(card);
  }

  /**
   * 微博风格
   */
  private static applyWeiboStyle(container: HTMLElement, summary: SummaryResult): void {
    container.style.background = 'linear-gradient(45deg, #ff6b6b, #feca57)';
    container.style.padding = '30px';
    container.style.borderRadius = '15px';
    container.style.color = 'white';
    container.style.textShadow = '0 1px 2px rgba(0,0,0,0.1)';
    container.style.minHeight = '350px';
    
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 15px;">🤖</div>
          <div>
            <div style="font-weight: 600; font-size: 16px;">智能摘要助手</div>
            <div style="font-size: 12px; opacity: 0.8;">刚刚</div>
          </div>
        </div>
        
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 15px 0; line-height: 1.4;">
          #${summary.title}#
        </h2>
        
        <div style="font-size: 14px; line-height: 1.4; margin-bottom: 20px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 400)} 
          
          #AI摘要 #智能助手 #效率工具
        </div>
      </div>
      
      <div style="font-size: 12px; opacity: 0.8; text-align: right; margin-top: auto;">
        ${new Date(summary.timestamp).toLocaleString('zh-CN')}
      </div>
    `;
  }

  /**
   * 学术论文风格
   */
  private static applyAcademicStyle(container: HTMLElement, summary: SummaryResult): void {
    container.style.backgroundColor = '#fafafa';
    container.style.padding = '20px';
    
    const paper = document.createElement('div');
    paper.style.background = 'white';
    paper.style.padding = '40px';
    paper.style.border = '1px solid #ddd';
    paper.style.fontFamily = '"Times New Roman", serif';
    paper.style.minHeight = '400px';
    
    paper.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;">
        <h1 style="font-size: 20px; font-weight: 600; margin: 0; color: #333; text-transform: uppercase; letter-spacing: 1px;">
          Abstract Summary
        </h1>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 15px 0; color: #333; line-height: 1.3;">
          ${summary.title}
        </h2>
        
        <div style="font-size: 14px; line-height: 1.5; color: #444; text-align: justify; text-indent: 2em; margin-bottom: 20px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 700)}
        </div>
      </div>
      
      <div style="padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; display: flex; justify-content: space-between;">
        <div><strong>Generated by:</strong> AI Summary Assistant</div>
        <div><strong>Date:</strong> ${new Date(summary.timestamp).toLocaleDateString('en-US')}</div>
      </div>
    `;
    
    container.appendChild(paper);
  }

  /**
   * 格式化内容，智能处理长文本并处理换行
   */
  private static formatContent(content: string, maxLength: number): string {
    let formatted = content;
    
    // 智能截断：优先在句号、换行符处截断
    if (content.length > maxLength) {
      const truncatePoint = this.findBestTruncatePoint(content, maxLength);
      formatted = content.substring(0, truncatePoint) + '...';
    }
    
    // 先转义HTML（但保留换行符）
    formatted = this.escapeHtml(formatted);
    
    // 处理各种类型的换行符
    formatted = formatted
      .replace(/\r\n/g, '<br>') // Windows换行符
      .replace(/\n/g, '<br>')   // Unix换行符
      .replace(/\r/g, '<br>');  // 老Mac换行符
    
    // 先处理 markdown 格式，包括列表项
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#f1f1f1;padding:2px 4px;border-radius:3px;">$1</code>')
      // 处理列表项，并在列表项后添加适当间距
      .replace(/^- (.*?)(<br>|$)/gm, '• $1<br>')
      .replace(/^\* (.*?)(<br>|$)/gm, '• $1<br>')
      .replace(/^\d+\. (.*?)(<br>|$)/gm, '$1<br>');
    
    // 处理连续的<br>标签，减少段落间距
    formatted = formatted.replace(/(<br\s*\/?>){3,}/g, '<br><br>'); // 3个或更多变成2个
    
    // 对于一般的双换行，使用紧凑间距（但保持列表项的正常间距）
    const lines = formatted.split('<br>');
    const processedLines: string[] = [];
    let skipNext = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }
      
      const currentLine = lines[i].trim();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      
      processedLines.push(lines[i]);
      
      // 如果当前行和下一行都不是列表项，且有空行，使用紧凑间距
      if (i < lines.length - 1) {
        const isCurrentList = currentLine.startsWith('•') || /^\d+\./.test(currentLine);
        const isNextList = nextLine.startsWith('•') || /^\d+\./.test(nextLine);
        const isEmpty = nextLine === '';
        
        if (!isCurrentList && !isNextList && isEmpty && i + 2 < lines.length) {
          // 跳过空行，添加紧凑间距
          processedLines.push('<span style="line-height:0.6;display:block;">&nbsp;</span>');
          skipNext = true; // 标记跳过下一个空行
        }
      }
    }
    
    formatted = processedLines.join('<br>');
    
    return formatted;
  }

  /**
   * 智能寻找最佳截断点
   */
  private static findBestTruncatePoint(content: string, maxLength: number): number {
    if (content.length <= maxLength) {
      return content.length;
    }

    // 在maxLength范围内寻找最佳截断点
    const searchRange = Math.min(maxLength, content.length);
    const buffer = Math.min(50, Math.floor(maxLength * 0.1)); // 10%的缓冲区，最多50字符
    
    // 优先级1: 在句号+空格后截断
    const sentenceEnd = content.lastIndexOf('。', searchRange);
    if (sentenceEnd > searchRange - buffer && sentenceEnd > maxLength * 0.7) {
      return sentenceEnd + 1;
    }
    
    // 优先级2: 在换行符处截断
    const lineEnd = content.lastIndexOf('\n', searchRange);
    if (lineEnd > searchRange - buffer && lineEnd > maxLength * 0.7) {
      return lineEnd;
    }
    
    // 优先级3: 在中文句号后截断
    const chinesePeriod = content.lastIndexOf('。', searchRange);
    if (chinesePeriod > searchRange - buffer && chinesePeriod > maxLength * 0.6) {
      return chinesePeriod + 1;
    }
    
    // 优先级4: 在逗号后截断
    const comma = content.lastIndexOf('，', searchRange);
    if (comma > searchRange - buffer && comma > maxLength * 0.6) {
      return comma + 1;
    }
    
    // 优先级5: 在空格处截断（避免截断单词）
    const space = content.lastIndexOf(' ', searchRange);
    if (space > searchRange - buffer && space > maxLength * 0.5) {
      return space;
    }
    
    // 最后选择：直接在maxLength处截断
    return maxLength;
  }

  /**
   * 处理文本溢出问题
   */
  private static async handleTextOverflow(container: HTMLElement, template: ImageTemplate): Promise<void> {
    // 等待DOM渲染
    await new Promise(resolve => {
      requestAnimationFrame(resolve);
    });
    
    const maxWidth = template.dimensions.width - 80; // 减去padding
    const maxHeight = template.dimensions.height;
    
    // 检查是否有水平溢出
    if (container.scrollWidth > maxWidth) {
      console.log('检测到水平溢出，调整字体大小');
      this.adjustFontSizeForOverflow(container, 'width');
    }
    
    // 检查是否有垂直溢出（但允许一定的高度扩展）
    if (container.scrollHeight > maxHeight * 1.2) {
      console.log('检测到严重垂直溢出，调整字体大小');
      this.adjustFontSizeForOverflow(container, 'height');
    }
  }

  /**
   * 调整字体大小以适应容器
   */
  private static adjustFontSizeForOverflow(container: HTMLElement, overflowType: 'width' | 'height'): void {
    const contentElements = container.querySelectorAll('div, p, span');
    
    contentElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const currentFontSize = parseInt(window.getComputedStyle(htmlElement).fontSize) || 16;
      
      // 根据溢出类型调整字体大小
      const reduction = overflowType === 'width' ? 2 : 1;
      const newFontSize = Math.max(currentFontSize - reduction, 12); // 最小字体12px
      
      htmlElement.style.fontSize = `${newFontSize}px`;
    });
  }

  /**
   * HTML转义
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 下载图片
   */
  static downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 复制图片到剪贴板
   */
  static async copyImageToClipboard(dataUrl: string): Promise<void> {
    try {
      // 将dataUrl转换为blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      throw new Error('复制图片到剪贴板失败');
    }
  }
}