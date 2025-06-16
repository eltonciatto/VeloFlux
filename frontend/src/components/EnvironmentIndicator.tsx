import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { getEnvironmentInfo } from '@/config/dataConfig';

export const EnvironmentIndicator: React.FC = () => {
  const envInfo = getEnvironmentInfo();

  // Don't show indicator in production
  if (envInfo.isProduction && !envInfo.isDemo) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg
        ${envInfo.isDemo 
          ? 'bg-amber-500/90 text-amber-50 border border-amber-400' 
          : 'bg-green-500/90 text-green-50 border border-green-400'
        }
      `}>
        {envInfo.isDemo ? (
          <>
            <AlertTriangle size={16} />
            <span>MODO DEMO</span>
          </>
        ) : (
          <>
            <Settings size={16} />
            <span>PRODUÇÃO</span>
          </>
        )}
      </div>
    </div>
  );
};

export default EnvironmentIndicator;
