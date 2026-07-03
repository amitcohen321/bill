import type { Diner } from '@bill/shared';

interface DinersStatusProps {
  diners: Diner[];
  myDinerId: string | null;
}

export function DinersStatus({ diners, myDinerId }: DinersStatusProps) {
  if (diners.length === 0) return null;

  const doneCount = diners.filter((d) => d.isDone).length;

  return (
    <div className="bg-surface-card border-surface-border rounded-2xl border p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        סטטוס סועדים
      </p>
      <div className="flex flex-col gap-2">
        {diners.map((diner) => {
          const isMe = diner.dinerId === myDinerId;
          return (
            <div
              key={diner.dinerId}
              className={[
                'flex items-center justify-between rounded-2xl px-3 py-2',
                isMe
                  ? 'bg-accent/20 border-accent/40 border'
                  : 'bg-surface-elevated',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{diner.animal}</span>
                <div className="flex flex-col">
                  {diner.name && (
                    <span className="text-base font-semibold leading-tight text-white">
                      {diner.name}
                    </span>
                  )}
                  <span className="text-sm text-white/60">
                    {diner.isDone ? '✅ סיים לבחור' : 'עדיין בוחר...'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMe && <span className="text-accent text-xs font-medium">אתה</span>}
                {diner.isAdmin && (
                  <span className="text-accent text-xs font-medium">מנהל</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-white/40">
        {doneCount} / {diners.length} סיימו
      </p>
    </div>
  );
}
