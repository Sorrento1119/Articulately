import React from 'react';
import { playButtonClick } from '../utils/sound';

export interface TextureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'neutral' | 'outline' | 'destructive' | 'success' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  playSound?: boolean;
}

export const TextureButton = React.forwardRef<HTMLButtonElement, TextureButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      className = '',
      disabled,
      type = 'button',
      playSound = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && playSound) {
        playButtonClick(
          variant === 'primary' || variant === 'accent'
            ? 'primary'
            : variant === 'secondary'
            ? 'secondary'
            : 'neutral'
        );
      }
      if (onClick) {
        onClick(e);
      }
    };
    // Base texture styles with neumorphic undertones (inset top highlight, bottom edge shadow, tactile click effect)
    const baseStyles =
      'relative inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 cursor-pointer select-none overflow-hidden border active:scale-[0.97] active:translate-y-[0.5px] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none';

    // Highlight & inner glow layers
    const textureOverlay =
      'before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/35 before:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:bg-black/25 after:pointer-events-none';

    // Variant color/gradient styling
    const variantStyles = {
      primary:
        'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 border-amber-300/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(245,158,11,0.35),0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-95',
      accent:
        'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-amber-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_10px_rgba(245,158,11,0.4),0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110 active:brightness-95',
      secondary:
        'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-950 border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105 active:brightness-95',
      neutral:
        'bg-gradient-to-b from-white/20 via-white/12 to-white/5 text-white border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:bg-white/25 active:bg-white/10',
      outline:
        'bg-gradient-to-b from-slate-900/80 to-slate-950/90 text-white border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-md hover:border-white/40 hover:bg-white/10',
      destructive:
        'bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white border-red-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(220,38,38,0.4)] hover:brightness-110 active:brightness-95',
      success:
        'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950 border-emerald-300/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(16,185,129,0.35)] hover:brightness-110 active:brightness-95',
      icon:
        'p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-white/20 via-white/10 to-white/5 border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.3)] backdrop-blur-md hover:bg-white/25 active:scale-95',
    };

    // Size styling
    const sizeStyles = {
      sm: 'px-3.5 py-2 text-xs sm:text-sm rounded-2xl font-semibold gap-1.5',
      md: 'px-5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl font-bold gap-2',
      lg: 'px-7 py-3.5 sm:py-4 text-sm sm:text-base rounded-2xl font-extrabold gap-2.5',
    };

    const finalClasses = `${baseStyles} ${textureOverlay} ${variantStyles[variant]} ${
      variant === 'icon' ? '' : sizeStyles[size]
    } ${className}`.trim();

    return (
      <button ref={ref} type={type} className={finalClasses} disabled={disabled} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);

TextureButton.displayName = 'TextureButton';
