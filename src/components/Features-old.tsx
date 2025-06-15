
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Globe, 
  Activity, 
  Lock, 
  BarChart3,
  Cpu,
  Network,
  Timer,
  GitBranch,
  Brain,
  TrendingUp,
  AlertTriangle,
  Target
} from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Routing",
      description: "Machine learning algorithms automatically select optimal backends based on real-time performance metrics and predictive analytics",
      badges: ["ML Routing", "Smart Selection", "Auto-optimize"],
      category: "ai"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "AI-driven traffic forecasting and capacity planning with early spike detection and automated scaling recommendations",
      badges: ["Traffic Prediction", "Capacity Planning", "Forecasting"],
      category: "ai"
    },
    {
      icon: AlertTriangle,
      title: "Anomaly Detection",
      description: "Real-time detection of unusual patterns, performance anomalies, and potential security threats using advanced ML models",
      badges: ["Real-time", "Pattern Detection", "Security"],
      category: "ai"
    },
    {
      icon: Target,
      title: "Performance Optimization",
      description: "AI-generated configuration recommendations and automated tuning for optimal load balancing performance",
      badges: ["Auto-tune", "Recommendations", "Optimization"],
      category: "ai"
    },
    {
      icon: Shield,
      title: "SSL/TLS Termination",
      description: "Automatic ACME certificates with Let's Encrypt, HTTP/2 & HTTP/3 support, SNI routing",
      badges: ["TLS 1.3", "HTTP/3", "ACME"],
      category: "core"
    },
    {
      icon: Activity,
      title: "Health Monitoring",
      description: "Active HTTP/TCP health checks, passive failure detection, exponential backoff retry",
      badges: ["Active", "Passive", "Auto-heal"],
      category: "core"
    },
    {
      icon: Globe,
      title: "Geo-Aware Routing",
      description: "Route traffic to nearest healthy backend using MaxMind GeoIP, anycast support",
      badges: ["GeoIP", "Anycast", "Proximity"],
      category: "core"
    },
    {
      icon: BarChart3,
      title: "Load Balancing",
      description: "Round-robin, least-connections, IP-hash, weighted backends with sticky sessions",
      badges: ["Multiple Algorithms", "Sticky Sessions", "Weighted"],
      category: "core"
    },
    {
      icon: Network,
      title: "Protocol Support",
      description: "WebSocket pass-through, gRPC proxying, HTTP/1.1, HTTP/2, HTTP/3 (QUIC)",
      badges: ["WebSocket", "gRPC", "QUIC"],
      category: "core"
    },
    {
      icon: Lock,
      title: "Security Features",
      description: "Rate limiting, WAF integration hooks, mTLS upstream, IP allowlisting",
      badges: ["Rate Limiting", "WAF", "mTLS"],
      category: "core"
    },
    {
      icon: Cpu,
      title: "High Performance",
      description: "Handle 100k+ concurrent connections on 2 vCPU, optimized for cloud workloads",
      badges: ["100k Conn", "Low Latency", "Optimized"],
      category: "core"
    },
    {
      icon: GitBranch,
      title: "Cloud Native",
      description: "Docker native, stateless design, Kubernetes ready, horizontal scaling",
      badges: ["Docker", "K8s", "Stateless"],
      category: "core"
    }
  ];
      icon: Lock,
      title: "Security Features",
      description: "Rate limiting, WAF integration hooks, mTLS upstream, IP allowlisting",
      badges: ["Rate Limiting", "WAF", "mTLS"]
    },
    {
      icon: Cpu,
      title: "High Performance",
      description: "Handle 100k+ concurrent connections on 2 vCPU, optimized for cloud workloads",
      badges: ["100k Conn", "Low Latency", "Optimized"]
    },
    {
      icon: Timer,
      title: "Zero Downtime",
      description: "Graceful shutdowns, rolling updates, hot config reload without connection drops",
      badges: ["Hot Reload", "Graceful", "Rolling"]
    },
    {
      icon: GitBranch,
      title: "Cloud Native",
      description: "Docker native, stateless design, Kubernetes ready, horizontal scaling",
      badges: ["Docker", "K8s", "Stateless"]
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Enterprise-Grade Features
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Built from the ground up for modern cloud infrastructure with production-tested reliability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm p-6 hover:bg-white/10 transition-all duration-300 group">
              <div className="mb-4">
                <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{feature.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {feature.badges.map((badge, badgeIndex) => (
                  <Badge 
                    key={badgeIndex} 
                    variant="secondary" 
                    className="bg-blue-100/10 text-blue-300 border-blue-400/30 text-xs"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
