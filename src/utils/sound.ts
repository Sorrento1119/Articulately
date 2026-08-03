// Web Audio API Sound Synthesizer for tactile UI feedback and typewriter clicks with sync'd haptic feedback

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;
let isUnlocked: boolean = false;

/**
 * Trigger subtle haptic vibration feedback on supported devices
 */
export function triggerHaptic(pattern: number | number[] = 8) {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration restrictions or lack of support
    }
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  return audioCtx;
}

function playSilentWarmup(ctx: AudioContext) {
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore warmup errors
  }
}

/**
 * Proactively unlock and resume AudioContext on user interaction
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (ctx.state === 'running' && !isUnlocked) {
        isUnlocked = true;
        playSilentWarmup(ctx);
      }
    }).catch(() => {});
  } else if (ctx.state === 'running' && !isUnlocked) {
    isUnlocked = true;
    playSilentWarmup(ctx);
  }
}

// Auto-attach global gesture unlock listeners so the very first tap/click/keydown anywhere unlocks audio context
if (typeof window !== 'undefined') {
  const unlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
  const handleUserInteraction = () => {
    unlockAudio();
  };
  unlockEvents.forEach((evt) => {
    window.addEventListener(evt, handleUserInteraction, { capture: true, passive: true });
  });
}

export function setMuted(muted: boolean) {
  isMuted = muted;
}

export function getMuted(): boolean {
  return isMuted;
}

/**
 * Helper to run sound generation safely once AudioContext is running
 */
function safePlay(soundFn: (ctx: AudioContext) => void) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (ctx.state === 'running') {
        try {
          soundFn(ctx);
        } catch {
          // Ignore audio node errors
        }
      }
    }).catch(() => {});
  } else if (ctx.state === 'running') {
    try {
      soundFn(ctx);
    } catch {
      // Ignore audio node errors
    }
  }
}

/**
 * Play a crisp mechanical typewriter key click with synchronized tactile haptic tick.
 */
export function playTypewriterClick() {
  triggerHaptic(6); // Light tactile micro-tick for keystrokes
  if (isMuted) return;

  safePlay((ctx) => {
    const now = ctx.currentTime;

    // 1. Filtered noise burst for key impact
    const bufferSize = Math.floor(ctx.sampleRate * 0.015); // 15ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter for realistic key sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = 2800 + (Math.random() * 400 - 200);
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(3.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.015);

    // 2. Low mechanical body thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.02);

    oscGain.gain.setValueAtTime(0.05, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  });
}

/**
 * Play a satisfying tactile button click sound with haptics.
 */
export function playButtonClick(variant: 'primary' | 'secondary' | 'neutral' | 'accent' | 'spin' = 'neutral') {
  if (variant === 'primary' || variant === 'spin') {
    triggerHaptic([15, 20, 15]);
  } else if (variant === 'secondary') {
    triggerHaptic(12);
  } else {
    triggerHaptic(8);
  }

  if (isMuted) return;

  safePlay((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (variant === 'primary' || variant === 'spin') {
      // Warm, punchy double pitch drop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    } else if (variant === 'secondary') {
      // Crisp snappy pop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    } else {
      // Soft clean tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  });
}

/**
 * Play a short pleasant shimmer chime when a new topic is generated or selected with haptics.
 */
export function playTopicRevealSound() {
  triggerHaptic([10, 30, 15, 30, 20, 40, 25]);

  if (isMuted) return;

  safePlay((ctx) => {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.2);
    });
  });
}

/**
 * Play a warning beep during countdown (e.g. for the last 5 seconds: 5, 4, 3, 2, 1).
 * Pitch rises on the final countdown second for emphasis.
 */
export function playWarningBeep(secondsLeft?: number) {
  triggerHaptic(secondsLeft === 1 ? [15, 30, 20] : 10);

  if (isMuted) return;

  safePlay((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Frequency: 880Hz for seconds 5..2, 1046.5Hz for second 1
    const freq = secondsLeft === 1 ? 1046.5 : 880;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Fast, crisp attack and exponential decay for clean tick/beep
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  });
}

/**
 * Play a distinct, triumphant ending alarm sound when the timer phase completes.
 * Different from the topic reveal sound, featuring a bright multi-burst completion alarm chime.
 */
export function playTimerCompleteAlarm() {
  triggerHaptic([25, 40, 25, 40, 30, 60, 40]);

  if (isMuted) return;

  safePlay((ctx) => {
    const now = ctx.currentTime;

    // Multi-burst completion alarm sequence (distinct, pleasant, clear finish chime)
    const bursts = [
      { delay: 0, notes: [523.25, 659.25, 783.99, 1046.5] }, // C5, E5, G5, C6
      { delay: 0.16, notes: [659.25, 783.99, 1046.5, 1318.51] }, // E5, G5, C6, E6
      { delay: 0.32, notes: [1046.5, 1318.51, 1567.98] }, // C6, E6, G6
    ];

    bursts.forEach((burst) => {
      const startTime = now + burst.delay;
      burst.notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.035);

        gain.gain.setValueAtTime(0, startTime + idx * 0.035);
        gain.gain.linearRampToValueAtTime(0.1, startTime + idx * 0.035 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.035 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.035);
        osc.stop(startTime + idx * 0.035 + 0.32);
      });
    });
  });
}
