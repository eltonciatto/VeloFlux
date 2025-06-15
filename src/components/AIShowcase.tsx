import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  ArrowRight,
  Sparkles,
  LineChart,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIShowcase = () => {
  const navigate = useNavigate();

  const aiCapabilities = [
    {
      icon: Brain,
      title: "Intelligent Routing",
      description: "ML algorithms analyze real-time performance metrics to automatically route traffic to the optimal backend",
      benefit: "Up to 40% better response times",
      color: "purple"
    },
    {
      icon: TrendingUp,
      title: "Predictive Scaling",
      description: "AI forecasts traffic patterns and recommends scaling actions before demand spikes occur",
      benefit: "Prevent 95% of capacity issues",
      color: "blue"
    },
    {
      icon: AlertTriangle,
      title: "Anomaly Detection",
      description: "Real-time pattern recognition identifies unusual behavior and potential security threats",
      benefit: "Detect issues 80% faster",
      color: "orange"
    },
    {
      icon: Target,
      title: "Auto-Optimization",
      description: "Continuous AI analysis provides configuration recommendations for optimal performance",
      benefit: "Reduce manual tuning by 90%",
      color: "green"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: {
        bg: "bg-slate-800/90",
        border: "border-purple-400/70",
        icon: "text-purple-400",
        badge: "bg-purple-600/50 text-purple-100 border-purple-400/80"
      },
      blue: {
        bg: "bg-slate-800/90",
        border: "border-blue-400/70",
        icon: "text-blue-400",
        badge: "bg-blue-600/50 text-blue-100 border-blue-400/80"
      },
      orange: {
        bg: "bg-slate-800/90",
        border: "border-orange-400/70",
        icon: "text-orange-400",
        badge: "bg-orange-600/50 text-orange-100 border-orange-400/80"
      },
      green: {
        bg: "bg-slate-800/90",
        border: "border-green-400/70",
        icon: "text-green-400",
        badge: "bg-green-600/50 text-green-100 border-green-400/80"
      }
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,69,19,0.1),transparent_50%)]"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by Artificial Intelligence
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            AI That Actually{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Experience the future of load balancing with AI that learns, predicts, and optimizes your infrastructure automatically
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {aiCapabilities.map((capability, index) => {
            const colors = getColorClasses(capability.color);
            return (
              <Card 
                key={index} 
                className={`${colors.bg} ${colors.border} backdrop-blur-sm p-8 hover:scale-105 hover:border-opacity-100 transition-all duration-300 group shadow-xl`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <capability.icon className={`w-12 h-12 ${colors.icon} group-hover:scale-110 transition-transform duration-300`} />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-3">{capability.title}</h3>
                    <p className="text-slate-200 leading-relaxed">{capability.description}</p>
                  </div>
                </div>
                
                <Badge className={`${colors.badge} text-sm font-semibold px-3 py-1 inline-flex items-center rounded-full`}>
                  <Zap className="w-3 h-3 mr-1" />
                  {capability.benefit}
                </Badge>
              </Card>
            );
          })}
        </div>

        {/* Live Demo Section */}
        <div className="bg-slate-800/90 border-2 border-purple-400/70 rounded-2xl p-8 text-center shadow-2xl">
          <div className="mb-6">
            <LineChart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-4">
              See AI in Action
            </h3>
            <p className="text-slate-100 text-lg max-w-2xl mx-auto">
              Experience real-time AI decision making with our interactive dashboard. 
              Watch as machine learning algorithms optimize your traffic routing in real-time.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
              onClick={() => navigate('/dashboard')}
            >
              <Brain className="w-5 h-5 mr-2" />
              Launch AI Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              className="border-2 border-purple-400/70 text-purple-100 hover:bg-purple-600/40 bg-slate-800/70 px-8 py-3 text-lg font-semibold"
              onClick={() => window.open('https://veloflux.io/docs/ai-features', '_blank')}
            >
              Learn More About AI
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
