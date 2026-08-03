import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, CheckCircle2, RotateCcw, X, Clock, Sparkles, Copy, Check } from 'lucide-react';
import { MeshGradientBg } from './MeshGradientBg';
import { TextureButton } from './TextureButton';
import { playTopicRevealSound, playButtonClick } from '../utils/sound';

interface FullScreenTimerProps {
  topic: string;
  prepDurationSeconds: number;
  speakDurationSeconds: number;
  onClose: () => void;
}

type Stage = 'prep' | 'speak' | 'completed';

export const FullScreenTimer: React.FC<FullScreenTimerProps> = ({
  topic,
  prepDurationSeconds,
  speakDurationSeconds,
  onClose,
}) => {
  const [stage, setStage] = useState<Stage>('prep');
  const [msLeft, setMsLeft] = useState<number>(prepDurationSeconds * 1000);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Keep track of original total milliseconds for progress calculation
  const totalMs = (stage === 'prep' ? prepDurationSeconds : speakDurationSeconds) * 1000;

  const animFrameRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);
  const msLeftRef = useRef<number>(msLeft);

  useEffect(() => {
    msLeftRef.current = msLeft;
  }, [msLeft]);

  const handleCopy = () => {
    if (topic) {
      navigator.clipboard.writeText(topic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stage transition handling
  const handleStageCompletion = () => {
    setIsRunning(false);
    playTopicRevealSound();
    if (stage === 'prep') {
      // Transition prep -> speak (paused by default so user can manually start)
      const nextMs = speakDurationSeconds * 1000;
      setStage('speak');
      setMsLeft(nextMs);
      msLeftRef.current = nextMs;
      endTimeRef.current = Date.now() + nextMs;
      setIsRunning(false);
    } else if (stage === 'speak') {
      // Transition speak -> completed
      setStage('completed');
      setMsLeft(0);
      msLeftRef.current = 0;
    }
  };

  // High-precision millisecond timer tick loop using requestAnimationFrame
  useEffect(() => {
    if (isRunning) {
      endTimeRef.current = Date.now() + msLeftRef.current;

      const tick = () => {
        const remaining = Math.max(0, endTimeRef.current - Date.now());
        setMsLeft(remaining);

        if (remaining <= 0) {
          handleStageCompletion();
        } else {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning, stage, prepDurationSeconds, speakDurationSeconds]);

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

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleDone = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);
    if (stage === 'prep') {
      const nextMs = speakDurationSeconds * 1000;
      setStage('speak');
      setMsLeft(nextMs);
      msLeftRef.current = nextMs;
      endTimeRef.current = Date.now() + nextMs;
      setIsRunning(false);
    } else if (stage === 'speak') {
      setStage('completed');
      setMsLeft(0);
      msLeftRef.current = 0;
    }
  };

  const handleStartOver = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);
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
        {/* Stage Badge */}
        <div className="flex items-center justify-start sm:justify-center flex-1 min-w-0">
          {stage === 'prep' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg truncate">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Preparation Phase</span>
            </span>
          )}
          {stage === 'speak' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg truncate">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Speaking Phase</span>
            </span>
          )}
          {stage === 'completed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg truncate">
              <span className="truncate">Session Completed</span>
            </span>
          )}
        </div>

        {/* Right Close Button */}
        <div className="flex justify-end flex-shrink-0 ml-2">
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

      {/* Centered Topic Header with Circular Copy Icon */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex items-center justify-center gap-2 px-3 py-2 my-auto">
        <h2 className="font-pixel-square hover:font-pixel-triangle transition-all duration-150 text-white/95 text-2xl sm:text-3xl md:text-4xl text-center leading-snug break-words max-w-[85vw] drop-shadow-md">
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

      {/* Main Central Display Area (Huge Timer or Huge Completion Text) */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-5xl px-2">
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
                className={`inline-flex items-baseline justify-center text-[15vw] sm:text-[18vw] md:text-[20vw] lg:text-[14rem] ${
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
            <h1 className="font-pixel-square hover:font-pixel-triangle transition-all duration-150 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_10px_35px_rgba(255,255,255,0.2)] uppercase">
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
              className="flex-1 max-w-[160px] sm:max-w-[200px]"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start</span>
                </>
              )}
            </TextureButton>

            {/* Done Button */}
            <TextureButton
              variant="neutral"
              size="lg"
              onClick={handleDone}
              className="flex-1 max-w-[140px] sm:max-w-[180px]"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span>Done</span>
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
