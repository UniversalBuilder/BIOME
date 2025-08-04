import React, { useState, useEffect } from 'react';

const ScrollTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 0 || document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Also handle scrolling for elements with overflow
    const scrollableElements = document.querySelectorAll('.overflow-auto');
    scrollableElements.forEach(element => {
      element.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  };

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener('scroll', toggleVisibility);
    
    // Find scrollable containers and add event listeners to them
    const scrollableElements = document.querySelectorAll('.overflow-auto');
    scrollableElements.forEach(element => {
      element.addEventListener('scroll', toggleVisibility);
    });
    
    return () => {
      // Clean up
      window.removeEventListener('scroll', toggleVisibility);
      
      const scrollableElements = document.querySelectorAll('.overflow-auto');
      scrollableElements.forEach(element => {
        element.removeEventListener('scroll', toggleVisibility);
      });
    };
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-24 right-8 z-[60] btn btn-sm btn-icon rounded-full transition-all duration-300 ${
        isVisible ? 'scale-100' : 'scale-0'
      }`}
      style={{
        background: 'linear-gradient(45deg, #00F7FF, #4DB4FF)',
        color: 'white',
        border: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}
      aria-label="Scroll to top"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 10l7-7m0 0l7 7m-7-7v18" 
        />
      </svg>
    </button>
  );
};

export default ScrollTopButton;
