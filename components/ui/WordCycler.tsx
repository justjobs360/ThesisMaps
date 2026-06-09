'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordCyclerProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function WordCycler({ words, interval = 3000, className = '' }: WordCyclerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span className={`relative inline-flex flex-col h-[1.2em] overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.23, 1, 0.32, 1] 
          }}
          className="whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
