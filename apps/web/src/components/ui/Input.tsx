import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-white/80">{label}</label>
        )}
        <input
          ref={ref}
          className={[
            'w-full h-12 px-4 rounded-2xl bg-surface-elevated border text-white placeholder:text-white/30',
            'transition-colors duration-200 outline-none',
            'focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
            error
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
              : 'border-surface-border',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && hint && <p className="text-xs text-white/40">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
