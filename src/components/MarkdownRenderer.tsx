import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 自定义组件定义移到外层，避免重复渲染
const CustomLink: Components['a'] = (props) => (
  <a {...props} target="_blank" rel="noopener noreferrer">
    {props.children}
  </a>
);

const CustomCode: Components['code'] = ({ className, children, ...props }) => {
  // 检查是否为代码块（有 language- 前缀）
  const isCodeBlock = className?.startsWith('language-');
  
  return isCodeBlock ? (
    <pre className="code-block">
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  ) : (
    <code className="inline-code" {...props}>
      {children}
    </code>
  );
};

const CustomTable: Components['table'] = ({ children }) => (
  <div className="table-wrapper">
    <table>{children}</table>
  </div>
);

const CustomBlockquote: Components['blockquote'] = ({ children }) => (
  <blockquote className="quote-block">{children}</blockquote>
);

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const components: Components = {
    a: CustomLink,
    code: CustomCode,
    table: CustomTable,
    blockquote: CustomBlockquote,
  };

  // 清理内容中多余的换行符和空白
  const cleanContent = content
    // 移除列表项前后多余的换行符
    .replace(/\n\s*\n(\s*[-*+]\s)/g, '\n$1')
    // 移除列表项之间多余的空行
    .replace(/(\s*[-*+]\s[^\n]+)\n\s*\n(\s*[-*+]\s)/g, '$1\n$2')
    // 移除行末的多余空格
    .replace(/[ \t]+$/gm, '')
    // 规范化多个连续的换行符为最多两个
    .replace(/\n{3,}/g, '\n\n')
    // 移除开头和结尾的空白
    .trim();

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;