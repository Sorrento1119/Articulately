import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, Copy, Check, Play, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { Typewriter } from './components/Typewriter';
import { MeshGradientBg } from './components/MeshGradientBg';
import { ArchetypeSelect } from './components/ArchetypeSelect';
import { TimerSettingsModal } from './components/TimerSettingsModal';
import { FullScreenTimer } from './components/FullScreenTimer';
import { TextureButton } from './components/TextureButton';
import { getMuted, setMuted, unlockAudio } from './utils/sound';
import {
  ALL_ARCHETYPES,
  JACK_OF_ALL_TRADES_ID,
  getRandomTopicForArchetype,
} from './topics';

export default function App() {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(JACK_OF_ALL_TRADES_ID);
  const [currentTopic, setCurrentTopic] = useState<string>(() =>
    getRandomTopicForArchetype(JACK_OF_ALL_TRADES_ID)
  );
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegree, setRotationDegree] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Attempt early unlock of AudioContext on app mount
  useEffect(() => {
    unlockAudio();
  }, []);

  // Timer Configuration State (Default 5 mins prep, 5 mins speak)
  const [prepMinutes, setPrepMinutes] = useState<number>(5);
  const [prepSeconds, setPrepSeconds] = useState<number>(0);
  const [speakMinutes, setSpeakMinutes] = useState<number>(5);
  const [speakSeconds, setSpeakSeconds] = useState<number>(0);
  const [showKeybindings, setShowKeybindings] = useState<boolean>(false);

  // Active Timer view state and Settings modal state
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(getMuted());

  const toggleAudioMute = () => {
    const nextMute = !isAudioMuted;
    setMuted(nextMute);
    setIsAudioMuted(nextMute);
  };

  // Handle archetype change from dropdown selector
  const handleSelectArchetype = (archetypeId: string) => {
    setSelectedArchetypeId(archetypeId);
    // When archetype changes, immediately update to a topic from that archetype
    const nextTopic = getRandomTopicForArchetype(archetypeId, currentTopic);
    setCurrentTopic(nextTopic);
    setCopied(false);
  };

  // Handle spin button click
  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setRotationDegree((prev) => prev + 360);

    // Pick random topic from currently selected archetype
    const newTopic = getRandomTopicForArchetype(selectedArchetypeId, currentTopic);

    setTimeout(() => {
      setCurrentTopic(newTopic);
      setIsSpinning(false);
      setCopied(false);
    }, 300);
  }, [isSpinning, selectedArchetypeId, currentTopic]);

  // Global Keyboard Shortcuts for Topic Selection Page:
  // Space = Spin, Enter = Start Timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTimerActive || isTimerSettingsOpen) return;

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
        handleSpin();
      } else if (e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setIsTimerActive(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTimerActive, isTimerSettingsOpen, handleSpin]);

  const handleCopy = () => {
    if (!currentTopic) return;
    navigator.clipboard.writeText(currentTopic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTimerSettings = (
    pMin: number,
    pSec: number,
    sMin: number,
    sSec: number,
    showKeys: boolean
  ) => {
    setPrepMinutes(pMin);
    setPrepSeconds(pSec);
    setSpeakMinutes(sMin);
    setSpeakSeconds(sSec);
    setShowKeybindings(showKeys);
  };

  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 45) return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
    if (len > 32) return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
    if (len > 20) return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
    return 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl';
  };

  const prepTotalSeconds = prepMinutes * 60 + prepSeconds;
  const speakTotalSeconds = speakMinutes * 60 + speakSeconds;

  return (
    <div className="relative h-[100dvh] w-screen max-h-[100dvh] overflow-hidden bg-slate-950 font-sans text-white flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 box-border select-none">
      {/* Mesh Gradient Background */}
      <MeshGradientBg />

      {/* Radial vignetting overlay for crisp contrast and depth */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/75 pointer-events-none" />

      {/* Main Content Container - Entirely fits in one page across resolutions */}
      <main className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-between text-center py-1 sm:py-2 gap-1 sm:gap-2 overflow-hidden">
        {/* Top Header Branding: Ultra-compact single line */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pt-0.5 flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium flex-shrink-0"
        >
          <span className="font-pixel text-xs sm:text-sm text-white tracking-widest drop-shadow-sm cursor-default">
            Articulately
          </span>
          <span className="text-white/40 text-[10px] sm:text-xs select-none">•</span>
          <span className="text-[10px] sm:text-xs text-white/70">made by</span>
          <TextureButton
            variant="neutral"
            size="sm"
            onClick={() => window.open('https://www.tharv.in', '_blank', 'noopener,noreferrer')}
            className="rounded-full !px-2.5 !py-0.5"
            title="Visit tharv.in"
          >
            <span className="text-[10px] sm:text-xs font-bold text-amber-200">tharv</span>
          </TextureButton>
        </motion.div>

        {/* Archetype Selection Dropdown & Timer Settings Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          className="w-full flex items-center justify-between sm:justify-center gap-2 sm:gap-3 flex-shrink-0"
        >
          {/* Archetype Dropdown - flexible on mobile, centered on desktop */}
          <div className="flex-1 min-w-0 sm:flex-initial">
            <ArchetypeSelect
              selectedArchetypeId={selectedArchetypeId}
              onSelectArchetype={handleSelectArchetype}
              disabled={isSpinning}
            />
          </div>

          {/* Action buttons (Timer Settings & Sound Toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <TextureButton
              variant="neutral"
              size="md"
              onClick={() => setIsTimerSettingsOpen(true)}
              aria-label="Timer Settings"
              title="Customize Preparation & Speaking Timers"
              className="!px-2.5 sm:!px-3.5 !py-2.5 sm:!py-3 flex items-center justify-center flex-shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
            </TextureButton>

            <TextureButton
              variant="neutral"
              size="md"
              onClick={toggleAudioMute}
              aria-label={isAudioMuted ? 'Unmute audio' : 'Mute audio'}
              title={isAudioMuted ? 'Enable Sound Effects' : 'Mute Sound Effects'}
              className="!px-2.5 sm:!px-3.5 !py-2.5 sm:!py-3 flex items-center justify-center flex-shrink-0"
            >
              {isAudioMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-300" />
              )}
            </TextureButton>
          </div>
        </motion.div>

        {/* Center: Topic Heading with Typewriter Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 min-h-0 flex items-center justify-center my-auto px-2 sm:px-4 py-2 max-w-full w-full overflow-visible"
        >
          <h1 className={`${getFontSizeClass(currentTopic)} font-pixel tracking-normal text-white drop-shadow-xl leading-snug max-w-full overflow-visible py-2 px-1 text-center cursor-default`}>
            <Typewriter
              text={currentTopic}
              className="font-pixel"
              speed={45}
              delay={0.05}
            />
          </h1>
        </motion.div>

        {/* Bottom: Spin Button, Start Button and Copy Action */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pb-2 sm:pb-4 flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 flex-shrink-0"
        >
          {/* Spin & Start Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full">
            <TextureButton
              id="spin-button"
              variant="secondary"
              size="lg"
              onClick={handleSpin}
              disabled={isSpinning}
              className="group min-w-[130px] sm:min-w-[170px]"
            >
              <motion.div
                animate={{ rotate: rotationDegree }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 group-hover:text-amber-600 transition-colors" />
              </motion.div>
              <div className="flex items-center gap-1.5">
                <span className="tracking-wider uppercase text-xs sm:text-sm font-extrabold">
                  spin
                </span>
                {showKeybindings && (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900/20 text-slate-700 uppercase border border-slate-900/30">
                    Space
                  </kbd>
                )}
              </div>
            </TextureButton>

            {/* Start Timer Session Button */}
            <TextureButton
              id="start-button"
              variant="primary"
              size="lg"
              onClick={() => setIsTimerActive(true)}
              className="group min-w-[130px] sm:min-w-[170px]"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
              <div className="flex items-center gap-1.5">
                <span className="tracking-wider uppercase text-xs sm:text-sm font-extrabold">
                  start
                </span>
                {showKeybindings && (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-950/20 text-amber-950 uppercase border border-amber-950/30">
                    Enter
                  </kbd>
                )}
              </div>
            </TextureButton>
          </div>

          {/* Quick Action: Copy Topic */}
          <TextureButton
            variant="neutral"
            size="sm"
            onClick={handleCopy}
            className="rounded-2xl !px-3.5 !py-1.5"
            title="Copy topic to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-xs">Copy topic</span>
              </>
            )}
          </TextureButton>
        </motion.div>
      </main>

      {/* Timer Settings Modal */}
      <TimerSettingsModal
        isOpen={isTimerSettingsOpen}
        onClose={() => setIsTimerSettingsOpen(false)}
        prepMinutes={prepMinutes}
        prepSeconds={prepSeconds}
        speakMinutes={speakMinutes}
        speakSeconds={speakSeconds}
        showKeybindings={showKeybindings}
        onSave={handleSaveTimerSettings}
      />

      {/* Huge Full Screen Timer Overlay */}
      <AnimatePresence>
        {isTimerActive && (
          <FullScreenTimer
            topic={currentTopic}
            prepDurationSeconds={prepTotalSeconds}
            speakDurationSeconds={speakTotalSeconds}
            showKeybindings={showKeybindings}
            onClose={() => setIsTimerActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
