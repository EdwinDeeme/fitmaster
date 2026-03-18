import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-dark',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
