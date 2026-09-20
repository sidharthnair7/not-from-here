import React from 'react';
import MoltenMetal from '../MoltenMetal/MoltenMetal';

export const GlobalMoltenBackground: React.FC = () => {
  return (
    <div
      className="global-molten-bg"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <MoltenMetal
        color1="#07101f"
        color2="#144637"
        color3="#7292eb"
        speed={0.15}
        scale={3.2}
        detail={3}
        glow={1.25}
        coreSize={0.08}
        swirl={0.85}
        fold={-0.18}
        blackPoint={0.08}
        brightness={1.15}
        colorMode="molten"
        grain={true}
        grainIntensity={0.035}
        mouseInteraction={true}
        mouseStrength={0.25}
        opacity={0.28}
        backgroundColor="#080b10"
        globalMouse={true}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default GlobalMoltenBackground;
