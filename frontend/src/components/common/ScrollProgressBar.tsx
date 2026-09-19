import React from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';

export const ScrollProgressBar: React.FC = () => {
  const progress = useScrollProgress();

  return (
    <div
      className="scroll-progress-bar"
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  );
};
