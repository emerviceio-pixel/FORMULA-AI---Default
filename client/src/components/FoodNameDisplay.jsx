import React from 'react';
import { useAutoScale } from '../hooks/useAutoScale';

/**
 * FoodNameDisplay Component
 * 
 * Displays food name with dynamic font scaling to fit within 2 lines.
 * Automatically reduces font size if text exceeds 2 lines.
 * 
 * Props:
 *   - name: string - The food name to display
 *   - variant: 'analyzer' | 'modal' | 'modalMobile' | 'listItem' - Display variant
 *   - className: string - Additional CSS classes
 */
export const FoodNameDisplay = ({ 
  name, 
  variant = 'analyzer',
  className = '',
  minFontSize = 14,
  maxFontSize = 32
}) => {
  const autoScaleRef = useAutoScale({
    maxLines: 2,
    minFontSize,
    maxFontSize,
    lineHeight: 1.3
  });

  const variantStyles = {
    analyzer: 'text-2xl font-bold text-white',
    modal: 'text-2xl lg:text-3xl font-bold text-white',
    modalMobile: 'text-2xl lg:text-3xl font-bold text-white',
    listItem: 'text-sm font-medium text-white/90',
  };

  const baseClasses = variantStyles[variant] || variantStyles.analyzer;

  return (
    <div
      ref={autoScaleRef}
      className={`
        line-clamp-2
        overflow-hidden
        break-words
        ${baseClasses}
        ${className}
      `}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
        wordBreak: 'break-word'
      }}
    >
      {name}
    </div>
  );
};

export default FoodNameDisplay;
