
import React from 'react';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { AIShowcase } from '@/components/AIShowcase';
import { Architecture } from '@/components/Architecture';
import { QuickStart } from '@/components/QuickStart';
import { Performance } from '@/components/Performance';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Hero />
      <Features />
      <AIShowcase />
      <Architecture />
      <QuickStart />
      <Performance />
      <Footer />
    </div>
  );
};

export default Index;
