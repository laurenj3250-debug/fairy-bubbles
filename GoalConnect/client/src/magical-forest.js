// Magical Forest Background Script
(function() {
  'use strict';

  // Wait for DOM to be ready
  function init() {
    const canvas = document.getElementById('magical-forest-canvas');
    const container = document.getElementById('magical-forest-container');

    if (!canvas || !container) {
      console.warn('Magical forest elements not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    let particles = [];

    // Set canvas size
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class for canvas particles
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;

        if (this.y < 0) {
          this.y = canvas.height;
          this.x = Math.random() * canvas.width;
        }

        if (this.x < 0 || this.x > canvas.width) {
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        ctx.fillStyle = `rgba(255, 220, 150, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    function initParticles() {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }
    initParticles();
    window.addEventListener('resize', initParticles);

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    }
    animate();

    // Create ambient sparkles (DOM elements)
    function createAmbientSparkle() {
      const sparkleTypes = ['sparkle', 'floating-sparkle', 'pulse-sparkle'];
      const type = sparkleTypes[Math.floor(Math.random() * sparkleTypes.length)];

      const sparkle = document.createElement('div');
      sparkle.className = type;
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';

      container.appendChild(sparkle);

      const duration = type === 'floating-sparkle' ? 6000 :
                      type === 'pulse-sparkle' ? 3000 : 1500;

      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.remove();
        }
      }, duration);
    }

    // Create star sparkle effect
    function createStarSparkle(x, y) {
      for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.animationDelay = (i * 0.1) + 's';

        container.appendChild(sparkle);

        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.remove();
          }
        }, 1500 + (i * 100));
      }
    }

    // Create floating sparkle with custom drift
    function createFloatingSparkle(x, y) {
      const sparkle = document.createElement('div');
      sparkle.className = 'floating-sparkle';
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';

      const driftX = (Math.random() - 0.5) * 200;
      const driftY = (Math.random() - 0.5) * 200 - 100;

      sparkle.style.setProperty('--drift-x', driftX + 'px');
      sparkle.style.setProperty('--drift-y', driftY + 'px');

      container.appendChild(sparkle);

      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.remove();
        }
      }, 6000);
    }

    // Create pulsing sparkles in a specific area
    function createPulsingSparkles() {
      const positions = [
        { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
        { x: window.innerWidth * 0.8, y: window.innerHeight * 0.4 },
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 }
      ];

      positions.forEach(pos => {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        createFloatingSparkle(pos.x + offsetX, pos.y + offsetY);
      });
    }

    // Set up sparkle intervals
    setInterval(createAmbientSparkle, 300);
    setInterval(createPulsingSparkles, 2000);

    // Create initial burst of sparkles
    for (let i = 0; i < 30; i++) {
      setTimeout(createAmbientSparkle, i * 100);
    }

    // Optional: Add sparkles on mouse move (subtle effect)
    let lastSparkleTime = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastSparkleTime > 500) {
        if (Math.random() > 0.7) {
          createFloatingSparkle(e.clientX, e.clientY);
        }
        lastSparkleTime = now;
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
