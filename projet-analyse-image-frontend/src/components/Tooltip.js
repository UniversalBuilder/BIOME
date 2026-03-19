import React, { useState, useEffect, useRef, Children } from 'react';

// Tooltip built with plain state — no Headless UI Popover.
//
// Using Headless UI's Popover here caused a critical regression: Popover.Button
// installs a document-level mousedown listener when "open" to detect outside
// clicks. Because the Modal renders via a React portal at document.body, every
// click inside the modal looked like an "outside click" to Headless UI, which
// intercepted the mousedown and returned focus to the trigger button — making
// all modal inputs, selects and buttons unclickable.

const HOVER_DELAY = 500;

export function Tooltip({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const [triggerElement, panelContent] = Children.toArray(children).reduce(
    ([trigger, panel], child) => {
      if (child.type === TooltipTrigger) return [child, panel];
      if (child.type === TooltipPanel) return [trigger, child];
      return [trigger, panel];
    },
    [null, null]
  );

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.height + 5, left: rect.width / 2 });
    timeoutRef.current = setTimeout(() => setIsVisible(true), HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {triggerElement?.props.children}

      {isVisible && panelContent && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
            {panelContent.props.children}
          </div>
        </div>
      )}
    </div>
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