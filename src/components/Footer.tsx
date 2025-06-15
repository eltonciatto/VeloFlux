
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Star, 
  Download, 
  BookOpen, 
  MessageCircle,
  Heart,
  Zap,
  Shield,
  Globe,
  Brain,
  ExternalLink
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-20 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Deploy VeloFlux LB?
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Join thousands of developers building reliable, AI-powered infrastructure
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              onClick={() => window.open('https://github.com/eltonciatto/VeloFlux', '_blank')}
            >
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20 px-6 py-3"
              onClick={() => window.open('https://github.com/eltonciatto/VeloFlux/releases', '_blank')}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Release
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20 px-6 py-3"
              onClick={() => window.open('https://veloflux.io/docs', '_blank')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Documentation
            </Button>
            <Button 
              variant="outline" 
              className="border-purple-400/50 text-purple-100 hover:bg-purple-600/20 px-6 py-3"
              onClick={() => window.open('https://veloflux.io', '_blank')}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Official Website
            </Button>
          </div>

          <div className="flex justify-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200">1.2k+ stars</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <span className="text-blue-200">25k+ downloads</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-blue-200">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-blue-200">Active community</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">AI/ML Features</h3>
            <ul className="space-y-2 text-blue-200">
              <li className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Intelligent Routing
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Predictive Analytics
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Anomaly Detection
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Documentation</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <a 
                  href="https://veloflux.io/docs/quickstart" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Quick Start
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/ai-features" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  AI/ML Guide
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/configuration" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Configuration
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <a 
                  href="https://github.com/eltonciatto/VeloFlux/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub Issues
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/veloflux" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a 
                  href="https://stackoverflow.com/questions/tagged/veloflux" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Stack Overflow
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/eltonciatto/VeloFlux/blob/main/CONTRIBUTING.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Contributing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <a 
                  href="https://veloflux.io/benchmarks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Benchmarks
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/best-practices" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Best Practices
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Security Guide
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/migration" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Migration Guide
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                VeloFlux LB
              </div>
              <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-purple-400/30">
                v0.0.6 - AI Edition
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-blue-200">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span>and AI</span>
              <Brain className="w-4 h-4 text-purple-400" />
              <span>for the open source community</span>
            </div>
            
            <div className="text-blue-200 text-sm">
              © 2025 VeloFlux LB. VeloFlux Custom License.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
