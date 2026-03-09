import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ glow = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-3xl bg-surface-card border border-surface-border shadow-card',
        glow && 'shadow-glow border-accent/20 bg-gradient-card',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
