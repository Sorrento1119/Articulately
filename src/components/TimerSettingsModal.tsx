import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Settings, Sparkles } from 'lucide-react';
import { TextureButton } from './TextureButton';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prepMinutes: number;
  prepSeconds: number;
  speakMinutes: number;
  speakSeconds: number;
  showKeybindings: boolean;
  onSave: (
    prepMin: number,
    prepSec: number,
    speakMin: number,
    speakSec: number,
    showKeybindings: boolean
  ) => void;
}

export const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
  isOpen,
  onClose,
  prepMinutes,
  prepSeconds,
  speakMinutes,
  speakSeconds,
  showKeybindings,
  onSave,
}) => {
  const [pMin, setPMin] = React.useState(prepMinutes);
  const [pSec, setPSec] = React.useState(prepSeconds);
  const [sMin, setSMin] = React.useState(speakMinutes);
  const [sSec, setSSec] = React.useState(speakSeconds);
  const [showKeys, setShowKeys] = React.useState(showKeybindings);

  React.useEffect(() => {
    if (isOpen) {
      setPMin(prepMinutes);
      setPSec(prepSeconds);
      setSMin(speakMinutes);
      setSSec(speakSeconds);
      setShowKeys(showKeybindings);
    }
  }, [isOpen, prepMinutes, prepSeconds, speakMinutes, speakSeconds, showKeybindings]);

  const handleSave = () => {
    const validPMin = Math.max(0, Math.min(120, pMin));
    const validPSec = Math.max(0, Math.min(59, pSec));
    const validSMin = Math.max(0, Math.min(120, sMin));
    const validSSec = Math.max(0, Math.min(59, sSec));

    onSave(validPMin, validPSec, validSMin, validSSec, showKeys);
    onClose();
  };

  const PRESET_MINUTES = [1, 2, 3, 5, 7, 10];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl z-10 text-white overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/30 before:pointer-events-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Timer Settings</h2>
                  <p className="text-xs text-white/60">Customize preparation & speaking durations</p>
                </div>
              </div>
              <TextureButton
                variant="icon"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </TextureButton>
            </div>

            {/* Content Form */}
            <div className="space-y-5">
              {/* Preparation Timer Settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    Preparation Timer
                  </span>
                  <span className="text-xs font-mono text-white/70">
                    {String(pMin).padStart(2, '0')}:{String(pSec).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-white/50 block mb-1">Minutes</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={pMin}
                      onChange={(e) => setPMin(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-white/50 block mb-1">Seconds</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={pSec}
                      onChange={(e) => setPSec(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-white/40 mr-1">Presets:</span>
                  {PRESET_MINUTES.map((m) => (
                    <TextureButton
                      key={`prep-${m}`}
                      type="button"
                      variant={pMin === m && pSec === 0 ? 'accent' : 'neutral'}
                      size="sm"
                      onClick={() => {
                        setPMin(m);
                        setPSec(0);
                      }}
                      className="!px-2.5 !py-0.5 text-xs font-semibold"
                    >
                      {m}m
                    </TextureButton>
                  ))}
                </div>
              </div>

              {/* Speaking Timer Settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Speaking Timer
                  </span>
                  <span className="text-xs font-mono text-white/70">
                    {String(sMin).padStart(2, '0')}:{String(sSec).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-white/50 block mb-1">Minutes</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={sMin}
                      onChange={(e) => setSMin(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-white/50 block mb-1">Seconds</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={sSec}
                      onChange={(e) => setSSec(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-white/40 mr-1">Presets:</span>
                  {PRESET_MINUTES.map((m) => (
                    <TextureButton
                      key={`speak-${m}`}
                      type="button"
                      variant={sMin === m && sSec === 0 ? 'success' : 'neutral'}
                      size="sm"
                      onClick={() => {
                        setSMin(m);
                        setSSec(0);
                      }}
                      className="!px-2.5 !py-0.5 text-xs font-semibold"
                    >
                      {m}m
                    </TextureButton>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcut Badges Option */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-amber-300 block">
                    Show Keyboard Shortcut Labels
                  </span>
                  <span className="text-[11px] text-white/60 block">
                    Display [Space] &amp; [Enter] badges on buttons
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={showKeys}
                    onChange={(e) => setShowKeys(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-white/10 mt-5">
              <TextureButton
                type="button"
                variant="neutral"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </TextureButton>
              <TextureButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
              >
                Save Changes
              </TextureButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
