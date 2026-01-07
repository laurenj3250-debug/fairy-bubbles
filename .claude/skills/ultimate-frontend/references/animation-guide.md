# Animation Guide

## CSS Animations

### Transitions (Simple State Changes)
```css
.button {
  transition: all 0.3s ease;
}

.button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
```

### Keyframe Animations
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeInUp 0.6s ease-out;
}
```

### Performance-Optimized Properties
Only animate these properties for 60fps:
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (use sparingly)

Avoid animating:
- `width`, `height`, `margin`, `padding` (causes layout recalculation)
- `left`, `right`, `top`, `bottom` (use `transform: translate()` instead)

## Tailwind CSS Animations

### Built-in Utilities
```html
<!-- Spin -->
<div class="animate-spin">Loading...</div>

<!-- Ping -->
<div class="animate-ping">Notification</div>

<!-- Pulse -->
<div class="animate-pulse">Loading skeleton</div>

<!-- Bounce -->
<div class="animate-bounce">↓</div>
```

### Custom Tailwind Animations
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out',
      },
    },
  },
}
```

## Framer Motion (React)

### Basic Animations
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Variants (Reusable Animation Sets)
```tsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  },
}

<motion.div
  initial="hidden"
  animate="visible"
  variants={variants}
>
  Content
</motion.div>
```

### Stagger Children
```tsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

<motion.ul variants={container} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item} variants={item}>{item}</motion.li>
  ))}
</motion.ul>
```

### Scroll-Triggered Animations
```tsx
import { motion, useScroll, useTransform } from 'framer-motion'

function ParallaxSection() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  return (
    <motion.div style={{ y }}>
      Parallax content
    </motion.div>
  )
}
```

### Gesture Animations
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

## p5.js (Generative & Algorithmic Art)

### Basic Setup
```javascript
function setup() {
  createCanvas(800, 600)
  background(220)
}

function draw() {
  // Animation loop
  circle(mouseX, mouseY, 50)
}
```

### Particle System
```javascript
let particles = []

function setup() {
  createCanvas(800, 600)
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle(random(width), random(height)))
  }
}

function draw() {
  background(0, 25) // Trailing effect

  particles.forEach(p => {
    p.update()
    p.display()
  })
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y)
    this.vel = createVector(random(-1, 1), random(-1, 1))
  }

  update() {
    this.pos.add(this.vel)
    if (this.pos.x > width || this.pos.x < 0) this.vel.x *= -1
    if (this.pos.y > height || this.pos.y < 0) this.vel.y *= -1
  }

  display() {
    noStroke()
    fill(255, 100)
    circle(this.pos.x, this.pos.y, 10)
  }
}
```

### Flow Field
```javascript
let flowfield
let particles = []

function setup() {
  createCanvas(800, 600)
  flowfield = generateFlowField()
  for (let i = 0; i < 1000; i++) {
    particles.push(new Particle())
  }
}

function generateFlowField() {
  let field = []
  let scale = 0.01
  for (let y = 0; y < height; y += 10) {
    for (let x = 0; x < width; x += 10) {
      let angle = noise(x * scale, y * scale) * TWO_PI * 2
      field.push(p5.Vector.fromAngle(angle))
    }
  }
  return field
}
```

### Seeded Randomness (Reproducible)
```javascript
function setup() {
  randomSeed(42) // Same seed = same "random" results
  noiseSeed(42)

  // Generate art with consistent randomness
}
```

## Micro-interactions

### Button Ripple Effect
```tsx
<motion.button
  className="relative overflow-hidden"
  whileTap="tap"
>
  <motion.span
    className="absolute inset-0 bg-white"
    initial={{ scale: 0, opacity: 0.5 }}
    variants={{
      tap: {
        scale: 2,
        opacity: 0,
        transition: { duration: 0.6 }
      }
    }}
  />
  Click me
</motion.button>
```

### Loading Skeleton
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

### Toast Notification Animation
```tsx
<motion.div
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 100, opacity: 0 }}
  className="fixed top-4 right-4 p-4 bg-white shadow-lg rounded"
>
  Notification message
</motion.div>
```

## Performance Best Practices

1. **Use `will-change` sparingly** - Only on elements actively animating
2. **Reduce motion for accessibility** - Respect `prefers-reduced-motion`
3. **Use `transform` over position properties** - Better performance
4. **Debounce scroll events** - Don't animate on every scroll pixel
5. **Use `requestAnimationFrame`** - For smooth 60fps animations
6. **Lazy load animations** - Don't animate off-screen elements

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
