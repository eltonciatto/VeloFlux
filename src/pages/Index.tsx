import React from 'react';
import { motion } from 'framer-motion';
import ImmersiveHero from '@/components/ImmersiveHero';
import { Features } from '@/components/Features';
import { AIShowcase } from '@/components/AIShowcase';
import LiveDemoSection from '@/components/LiveDemoSection';
import { Architecture } from '@/components/Architecture';
import { QuickStart } from '@/components/QuickStart';
import { Performance } from '@/components/Performance';
import { Conclusion } from '@/components/Conclusion';
import { Footer } from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import FloatingParticles from '@/components/FloatingParticles';
import CustomCursor from '@/components/CustomCursor';
import StarField from '@/components/StarField';
import TranslationTest from '@/components/TranslationTest';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 scroll-smooth relative overflow-hidden md:cursor-none">
      <StarField />
      <div className="hidden md:block">
        <CustomCursor />
      </div>
      <FloatingParticles />
      <ScrollProgress />
      
      <div id="hero" className="relative z-20">
        <ImmersiveHero />
      </div>
      
      <motion.div
        id="features"
        className="relative z-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Features />
      </motion.div>

      <motion.div
        id="ai-showcase"
        className="relative z-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <AIShowcase />
      </motion.div>

      <div id="demo" className="relative z-20">
        <LiveDemoSection />
      </div>

      <motion.div
        id="architecture"
        className="relative z-20"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Architecture />
      </motion.div>

      <motion.div
        id="quickstart"
        className="relative z-20"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <QuickStart />
      </motion.div>

      <motion.div
        id="performance"
        className="relative z-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Performance />
      </motion.div>

      <motion.div
        id="conclusion"
        className="relative z-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Conclusion />
      </motion.div>

      <div className="relative z-20">
        <Footer />
      </div>
      
      <TranslationTest />

    </div>
  );
};

export default Index;
