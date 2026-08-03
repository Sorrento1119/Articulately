import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, CheckCircle2, RotateCcw, X, Clock, Sparkles, Copy, Check } from 'lucide-react';
import { MeshGradientBg } from './MeshGradientBg';
import { TextureButton } from './TextureButton';
import { playWarningBeep, playTimerCompleteAlarm, unlockAudio } from '../utils/sound';

interface FullScreenTimerProps {
  topic: string;
  prepDurationSeconds: number;
  speakDurationSeconds: number;
  showKeybindings?: boolean;
  onClose: () => void;
}

type Stage = 'prep' | 'speak' | 'completed';

// Worker constructor helper that creates an unthrottled background worker timer with fallback
class BackgroundTimerWorker {
  private worker: Worker | null = null;
  private intervalId: number | null = null;
  private onTickCallback: (remainingMs: number) => void;

  constructor(onTick: (remainingMs: number) => void) {
    this.onTickCallback = onTick;
    try {
      const code = `
        let timerId = null;
        let endTime = 0;

        self.onmessage = function(e) {
          const data = e.data;
          if (data.action === 'start') {
            if (timerId) clearInterval(timerId);
            endTime = Date.now() + data.durationMs;
            timerId = setInterval(function() {
              const remaining = Math.max(0, endTime - Date.now());
              self.postMessage({ type: 'tick', remainingMs: remaining });
              if (remaining <= 0) {
                clearInterval(timerId);
                timerId = null;
              }
            }, 100);
          } else if (data.action === 'stop') {
            if (timerId) {
              clearInterval(timerId);
              timerId = null;
            }
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = (e) => {
        if (e.data && e.data.type === 'tick') {
          this.onTickCallback(e.data.remainingMs);
        }
      };
    } catch {
      this.worker = null;
    }
  }

  start(durationMs: number) {
    if (this.worker) {
      this.worker.postMessage({ action: 'start', durationMs });
    } else {
      if (this.intervalId) clearInterval(this.intervalId);
      const endTime = Date.now() + durationMs;
      this.intervalId = window.setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        this.onTickCallback(remaining);
        if (remaining <= 0) {
          if (this.intervalId) clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }, 100);
    }
  }

  stop() {
    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  terminate() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const FullScreenTimer: React.FC<FullScreenTimerProps> = ({
  topic,
  prepDurationSeconds,
  speakDurationSeconds,
  showKeybindings = false,
  onClose,
}) => {
  const initialStage: Stage = prepDurationSeconds > 0 ? 'prep' : 'speak';
  const initialMs = (initialStage === 'prep' ? prepDurationSeconds : speakDurationSeconds) * 1000;

  const [stage, setStage] = useState<Stage>(initialStage);
  const [msLeft, setMsLeft] = useState<number>(initialMs);
  const [isRunning, setIsRunning] = useState<boolean>(prepDurationSeconds > 0);
  const [copied, setCopied] = useState<boolean>(false);

  // Keep track of original total milliseconds for progress calculation
  const totalMs = (stage === 'prep' ? prepDurationSeconds : speakDurationSeconds) * 1000;

  const timerWorkerRef = useRef<BackgroundTimerWorker | null>(null);
  const msLeftRef = useRef<number>(msLeft);
  const lastBeepSecondRef = useRef<number | null>(null);
  const stageRef = useRef<Stage>(stage);

  useEffect(() => {
    msLeftRef.current = msLeft;
  }, [msLeft]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const handleCopy = () => {
    if (topic) {
      navigator.clipboard.writeText(topic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stage completion handler
  const handleStageCompletion = useCallback(() => {
    setIsRunning(false);
    if (timerWorkerRef.current) {
      timerWorkerRef.current.stop();
    }
    // Play the distinct, triumphant timer ending alarm sound
    playTimerCompleteAlarm();

    if (stageRef.current === 'prep') {
      // Transition prep -> speak (paused by default so user can manually start speaking phase)
      const nextMs = speakDurationSeconds * 1000;
      setStage('speak');
      setMsLeft(nextMs);
      msLeftRef.current = nextMs;
      lastBeepSecondRef.current = null;
      setIsRunning(false);
    } else if (stageRef.current === 'speak') {
      // Transition speak -> completed
      setStage('completed');
      setMsLeft(0);
      msLeftRef.current = 0;
      lastBeepSecondRef.current = null;
    }
  }, [speakDurationSeconds]);

  // Tick handler passed to the worker
  const handleTick = useCallback((remainingMs: number) => {
    setMsLeft(remainingMs);
    msLeftRef.current = remainingMs;

    const currentCeilSec = Math.ceil(remainingMs / 1000);

    if (remainingMs <= 0) {
      if (timerWorkerRef.current) {
        timerWorkerRef.current.stop();
      }
      handleStageCompletion();
    } else if (currentCeilSec <= 5 && currentCeilSec >= 1) {
      if (lastBeepSecondRef.current !== currentCeilSec) {
        lastBeepSecondRef.current = currentCeilSec;
        playWarningBeep(currentCeilSec);
      }
    }
  }, [handleStageCompletion]);

  // Handle timer worker lifecycle & background ticking
  useEffect(() => {
    if (isRunning && msLeftRef.current > 0) {
      unlockAudio();
      if (!timerWorkerRef.current) {
        timerWorkerRef.current = new BackgroundTimerWorker(handleTick);
      }
      timerWorkerRef.current.start(msLeftRef.current);
    } else if (timerWorkerRef.current) {
      timerWorkerRef.current.stop();
    }

    return () => {
      if (timerWorkerRef.current) {
        timerWorkerRef.current.stop();
      }
    };
  }, [isRunning, handleTick]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (timerWorkerRef.current) {
        timerWorkerRef.current.terminate();
        timerWorkerRef.current = null;
      }
    };
  }, []);

  // Format milliseconds to MM:SS and MS (hundredths of a second)
  const formatTimeParts = (totalMilliseconds: number) => {
    const validMs = Math.max(0, totalMilliseconds);
    const hrs = Math.floor(validMs / 3600000);
    const mins = Math.floor((validMs % 3600000) / 60000);
    const secs = Math.floor((validMs % 60000) / 1000);
    const hundredths = Math.floor((validMs % 1000) / 10);

    const pad = (n: number) => String(n).padStart(2, '0');

    const mainTime = hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;

    return {
      mainTime,
      ms: pad(hundredths),
    };
  };

  // Update document title dynamically so timer is visible in browser tab bar during research
  useEffect(() => {
    const originalTitle = document.title;

    if (stage === 'completed') {
      document.title = `[COMPLETED] Articulately`;
    } else {
      const { mainTime } = formatTimeParts(msLeft);
      const stageLabel = stage === 'prep' ? 'PREP' : 'SPEAK';
      document.title = `(${mainTime}) [${stageLabel}] ${topic} - Articulately`;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [msLeft, stage, topic]);

  const handleStartPause = useCallback(() => {
    unlockAudio();
    setIsRunning((prev) => !prev);
  }, []);

  const handleDone = useCallback(() => {
    if (timerWorkerRef.current) {
      timerWorkerRef.current.stop();
    }
    setIsRunning(false);
    lastBeepSecondRef.current = null;

    if (stageRef.current === 'prep') {
      const nextMs = speakDurationSeconds * 1000;
      setStage('speak');
      setMsLeft(nextMs);
      msLeftRef.current = nextMs;
      setIsRunning(false);
    } else if (stageRef.current === 'speak') {
      setStage('completed');
      setMsLeft(0);
      msLeftRef.current = 0;
    }
  }, [speakDurationSeconds]);

  // Keyboard Shortcuts in Timer Overlay:
  // Space = Start / Pause
  // Enter = Done (Next phase / finish)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        handleStartPause();
      } else if (e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        if (stageRef.current === 'completed') {
          onClose();
        } else {
          handleDone();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleStartPause, handleDone, onClose]);

  const handleStartOver = () => {
    if (timerWorkerRef.current) {
      timerWorkerRef.current.stop();
    }
    setIsRunning(false);
    lastBeepSecondRef.current = null;

    if (stage === 'prep') {
      const initMs = prepDurationSeconds * 1000;
      setMsLeft(initMs);
      msLeftRef.current = initMs;
    } else if (stage === 'speak') {
      const initMs = speakDurationSeconds * 1000;
      setMsLeft(initMs);
      msLeftRef.current = initMs;
    } else if (stage === 'completed') {
      setStage('prep');
      const initMs = prepDurationSeconds * 1000;
      setMsLeft(initMs);
      msLeftRef.current = initMs;
    }
  };

  // Progress ratio (1 to 0)
  const progressRatio = totalMs > 0 ? msLeft / totalMs : 0;
  const timeFormatted = formatTimeParts(msLeft);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-50 h-[100dvh] w-screen max-h-[100dvh] overflow-hidden bg-slate-950 font-sans text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 box-border select-none"
    >
      {/* Background Gradient Mesh - matching selected UI texture */}
      <MeshGradientBg />

      {/* Radial vignetting overlay for crisp contrast and depth */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/75 pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-2 sm:pt-4 px-1 sm:px-4">
        {/* Invisible left spacer balancing the close button so the center chip stays centered */}
        <div className="w-8 sm:w-10 flex-shrink-0 pointer-events-none opacity-0" aria-hidden="true">
          <div className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Stage Badge - Centered, compact, single line */}
        <div className="flex items-center justify-center flex-1 min-w-0 px-1">
          {stage === 'prep' && (
            <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Preparation Phase</span>
            </span>
          )}
          {stage === 'speak' && (
            <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Speaking Phase</span>
            </span>
          )}
          {stage === 'completed' && (
            <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Session Completed</span>
            </span>
          )}
        </div>

        {/* Right Close Button */}
        <div className="flex justify-end flex-shrink-0">
          <TextureButton
            variant="icon"
            onClick={onClose}
            title="Exit timer"
            className="!p-2 sm:!p-2.5"
          >
            <X className="w-5 h-5" />
          </TextureButton>
        </div>
      </div>

      {/* Main Central Display Area (Topic + Huge Timer / Completion Text) */}
      <div className="relative z-10 flex-1 my-auto flex flex-col items-center justify-center w-full max-w-5xl px-2 min-h-0 gap-3 sm:gap-6">
        {/* Centered Topic Header with Circular Copy Icon */}
        <div className="w-full max-w-3xl mx-auto flex items-center justify-center gap-2 px-3">
          <h2 className="font-pixel text-white/95 text-xl sm:text-3xl md:text-4xl text-center leading-snug break-words max-w-[85vw] drop-shadow-md">
            {topic}
          </h2>
          <TextureButton
            variant="icon"
            onClick={handleCopy}
            title="Copy topic"
            className="flex-shrink-0 !p-2 sm:!p-2.5 rounded-2xl"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/80" />
            )}
          </TextureButton>
        </div>

        {stage !== 'completed' ? (
          <div className="flex flex-col items-center justify-center w-full">
            {/* Massive Monospaced Timer Digits */}
            <motion.div
              key={stage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative font-mono font-extrabold tracking-tighter text-center leading-none select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
            >
              <div
                className={`inline-flex items-baseline justify-center text-[22vw] sm:text-[18vw] md:text-[20vw] lg:text-[14rem] ${
                  stage === 'prep'
                    ? 'text-amber-300 drop-shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                    : 'text-emerald-300 drop-shadow-[0_0_40px_rgba(16,185,129,0.25)]'
                }`}
              >
                <span>{timeFormatted.mainTime}</span>
                <span className="text-[0.45em] font-mono opacity-80 ml-1 sm:ml-2">
                  .{timeFormatted.ms}
                </span>
              </div>
            </motion.div>

            {/* Glowing Linear Progress Bar */}
            <div className="w-full max-w-xl h-2 bg-white/10 rounded-full overflow-hidden mt-2 sm:mt-6 border border-white/10 p-0.5">
              <motion.div
                className={`h-full rounded-full transition-all duration-300 ${
                  stage === 'prep' ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]' : 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, progressRatio * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-4 sm:p-8"
          >
            <h1 className="font-pixel text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_10px_35px_rgba(255,255,255,0.2)] uppercase">
              session completed
            </h1>
          </motion.div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-center gap-3 sm:gap-6 pb-2 sm:pb-4">
        {stage !== 'completed' ? (
          <>
            {/* Start / Pause Button */}
            <TextureButton
              variant={isRunning ? 'primary' : stage === 'prep' ? 'accent' : 'success'}
              size="lg"
              onClick={handleStartPause}
              className="flex-1 max-w-[170px] sm:max-w-[210px]"
            >
              {isRunning ? (
                <div className="flex items-center gap-1.5">
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                  {showKeybindings && (
                    <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900/20 text-slate-800 uppercase border border-slate-900/30">
                      Space
                    </kbd>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start</span>
                  {showKeybindings && (
                    <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900/20 text-slate-800 uppercase border border-slate-900/30">
                      Space
                    </kbd>
                  )}
                </div>
              )}
            </TextureButton>

            {/* Done Button */}
            <TextureButton
              variant="neutral"
              size="lg"
              onClick={handleDone}
              className="flex-1 max-w-[150px] sm:max-w-[190px]"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span>Done</span>
                {showKeybindings && (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white/10 text-white/80 uppercase border border-white/20">
                    Enter
                  </kbd>
                )}
              </div>
            </TextureButton>

            {/* Start Over Button */}
            <TextureButton
              variant="icon"
              onClick={handleStartOver}
              title="Start over current phase"
            >
              <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" />
            </TextureButton>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <TextureButton
              variant="neutral"
              size="md"
              onClick={handleStartOver}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Over</span>
            </TextureButton>
            <TextureButton
              variant="primary"
              size="md"
              onClick={onClose}
            >
              <span>Back to Topics</span>
            </TextureButton>
          </div>
        )}
      </div>
    </motion.div>
  );
};
