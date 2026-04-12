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


      <footer className="flex items-center justify-center pb-3 pt-1">
        <a
          href="https://linkly.link/2gJnq"
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="flex items-center gap-1.5 text-white/25 text-xs hover:text-white/50 transition-colors"
        >
          Built with
          <svg className="w-3 h-3 text-accent/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          by <span className="text-accent/60 font-medium">@amitco</span>
        </a>
      </footer>


    </div>
  );
}
