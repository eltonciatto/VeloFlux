import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ServerIcon,
  DatabaseIcon,
  CloudIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react';

interface SwipeableCard {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
  description: string;
}

const mockCards: SwipeableCard[] = [
  {
    id: '1',
    title: 'Server Performance',
    value: '98.5%',
    change: '+2.1%',
    trend: 'up',
    status: 'healthy',
    icon: <ServerIcon className="w-6 h-6" />,
    description: 'Uptime nas últimas 24h'
  },
  {
    id: '2',
    title: 'Database Load',
    value: '76%',
    change: '+12%',
    trend: 'up',
    status: 'warning',
    icon: <DatabaseIcon className="w-6 h-6" />,
    description: 'Utilização do banco de dados'
  },
  {
    id: '3',
    title: 'Cache Hit Rate',
    value: '94.2%',
    change: '-1.2%',
    trend: 'down',
    status: 'healthy',
    icon: <CloudIcon className="w-6 h-6" />,
    description: 'Taxa de acerto do cache'
  },
  {
    id: '4',
    title: 'API Response',
    value: '45ms',
    change: '-8ms',
    trend: 'up',
    status: 'healthy',
    icon: <ActivityIcon className="w-6 h-6" />,
    description: 'Tempo médio de resposta'
  }
];

export const SwipeableCards: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 80;
    
    if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (dragOffset < -threshold && currentIndex < mockCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setStartX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const threshold = 80;
    
    if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (dragOffset < -threshold && currentIndex < mockCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setStartX(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangleIcon className="w-4 h-4 text-red-600" />;
      default: return <CheckCircleIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUpIcon className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDownIcon className="w-4 h-4 text-red-600" />;
    return <ActivityIcon className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">System Metrics</h3>
        <div className="flex gap-1">
          {mockCards.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Swipeable Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${-currentIndex * 100 + (isDragging ? (dragOffset / window.innerWidth) * 100 : 0)}%)`
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {mockCards.map((card) => (
            <div key={card.id} className="w-full flex-shrink-0 px-1">
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        {card.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{card.title}</h4>
                        <p className="text-xs text-gray-600">{card.description}</p>
                      </div>
                    </div>
                    {getStatusIcon(card.status)}
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(card.trend)}
                        <span className={`text-xs font-medium ${
                          card.trend === 'up' ? 'text-green-600' : 
                          card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {card.change}
                        </span>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(card.status)}>
                      {card.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Hints */}
      <div className="flex justify-center mt-3">
        <p className="text-xs text-gray-500">← Deslize para navegar →</p>
      </div>
    </div>
  );
};

export default SwipeableCards;
