import { useState, useEffect } from 'react';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_SCALE: Record<TextSize, number> = {
  xs: 85,
  sm: 92,
  md: 100,
  lg: 112,
  xl: 125,
};

const SIZE_LABELS: Record<TextSize, string> = {
  xs: 'Smallest',
  sm: 'Small',
  md: 'Default',
  lg: 'Large',
  xl: 'Largest',
};

const SIZES: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

function applyTextSize(size: TextSize) {
  document.documentElement.style.setProperty('--font-scale', `${SIZE_SCALE[size]}%`);
}

export function useTextSize() {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('textSize') as TextSize | null;
      if (stored && SIZE_SCALE[stored] !== undefined) return stored;
    }
    return 'md';
  });

  useEffect(() => {
    applyTextSize(textSize);
    localStorage.setItem('textSize', textSize);
  }, [textSize]);

  // Apply on first mount (before first render cycle completes)
  useEffect(() => {
    applyTextSize(textSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const increaseSize = () => {
    setTextSizeState((prev) => {
      const idx = SIZES.indexOf(prev);
      return idx < SIZES.length - 1 ? SIZES[idx + 1] : prev;
    });
  };

  const decreaseSize = () => {
    setTextSizeState((prev) => {
      const idx = SIZES.indexOf(prev);
      return idx > 0 ? SIZES[idx - 1] : prev;
    });
  };

  const resetSize = () => setTextSizeState('md');

  const canIncrease = textSize !== 'xl';
  const canDecrease = textSize !== 'xs';
  const label = SIZE_LABELS[textSize];
  const isDefault = textSize === 'md';

  return {
    textSize,
    label,
    isDefault,
    canIncrease,
    canDecrease,
    increaseSize,
    decreaseSize,
    resetSize,
  };
}
