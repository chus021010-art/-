import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BlockProps {
  x: number;
  y: number;
  onClick: () => void;
  flowerType?: string | null;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

export const Block: React.FC<BlockProps> = ({ x, y, onClick, flowerType }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Trigger particles when flowerType changes
  useEffect(() => {
    if (flowerType !== undefined) {
      const newParticles = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 800);
      return () => clearTimeout(timer);
    }
  }, [flowerType]);

  return (
    <div
      className="relative w-[60px] h-[60px] cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        transformStyle: 'preserve-3d',
        position: 'absolute',
        left: x * 75, // Increased spacing for manor decorations
        top: y * 75,
      }}
      onClick={onClick}
    >
      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: p.x, y: p.y - 40, scale: 0, opacity: 0 }}
            className="sparkle"
            style={{ left: '50%', top: '50%' }}
          />
        ))}
      </AnimatePresence>

      {/* Soft Rounded Mound */}
      <div 
        className="absolute inset-0 rounded-2xl shadow-lg transition-all duration-500"
        style={{ 
          transform: 'translateZ(0px)',
          background: flowerType 
            ? 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)' 
            : 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: flowerType ? '0 0 20px rgba(85, 239, 196, 0.4)' : 'none'
        }}
      >
        {/* Magical Sparkles (Static) */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '15px 15px'
        }} />
        
        {/* Flower Rendering */}
        <AnimatePresence mode="wait">
          {flowerType && (
            <motion.div
              key={flowerType}
              initial={{ scale: 0, y: 30, rotateY: 0 }}
              animate={{ scale: 1, y: 0, rotateY: 360 }}
              exit={{ scale: 0, y: -20, opacity: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 15, 
                rotateY: { duration: 4, repeat: Infinity, ease: "linear" } 
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: 'translateZ(25px) rotateX(-45deg)' }}
            >
              <FlowerModel type={flowerType} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side Depth */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-40" 
        style={{ 
          transform: 'translateZ(-15px)', 
          background: '#1b4d3e',
          filter: 'blur(6px)'
        }} 
      />
    </div>
  );
};

const FlowerModel: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, { petal: string, center: string, highlight: string }> = {
    red: { petal: 'linear-gradient(135deg, #ff7675, #d63031)', center: '#feca57', highlight: '#ff9f43' },
    yellow: { petal: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)', center: '#ff9f43', highlight: '#fff' },
    blue: { petal: 'linear-gradient(135deg, #74b9ff, #0984e3)', center: '#55efc4', highlight: '#81ecec' },
    white: { petal: 'linear-gradient(135deg, #ffffff, #dfe6e9)', center: '#fdcb6e', highlight: '#fff' },
    purple: { petal: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', center: '#ff7675', highlight: '#ef5777' }
  };

  const current = colors[type] || colors.red;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center magical-glow">
      {/* Leaves on the stem */}
      <div className="absolute w-full h-full pointer-events-none" style={{ transform: 'translateY(15px) rotateX(45deg)' }}>
        <motion.div 
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1 w-4 h-2 bg-[#2ecc71] rounded-full" 
          style={{ transform: 'rotate(-30deg) translateX(-8px)' }} 
        />
        <motion.div 
          animate={{ rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute right-1 w-4 h-2 bg-[#27ae60] rounded-full" 
          style={{ transform: 'rotate(30deg) translateX(8px)' }} 
        />
      </div>

      {/* Petals - Layered for volume */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <React.Fragment key={deg}>
          {/* Back Layer Petal */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [deg, deg + 2, deg] }}
            transition={{ duration: 3, repeat: Infinity, delay: deg / 360 }}
            className="absolute w-6 h-10 rounded-full opacity-80"
            style={{
              background: current.petal,
              transform: `rotate(${deg}deg) translateY(-14px) scale(1.1)`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              filter: 'brightness(0.9)'
            }}
          />
          {/* Front Layer Petal */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: deg / 360 }}
            className="absolute w-5 h-9 rounded-full z-10"
            style={{
              background: current.petal,
              transform: `rotate(${deg}deg) translateY(-12px)`,
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 2px 5px rgba(0,0,0,0.1)',
              border: '1.5px solid rgba(255,255,255,0.2)'
            }}
          >
            {/* Glossy highlight on petal */}
            <div className="absolute top-1 left-1 w-1.5 h-3 bg-white/30 rounded-full blur-[1px]" />
          </motion.div>
        </React.Fragment>
      ))}

      {/* Center of the flower (Stamen) */}
      <div className="relative z-20 flex items-center justify-center">
        <div 
          className="w-6 h-6 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, ${current.highlight}, ${current.center})`,
            border: '2px solid rgba(255,255,255,0.5)'
          }}
        >
          {/* Tiny texture dots for the center */}
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)',
            backgroundSize: '4px 4px'
          }} />
        </div>
        {/* Extra highlight on center */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white/40 rounded-full blur-[0.5px]" />
      </div>

      {/* Stem - More detailed 3D look */}
      <div 
        className="absolute w-2.5 h-20 rounded-full"
        style={{ 
          background: 'linear-gradient(to right, #27ae60, #2ecc71, #27ae60)',
          transform: 'translateY(25px) rotateX(45deg)',
          zIndex: -1,
          boxShadow: '4px 4px 10px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      />
    </div>
  );
};
