import React, { useState, useEffect } from 'react';
import { playTypewriterClick, playTopicRevealSound } from '../utils/sound';

export interface TypewriterProps {
  text: string;
  speed?: number; // Speed per character in ms (default 90ms for deliberate pace & anticipation)
  delay?: number; // Initial delay in seconds
  baseText?: string;
  className?: string;
  cursorClassName?: string;
}

export function Typewriter({
  text,
  speed = 68,
  delay = 0,
  baseText = '',
  className = '',
  cursorClassName = '',
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  // Handle initial delay
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsStarted(true), delay * 1000);
      return () => clearTimeout(timer);
    } else {
      setIsStarted(true);
    }
  }, [delay]);

  // Whenever target text changes, reset displayed text to start typing
  useEffect(() => {
    setDisplayedText('');
  }, [text]);

  // Typing effect
  useEffect(() => {
    if (!isStarted) return;

    if (displayedText.length < text.length) {
      const nextIndex = displayedText.length;

      const timer = setTimeout(() => {
        const nextChar = text[nextIndex];
        // Only play sound if character is not empty space
        if (nextChar && nextChar.trim() !== '') {
          playTypewriterClick();
        }
        const nextText = text.substring(0, nextIndex + 1);
        setDisplayedText(nextText);
        if (nextText.length === text.length) {
          playTopicRevealSound();
        }
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [displayedText, text, isStarted, speed]);

  const isComplete = displayedText.length === text.length;

  return (
    <span className={`inline text-center whitespace-normal break-words max-w-full ${className}`}>
      {baseText && <span className="mr-1 inline-block">{baseText}</span>}
      <span className="inline break-words">{displayedText}</span>
      <span
        className={`inline-block w-[3px] sm:w-[5px] h-[0.8em] ${
          isComplete ? 'bg-amber-300/80 shadow-[0_0_8px_rgba(252,211,77,0.5)]' : 'bg-white/90 shadow-sm'
        } ml-1.5 animate-pulse rounded-xs align-middle -translate-y-[0.05em] ${cursorClassName}`}
      />
    </span>
  );
}
