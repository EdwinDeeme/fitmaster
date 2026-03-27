'use client';

import { useRef, useEffect, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
}

export function MarqueeText({ text, className = '' }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0); // 0 = start, 1 = end

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const measure = () => {
      const diff = inner.scrollWidth - container.clientWidth;
      setOverflows(diff > 2);
      setOffset(diff > 2 ? diff : 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text]);

  // Track animation progress to know which edges to fade
  useEffect(() => {
    if (!overflows) return;
    const duration = 4000;
    let start: number | null = null;
    let raf: number;
    let forward = true;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(forward ? t : 1 - t);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        forward = !forward;
        start = null;
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [overflows, offset]);

  const fadeLeft  = overflows && progress > 0.05;
  const fadeRight = overflows && progress < 0.95;

  const mask = overflows
    ? fadeLeft && fadeRight
      ? 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)'
      : fadeLeft
      ? 'linear-gradient(to right, transparent 0%, black 8%, black 100%)'
      : 'linear-gradient(to right, black 0%, black 92%, transparent 100%)'
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative ${className}`}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      <span
        ref={innerRef}
        className={overflows ? 'marquee-inner inline-block whitespace-nowrap' : 'inline-block whitespace-nowrap'}
        style={overflows ? ({ '--marquee-offset': `-${offset}px` } as React.CSSProperties) : undefined}
      >
        {text}
      </span>
    </div>
  );
}
