import { useMemo, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '../components/ui/PageLayout';
import { ItemList } from '../features/bill-review/ItemList';
import { QRShare } from '../features/bill-review/QRShare';
import { ParticipantBar } from '../features/session/ParticipantBar';
import { ResultsView } from '../features/session/ResultsView';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getTable } from '../lib/api/tables';
import { isManager } from '../lib/manager';
import { useTableSession } from '../hooks/useTableSession';

export function GuestTablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const admin = isManager(tableId ?? '');
  const [nameInput, setNameInput] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);

  const { data: table, isLoading, isError } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTable(tableId!),
    enabled: !!tableId,
    retry: 1,
  });

  const { sessionState, myDinerId, isConnected, connectionError, toggleItem, setDone, calculate } =
    useTableSession(tableId ?? '', admin, nameSubmitted ? nameInput || undefined : undefined, nameSubmitted);

  const extraction = table?.extraction;

  const itemParticipants = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!sessionState) return map;
    for (const diner of sessionState.diners) {
      for (const itemId of diner.selectedItemIds) {
        const list = map.get(itemId) ?? [];
        list.push(diner.animal);
        map.set(itemId, list);
      }
    }
    return map;
  }, [sessionState]);

  const mySelectedIds = useMemo(() => {
    const myDiner = sessionState?.diners.find((d) => d.dinerId === myDinerId);
    return new Set<string>(myDiner?.selectedItemIds ?? []);
  }, [sessionState, myDinerId]);

  if (!tableId) return <Navigate to="/" replace />;

  const myDiner = sessionState?.diners.find((d) => d.dinerId === myDinerId);
  const hasResults = !!sessionState?.results;
  const allDone =
    (sessionState?.diners.length ?? 0) > 0 &&
    sessionState?.diners.every((d) => d.isDone);
  const someDone = !allDone && (sessionState?.diners.some((d) => d.isDone) ?? false);

  // Show name input dialog if not submitted yet
  if (!nameSubmitted) {
    return (
      <PageLayout title="שולחן">
        <div className="flex flex-col gap-6 mt-6 pb-32">
          {/* Back to home button */}
          <button
            onClick={() => navigate('/')}
            className="text-accent hover:text-accent/80 transition-colors text-sm font-medium inline-flex items-center gap-1 w-fit"
          >
            ← חזור לעמוד הבית
          </button>

          <div className="flex flex-col gap-6 mt-14 max-w-md mx-auto">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">הוסף את שמך</h2>
              <p className="text-white/40 text-sm">לא חובה - הקש הכנס לדלג</p>
            </div>

            <Input
              placeholder="שמך (אופציונלי)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setNameSubmitted(true);
                }
              }}
            />

            <Button
              size="lg"
              fullWidth
              onClick={() => setNameSubmitted(true)}
            >
              הכנס
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="שולחן">
      <div className="flex flex-col gap-6 mt-6 pb-32">

        {/* Back to home button */}
        <button
          onClick={() => navigate('/')}
          className="text-accent hover:text-accent/80 transition-colors text-sm font-medium inline-flex items-center gap-1 w-fit"
        >
          ← חזור לעמוד הבית
        </button>

        {/* Connection status */}
        {!isConnected && !connectionError && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
            <span>מתחבר...</span>
          </div>
        )}
        {connectionError && (
          <div className="rounded-2xl bg-red-950 border border-red-800/50 p-4 text-red-300 text-sm">
            {connectionError}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-white/40 text-sm">טוען את השולחן...</p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl bg-red-950 border border-red-800/50 p-6 text-center">
            <p className="text-red-300 font-medium">לא ניתן למצוא את השולחן</p>
            <p className="text-red-400/60 text-sm mt-1">ודא שהקישור תקין ונסה שוב</p>
          </div>
        )}

        {/* My identity */}
        {myDiner && (
          <div className="flex items-center gap-2">
            <span className="text-3xl">{myDiner.animal}</span>
            <div>
              {myDiner.name && <p className="text-white font-medium">{myDiner.name}</p>}
              <p className="text-white/40 text-xs">אתה</p>
              {myDiner.isAdmin && <p className="text-accent text-xs font-medium">מנהל שולחן</p>}
            </div>
          </div>
        )}

        {/* Participants */}
        {sessionState && sessionState.diners.length > 0 && (
          <ParticipantBar diners={sessionState.diners} myDinerId={myDinerId} />
        )}

        {/* Admin: share QR */}
        {admin && extraction && !hasResults && <QRShare tableId={tableId} />}

        {/* Admin: retake photo */}
        {admin && extraction && !hasResults && (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => navigate(`/tables/${tableId}/scan`)}
          >
            צלם קבלה שוב
          </Button>
        )}

        {/* Admin: participants status */}
        {admin && sessionState && sessionState.diners.length > 0 && !hasResults && (
          <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">סטטוס סועדים</p>
            <div className="flex flex-col gap-2">
              {sessionState.diners.map((diner) => (
                <div
                  key={diner.dinerId}
                  className="flex items-center justify-between py-2 px-3 rounded-2xl bg-surface-elevated"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{diner.animal}</span>
                    <div className="flex flex-col">
                      {diner.name && <span className="text-white text-sm font-medium">{diner.name}</span>}
                      <span className="text-white/60 text-sm">
                        {diner.isDone ? '✓ סיים לבחור' : '⏳ עדיין בוחר'}
                      </span>
                    </div>
                  </div>
                  {diner.isAdmin && (
                    <span className="text-accent text-xs font-medium">מנהל</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-3">
              {sessionState.diners.filter((d) => d.isDone).length} / {sessionState.diners.length} סיימו
            </p>
          </div>
        )}

        {/* Waiting for scan */}
        {table && !extraction && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <p className="text-white font-semibold text-lg">ממתין לסריקת החשבון</p>
            <p className="text-white/40 text-sm">מנהל השולחן עוד לא סרק את החשבון</p>
          </div>
        )}

        {/* Results view */}
        {hasResults && extraction && (
          <ResultsView
            results={sessionState!.results!}
            myDinerId={myDinerId}
            items={extraction.items}
            admin={admin}
          />
        )}

        {/* Item selection */}
        {extraction && !hasResults && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-white">בחר את הפריטים שלך</h2>
            </div>

            <ItemList
              items={extraction.items}
              currency={extraction.currency}
              warnings={extraction.warnings}
              selectedIds={mySelectedIds}
              onToggle={toggleItem}
              itemParticipants={itemParticipants}
              isDone={myDiner?.isDone}
              onSetDone={setDone}
            />
          </>
        )}

        {/* Admin: calculate */}
        {admin && extraction && !hasResults && (
          <div className="flex flex-col gap-3 pt-2">
            {someDone && (
              <p className="text-yellow-400/70 text-sm text-center">
                לא כולם סיימו לבחור
              </p>
            )}
            <Button size="lg" fullWidth onClick={calculate}>
              חשב חלוקה
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
