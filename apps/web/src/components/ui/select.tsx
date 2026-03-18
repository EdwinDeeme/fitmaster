'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, ...props }, ref) => {
    const options = React.Children.toArray(children).filter(
      (c): c is React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>> =>
        React.isValidElement(c) && (c.type === 'option' || (c as any).type?.displayName === 'option'),
    );

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string>(
      String(value ?? defaultValue ?? options[0]?.props.value ?? ''),
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenRef    = useRef<HTMLSelectElement>(null);

    // sync controlled value
    useEffect(() => {
      if (value !== undefined) setSelected(String(value));
    }, [value]);

    // close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedLabel = options.find(o => String(o.props.value) === selected)?.props.children ?? selected;

    const handleSelect = (val: string) => {
      setSelected(val);
      setOpen(false);
      // fire synthetic onChange so react-hook-form picks it up
      if (hiddenRef.current) {
        const nativeInput = hiddenRef.current;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
        nativeSetter?.call(nativeInput, val);
        nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    return (
      <div ref={containerRef} className="relative w-full">
        {/* Hidden native select for form compatibility */}
        <select
          ref={(node) => {
            (hiddenRef as any).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as any).current = node;
          }}
          value={selected}
          onChange={e => { setSelected(e.target.value); onChange?.(e); }}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          {...props}
        >
          {children}
        </select>

        {/* Custom trigger */}
        <button
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
          <span className={cn(!selected && 'text-gray-400')}>{selectedLabel || 'Seleccionar...'}</span>
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        {open && (
          <ul className="absolute z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
            {options.map((opt, i) => {
              const val   = String(opt.props.value ?? '');
              const label = opt.props.children;
              const isSelected = val === selected;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleSelect(val)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors',
                      isSelected
                        ? 'bg-primary text-dark font-medium'
                        : 'text-dark hover:bg-primary/20',
                    )}
                  >
                    {label}
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
export { Select };
