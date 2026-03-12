import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: {
      circle: 'w-8 h-8',
      text: 'text-xs',
      logoText: 'text-xl',
    },
    md: {
      circle: 'w-10 h-10',
      text: 'text-sm',
      logoText: 'text-2xl',
    },
    lg: {
      circle: 'w-12 h-12',
      text: 'text-base',
      logoText: 'text-3xl',
    },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Círculo verde con FM */}
      <div
        className={`${sizes[size].circle} bg-primary rounded-full flex items-center justify-center flex-shrink-0`}
      >
        <span className={`font-bold text-dark ${sizes[size].text}`}>FM</span>
      </div>
      {/* Texto FitMaster */}
      <span className={`font-bold text-dark ${sizes[size].logoText}`}>
        FitMaster
      </span>
    </div>
  );
}
