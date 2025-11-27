import React, { useState, useRef, useEffect } from 'react';

/**
 * A container that handles scrolling with visual hints (shadows)
 * when content overflows.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to scroll
 * @param {string} props.className - Additional classes for the outer container
 * @param {string} props.innerClassName - Additional classes for the inner scrollable div
 * @param {Object} props.style - Inline styles for the outer container
 */
const ScrollableContainer = ({ children, className = '', innerClassName = '', style = {} }) => {
  const scrollRef = useRef(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    // Show top shadow if we've scrolled down
    setShowTopShadow(scrollTop > 0);
    // Show bottom shadow if we haven't reached the bottom (with small tolerance)
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    // Also check when children change (content updates)
    const timeoutId = setTimeout(checkScroll, 100);
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeoutId);
    };
  }, [children]);

  return (
    <div className={`relative flex-1 min-h-0 flex flex-col ${className}`} style={style}>
      {/* Top Shadow Hint */}
      <div 
        className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/10 to-transparent dark:from-black/40 z-10 pointer-events-none transition-opacity duration-300 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex-1 overflow-y-auto ${innerClassName}`}
      >
        {children}
      </div>

      {/* Bottom Shadow Hint */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent dark:from-black/40 z-10 pointer-events-none transition-opacity duration-300 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} 
      />
    </div>
  );
};

export default ScrollableContainer;
