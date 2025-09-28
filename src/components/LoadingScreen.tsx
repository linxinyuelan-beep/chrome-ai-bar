import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface LoadingScreenProps {
  message?: string;
  streamingContent?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = '正在处理...', 
  streamingContent 
}) => {
  return (
    <div className="loading-screen">
      {streamingContent ? (
        <div className="streaming-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="content">
            <MarkdownRenderer content={streamingContent} />
          </div>
        </div>
      ) : (
        <>
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p>{message}</p>
        </>
      )}
    </div>
  );
};

export default LoadingScreen;