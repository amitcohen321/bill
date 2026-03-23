import type { Diner } from '@bill/shared';

interface ParticipantBarProps {
  diners: Diner[];
  myDinerId: string | null;
}

export function ParticipantBar({ diners, myDinerId }: ParticipantBarProps) {
  if (diners.length === 0) return null;

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border px-4 py-3">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">סועדים</p>
      <div className="flex flex-wrap gap-2">
        {diners.map((diner) => {
          const isMe = diner.dinerId === myDinerId;
          return (
            <div
              key={diner.dinerId}
              className={[
                'flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-base',
                isMe
                  ? 'bg-accent/20 border border-accent/40'
                  : 'bg-surface-elevated border border-surface-border',
              ].join(' ')}
            >
              <span className="text-2xl leading-none">{diner.animal}</span>
              {diner.name && <span className="text-white text-sm font-medium">{diner.name}</span>}
              {isMe && (
                <span className="text-accent text-xs font-medium">אתה</span>
              )}
              {diner.isAdmin && !isMe && (
                <span className="text-white/30 text-xs">מנהל</span>
              )}
              {diner.isDone && (
                <span className="text-emerald-400 text-xs font-medium">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
