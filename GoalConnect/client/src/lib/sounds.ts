// Web Audio API sounds - no files needed
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
  if (!audioContext) return;

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  // Fade out to avoid click
  gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

// Satisfying completion sound - quick ascending notes
export function playCompleteSound() {
  if (!audioContext) return;
  playTone(523, 0.1, 'sine', 0.2); // C5
  setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 50); // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 100); // G5
}

// CRITICAL HIT - dramatic ascending with final punch
export function playCriticalSound() {
  if (!audioContext) return;
  playTone(392, 0.08, 'square', 0.15); // G4
  setTimeout(() => playTone(523, 0.08, 'square', 0.15), 60); // C5
  setTimeout(() => playTone(659, 0.08, 'square', 0.15), 120); // E5
  setTimeout(() => playTone(784, 0.1, 'square', 0.2), 180); // G5
  setTimeout(() => playTone(1047, 0.2, 'square', 0.3), 240); // C6 - the punch
}

// Combo sound - quick blip
export function playComboSound() {
  if (!audioContext) return;
  playTone(880, 0.08, 'sine', 0.15); // A5
  setTimeout(() => playTone(1109, 0.1, 'sine', 0.2), 40); // C#6
}

// Streak milestone sound
export function playStreakSound() {
  if (!audioContext) return;
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
