import { useMemo, useRef, useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '../components/ui/PageLayout';
import { ItemList } from '../features/bill-review/ItemList';
import { TipSelector } from '../features/bill-review/TipSelector';
import { SelectionBar } from '../features/bill-review/SelectionBar';
import { QRShare } from '../features/bill-review/QRShare';
import { ResultsView } from '../features/session/ResultsView';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getTable } from '../lib/api/tables';
import { getAdminToken } from '../lib/manager';
import { useTableSession } from '../hooks/useTableSession';

function getPersistedName(tableId: string): string {
  return localStorage.getItem(`bill_name_${tableId}`) ?? '';
}

export function GuestTablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const adminToken = getAdminToken(tableId ?? '');
  const admin = !!adminToken;

  const persistedName = tableId ? getPersistedName(tableId) : '';
  const [nameInput, setNameInput] = useState(persistedName);
  const [nameSubmitted, setNameSubmitted] = useState(persistedName !== '');
  const [submittedName, setSubmittedName] = useState<string | undefined>(
    persistedName || undefined,
  );
  const [showItemSelection, setShowItemSelection] = useState(false);
  const nameRef = useRef(persistedName);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    nameRef.current = e.target.value;
    setNameInput(e.target.value);
  };

  const handleNameSubmit = () => {
    const name = nameRef.current.trim() || undefined;
    if (tableId) {
      localStorage.setItem(`bill_name_${tableId}`, name ?? '');
    }
    setSubmittedName(name);
    setNameSubmitted(true);
  };

  const {
    data: table,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTable(tableId!),
    enabled: !!tableId,
    retry: 1,
  });

  const {
    sessionState,
    myDinerId,
    isConnected,
    connectionError,
    toggleItem,
    setDone,
    reduceItem,
    calculate,
  } = useTableSession(tableId ?? '', adminToken, submittedName, nameSubmitted);

  // When new results arrive (recalculated), show results view again
  useEffect(() => {
    if (sessionState?.results) {
      setShowItemSelection(false);
    }
  }, [sessionState?.results?.calculatedAt]);

  const extraction = table?.extraction;

  const itemParticipants = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!sessionState) return map;
    for (const diner of sessionState.diners) {
      for (const itemId of diner.selectedItemIds) {
        const list = map.get(itemId) ?? [];
        list.push(diner.name ? `${diner.animal} ${diner.name}` : diner.animal);
        map.set(itemId, list);
      }
    }
    return map;
  }, [sessionState]);

  const mySelectedIds = useMemo(() => {
    const myDiner = sessionState?.diners.find((d) => d.dinerId === myDinerId);
    return new Set<string>(myDiner?.selectedItemIds ?? []);
  }, [sessionState, myDinerId]);

  const [tipPercent, setTipPercent] = useState(0);
  const [fractionMap, setFractionMap] = useState<Map<string, number>>(new Map());

  function handleFractionChange(itemId: string, fraction: number | undefined) {
    setFractionMap((prev) => {
      const next = new Map(prev);
      if (fraction === undefined) {
        next.delete(itemId);
      } else {
        next.set(itemId, fraction);
      }
      return next;
    });
  }

  const selectedSubtotal = useMemo(() => {
    if (!extraction) return 0;
    return extraction.items
      .filter((item) => mySelectedIds.has(item.id))
      .reduce((sum, item) => {
        const reduction = sessionState?.itemReductions?.[item.id] ?? 0;
        const basePrice = Math.max(0, item.price - reduction);
        const fraction = fractionMap.get(item.id);
        return sum + (fraction !== undefined ? basePrice * fraction : basePrice);
      }, 0);
  }, [extraction, mySelectedIds, sessionState?.itemReductions, fractionMap]);

  if (!tableId) return <Navigate to="/" replace />;

  const myDiner = sessionState?.diners.find((d) => d.dinerId === myDinerId);
  const hasResults = !!sessionState?.results;
  const allDone =
    (sessionState?.diners.length ?? 0) > 0 && sessionState?.diners.every((d) => d.isDone);

  // Show name input dialog if not submitted yet
  if (!nameSubmitted) {
    return (
      <PageLayout>
        <div className="mt-6 flex flex-col gap-6 pb-32">
          {/* Back to home button */}
          <button
            onClick={() => navigate('/')}
            className="text-accent hover:text-accent/80 inline-flex w-fit items-center gap-1 text-sm font-medium transition-colors"
          >
           → חזור לעמוד הבית 
          </button>

          <div className="mx-auto mt-14 flex max-w-md flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">הוסף את שמך</h2>
            </div>

            <Input
              placeholder="(אופציונלי)"
              value={nameInput}
              onChange={handleNameChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit();
                }
              }}
            />

            <Button size="lg" fullWidth onClick={handleNameSubmit}>
              אישור
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mt-6 flex flex-col gap-6 pb-32">
        {/* Back to home button */}
        <button
          onClick={() => {
            sessionStorage.setItem('bill_last_table', tableId);
            navigate('/');
          }}
          className="text-accent hover:text-accent/80 inline-flex w-fit items-center gap-1 text-sm font-medium transition-colors"
        >
         → חזור לעמוד הבית 
        </button>

        {/* Connection status */}
        {!isConnected && !connectionError && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-transparent" />
            <span>מתחבר...</span>
          </div>
        )}
        {connectionError && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950 p-4 text-sm text-red-300">
            {connectionError}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-sm text-white/40">טוען את השולחן...</p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950 p-6 text-center">
            <p className="font-medium text-red-300">לא ניתן למצוא את השולחן</p>
            <p className="mt-1 text-sm text-red-400/60">ודא שהקישור תקין ונסה שוב</p>
          </div>
        )}

        {/* My identity */}
        {myDiner && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-3xl">{myDiner.animal}</span>
            <div>
              {(myDiner.name || submittedName) && (
                <p className="font-medium text-white">{myDiner.name || submittedName}</p>
              )}
              <p className="text-xs text-white/40">אתה</p>
              {myDiner.isAdmin && <p className="text-accent text-xs font-medium">מנהל שולחן</p>}
            </div>
          </div>
        )}

        {/* Admin: share QR */}
        {admin && extraction && !hasResults && <QRShare tableId={tableId} />}

        {/* Admin: re-scan */}
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

        {/* Waiting for scan */}
        {table && !extraction && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-lg font-semibold text-white">ממתין לסריקת החשבון</p>
            <p className="text-sm text-white/40">מנהל השולחן עוד לא סרק את החשבון</p>
          </div>
        )}

        {/* Results view */}
        {hasResults && !showItemSelection && extraction && (
          <ResultsView
            results={sessionState!.results!}
            myDinerId={myDinerId}
            items={extraction.items}
            admin={admin}
            onGoBack={() => setShowItemSelection(true)}
          />
        )}

        {/* Admin: recalculate (shown when results exist but someone changed their items) */}
        {admin && hasResults && !showItemSelection && sessionState?.resultsStale && (
          <Button size="lg" fullWidth onClick={calculate}>
            התבצעו שינויים - חשב מחדש
          </Button>
        )}

        {/* Item selection */}
        {extraction && (!hasResults || showItemSelection) && (
          <>
            <h2 className="text-2xl font-bold text-white">בחר את הפריטים שלך</h2>

            <ItemList
              items={extraction.items}
              currency={extraction.currency}
              warnings={extraction.warnings}
              selectedIds={mySelectedIds}
              onToggle={toggleItem}
              itemParticipants={itemParticipants}
              isDone={myDiner?.isDone}
              onSetDone={setDone}
              admin={admin}
              itemReductions={sessionState?.itemReductions}
              onReduceItem={admin ? reduceItem : undefined}
              fractionMap={fractionMap}
              onFractionChange={handleFractionChange}
            />
          </>
        )}

        <SelectionBar
          count={mySelectedIds.size}
          subtotal={selectedSubtotal}
          tipPercent={tipPercent}
          currency={extraction?.currency ?? 'ILS'}
        />

        {/* Admin: calculate (first time) / recalculate (when editing) */}
        {admin && extraction && (!hasResults || showItemSelection) && (
          <div className="flex flex-col gap-3 pt-2">
            {/* Participants status */}
            {sessionState && sessionState.diners.length > 0 && (
              <div className="bg-surface-card border-surface-border rounded-2xl border p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  סטטוס סועדים
                </p>
                <div className="flex flex-col gap-2">
                  {sessionState.diners.map((diner) => (
                    <div
                      key={diner.dinerId}
                      className="bg-surface-elevated flex items-center justify-between rounded-2xl px-3 py-2"
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
                      {diner.isAdmin && (
                        <span className="text-accent text-xs font-medium">מנהל</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/40">
                  {sessionState.diners.filter((d) => d.isDone).length} /{' '}
                  {sessionState.diners.length} סיימו
                </p>
              </div>
            )}
            <Button size="lg" fullWidth onClick={calculate} disabled={!allDone}>
              {hasResults ? 'התבצעו שינויים - חשב מחדש' : 'כולם בחרו - חשב חלוקה'}
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
