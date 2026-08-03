import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, Copy, Check, Play, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { Typewriter } from './components/Typewriter';
import { MeshGradientBg } from './components/MeshGradientBg';
import { ArchetypeSelect } from './components/ArchetypeSelect';
import { TimerSettingsModal } from './components/TimerSettingsModal';
import { FullScreenTimer } from './components/FullScreenTimer';
import { TextureButton } from './components/TextureButton';
import { getMuted, setMuted } from './utils/sound';
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

  // Timer Configuration State (Default 5 mins prep, 5 mins speak)
  const [prepMinutes, setPrepMinutes] = useState<number>(5);
  const [prepSeconds, setPrepSeconds] = useState<number>(0);
  const [speakMinutes, setSpeakMinutes] = useState<number>(5);
  const [speakSeconds, setSpeakSeconds] = useState<number>(0);

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
  const handleSpin = () => {
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
  };

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
    sSec: number
  ) => {
    setPrepMinutes(pMin);
    setPrepSeconds(pSec);
    setSpeakMinutes(sMin);
    setSpeakSeconds(sSec);
  };

  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 45) return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
    if (len > 32) return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
    if (len > 20) return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
    return 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl';
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
      <main className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-between text-center py-2 sm:py-4 gap-3 sm:gap-6">
        {/* Top: Archetype Selection Dropdown & Timer Settings Button */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pt-1 sm:pt-2 w-full flex items-center justify-between sm:justify-center gap-2 sm:gap-3"
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
          className="flex-1 flex items-center justify-center my-auto px-2 sm:px-4 py-2 sm:py-4 max-w-full w-full overflow-visible"
        >
          <h1 className={`${getFontSizeClass(currentTopic)} font-pixel-square hover:font-pixel-triangle transition-all duration-150 tracking-normal text-white drop-shadow-xl leading-snug max-w-full overflow-visible py-2 px-1 text-center cursor-default`}>
            <Typewriter
              text={currentTopic}
              className="font-pixel-square hover:font-pixel-triangle"
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
          className="pb-2 sm:pb-6 flex flex-col items-center justify-center gap-2.5 sm:gap-3.5"
        >
          {/* Spin & Start Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full">
            <TextureButton
              id="spin-button"
              variant="secondary"
              size="lg"
              onClick={handleSpin}
              disabled={isSpinning}
              className="group min-w-[125px] sm:min-w-[160px]"
            >
              <motion.div
                animate={{ rotate: rotationDegree }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 group-hover:text-amber-600 transition-colors" />
              </motion.div>
              <span className="tracking-wider uppercase text-xs sm:text-sm font-extrabold">
                spin
              </span>
            </TextureButton>

            {/* Start Timer Session Button */}
            <TextureButton
              id="start-button"
              variant="primary"
              size="lg"
              onClick={() => setIsTimerActive(true)}
              className="group min-w-[125px] sm:min-w-[160px]"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
              <span className="tracking-wider uppercase text-xs sm:text-sm font-extrabold">
                start
              </span>
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
        onSave={handleSaveTimerSettings}
      />

      {/* Huge Full Screen Timer Overlay */}
      <AnimatePresence>
        {isTimerActive && (
          <FullScreenTimer
            topic={currentTopic}
            prepDurationSeconds={prepTotalSeconds}
            speakDurationSeconds={speakTotalSeconds}
            onClose={() => setIsTimerActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
