import React, { useState, useEffect, Children } from 'react';
import { Popover } from '@headlessui/react';

const HOVER_DELAY = 500; // 500ms delay before showing tooltip

export function Tooltip({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Find the trigger and panel content from children
  const [triggerElement, panelContent] = Children.toArray(children).reduce(
    ([trigger, panel], child) => {
      if (child.type === TooltipTrigger) return [child, panel];
      if (child.type === TooltipPanel) return [trigger, child];
      return [trigger, panel];
    },
    [null, null]
  );

  const handleMouseEnter = (e) => {
    const targetRect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: targetRect.height + 5,
      left: targetRect.width / 2
    });
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, HOVER_DELAY);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <Popover className="relative">
      {() => (
        <div 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Popover.Button as="div" className="outline-none">
            {triggerElement?.props.children}
          </Popover.Button>

          {isVisible && panelContent && (
            <Popover.Panel 
              static 
              className="absolute z-50"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
                {panelContent.props.children}
              </div>
            </Popover.Panel>
          )}
        </div>
      )}
    </Popover>
  );
}

export function TooltipTrigger({ children, asChild }) {
  return children;
}

export function TooltipPanel({ children }) {
  return children;
}

Tooltip.Trigger = TooltipTrigger;
Tooltip.Panel = TooltipPanel;

export default Tooltip;