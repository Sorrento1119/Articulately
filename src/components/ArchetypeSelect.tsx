import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { ALL_ARCHETYPES, JACK_OF_ALL_TRADES_ID, Archetype } from '../topics';
import { TextureButton } from './TextureButton';

interface ArchetypeSelectProps {
  selectedArchetypeId: string;
  onSelectArchetype: (archetypeId: string) => void;
  disabled?: boolean;
}

export function ArchetypeSelect({
  selectedArchetypeId,
  onSelectArchetype,
  disabled = false,
}: ArchetypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedArchetype = ALL_ARCHETYPES.find((a) => a.id === selectedArchetypeId) || ALL_ARCHETYPES[0];
  const IconComponent = selectedArchetype.icon;

  return (
    <div className="relative inline-block text-left z-30" ref={dropdownRef}>
      {/* Dropdown Selector Button */}
      <TextureButton
        variant="neutral"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="justify-between min-w-[220px] sm:min-w-[280px]"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="p-1 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-300 flex-shrink-0">
            <IconComponent className="w-4 h-4" />
          </span>
          <div className="flex flex-col text-left truncate">
            <span className="truncate font-semibold tracking-wide text-xs sm:text-sm text-white">
              {selectedArchetype.name}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-white/70 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </TextureButton>

      {/* Dropdown Options List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 w-[280px] sm:w-[340px] max-h-[320px] sm:max-h-[380px] overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/92 to-slate-950/98 backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_15px_35px_rgba(0,0,0,0.8)] p-1.5 z-50 space-y-1 scrollbar-thin scrollbar-thumb-white/20"
            role="listbox"
          >
            {ALL_ARCHETYPES.map((archetype) => {
              const ItemIcon = archetype.icon;
              const isSelected = selectedArchetypeId === archetype.id;

              return (
                <button
                  key={archetype.id}
                  type="button"
                  onClick={() => {
                    onSelectArchetype(archetype.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                      : 'text-white/90 hover:bg-white/10 hover:text-white border border-transparent'
                  }`}
                >
                  <span
                    className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isSelected
                        ? 'bg-amber-400/30 text-amber-200 border border-amber-400/40'
                        : 'bg-white/5 text-amber-300/80 border border-white/10'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs sm:text-sm tracking-wide text-white truncate block">
                      {archetype.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
