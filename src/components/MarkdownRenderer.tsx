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

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;