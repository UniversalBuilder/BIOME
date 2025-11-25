import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Show button when page is scrolled down
  const toggleVisibility = (e) => {
    // Check window scroll
    if (window.scrollY > 300 || document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
      setIsVisible(true);
      return;
    }
    
    // Check event target scroll if available
    if (e && e.target && e.target.scrollTop !== undefined) {
      if (e.target.scrollTop > 300) {
        setIsVisible(true);
        return;
      }
    }
    
    // Check any overflow-auto element
    const scrollableElements = document.querySelectorAll('.overflow-auto');
    let anyScrolled = false;
    scrollableElements.forEach(el => {
      if (el.scrollTop > 300) anyScrolled = true;
    });
    
    if (anyScrolled) {
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
    // Add scroll event listener to window
    window.addEventListener('scroll', toggleVisibility);
    
    // Find scrollable containers and add event listeners to them
    // We need a small delay to ensure DOM is updated after route change
    const timer = setTimeout(() => {
      const scrollableElements = document.querySelectorAll('.overflow-auto');
      scrollableElements.forEach(element => {
        element.addEventListener('scroll', toggleVisibility);
      });
    }, 500);
    
    return () => {
      // Clean up
      window.removeEventListener('scroll', toggleVisibility);
      clearTimeout(timer);
      
      const scrollableElements = document.querySelectorAll('.overflow-auto');
      scrollableElements.forEach(element => {
        element.removeEventListener('scroll', toggleVisibility);
      });
    };
  }, [location.pathname]); // Re-run when route changes

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
