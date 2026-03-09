import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  className?: string;
}

export function PageLayout({ children, title, showBack = false, className = '' }: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen-safe flex flex-col bg-surface">
      {(showBack || title) && (
        <header className="flex items-center gap-3 px-4 pt-safe-top pb-2 pt-4">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-border text-white/70 hover:text-white transition-colors"
              aria-label="חזור"
            >
              <svg
                className="w-5 h-5 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {title && <h1 className="text-xl font-semibold text-white">{title}</h1>}
        </header>
      )}
      <main className={['flex-1 flex flex-col px-4 pb-6', className].filter(Boolean).join(' ')}>
        {children}
      </main>
    </div>
  );
}
