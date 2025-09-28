import { useRef, useEffect, useCallback, useState } from 'react';

interface UseAutoScrollOptions {
  /**
   * 是否启用自动滚动
   */
  enabled?: boolean;
  
  /**
   * 滚动延迟时间（毫秒）
   */
  delay?: number;
  
  /**
   * 滚动行为
   */
  behavior?: ScrollBehavior;
  
  /**
   * 距离底部多少像素时认为已经在底部
   */
  threshold?: number;
}

interface UseAutoScrollReturn {
  /**
   * 滚动容器的ref
   */
  scrollRef: React.RefObject<HTMLDivElement>;
  
  /**
   * 手动滚动到底部
   */
  scrollToBottom: () => void;
  
  /**
   * 是否正在自动滚动（用户没有手动干预）
   */
  isAutoScrolling: boolean;
  
  /**
   * 重置自动滚动状态（重新启用自动滚动）
   */
  resetAutoScroll: () => void;
}

/**
 * 自动滚动Hook
 * 
 * 功能：
 * 1. 当内容更新时自动滚动到底部
 * 2. 检测用户手动滚动，暂停自动滚动
 * 3. 提供手动控制滚动的方法
 */
export const useAutoScroll = (options: UseAutoScrollOptions = {}): UseAutoScrollReturn => {
  const {
    enabled = true,
    delay = 100,
    behavior = 'smooth',
    threshold = 50
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const isScrollingProgrammatically = useRef(false);
  const lastScrollTop = useRef(0);

  /**
   * 检查是否在底部
   */
  const isAtBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, [threshold]);

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    isScrollingProgrammatically.current = true;
    
    element.scrollTo({
      top: element.scrollHeight,
      behavior
    });

    // 延迟重置程序化滚动标志，避免触发手动滚动检测
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 300);
  }, [behavior]);

  /**
   * 处理滚动事件
   */
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || isScrollingProgrammatically.current) return;

    const currentScrollTop = element.scrollTop;
    
    // 检测用户向上滚动（手动干预）
    if (currentScrollTop < lastScrollTop.current) {
      setIsAutoScrolling(false);
    }
    // 如果用户滚动到底部，重新启用自动滚动
    else if (isAtBottom()) {
      setIsAutoScrolling(true);
    }

    lastScrollTop.current = currentScrollTop;
  }, [isAtBottom]);

  /**
   * 重置自动滚动状态
   */
  const resetAutoScroll = useCallback(() => {
    setIsAutoScrolling(true);
    scrollToBottom();
  }, [scrollToBottom]);

  // 监听滚动事件
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 内容变化时的自动滚动
  useEffect(() => {
    if (!enabled || !isAutoScrolling) return;

    const timer = setTimeout(() => {
      if (isAtBottom() || isAutoScrolling) {
        scrollToBottom();
      }
    }, delay);

    return () => clearTimeout(timer);
  });

  return {
    scrollRef,
    scrollToBottom,
    isAutoScrolling,
    resetAutoScroll
  };
};

export default useAutoScroll;