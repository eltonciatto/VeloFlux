import { useState, useCallback } from 'react';

interface TouchEvent extends Event {
  touches: TouchList;
  changedTouches: TouchList;
}

interface MouseEvent extends Event {
  clientX: number;
  clientY: number;
}

interface TouchHandlers {
  onDragStart?: (event: TouchEvent | MouseEvent) => boolean | void;
  onDrag?: (event: TouchEvent | MouseEvent) => void;
  onDragEnd?: (event: TouchEvent | MouseEvent) => void;
  onTap?: (event: TouchEvent | MouseEvent) => void;
  onDoubleTap?: (event: TouchEvent | MouseEvent) => void;
  onLongPress?: (event: TouchEvent | MouseEvent) => void;
  onPinch?: (event: TouchEvent, scale: number) => void;
}

interface TouchState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface UseTouchResult extends TouchState {
  bind: {
    onTouchStart: (event: TouchEvent) => void;
    onTouchMove: (event: TouchEvent) => void;
    onTouchEnd: (event: TouchEvent) => void;
    onMouseDown: (event: MouseEvent) => void;
    onMouseMove: (event: MouseEvent) => void;
    onMouseUp: (event: MouseEvent) => void;
    onMouseLeave: (event: MouseEvent) => void;
  };
}

export const useTouch = (handlers: TouchHandlers = {}): UseTouchResult => {
  const [touchState, setTouchState] = useState<TouchState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  });

  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [initialDistance, setInitialDistance] = useState(0);

  const getEventPosition = (event: TouchEvent | MouseEvent) => {
    if ('touches' in event && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
    const mouseEvent = event as MouseEvent;
    return {
      x: mouseEvent.clientX || 0,
      y: mouseEvent.clientY || 0
    };
  };

  const getPinchDistance = (event: TouchEvent) => {
    if (event.touches && event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    }
    return 0;
  };

  const calculateVelocity = useCallback((currentPos: { x: number; y: number }, currentTime: number) => {
    const timeDelta = currentTime - lastMoveTime;
    if (timeDelta === 0) return { x: 0, y: 0 };

    const deltaX = currentPos.x - lastPosition.x;
    const deltaY = currentPos.y - lastPosition.y;

    return {
      x: deltaX / timeDelta,
      y: deltaY / timeDelta
    };
  }, [lastMoveTime, lastPosition]);

  const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
    const position = getEventPosition(event);
    const currentTime = Date.now();
    
    // Clear existing timeouts
    if (longPressTimeout) clearTimeout(longPressTimeout);
    if (tapTimeout) clearTimeout(tapTimeout);

    // Check for pinch gesture
    if ('touches' in event && event.touches && event.touches.length === 2) {
      setInitialDistance(getPinchDistance(event as TouchEvent));
      return;
    }

    // Call onDragStart handler
    const shouldStart = handlers.onDragStart?.(event);
    if (shouldStart === false) return;

    setTouchState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: position,
      currentPosition: position,
      dragOffset: { x: 0, y: 0 }
    }));

    setLastMoveTime(currentTime);
    setLastPosition(position);

    // Set up long press detection
    const longPressTimer = setTimeout(() => {
      handlers.onLongPress?.(event);
    }, 500);
    setLongPressTimeout(longPressTimer);

    event.preventDefault();
  }, [handlers, longPressTimeout, tapTimeout]);

  const handleMove = useCallback((event: TouchEvent | MouseEvent) => {
    const position = getEventPosition(event);
    const currentTime = Date.now();

    // Handle pinch gesture
    if ('touches' in event && event.touches && event.touches.length === 2 && initialDistance > 0) {
      const currentDistance = getPinchDistance(event as TouchEvent);
      const scale = currentDistance / initialDistance;
      handlers.onPinch?.(event, scale);
      return;
    }

    if (!touchState.isDragging) return;

    // Clear long press timeout on move
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }

    const velocity = calculateVelocity(position, currentTime);

    setTouchState(prev => ({
      ...prev,
      currentPosition: position,
      dragOffset: {
        x: position.x - prev.startPosition.x,
        y: position.y - prev.startPosition.y
      },
      velocity
    }));

    setLastMoveTime(currentTime);
    setLastPosition(position);

    handlers.onDrag?.(event);
    event.preventDefault();
  }, [touchState.isDragging, longPressTimeout, calculateVelocity, handlers, initialDistance]);

  const handleEnd = useCallback((event: TouchEvent | MouseEvent) => {
    // Clear timeouts
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }

    // Reset pinch state
    setInitialDistance(0);

    if (!touchState.isDragging) return;

    const position = getEventPosition(event);
    const dragDistance = Math.sqrt(
      Math.pow(touchState.dragOffset.x, 2) + 
      Math.pow(touchState.dragOffset.y, 2)
    );

    // Determine if this was a tap or drag
    if (dragDistance < 10) {
      // Handle tap
      setTapCount(prev => prev + 1);
      
      // Clear existing tap timeout
      if (tapTimeout) clearTimeout(tapTimeout);
      
      // Set new tap timeout
      const newTapTimeout = setTimeout(() => {
        if (tapCount === 0) {
          handlers.onTap?.(event);
        } else if (tapCount === 1) {
          handlers.onDoubleTap?.(event);
        }
        setTapCount(0);
      }, 300);
      
      setTapTimeout(newTapTimeout);
    } else {
      // Handle drag end
      handlers.onDragEnd?.(event);
    }

    setTouchState(prev => ({
      ...prev,
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 }
    }));

    event.preventDefault();
  }, [touchState.isDragging, touchState.dragOffset, tapCount, tapTimeout, longPressTimeout, handlers]);

  const bind = {
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
    onMouseDown: handleStart,
    onMouseMove: handleMove,
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd
  };

  return {
    ...touchState,
    bind
  };
};

export default useTouch;
