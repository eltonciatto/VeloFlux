import React, { useRef, useEffect, useCallback } from 'react';
import useTouch from '../../hooks/useTouch';
import './TouchGestures.css';

interface TouchGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchZoom?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  enableSwipe?: boolean;
  enablePinch?: boolean;
  enableRotate?: boolean;
  enableTap?: boolean;
  swipeThreshold?: number;
  className?: string;
}

const TouchGestures: React.FC<TouchGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchZoom,
  onRotate,
  onTap,
  onDoubleTap,
  onLongPress,
  enableSwipe = true,
  enablePinch = true,
  enableRotate = true,
  enableTap = true,
  swipeThreshold = 50,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialAngleRef = useRef(0);
  const currentAngleRef = useRef(0);

  const calculateAngle = (touch1: React.Touch, touch2: React.Touch) => {
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const handleDragEnd = (event: React.TouchEvent | React.MouseEvent) => {
    if (!enableSwipe) return;

    const touches = 'touches' in event ? event.changedTouches : null;
    if (touches && touches.length > 1) return; // Ignore multi-touch swipes

    // Get the final drag offset from the touch hook
    const dragOffset = touchState.dragOffset;
    const velocity = touchState.velocity;

    // Determine swipe direction based on offset and velocity
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
    const absVelX = Math.abs(velocity.x);
    const absVelY = Math.abs(velocity.y);

    // Check if movement is significant enough to be a swipe
    if (Math.max(absX, absY) < swipeThreshold && Math.max(absVelX, absVelY) < 0.5) {
      return;
    }

    // Determine primary direction
    if (absX > absY) {
      // Horizontal swipe
      if (dragOffset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (dragOffset.y > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  };

  const handlePinch = (event: React.TouchEvent, scale: number) => {
    if (!enablePinch) return;
    onPinchZoom?.(scale);
  };

  const handleRotation = useCallback((event: TouchEvent) => {
    if (!enableRotate || !event.touches || event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentAngle = calculateAngle(
      { clientX: touch1.clientX, clientY: touch1.clientY } as React.Touch,
      { clientX: touch2.clientX, clientY: touch2.clientY } as React.Touch
    );

    if (initialAngleRef.current === 0) {
      initialAngleRef.current = currentAngle;
      currentAngleRef.current = currentAngle;
      return;
    }

    const angleDiff = currentAngle - currentAngleRef.current;
    currentAngleRef.current = currentAngle;

    // Normalize angle difference to -180 to 180 range
    const normalizedAngle = ((angleDiff + 180) % 360) - 180;
    
    onRotate?.(normalizedAngle);
  }, [enableRotate, onRotate]);

  const {
    bind,
    isDragging,
    ...touchState
  } = useTouch({
    onDragEnd: handleDragEnd,
    onTap: enableTap ? onTap : undefined,
    onDoubleTap: enableTap ? onDoubleTap : undefined,
    onLongPress: enableTap ? onLongPress : undefined,
    onPinch: handlePinch
  });

  // Handle rotation separately as it's not part of the useTouch hook
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableRotate) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        handleRotation(event);
      }
    };

    const handleTouchEnd = () => {
      initialAngleRef.current = 0;
      currentAngleRef.current = 0;
    };

    container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableRotate, handleRotation]);

  return (
    <div
      ref={containerRef}
      className={`touch-gestures-container ${className} ${isDragging ? 'dragging' : ''}`}
      {...bind}
      style={{
        touchAction: 'none', // Prevent default touch behaviors
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {children}
    </div>
  );
};

export default TouchGestures;
