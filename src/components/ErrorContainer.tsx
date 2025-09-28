import React from 'react';
import { XCircle } from 'lucide-react';

interface ErrorContainerProps {
  message: string;
  onRetry: () => void;
}

const ErrorContainer: React.FC<ErrorContainerProps> = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">
        <XCircle size={24} />
      </div>
      <h4>操作失败</h4>
      <p>{message}</p>
      <button className="secondary-btn" onClick={onRetry}>
        重试
      </button>
    </div>
  );
};

export default ErrorContainer;