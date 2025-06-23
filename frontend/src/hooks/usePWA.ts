import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

interface UsePWAResult extends PWAState {
  install: () => Promise<boolean>;
  refresh: () => void;
  share: (data?: ShareData) => Promise<boolean>;
  addToHomeScreen: () => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
}

interface NavigatorStandalone {
  standalone?: boolean;
}

export const usePWA = (): UsePWAResult => {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    installPrompt: null
  });

  // Check if running in standalone mode
  const checkStandalone = useCallback(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorStandalone).standalone ||
      document.referrer.includes('android-app://');
    
    return isStandalone;
  }, []);

  // Check if PWA is already installed
  const checkInstalled = useCallback(() => {
    // Check for display mode
    if (checkStandalone()) return true;
    
    // Check for iOS Safari bookmark
    if ((window.navigator as NavigatorStandalone).standalone) return true;
    
    // Check for Android Chrome
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    
    return false;
  }, [checkStandalone]);

  // Install PWA
  const install = useCallback(async (): Promise<boolean> => {
    if (!pwaState.installPrompt) {
      console.warn('PWA install prompt not available');
      return false;
    }

    try {
      await pwaState.installPrompt.prompt();
      const choiceResult = await pwaState.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setPWAState(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          installPrompt: null
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [pwaState.installPrompt]);

  // Add to home screen (iOS)
  const addToHomeScreen = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    // For iOS, we need to show instructions
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Show iOS-specific instructions
      const confirmed = window.confirm(
        'Para instalar este app:\n' +
        '1. Toque no ícone de compartilhar\n' +
        '2. Selecione "Adicionar à Tela Inicial"\n' +
        '3. Toque em "Adicionar"'
      );
      return confirmed;
    }

    // For Android and other platforms, use the install prompt
    return await install();
  }, [install]);

  // Share functionality
  const share = useCallback(async (data?: ShareData): Promise<boolean> => {
    const defaultData: ShareData = {
      title: 'VeloFlux',
      text: 'Sistema de Load Balancing Inteligente',
      url: window.location.href
    };

    const shareData = { ...defaultData, ...data };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url || window.location.href);
        alert('Link copiado para a área de transferência!');
        return true;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
      }
    }
  }, []);

  // Refresh app
  const refresh = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
    window.location.reload();
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      return new Promise((resolve) => {
        const worker = registration.installing || registration.waiting;
        if (worker) {
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
              setPWAState(prev => ({ ...prev, updateAvailable: true }));
              resolve(true);
            }
          });
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initialize PWA state
    setPWAState(prev => ({
      ...prev,
      isStandalone: checkStandalone(),
      isInstalled: checkInstalled(),
      isOnline: navigator.onLine
    }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: installEvent
      }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }));
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOnline: false }));
    };

    // Service Worker update detection
    const handleServiceWorkerUpdate = () => {
      setPWAState(prev => ({ ...prev, updateAvailable: true }));
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker event listeners
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate);
      
      // Check for existing service worker updates
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setPWAState(prev => ({ ...prev, updateAvailable: true }));
        }
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate);
      }
    };
  }, [checkStandalone, checkInstalled]);

  // Periodic update check
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return {
    ...pwaState,
    install,
    refresh,
    share,
    addToHomeScreen,
    checkForUpdates
  };
};

export default usePWA;
