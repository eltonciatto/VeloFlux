import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import useMobileDetection from '../../hooks/useMobileDetection';
import './MobileNavigation.css';

interface MobileNavigationProps {
  onNavigate?: (path: string) => void;
  notificationCount?: number;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  children?: NavigationItem[];
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  onNavigate,
  notificationCount = 0
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useMobileDetection();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Navigation items for bottom navigation
  const bottomNavItems: NavigationItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: '📊',
      path: '/dashboard'
    },
    {
      id: 'analytics',
      label: t('navigation.analytics'),
      icon: '📈',
      path: '/analytics'
    },
    {
      id: 'notifications',
      label: t('navigation.notifications'),
      icon: '🔔',
      path: '/notifications',
      badge: notificationCount
    },
    {
      id: 'menu',
      label: t('navigation.menu'),
      icon: '☰',
      path: '/menu'
    }
  ], [t, notificationCount]);

  // Navigation items for drawer menu
  const drawerNavItems: NavigationItem[] = [
    {
      id: 'home',
      label: t('navigation.home'),
      icon: '🏠',
      path: '/'
    },
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: '📊',
      path: '/dashboard',
      children: [
        {
          id: 'overview',
          label: t('navigation.overview'),
          icon: '📈',
          path: '/dashboard/overview'
        },
        {
          id: 'performance',
          label: t('navigation.performance'),
          icon: '⚡',
          path: '/dashboard/performance'
        }
      ]
    },
    {
      id: 'multi-tenant',
      label: t('navigation.multiTenant'),
      icon: '🏢',
      path: '/multi-tenant',
      children: [
        {
          id: 'overview',
          label: t('navigation.overview'),
          icon: '📈',
          path: '/multi-tenant/overview'
        },
        {
          id: 'comparison',
          label: t('navigation.comparison'),
          icon: '📊',
          path: '/multi-tenant/comparison'
        },
        {
          id: 'hierarchy',
          label: t('navigation.hierarchy'),
          icon: '🌳',
          path: '/multi-tenant/hierarchy'
        }
      ]
    },
    {
      id: 'integrations',
      label: t('navigation.integrations'),
      icon: '🔗',
      path: '/integrations',
      children: [
        {
          id: 'prometheus',
          label: 'Prometheus',
          icon: '📊',
          path: '/integrations/prometheus'
        },
        {
          id: 'datadog',
          label: 'DataDog',
          icon: '☁️',
          path: '/integrations/datadog'
        },
        {
          id: 'slack',
          label: 'Slack',
          icon: '💬',
          path: '/integrations/slack'
        }
      ]
    },
    {
      id: 'mobile',
      label: t('navigation.mobile'),
      icon: '📱',
      path: '/mobile'
    },
    {
      id: 'analytics',
      label: t('navigation.analytics'),
      icon: '📈',
      path: '/analytics'
    },
    {
      id: 'users',
      label: t('navigation.users'),
      icon: '👥',
      path: '/users'
    },
    {
      id: 'security',
      label: t('navigation.security'),
      icon: '🔒',
      path: '/security'
    },
    {
      id: 'settings',
      label: t('navigation.settings'),
      icon: '⚙️',
      path: '/settings'
    }
  ];

  // Speed dial actions
  const speedDialActions = [
    {
      icon: '💾',
      name: t('actions.addServer'),
      action: () => navigate('/servers/add')
    },
    {
      icon: '👤',
      name: t('actions.addUser'),
      action: () => navigate('/users/add')
    },
    {
      icon: '🔐',
      name: t('actions.addRule'),
      action: () => navigate('/rules/add')
    },
    {
      icon: '🔗',
      name: t('actions.addIntegration'),
      action: () => navigate('/integrations/add')
    }
  ];

  // Update current tab based on location
  useEffect(() => {
    const currentPath = location.pathname;
    const tabIndex = bottomNavItems.findIndex(item => 
      item.path === currentPath || currentPath.startsWith(item.path)
    );
    if (tabIndex !== -1) {
      setCurrentTab(tabIndex);
    }
  }, [location.pathname, bottomNavItems]);

  const handleNavigation = (path: string) => {
    if (path === '/menu') {
      setDrawerOpen(true);
      return;
    }
    
    navigate(path);
    onNavigate?.(path);
    setDrawerOpen(false);
  };

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderDrawerItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = location.pathname === item.path || 
                    location.pathname.startsWith(item.path);

    return (
      <div key={item.id}>
        <div 
          className={`drawer-item ${isActive && !hasChildren ? 'active' : ''}`}
          style={{ paddingLeft: `${16 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              handleExpandClick(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
        >
          <span className="drawer-item-icon">
            {item.badge ? (
              <div className="badge-container">
                <span>{item.icon}</span>
                <span className="badge">{item.badge}</span>
              </div>
            ) : (
              item.icon
            )}
          </span>
          <span className="drawer-item-text">{item.label}</span>
          {hasChildren && (
            <span className="expand-icon">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="drawer-children">
            {item.children!.map(child => 
              renderDrawerItem(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isMobile && !isTablet) {
    return null; // Don't render on desktop
  }

  return (
    <>
      {/* Mobile App Bar */}
      <div className="mobile-app-bar">
        <button 
          className="menu-button"
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>
        <h1 className="app-title">VeloFlux</h1>
        <button className="notification-button">
          {notificationCount > 0 ? (
            <div className="badge-container">
              <span>🔔</span>
              <span className="badge">{notificationCount}</span>
            </div>
          ) : (
            '🔔'
          )}
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        {bottomNavItems.map((item, index) => (
          <button
            key={item.id}
            className={`bottom-nav-item ${currentTab === index ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab(index);
              handleNavigation(item.path);
            }}
          >
            <span className="bottom-nav-icon">
              {item.badge ? (
                <div className="badge-container">
                  <span>{item.icon}</span>
                  <span className="badge">{item.badge}</span>
                </div>
              ) : (
                item.icon
              )}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Navigation Drawer */}
      {drawerOpen && (
        <>
          <div 
            className="drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="navigation-drawer">
            <div className="drawer-header">
              <h2>VeloFlux</h2>
              <button 
                className="close-button"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="drawer-content">
              {drawerNavItems.map(item => renderDrawerItem(item))}
            </div>
          </div>
        </>
      )}

      {/* Speed Dial for Quick Actions */}
      <div className="speed-dial-container">
        <button
          className={`speed-dial-fab ${speedDialOpen ? 'open' : ''}`}
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
        >
          {speedDialOpen ? '✕' : '+'}
        </button>
        {speedDialOpen && (
          <div className="speed-dial-actions">
            {speedDialActions.map((action, index) => (
              <button
                key={action.name}
                className="speed-dial-action"
                onClick={() => {
                  action.action();
                  setSpeedDialOpen(false);
                }}
                title={action.name}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  bottom: `${(index + 1) * 60}px`
                }}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer for fixed bottom navigation */}
      <div className="bottom-nav-spacer" />
    </>
  );
};

export default MobileNavigation;
