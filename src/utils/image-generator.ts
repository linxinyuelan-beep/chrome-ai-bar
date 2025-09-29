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
  // 预定义的模板 - 高分辨率版本，支持自适应高度
  static readonly TEMPLATES: ImageTemplate[] = [
    {
      id: 'modern',
      name: '简洁现代',
      description: '简洁的现代风格，适合商务分享',
      style: 'modern',
      dimensions: { width: 1200, height: 1200 } // 提高到1200px宽度
    },
    {
      id: 'xiaohongshu',
      name: '小红书风格',
      description: '活泼可爱，适合生活分享',
      style: 'xiaohongshu',
      dimensions: { width: 1080, height: 1800 } // 标准小红书尺寸
    },
    {
      id: 'zhihu',
      name: '知乎风格',
      description: '专业理性，适合知识分享',
      style: 'zhihu',
      dimensions: { width: 1200, height: 1350 } // 提高分辨率
    },
    {
      id: 'weibo',
      name: '微博风格',
      description: '简短精炼，适合快速分享',
      style: 'weibo',
      dimensions: { width: 1080, height: 1200 } // 标准微博尺寸
    },
    {
      id: 'academic',
      name: '学术论文',
      description: '严谨专业，适合学术分享',
      style: 'academic',
      dimensions: { width: 1200, height: 1800 } // A4比例高分辨率
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

      // 生成canvas - 提高分辨率和质量
      const canvas = await html2canvas(container, {
        width: options.template.dimensions.width,
        height: actualHeight,
        scale: window.devicePixelRatio || 2, // 使用设备像素比或2倍缩放提高清晰度
        backgroundColor: options.backgroundColor || '#ffffff',
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false, // 关闭日志减少控制台输出
        removeContainer: true, // 渲染后移除容器
        imageTimeout: 15000, // 增加图片加载超时时间
        onclone: (clonedDoc) => {
          // 确保克隆文档中的样式正确，并优化渲染质量
          const clonedContainer = clonedDoc.querySelector('div');
          if (clonedContainer) {
            clonedContainer.style.position = 'static';
            clonedContainer.style.left = 'auto';
            clonedContainer.style.top = 'auto';
            clonedContainer.style.visibility = 'visible';
            // 添加高质量渲染样式
            clonedContainer.style.imageRendering = 'pixelated';
            clonedContainer.style.transform = 'translateZ(0)';
            clonedContainer.style.backfaceVisibility = 'hidden';
          }
        }
      });
      
      // 转换为数据URL - 使用最高质量设置
      const highQuality = Math.max(options.quality, 0.95); // 确保至少95%质量
      const dataUrl = canvas.toDataURL(`image/${options.format}`, highQuality);
      
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
    // 基础样式 - 高分辨率优化
    const scaleFactor = template.dimensions.width / 800; // 基于800px计算缩放比例
    const baseFontSize = Math.round(16 * scaleFactor);
    const basePadding = Math.round(40 * scaleFactor);
    
    container.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    container.style.fontSize = `${baseFontSize}px`;
    container.style.lineHeight = '1.6';
    container.style.padding = `${basePadding}px`;
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
    container.style.minHeight = `${Math.min(400 * scaleFactor, template.dimensions.height)}px`;
    container.style.maxHeight = `${template.dimensions.height}px`;
    // 高质量渲染优化
    container.style.textRendering = 'optimizeLegibility';
    // 使用字符串设置私有样式属性
    (container.style as any).webkitFontSmoothing = 'antialiased';
    (container.style as any).mozOsxFontSmoothing = 'grayscale';
    
    switch (template.style) {
      case 'modern':
        this.applyModernStyle(container, summary, template);
        break;
      case 'xiaohongshu':
        this.applyXiaohongshuStyle(container, summary, template);
        break;
      case 'zhihu':
        this.applyZhihuStyle(container, summary, template);
        break;
      case 'weibo':
        this.applyWeiboStyle(container, summary, template);
        break;
      case 'academic':
        this.applyAcademicStyle(container, summary, template);
        break;
    }
  }

  /**
   * 计算基于模板尺寸的缩放因子和样式值
   */
  private static getScaledStyles(template: ImageTemplate) {
    const scaleFactor = template.dimensions.width / 800; // 基于800px计算缩放比例
    return {
      scaleFactor,
      fontSize: {
        title: Math.round(28 * scaleFactor),
        content: Math.round(16 * scaleFactor),
        meta: Math.round(14 * scaleFactor),
        small: Math.round(12 * scaleFactor)
      },
      spacing: {
        padding: Math.round(30 * scaleFactor),
        margin: Math.round(20 * scaleFactor),
        smallMargin: Math.round(15 * scaleFactor)
      },
      borderRadius: Math.round(20 * scaleFactor)
    };
  }

  /**
   * 现代简洁风格
   */
  private static applyModernStyle(container: HTMLElement, summary: SummaryResult, template: ImageTemplate): void {
    const styles = this.getScaledStyles(template);
    
    // 使用简化的HTML结构，自适应高度
    container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    container.style.color = 'white';
    container.style.padding = `${styles.spacing.padding}px`;
    container.style.borderRadius = `${styles.borderRadius}px`;
    container.style.display = 'block'; // 改为block布局，不使用flex
    
    container.innerHTML = `
      <div style="margin-bottom: ${styles.spacing.padding}px;">
        <h1 style="font-size: ${styles.fontSize.title}px; font-weight: 700; margin: 0 0 ${styles.spacing.margin}px 0; line-height: 1.3; color: white;">
          ${summary.title}
        </h1>
        <div style="font-size: ${styles.fontSize.content}px; line-height: 1.4; color: white; opacity: 0.95; margin-bottom: ${styles.spacing.margin}px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 600 * styles.scaleFactor)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: ${styles.fontSize.meta}px; color: white; opacity: 0.8; padding-top: ${styles.spacing.margin}px; border-top: 1px solid rgba(255,255,255,0.2);">
        <span>智能摘要助手</span>
        <span>${new Date(summary.timestamp).toLocaleDateString('zh-CN')}</span>
      </div>
    `;
  }

  /**
   * 小红书风格
   */
  private static applyXiaohongshuStyle(container: HTMLElement, summary: SummaryResult, template: ImageTemplate): void {
    const styles = this.getScaledStyles(template);
    
    container.style.background = 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)';
    container.style.padding = `${styles.spacing.margin}px`;
    
    // 创建内部白色卡片，自适应高度
    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.padding = `${styles.spacing.padding}px`;
    card.style.borderRadius = `${Math.round(25 * styles.scaleFactor)}px`;
    card.style.minHeight = `${Math.round(300 * styles.scaleFactor)}px`; // 最小高度
    card.style.display = 'block';
    
    card.innerHTML = `
      <div style="margin-bottom: ${styles.spacing.padding}px;">
        <h1 style="font-size: ${Math.round(24 * styles.scaleFactor)}px; font-weight: 700; margin: 0 0 ${styles.spacing.margin}px 0; color: #e91e63;">
          ✨ ${summary.title}
        </h1>
        <div style="font-size: ${styles.fontSize.content}px; line-height: 1.4; color: #333; margin-bottom: ${styles.spacing.margin}px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 500 * styles.scaleFactor)} 💫
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: ${styles.spacing.margin}px; border-top: 2px solid #fce4ec; font-size: ${Math.round(13 * styles.scaleFactor)}px; color: #e91e63;">
        <span style="font-weight: 600;">📱 智能摘要助手</span>
        <span>#智能摘要 #AI助手</span>
      </div>
    `;
    
    container.appendChild(card);
  }

  /**
   * 知乎风格
   */
  private static applyZhihuStyle(container: HTMLElement, summary: SummaryResult, template: ImageTemplate): void {
    const styles = this.getScaledStyles(template);
    
    container.style.backgroundColor = '#f6f6f6';
    container.style.padding = `${styles.spacing.margin}px`;
    
    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.padding = `${Math.round(35 * styles.scaleFactor)}px`;
    card.style.borderRadius = `${Math.round(8 * styles.scaleFactor)}px`;
    card.style.borderLeft = `${Math.round(4 * styles.scaleFactor)}px solid #0084ff`;
    card.style.minHeight = `${Math.round(300 * styles.scaleFactor)}px`; // 最小高度
    card.style.display = 'block';
    
    card.innerHTML = `
      <div style="margin-bottom: ${styles.spacing.padding}px;">
        <h1 style="font-size: ${Math.round(22 * styles.scaleFactor)}px; font-weight: 600; margin: 0 0 ${styles.spacing.margin}px 0; color: #1a1a1a; line-height: 1.4;">
          ${summary.title}
        </h1>
        <div style="font-size: ${Math.round(15 * styles.scaleFactor)}px; line-height: 1.4; color: #444; margin-bottom: ${styles.spacing.margin}px; text-align: justify; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 650 * styles.scaleFactor)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: ${styles.spacing.margin}px; border-top: 1px solid #e6e6e6; font-size: ${Math.round(13 * styles.scaleFactor)}px; color: #8590a6;">
        <span><span style="color: #0084ff; font-weight: 500;">智能摘要助手</span> · ${summary.wordCount} 字</span>
        <span>${new Date(summary.timestamp).toLocaleDateString('zh-CN')}</span>
      </div>
    `;
    
    container.appendChild(card);
  }

  /**
   * 微博风格
   */
  private static applyWeiboStyle(container: HTMLElement, summary: SummaryResult, template: ImageTemplate): void {
    const styles = this.getScaledStyles(template);
    
    container.style.background = 'linear-gradient(45deg, #ff6b6b, #feca57)';
    container.style.padding = `${styles.spacing.padding}px`;
    container.style.borderRadius = `${Math.round(15 * styles.scaleFactor)}px`;
    container.style.color = 'white';
    container.style.textShadow = '0 1px 2px rgba(0,0,0,0.1)';
    container.style.minHeight = `${Math.round(350 * styles.scaleFactor)}px`;
    
    container.innerHTML = `
      <div style="margin-bottom: ${styles.spacing.margin}px;">
        <div style="display: flex; align-items: center; margin-bottom: ${styles.spacing.margin}px;">
          <div style="width: ${Math.round(50 * styles.scaleFactor)}px; height: ${Math.round(50 * styles.scaleFactor)}px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${Math.round(20 * styles.scaleFactor)}px; margin-right: ${styles.spacing.smallMargin}px;">🤖</div>
          <div>
            <div style="font-weight: 600; font-size: ${styles.fontSize.content}px;">智能摘要助手</div>
            <div style="font-size: ${styles.fontSize.small}px; opacity: 0.8;">刚刚</div>
          </div>
        </div>
        
        <h2 style="font-size: ${Math.round(18 * styles.scaleFactor)}px; font-weight: 600; margin: 0 0 ${styles.spacing.smallMargin}px 0; line-height: 1.4;">
          #${summary.title}#
        </h2>
        
        <div style="font-size: ${styles.fontSize.meta}px; line-height: 1.3; margin-bottom: ${styles.spacing.margin}px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 400 * styles.scaleFactor)} 
          
          #AI摘要 #智能助手 #效率工具
        </div>
      </div>
      
      <div style="font-size: ${styles.fontSize.small}px; opacity: 0.8; text-align: right; margin-top: auto;">
        ${new Date(summary.timestamp).toLocaleString('zh-CN')}
      </div>
    `;
  }

  /**
   * 学术论文风格
   */
  private static applyAcademicStyle(container: HTMLElement, summary: SummaryResult, template: ImageTemplate): void {
    const styles = this.getScaledStyles(template);
    
    container.style.backgroundColor = '#fafafa';
    container.style.padding = `${styles.spacing.margin}px`;
    
    const paper = document.createElement('div');
    paper.style.background = 'white';
    paper.style.padding = `${Math.round(40 * styles.scaleFactor)}px`;
    paper.style.border = '1px solid #ddd';
    paper.style.fontFamily = '"Times New Roman", serif';
    paper.style.minHeight = `${Math.round(400 * styles.scaleFactor)}px`;
    
    paper.innerHTML = `
      <div style="text-align: center; margin-bottom: ${styles.spacing.padding}px; padding-bottom: ${styles.spacing.margin}px; border-bottom: 2px solid #333;">
        <h1 style="font-size: ${Math.round(20 * styles.scaleFactor)}px; font-weight: 600; margin: 0; color: #333; text-transform: uppercase; letter-spacing: 1px;">
          Abstract Summary
        </h1>
      </div>
      
      <div style="margin-bottom: ${styles.spacing.padding}px;">
        <h2 style="font-size: ${Math.round(18 * styles.scaleFactor)}px; font-weight: 600; margin: 0 0 ${styles.spacing.smallMargin}px 0; color: #333; line-height: 1.3;">
          ${summary.title}
        </h2>
        
        <div style="font-size: ${styles.fontSize.meta}px; line-height: 1.4; color: #444; text-align: justify; text-indent: ${Math.round(2 * styles.scaleFactor)}em; margin-bottom: ${styles.spacing.margin}px; word-wrap: break-word; overflow-wrap: break-word;">
          ${this.formatContent(summary.content, 700 * styles.scaleFactor)}
        </div>
      </div>
      
      <div style="padding-top: ${styles.spacing.margin}px; border-top: 1px solid #ddd; font-size: ${styles.fontSize.small}px; color: #666; display: flex; justify-content: space-between;">
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
    
    // 处理换行：使用更紧凑的段落间距
    formatted = formatted
      // 首先标记段落换行（双换行）
      .replace(/\r?\n\s*\r?\n/g, '__PARAGRAPH_BREAK__')
      // 然后处理单换行
      .replace(/\r?\n/g, '<br>')
      // 恢复段落换行，使用紧凑的段落间距
      .replace(/__PARAGRAPH_BREAK__/g, '</p><p style="margin: 0.5em 0;">');
    
    // 处理 markdown 格式
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#f1f1f1;padding:2px 4px;border-radius:3px;">$1</code>')
      // 处理列表项
      .replace(/^- (.*?)(<br>|$)/gm, '• $1<br>')
      .replace(/^\* (.*?)(<br>|$)/gm, '• $1<br>')
      .replace(/^\d+\. (.*?)(<br>|$)/gm, '$1<br>');
    
    // 清理多余的连续<br>标签（超过2个的减少为1个）
    formatted = formatted.replace(/(<br\s*\/?>){2,}/g, '<br>');
    
    // 如果内容包含段落分隔，需要包装在 <p> 标签中
    if (formatted.includes('</p><p')) {
      formatted = '<p style="margin: 0 0 0.5em 0;">' + formatted + '</p>';
    }
    
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