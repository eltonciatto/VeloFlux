import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { useTouch } from '@/hooks/useTouch';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  threshold?: number;
  maxPullDistance?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  isRefreshing,
  threshold = 80,
  maxPullDistance = 120,
  refreshingText = 'Atualizando...',
  pullText = 'Puxe para atualizar',
  releaseText = 'Solte para atualizar'
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const { 
    isDragging, 
    dragOffset, 
    bind 
  } = useTouch({
    onDragStart: (event) => {
      if (window.scrollY > 0) return false;
      
      const touch = 'touches' in event ? event.touches[0] : event as MouseEvent;
      startY.current = touch.clientY;
      setIsPulling(true);
      return true;
    },
    onDrag: (event) => {
      if (!isPulling || isRefreshing) return;
      
      const touch = 'touches' in event ? event.touches[0] : event as MouseEvent;
      currentY.current = touch.clientY;
      const distance = Math.max(0, (currentY.current - startY.current) * 0.6);
      const clampedDistance = Math.min(distance, maxPullDistance);
      
      setPullDistance(clampedDistance);
      setCanRefresh(clampedDistance >= threshold);
    },
    onDragEnd: async () => {
      if (!isPulling) return;
      
      setIsPulling(false);
      
      if (canRefresh && !isRefreshing) {
        await onRefresh();
      }
      
      setPullDistance(0);
      setCanRefresh(false);
      startY.current = 0;
      currentY.current = 0;
    }
  });

  useEffect(() => {
    if (isRefreshing) {
      setPullDistance(threshold);
    } else if (!isPulling) {
      setPullDistance(0);
    }
  }, [isRefreshing, isPulling, threshold]);

  const getRefreshText = () => {
    if (isRefreshing) return refreshingText;
    if (canRefresh) return releaseText;
    return pullText;
  };

  const getProgressPercentage = () => {
    return Math.min((pullDistance / threshold) * 100, 100);
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      {...bind}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-blue-50 to-transparent"
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
          transform: `translateY(-${Math.max(pullDistance, isRefreshing ? threshold : 0)}px)`,
          transition: isPulling ? 'none' : 'all 0.3s ease-out'
        }}
      >
        <div className="flex flex-col items-center gap-2 py-4">
          {/* Refresh Icon */}
          <div className="relative">
            <RefreshCwIcon 
              className={`w-6 h-6 text-blue-600 transition-transform duration-300 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${getProgressPercentage() * 3.6}deg)`
              }}
            />
            
            {/* Progress Ring */}
            <svg 
              className="absolute inset-0 w-6 h-6 -rotate-90"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 10}`}
                strokeDashoffset={`${2 * Math.PI * 10 * (1 - getProgressPercentage() / 100)}`}
                className="transition-all duration-150"
              />
            </svg>
          </div>
          
          {/* Refresh Text */}
          <span className="text-sm font-medium text-blue-600">
            {getRefreshText()}
          </span>
          
          {/* Progress Bar */}
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-150"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
