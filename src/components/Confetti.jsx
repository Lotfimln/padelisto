import { useEffect, useRef } from 'react';

const COLORS = [
  '#4ade80', '#38bdf8', '#fbbf24', '#f472b6',
  '#a78bfa', '#fb923c', '#34d399', '#60a5fa',
  '#facc15', '#f87171', '#818cf8', '#2dd4bf',
];

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = -10 - Math.random() * this.canvas.height;
    this.size = 4 + Math.random() * 6;
    this.speedY = 2 + Math.random() * 3;
    this.speedX = (Math.random() - 0.5) * 3;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.opacity = 1;
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.rotation += this.rotationSpeed;
    this.speedY += 0.05; // gravity
    this.speedX *= 0.99; // friction
    this.opacity -= 0.003;

    if (this.y > this.canvas.height + 20 || this.opacity <= 0) {
      this.opacity = 0;
    }
  }

  draw(ctx) {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;

    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default function Confetti({ active = true, duration = 5000 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const particles = Array.from({ length: 80 }, () => new Particle({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let anyAlive = false;
      for (const particle of particles) {
        particle.update();
        particle.draw(ctx);
        if (particle.opacity > 0) anyAlive = true;
      }

      if (anyAlive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, duration]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
    />
  );
}
