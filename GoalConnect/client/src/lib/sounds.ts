// Web Audio API sounds - no files needed
// Lazy-init: AudioContext created on first user interaction to avoid browser autoplay warnings
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  // Fade out to avoid click
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

// Satisfying completion sound - quick ascending notes
export function playCompleteSound() {
  playTone(523, 0.1, 'sine', 0.2); // C5
  setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 50); // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 100); // G5
}

// CRITICAL HIT - dramatic ascending with final punch
export function playCriticalSound() {
  playTone(392, 0.08, 'square', 0.15); // G4
  setTimeout(() => playTone(523, 0.08, 'square', 0.15), 60); // C5
  setTimeout(() => playTone(659, 0.08, 'square', 0.15), 120); // E5
  setTimeout(() => playTone(784, 0.1, 'square', 0.2), 180); // G5
  setTimeout(() => playTone(1047, 0.2, 'square', 0.3), 240); // C6 - the punch
}

// Combo sound - quick blip
export function playComboSound() {
  playTone(880, 0.08, 'sine', 0.15); // A5
  setTimeout(() => playTone(1109, 0.1, 'sine', 0.2), 40); // C#6
}

// Streak milestone sound
export function playStreakSound() {
  playTone(523, 0.1, 'triangle', 0.2);
  setTimeout(() => playTone(659, 0.1, 'triangle', 0.2), 80);
  setTimeout(() => playTone(784, 0.1, 'triangle', 0.2), 160);
  setTimeout(() => playTone(1047, 0.2, 'triangle', 0.3), 240);
}

// Haptic feedback (mobile)
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    };
    navigator.vibrate(patterns[style]);
  }
}
