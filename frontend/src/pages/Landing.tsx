import React, { useEffect } from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { Hero } from '../components/landing/Hero';
import { Ticker } from '../components/landing/Ticker';
import { PinnedStory } from '../components/landing/PinnedStory';
import { Bento } from '../components/landing/Bento';
import { Playground } from '../components/landing/Playground';
import { Numbers } from '../components/landing/Numbers';
import { Showcase } from '../components/landing/Showcase';
import { Faq } from '../components/landing/Faq';
import { FinalCta } from '../components/landing/FinalCta';
import { LandingFooter } from '../components/landing/LandingFooter';
export const Landing: React.FC = () => {

  // Global listener for `.spot` cards to drive cursor spotlight custom props
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest('.spot') as HTMLElement | null;
      if (target) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        target.style.setProperty('--my', `${e.clientY - rect.top}px`);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <div className="landing-page" id="main-content">
      <SeoHead
        title="Not From Here"
        description="A four-rule decision gate for reporting invasive species in Ontario. Vision models propose; fixed rules decide."
      />
      <Hero />
      <Ticker />
      <PinnedStory />
      <Bento />
      <Playground />
      <Numbers />
      <Showcase />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </div>
  );
};

export default Landing;
