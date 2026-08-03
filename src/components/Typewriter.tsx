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
    <span className={`inline text-center whitespace-normal break-words max-w-full ${className}`}>
      {baseText && <span className="mr-1 inline-block">{baseText}</span>}
      <span className="inline break-words">{displayedText}</span>
      <span
        className={`inline-block w-[3px] sm:w-[5px] h-[0.8em] bg-white/90 ml-1.5 animate-pulse rounded-xs shadow-sm align-middle -translate-y-[0.05em] ${cursorClassName}`}
      />
    </span>
  );
}
