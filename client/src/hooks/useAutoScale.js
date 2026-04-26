import { useEffect, useRef } from 'react';

/**
 * Hook for dynamically scaling text to fit within a maximum number of lines.
 * 
 * Usage:
 *   const ref = useAutoScale({ maxLines: 2, minFontSize: 12, maxFontSize: 32 });
 *   <div ref={ref} style={{ lineHeight: '1.4' }}>Long text</div>
 */
export const useAutoScale = ({
  maxLines = 2,
  minFontSize = 12,
  maxFontSize = 32,
  lineHeight = 1.4
} = {}) => {
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const adjustFontSize = () => {
      const computedStyle = window.getComputedStyle(element);
      const currentFontSize = parseFloat(computedStyle.fontSize);
      const currentLineHeight = parseFloat(computedStyle.lineHeight) || 
                               (currentFontSize * lineHeight);
      
      const maxHeight = currentLineHeight * maxLines;
      
      // Check if content overflows
      if (element.scrollHeight > maxHeight + 2) { // +2px tolerance
        // Content overflows - reduce font size
        const newFontSize = Math.max(minFontSize, currentFontSize - 1);
        if (newFontSize > minFontSize) {
          element.style.fontSize = `${newFontSize}px`;
          // Check again after resize
          setTimeout(adjustFontSize, 0);
        }
      } else if (element.scrollHeight < maxHeight - (currentLineHeight * 0.5)) {
        // Content has plenty of space - try to increase font size
        const newFontSize = Math.min(maxFontSize, currentFontSize + 0.5);
        if (newFontSize < maxFontSize) {
          element.style.fontSize = `${newFontSize}px`;
          // Check again after resize
          setTimeout(adjustFontSize, 0);
        }
      }
    };

    // Initial adjustment
    adjustFontSize();

    // Observer for container resize
    resizeObserverRef.current = new ResizeObserver(() => {
      adjustFontSize();
    });

    resizeObserverRef.current.observe(element);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [maxLines, minFontSize, maxFontSize, lineHeight]);

  return containerRef;
};

export default useAutoScale;
