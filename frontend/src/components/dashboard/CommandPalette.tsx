import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Settings, 
  BarChart3, 
  Shield, 
  Users, 
  Database,
  Activity,
  DollarSign,
  Zap,
  Brain,
  Server,
  Monitor
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords: string[];
}

interface Tab {
  id: string;
  title: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  tabs?: Tab[];
}

export function CommandPalette({ isOpen, onClose, onNavigate, tabs }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      description: 'Go to main dashboard',
      icon: <Monitor className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard'),
      keywords: ['dashboard', 'overview', 'main', 'home']
    },
    {
      id: 'billing',
      label: 'Billing Panel',
      description: 'Manage billing and subscriptions',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/billing'),
      keywords: ['billing', 'payment', 'subscription', 'money', 'invoice']
    },
    {
      id: 'security',
      label: 'Security Settings',
      description: 'Configure security and WAF',
      icon: <Shield className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/security'),
      keywords: ['security', 'waf', 'firewall', 'protection', 'threats']
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      description: 'View AI analytics and predictions',
      icon: <Brain className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/ai-insights'),
      keywords: ['ai', 'artificial intelligence', 'insights', 'predictions', 'analytics']
    },
    {
      id: 'metrics',
      label: 'Metrics & Analytics',
      description: 'View performance metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/metrics'),
      keywords: ['metrics', 'analytics', 'performance', 'charts', 'data']
    },
    {
      id: 'backends',
      label: 'Backend Management',
      description: 'Manage backend servers',
      icon: <Server className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/backends'),
      keywords: ['backends', 'servers', 'infrastructure', 'nodes']
    },
    {
      id: 'rate-limit',
      label: 'Rate Limiting',
      description: 'Configure rate limits',
      icon: <Zap className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/rate-limit'),
      keywords: ['rate', 'limit', 'throttle', 'quota', 'requests']
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/users'),
      keywords: ['users', 'permissions', 'roles', 'access', 'team']
    },
    {
      id: 'health',
      label: 'Health Monitor',
      description: 'Monitor system health',
      icon: <Activity className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/health'),
      keywords: ['health', 'monitoring', 'status', 'uptime', 'alerts']
    },
    {
      id: 'config',
      label: 'Configuration',
      description: 'System configuration',
      icon: <Settings className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/config'),
      keywords: ['config', 'configuration', 'settings', 'preferences']
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.description?.toLowerCase().includes(query.toLowerCase()) ||
    command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-slate-900/95 border-slate-700 backdrop-blur-xl shadow-2xl">
            {/* Search Input */}
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-slate-400 border-0 focus:outline-none text-lg"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {Object.keys(groupedCommands).length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No commands found for "{query}"
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-2 py-1 text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {categoryCommands.map((command, index) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        return (
                          <motion.div
                            key={command.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-blue-600/20 border border-blue-500/30'
                                : 'hover:bg-slate-800/50'
                            }`}
                            onClick={() => {
                              command.action();
                              onClose();
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="text-slate-300">{command.icon}</div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{command.label}</div>
                              {command.description && (
                                <div className="text-sm text-slate-400">{command.description}</div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {globalIndex === selectedIndex ? 'Enter' : ''}
                            </Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <div>Use ↑↓ to navigate, Enter to select, Esc to close</div>
              <Badge variant="outline" className="text-xs">Cmd+K</Badge>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandPalette;
