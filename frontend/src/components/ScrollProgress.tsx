import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ScrollProgress: React.FC = () => {
  const { t } = useTranslation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const sections = useMemo(() => [
    { id: 'hero', label: t('scrollProgress.sections.hero') },
    { id: 'features', label: t('scrollProgress.sections.features') },
    { id: 'ai-showcase', label: t('scrollProgress.sections.aiShowcase') },
    { id: 'demo', label: t('scrollProgress.sections.demo') },
    { id: 'architecture', label: t('scrollProgress.sections.architecture') },
    { id: 'quickstart', label: t('scrollProgress.sections.quickstart') },
    { id: 'performance', label: t('scrollProgress.sections.performance') },
    { id: 'conclusion', label: t('scrollProgress.sections.conclusion') }
  ], [t]);

  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY;
    setIsVisible(scrolled > 100);

    // Determinar seção ativa
    const sectionElements = sections.map(section => 
      document.getElementById(section.id)
    ).filter(Boolean);

    const currentSection = sectionElements.findIndex((element, index) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const nextElement = sectionElements[index + 1];
      
      if (nextElement) {
        const nextRect = nextElement.getBoundingClientRect();
        return rect.top <= window.innerHeight / 2 && nextRect.top > window.innerHeight / 2;
      }
      
      return rect.top <= window.innerHeight / 2;
    });

    if (currentSection !== -1) {
      setActiveSection(currentSection);
    }
  }, [sections]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 z-50 origin-left"
        style={{ scaleX }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Floating Navigation Dots */}
      <motion.div
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 space-y-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            className={`relative w-3 h-3 rounded-full transition-all duration-300 backdrop-blur-sm border group ${
              activeSection === index 
                ? 'bg-cyan-400 border-cyan-400/50 scale-125' 
                : 'bg-white/20 border-white/10 hover:bg-cyan-400/50'
            }`}
            whileHover={{ scale: activeSection === index ? 1.25 : 1.5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const element = document.getElementById(section.id);
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {/* Tooltip */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap backdrop-blur-sm">
              {section.label}
            </div>
          </motion.button>
        ))}
      </motion.div>
    </>
  );
};

export default ScrollProgress;
