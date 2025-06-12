
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
  Globe
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
              Join thousands of developers building reliable, scalable infrastructure
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
            <Button variant="outline" className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20 px-6 py-3">
              <Download className="w-5 h-5 mr-2" />
              Download Release
            </Button>
            <Button variant="outline" className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20 px-6 py-3">
              <BookOpen className="w-5 h-5 mr-2" />
              Documentation
            </Button>
          </div>

          <div className="flex justify-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200">1.2k stars</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <span className="text-blue-200">25k+ downloads</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-blue-200">Active community</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-2 text-blue-200">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                High Performance
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Security First
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Global Scale
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Documentation</h3>
            <ul className="space-y-2 text-blue-200">
              <li><a href="#" className="hover:text-white transition-colors">Quick Start</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Configuration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-blue-200">
              <li><a href="#" className="hover:text-white transition-colors">GitHub Issues</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Stack Overflow</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contributing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-blue-200">
              <li><a href="#" className="hover:text-white transition-colors">Benchmarks</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Best Practices</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Migration Guide</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                VeloFlux LB
              </div>
              <Badge className="bg-blue-100/10 text-blue-300">v1.0.0</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-blue-200">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span>for the open source community</span>
            </div>
            
            <div className="text-blue-200 text-sm">
              © 2024 VeloFlux LB. MIT License.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
