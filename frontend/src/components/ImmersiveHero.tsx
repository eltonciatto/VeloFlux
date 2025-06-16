import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Github, 
  Play, 
  Zap, 
  Activity,
  Globe,
  Shield,
  Brain,
  Network
} from 'lucide-react';

const ImmersiveHero = () => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const [stats, setStats] = useState([
    { label: '', value: 0, target: 12, suffix: '+' },
    { label: '', value: 0, target: 100000, suffix: '+' },
    { label: '', value: 0, target: 99.9, suffix: '%' },
    { label: '', value: 0, target: 45, suffix: '' },
  ]);

  // Update stats labels when translation changes
  useEffect(() => {
    setStats(prevStats => [
      { ...prevStats[0], label: t('immersiveHero.stats.aiModels') },
      { ...prevStats[1], label: t('immersiveHero.stats.requestsPerSec') },
      { ...prevStats[2], label: t('immersiveHero.stats.mlAccuracy') },
      { ...prevStats[3], label: t('immersiveHero.stats.globalEdge'), suffix: prevStats[3].suffix.includes('+') ? '+' : t('immersiveHero.stats.locations') },
    ]);
  }, [t]);

  const [networkNodes, setNetworkNodes] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      direction: Math.random() * Math.PI * 2,
    }))
  );

  useEffect(() => {
    // Animate stats on mount - after translations are loaded
    const timer = setTimeout(() => {
      setStats(prev => prev.map((stat, index) => {
        const targets = [12, 100000, 99.9, 45];
        return {
          ...stat,
          value: targets[index]
        };
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [t]); // Depend on translations to ensure they're loaded first

  useEffect(() => {
    // Animate network nodes
    const interval = setInterval(() => {
      setNetworkNodes(prev => prev.map(node => ({
        ...node,
        x: (node.x + Math.cos(node.direction) * node.speed) % 100,
        y: (node.y + Math.sin(node.direction) * node.speed) % 100,
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mouseX, mouseY]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
    }
  };

  const floatingVariants: Variants = {
    float: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Dynamic Gradient Background */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 60% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 60% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />

      {/* Animated Network Visualization */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          {/* Connection lines */}
          {networkNodes.map((node, i) => 
            networkNodes.slice(i + 1).map((otherNode, j) => {
              const distance = Math.sqrt(
                Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
              );
              
              if (distance < 30) {
                return (
                  <motion.line
                    key={`${i}-${j}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${otherNode.x}%`}
                    y2={`${otherNode.y}%`}
                    stroke="url(#networkGradient)"
                    strokeWidth="1"
                    opacity={0.6 - distance / 50}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: (i + j) * 0.1
                    }}
                  />
                );
              }
              return null;
            })
          )}

          {/* Network nodes */}
          {networkNodes.map((node) => (
            <motion.circle
              key={node.id}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="url(#nodeGradient)"
              animate={{
                r: [node.size, node.size + 1, node.size],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: node.id * 0.2
              }}
            />
          ))}

          <defs>
            <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <radialGradient id="nodeGradient">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#1e40af" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            animate={{
              x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%'
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1000
        }}
      >
        {/* AI Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-8"
          animate={{
            boxShadow: [
              '0 0 20px rgba(6, 182, 212, 0.3)',
              '0 0 40px rgba(6, 182, 212, 0.5)',
              '0 0 20px rgba(6, 182, 212, 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-5 h-5 text-cyan-400 mr-3" />
          <span className="text-cyan-300 font-semibold">{t('immersiveHero.badge')}</span>
          <motion.div
            className="ml-3 flex space-x-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          </motion.div>
        </motion.div>

        {/* Main Title */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold leading-tight">
            <motion.span 
              className="block bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {t('hero.title')}
            </motion.span>
            <motion.span 
              className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
              variants={floatingVariants}
              animate="float"
            >
              AI-Powered
            </motion.span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: t('hero.description', {
              highlight: '<span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-semibold">AI/ML</span>'
            })
          }}
        />

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/dashboard"
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ x: '-100%' }}
                animate={{ x: isHovered ? '0%' : '-100%' }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center">
                <Play className="w-5 h-5 mr-2" />
                {t('hero.buttons.aiDashboard')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="https://github.com/eltonciatto/veloflux"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-400 hover:text-white transition-all duration-200"
            >
              <Github className="w-5 h-5 mr-2" />
              {t('hero.buttons.github')}
            </a>
          </motion.div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 + index * 0.2, duration: 0.5 }}
            >
              <motion.div 
                className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2"
                animate={{ 
                  textShadow: [
                    '0 0 10px rgba(6, 182, 212, 0.5)',
                    '0 0 20px rgba(6, 182, 212, 0.8)',
                    '0 0 10px rgba(6, 182, 212, 0.5)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 + index * 0.1 }}
                >
                  {stat.value === stat.target ? (
                    `${stat.target.toLocaleString()}${stat.suffix}`
                  ) : (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 + index * 0.2 }}
                    >
                      {Math.floor(stat.value).toLocaleString()}{stat.suffix}
                    </motion.span>
                  )}
                </motion.span>
              </motion.div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ImmersiveHero;
