import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, BookOpen, Check, Sparkles, Filter, Shuffle, Target } from 'lucide-react';
import {
  SPECIFIC_ARCHETYPES,
  ALL_ARCHETYPES,
  JACK_OF_ALL_TRADES_ID,
  Archetype,
} from '../topics';
import { TextureButton } from './TextureButton';

interface TopicItem {
  topic: string;
  archetypeId: string;
  archetypeName: string;
  archetypeIcon: React.ElementType;
}

export interface QueuedTopic {
  topic: string;
  archetypeId: string;
}

interface TopicLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic: string;
  selectedArchetypeId: string;
  queuedTopic: QueuedTopic | null;
  onSelectTopic: (topic: string, archetypeId?: string) => void;
  onSetQueuedTopic: (queued: QueuedTopic | null) => void;
}

export const TopicLibraryModal: React.FC<TopicLibraryModalProps> = ({
  isOpen,
  onClose,
  currentTopic,
  selectedArchetypeId,
  queuedTopic,
  onSelectTopic,
  onSetQueuedTopic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens & reset search
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      // Set initial filter to current selected archetype if specific, or 'all'
      if (selectedArchetypeId !== JACK_OF_ALL_TRADES_ID) {
        setActiveFilterId(selectedArchetypeId);
      } else {
        setActiveFilterId('all');
      }

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, selectedArchetypeId]);

  // Aggregate all unique topics with their associated archetype metadata
  const allTopicItems = useMemo<TopicItem[]>(() => {
    const list: TopicItem[] = [];
    const seen = new Set<string>();

    SPECIFIC_ARCHETYPES.forEach((arch) => {
      arch.topics.forEach((t) => {
        if (!seen.has(t)) {
          seen.add(t);
          list.push({
            topic: t,
            archetypeId: arch.id,
            archetypeName: arch.name,
            archetypeIcon: arch.icon,
          });
        }
      });
    });

    return list;
  }, []);

  // Filter topics based on active archetype tab and search query
  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allTopicItems.filter((item) => {
      // Archetype filter match
      const matchesArchetype =
        activeFilterId === 'all' || item.archetypeId === activeFilterId;

      if (!matchesArchetype) return false;

      // Search query match
      if (!query) return true;
      return (
        item.topic.toLowerCase().includes(query) ||
        item.archetypeName.toLowerCase().includes(query)
      );
    });
  }, [allTopicItems, activeFilterId, searchQuery]);

  const handlePickTopic = (topic: string, archetypeId: string) => {
    onSelectTopic(topic, archetypeId);
    onClose();
  };

  const handlePickRandomFromFiltered = () => {
    if (filteredTopics.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredTopics.length);
    const chosen = filteredTopics[randomIndex];
    handlePickTopic(chosen.topic, chosen.archetypeId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[85dvh] sm:max-h-[88dvh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/92 to-slate-950/98 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-10 text-white overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/30 before:pointer-events-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    Topic Library
                  </h2>
                  <p className="text-xs text-white/60">
                    Browse &amp; select manually from {allTopicItems.length} topics
                  </p>
                </div>
              </div>

              <TextureButton variant="icon" onClick={onClose} aria-label="Close modal">
                <X className="w-5 h-5" />
              </TextureButton>
            </div>

            {/* Search Bar & Category Filters Container */}
            <div className="p-3 sm:p-4 border-b border-white/10 space-y-3 bg-slate-900/50 flex-shrink-0">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-amber-300/70 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search topics by keyword (e.g. Stoicism, AI, Space, History)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/15 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-white/50 hover:text-white transition-colors p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills (Scrollable horizontally) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-white/20">
                <button
                  type="button"
                  onClick={() => setActiveFilterId('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilterId === 'all'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  All Archetypes ({allTopicItems.length})
                </button>

                {SPECIFIC_ARCHETYPES.map((arch) => {
                  const Icon = arch.icon;
                  const isSelected = activeFilterId === arch.id;
                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => setActiveFilterId(arch.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      <Icon className="w-3 h-3 text-amber-300" />
                      <span>{arch.name.replace(/^The\s+/, '')}</span>
                      <span className="text-[10px] text-white/40 font-mono">
                        ({arch.topics.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Topics List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/20">
              {queuedTopic && (
                <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Target className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                    <span className="truncate">
                      <strong>Next spin queued:</strong> &quot;{queuedTopic.topic}&quot;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetQueuedTopic(null)}
                    className="text-[11px] underline text-amber-300 hover:text-white transition-colors flex-shrink-0"
                  >
                    Clear queue
                  </button>
                </div>
              )}

              {filteredTopics.length > 0 ? (
                filteredTopics.map((item) => {
                  const Icon = item.archetypeIcon;
                  const isCurrent = item.topic === currentTopic;
                  const isQueued = queuedTopic?.topic === item.topic;

                  return (
                    <div
                      key={`${item.archetypeId}-${item.topic}`}
                      className={`w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl text-left transition-all ${
                        isQueued
                          ? 'bg-amber-500/25 border border-amber-400/80 text-amber-100 shadow-md ring-1 ring-amber-400/50'
                          : isCurrent
                          ? 'bg-amber-500/15 border border-amber-400/50 text-amber-100'
                          : 'bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/30 text-white'
                      }`}
                    >
                      {/* Topic title & archetype icon - Click to select immediately */}
                      <button
                        type="button"
                        onClick={() => handlePickTopic(item.topic, item.archetypeId)}
                        className="flex items-center gap-3 min-w-0 flex-1 pr-2 text-left cursor-pointer"
                        title="Select topic immediately"
                      >
                        <span
                          className={`p-1.5 rounded-xl flex-shrink-0 transition-colors ${
                            isQueued || isCurrent
                              ? 'bg-amber-400/30 text-amber-200 border border-amber-400/40'
                              : 'bg-white/5 text-amber-300/80 group-hover:bg-amber-400/20 group-hover:text-amber-200 border border-white/10'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="font-semibold text-xs sm:text-sm tracking-wide leading-snug break-words">
                          {item.topic}
                        </span>
                      </button>

                      {/* Right actions: Queue button & Status badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isQueued ? (
                          <button
                            type="button"
                            onClick={() => onSetQueuedTopic(null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-400 text-slate-950 border border-amber-300 uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer shadow-sm"
                            title="Click to cancel queueing this topic for spin"
                          >
                            <Target className="w-3 h-3" />
                            Queued for Spin
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSetQueuedTopic({
                                topic: item.topic,
                                archetypeId: item.archetypeId,
                              });
                            }}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-amber-500/30 text-white/50 hover:text-amber-200 border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer flex items-center gap-1"
                            title="Set as topic for next spin (comes out naturally when wheel spins)"
                          >
                            <Target className="w-3.5 h-3.5 text-amber-300" />
                            <span className="hidden sm:inline text-[10px] font-semibold text-white/70">
                              Queue for Spin
                            </span>
                          </button>
                        )}

                        {isCurrent && !isQueued && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white/80">No topics found</p>
                  <p className="text-xs text-white/50 mt-1 max-w-xs">
                    No results for &quot;{searchQuery}&quot; in the selected filter. Try adjusting your search query or archetype.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilterId('all');
                    }}
                    className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between gap-2 flex-shrink-0 text-xs text-white/60">
              <span className="font-mono text-[11px] sm:text-xs">
                Showing {filteredTopics.length} of {allTopicItems.length} topics
              </span>

              <div className="flex items-center gap-2">
                {filteredTopics.length > 0 && (
                  <TextureButton
                    type="button"
                    variant="neutral"
                    size="sm"
                    onClick={handlePickRandomFromFiltered}
                    title="Pick a random topic from current search/filter results"
                    className="!px-3 !py-1 text-xs"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Pick Random Filtered</span>
                  </TextureButton>
                )}

                <TextureButton
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={onClose}
                  className="!px-3 !py-1 text-xs"
                >
                  Close
                </TextureButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
