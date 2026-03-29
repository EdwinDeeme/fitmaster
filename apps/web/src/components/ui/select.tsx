'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, ...props }, ref) => {
    const options = React.Children.toArray(children).filter(
      (c): c is React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>> =>
        React.isValidElement(c) &&
        (c.type === 'option' || (c as any).type?.displayName === 'option'),
    );

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
      String(value ?? defaultValue ?? options[0]?.props.value ?? ''),
    );
    const selected = isControlled ? String(value) : internalValue;

    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);

    // Keep onChange stable
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; });

    // Sync controlled value
    useEffect(() => {
      if (isControlled) setInternalValue(String(value));
    }, [value, isControlled]);

    // Measure trigger position when opening
    useLayoutEffect(() => {
      if (open && triggerRef.current) {
        setRect(triggerRef.current.getBoundingClientRect());
      }
    }, [open]);

    // Close on outside click — check both trigger and dropdown
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current?.contains(target) ||
          dropdownRef.current?.contains(target)
        ) return;
        setOpen(false);
      };
      // Use capture so it fires before anything else
      document.addEventListener('mousedown', handler, true);
      return () => document.removeEventListener('mousedown', handler, true);
    }, [open]);

    // Close on scroll/resize to avoid stale position
    useEffect(() => {
      if (!open) return;
      const close = () => setOpen(false);
      window.addEventListener('scroll', close, true);
      window.addEventListener('resize', close);
      return () => {
        window.removeEventListener('scroll', close, true);
        window.removeEventListener('resize', close);
      };
    }, [open]);

    const selectedLabel =
      options.find(o => String(o.props.value) === selected)?.props.children ?? selected;

    const handleSelect = useCallback((val: string) => {
      setInternalValue(val);
      setOpen(false);
      onChangeRef.current?.({
        target: { value: val } as HTMLSelectElement,
        currentTarget: { value: val } as HTMLSelectElement,
      } as React.ChangeEvent<HTMLSelectElement>);
    }, []);

    const DROPDOWN_HEIGHT = options.length * 44; // approx height per option

    const dropdownStyle: React.CSSProperties = rect
      ? (() => {
          const spaceBelow = window.innerHeight - rect.bottom - 8;
          const spaceAbove = rect.top - 8;
          const openUpward = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;
          return {
            position: 'fixed',
            ...(openUpward
              ? { bottom: window.innerHeight - rect.top + 4 }
              : { top: rect.bottom + 4 }),
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
          };
        })()
      : { display: 'none' };

    return (
      <>
        <div className="relative w-full">
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            onClick={() => setOpen(o => !o)}
            className={cn(
              'flex h-12 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 text-sm text-dark',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              open && 'ring-2 ring-primary border-transparent',
              className,
            )}
          >
            <span className={cn('text-left truncate', !selected && 'text-gray-400')}>
              {selectedLabel || 'Seleccionar...'}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform shrink-0 ml-2',
                open && 'rotate-180',
              )}
            />
          </button>
        </div>

        {open && typeof document !== 'undefined' &&
          createPortal(
            <ul
              ref={dropdownRef}
              style={dropdownStyle}
              className="rounded-xl border border-gray-100 bg-white shadow-xl"
            >
              {options.map((opt, i) => {
                const val = String(opt.props.value ?? '');
                const label = opt.props.children;
                const isSelected = val === selected;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(val)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors',
                        isSelected
                          ? 'bg-primary text-dark font-medium'
                          : 'text-dark hover:bg-primary/20',
                      )}
                    >
                      <span className="text-left">{label}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}
      </>
    );
  },
);

Select.displayName = 'Select';
export { Select };
