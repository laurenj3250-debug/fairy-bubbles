import { useEffect, useRef } from 'react';

export function SundownLandscape() {
  const particlesRef = useRef<HTMLDivElement>(null);

  // Generate 60 fireflies on mount
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    // Clear any existing particles
    container.innerHTML = '';

    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'sd-particle';
      const size = 1.5 + Math.random() * 2.5;
      const left = Math.random() * 100;
      const bottom = 10 + Math.random() * 55;
      const dur = 8 + Math.random() * 18;
      const delay = Math.random() * 12;
      const opacity = 0.25 + Math.random() * 0.45;
      const anim = Math.random() > 0.4 ? 'sd-float-up' : 'sd-float-up-2';
      const g = 160 + Math.floor(Math.random() * 40);
      const b = 100 + Math.floor(Math.random() * 40);
      const a = 0.4 + Math.random() * 0.3;
      p.style.cssText = `left:${left}%;bottom:${bottom}%;width:${size}px;height:${size}px;opacity:${opacity};animation:${anim} ${dur}s linear ${delay}s infinite;background:rgba(225,${g},${b},${a});`;
      container.appendChild(p);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div className="sd-landscape" />
      <div className="sd-particles" ref={particlesRef} />
      <div className="sd-sun-glow" />
      <div className="sd-lens-flare" />
      <div className="sd-lens-flare-wide" />
    </>
  );
}
