import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  WifiOffIcon,
  WifiIcon,
  CloudOffIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000); // Hide after 3 seconds
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastOnlineTime(new Date());
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show indicator initially if offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setIsOnline(true);
        setShowIndicator(true);
        setTimeout(() => setShowIndicator(false), 2000);
      }
    } catch (error) {
      console.log('Still offline');
    } finally {
      setIsRetrying(false);
    }
  };

  const getOfflineDuration = () => {
    if (!lastOnlineTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastOnlineTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else if (diffMins > 0) {
      return `${diffMins}m`;
    } else {
      return 'agora';
    }
  };

  if (!showIndicator && isOnline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      {isOnline ? (
        // Online notification
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Conexão restabelecida
            </span>
            <WifiIcon className="w-4 h-4 text-green-600" />
          </div>
        </div>
      ) : (
        // Offline notification
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOffIcon className="w-4 h-4 text-red-600" />
              <div>
                <span className="text-sm font-medium text-red-800">
                  Sem conexão
                </span>
                {lastOnlineTime && (
                  <p className="text-xs text-red-600">
                    Offline há {getOfflineDuration()}
                  </p>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              {isRetrying ? (
                <>
                  <RefreshCwIcon className="w-3 h-3 mr-1 animate-spin" />
                  Tentando...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="w-3 h-3 mr-1" />
                  Tentar novamente
                </>
              )}
            </Button>
          </div>
          
          {/* Offline capabilities info */}
          <div className="mt-2 pt-2 border-t border-red-200">
            <div className="flex items-center gap-2">
              <CloudOffIcon className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">
                Dados em cache disponíveis para visualização
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
