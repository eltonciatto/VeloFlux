import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
  userAgent: {
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isChrome: boolean;
    isFirefox: boolean;
  };
  viewport: {
    width: number;
    height: number;
  };
}

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenSize: 'lg',
        orientation: 'landscape',
        touchSupported: false,
        userAgent: {
          isIOS: false,
          isAndroid: false,
          isSafari: false,
          isChrome: false,
          isFirefox: false,
        },
        viewport: {
          width: 1024,
          height: 768,
        },
      };
    }

    return getDetectionResult();
  });

  function getDetectionResult(): MobileDetectionResult {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent;

    // Screen size breakpoints (Tailwind-based)
    const getScreenSize = (w: number): MobileDetectionResult['screenSize'] => {
      if (w < 640) return 'xs';
      if (w < 768) return 'sm';
      if (w < 1024) return 'md';
      if (w < 1280) return 'lg';
      if (w < 1536) return 'xl';
      return '2xl';
    };

    // Device detection
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;

    // Orientation
    const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

    // Touch support
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // User agent detection
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenSize: getScreenSize(width),
      orientation,
      touchSupported,
      userAgent: {
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isFirefox,
      },
      viewport: {
        width,
        height,
      },
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setDetection(getDetectionResult());
    };

    const handleOrientationChange = () => {
      // Delay to get correct dimensions after orientation change
      setTimeout(() => {
        setDetection(getDetectionResult());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
};

export default useMobileDetection;
