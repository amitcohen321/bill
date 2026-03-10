import { useState } from 'react';

interface TableCodeBadgeProps {
  code: string;
}

export function TableCodeBadge({ code }: TableCodeBadgeProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface-elevated border border-surface-border px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-white/40 text-xs font-medium">קוד שולחן</span>
        <span className="text-white font-bold text-2xl tabular-nums tracking-[0.25em]">
          {code}
        </span>
      </div>
      <button
        onClick={handleCopy}
        className="text-xs text-accent hover:text-accent/80 transition-colors font-medium px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/15"
      >
        {copied ? '✓ הועתק' : 'העתק'}
      </button>
    </div>
  );
}
