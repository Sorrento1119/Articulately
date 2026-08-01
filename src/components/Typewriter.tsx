import React, { useState, useEffect } from 'react';
import { playTypewriterClick, playTopicRevealSound } from '../utils/sound';

export interface TypewriterProps {
  text: string;
  speed?: number; // Speed per character in ms
  delay?: number; // Initial delay in seconds
  baseText?: string;
  className?: string;
  cursorClassName?: string;
}

export function Typewriter({
  text,
  speed = 60,
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
      const timer = setTimeout(() => {
        const nextChar = text[displayedText.length];
        // Only play sound if character is not empty space
        if (nextChar && nextChar.trim() !== '') {
          playTypewriterClick();
        }
        const nextText = text.substring(0, displayedText.length + 1);
        setDisplayedText(nextText);
        if (nextText.length === text.length) {
          playTopicRevealSound();
        }
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [displayedText, text, isStarted, speed]);

  return (
    <span className={`inline-flex items-center justify-center whitespace-nowrap max-w-full overflow-visible py-2 px-1 ${className}`}>
      {baseText && <span className="mr-1 flex-shrink-0">{baseText}</span>}
      <span className="inline-block leading-normal">{displayedText}</span>
      <span
        className={`inline-block flex-shrink-0 w-[2px] sm:w-[4px] h-[0.85em] bg-white/90 ml-1.5 sm:ml-2 animate-pulse rounded-xs shadow-sm align-middle ${cursorClassName}`}
      />
    </span>
  );
}
