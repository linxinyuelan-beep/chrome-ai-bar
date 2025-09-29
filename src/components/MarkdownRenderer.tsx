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

  // 预处理内容：将单个换行符转换为双换行符，保持原有的段落换行
  const processedContent = content
    .replace(/\n\n/g, '___DOUBLE_NEWLINE___') // 临时标记段落换行
    .replace(/\n/g, '  \n') // 将单换行转换为Markdown的强制换行（两个空格+换行）
    .replace(/___DOUBLE_NEWLINE___/g, '\n\n'); // 恢复段落换行

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;