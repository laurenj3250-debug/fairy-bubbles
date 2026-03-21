import { useEffect, useRef } from 'react';

interface SundownStardustRingProps {
  percentage: number;
}

function drawStardustRing(
  canvas: HTMLCanvasElement,
  litCount: number,
  totalCount: number,
  radius: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = radius; // radius in canvas space

  ctx.clearRect(0, 0, w, h);

  const dots: Array<{ x: number; y: number; lit: boolean }> = [];
  for (let i = 0; i < totalCount; i++) {
    const angle = (i / totalCount) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const lit = i < litCount;
    dots.push({ x, y, lit });
  }

  // Constellation lines between adjacent lit dots
  ctx.strokeStyle = 'rgba(225,164,92,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < dots.length; i++) {
    const next = (i + 1) % dots.length;
    if (dots[i].lit && dots[next].lit) {
      ctx.beginPath();
      ctx.moveTo(dots[i].x, dots[i].y);
      ctx.lineTo(dots[next].x, dots[next].y);
      ctx.stroke();
    }
  }

  // Draw dots
  dots.forEach((d) => {
    if (d.lit) {
      // Outer glow
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, 8);
      grad.addColorStop(0, 'rgba(225,164,92,0.5)');
      grad.addColorStop(0.5, 'rgba(225,164,92,0.15)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = 'rgba(255,220,160,0.9)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(169,130,106,0.2)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function SundownStardustRing({ percentage }: SundownStardustRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalDots = 24;
  const litDots = Math.round((percentage / 100) * totalDots);

  useEffect(() => {
    if (canvasRef.current) {
      drawStardustRing(canvasRef.current, litDots, totalDots, 48);
    }
  }, [litDots]);

  return (
    <div className="sd-shell" style={{ animationDelay: '1.5s' }}>
      <div className="sd-face">
        <div className="sd-card-hdr">
          <span className="sd-card-title">Progress</span>
        </div>
        <div className="sd-ring-wrap">
          <div className="sd-ring-container">
            <canvas ref={canvasRef} width={240} height={240} />
            <div className="sd-ring-center">
              <div className="sd-ring-pct">{percentage}%</div>
              <div className="sd-ring-label">This Week</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
