import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FuturisticCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const FuturisticCard: React.FC<FuturisticCardProps> = ({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  description,
  className = '',
  children
}) => {
  return (
    <motion.div
      className={`group relative ${className}`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-xl opacity-0 group-hover:opacity-75 transition-opacity duration-300 blur`}
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <Card className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl p-6 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className={`w-full h-full bg-gradient-to-br ${gradient}`}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className={`absolute top-4 right-4 w-8 h-8 bg-gradient-to-r ${gradient} rounded-full opacity-20`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
          />
          <motion.div
            className={`absolute bottom-4 left-4 w-6 h-6 border-2 border-gradient-to-r ${gradient} rotate-45 opacity-20`}
            animate={{
              rotate: [45, 90, 45],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 1
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
              <motion.div
                className="flex items-baseline gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-3xl font-bold text-white">{value}</span>
                {trend && (
                  <motion.div
                    className={`flex items-center text-sm font-medium ${
                      trend.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                    <motion.div
                      className={`ml-1 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    >
                      ↗
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
              {description && (
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              )}
            </div>
            
            {/* Icon with gradient background */}
            <motion.div
              className={`relative p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}
              whileHover={{ scale: 1.1 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.3)',
                  '0 0 40px rgba(59, 130, 246, 0.5)',
                  '0 0 20px rgba(59, 130, 246, 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className="w-6 h-6 text-white" />
              
              {/* Pulsing ring */}
              <motion.div
                className={`absolute inset-0 rounded-xl border-2 border-gradient-to-r ${gradient}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </motion.div>
          </div>

          {/* Additional content */}
          {children && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {children}
            </motion.div>
          )}
        </div>

        {/* Bottom border accent */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </Card>
    </motion.div>
  );
};

export default FuturisticCard;
