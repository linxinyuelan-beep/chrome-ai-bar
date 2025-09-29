import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Loader2 } from 'lucide-react';
import { SummaryResult } from '../types';
import { ImageGenerator, ImageTemplate, GenerateImageOptions } from '../utils/image-generator';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SummaryResult;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  summary
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ImageTemplate>(ImageGenerator.TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 生成图片
  const handleGenerateImage = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      const options: GenerateImageOptions = {
        template: selectedTemplate,
        quality: 0.9,
        format: 'png',
        backgroundColor: '#ffffff'
      };

      const imageDataUrl = await ImageGenerator.generateImage(summary, options);
      setGeneratedImage(imageDataUrl);
    } catch (err) {
      console.error('生成图片失败:', err);
      setError(err instanceof Error ? err.message : '生成图片失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载图片
  const handleDownload = () => {
    if (generatedImage) {
      const filename = `${summary.title.substring(0, 20)}_摘要_${Date.now()}.png`;
      ImageGenerator.downloadImage(generatedImage, filename);
    }
  };

  // 复制图片
  const handleCopy = async () => {
    try {
      await ImageGenerator.copyImageToClipboard(generatedImage);
      // 可以添加成功提示
      console.log('图片已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      setError('复制图片失败，请尝试下载');
    }
  };

  // 模板选择变化时重新生成
  useEffect(() => {
    if (isOpen && selectedTemplate) {
      handleGenerateImage();
    }
  }, [isOpen, selectedTemplate]);

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImage('');
      setError('');
    }
  }, [isOpen]);

  // 获取模板预览颜色的辅助方法
  const getTemplatePreviewColor = (style: string): string => {
    switch (style) {
      case 'modern':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'xiaohongshu':
        return 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)';
      case 'zhihu':
        return 'linear-gradient(45deg, #0084ff 0%, #00a6ff 100%)';
      case 'weibo':
        return 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)';
      case 'academic':
        return 'linear-gradient(45deg, #333 0%, #666 100%)';
      default:
        return '#f0f0f0';
    }
  };



  if (!isOpen) return null;

  // 渲染图片预览内容
  const renderImagePreview = () => {
    if (isGenerating) {
      return (
        <div className="loading-container">
          <Loader2 size={32} className="spinner" />
          <p>正在生成图片...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="secondary-btn" onClick={handleGenerateImage}>
            重新生成
          </button>
        </div>
      );
    }

    if (generatedImage) {
      return (
        <div className="generated-image-container">
          <img
            src={generatedImage}
            alt="生成的分享图片"
            className="generated-image"
          />
          <div className="image-actions">
            <button className="primary-btn" onClick={handleDownload}>
              <Download size={16} />
              下载图片
            </button>
            <button className="secondary-btn" onClick={handleCopy}>
              <Copy size={16} />
              复制图片
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content image-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>生成分享图片</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 模板选择 */}
          <div className="template-selector">
            <h4>选择模板</h4>
            <div className="template-grid">
              {ImageGenerator.TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  className={`template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template)}
                  type="button"
                >
                  <div className="template-preview" style={{
                    background: getTemplatePreviewColor(template.style)
                  }}>
                    <div className="template-name">{template.name}</div>
                  </div>
                  <div className="template-info">
                    <div className="template-title">{template.name}</div>
                    <div className="template-desc">{template.description}</div>
                    <div className="template-size">
                      {template.dimensions.width} × {template.dimensions.height}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 图片预览 */}
          <div className="image-preview-container">
            {renderImagePreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;