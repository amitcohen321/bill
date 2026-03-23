import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../../components/ui/Card';
import { getTable } from '../../lib/api/tables';

interface QRShareProps {
  tableId: string;
}

export function QRShare({ tableId }: QRShareProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/tables/${tableId}`;

  const { data: table } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTable(tableId),
  });

  function handleCopy() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="flex flex-col items-center gap-4 p-5">
      <div>
        <h3 className="text-white font-semibold text-center text-base">שתף את השולחן</h3>
        <p className="text-white/40 text-sm text-center mt-0.5">
          סרוק או הכנס קוד
        </p>
      </div>

      <div className="rounded-2xl bg-white p-3">
        <QRCodeSVG
          value={url}
          size={126}
          bgColor="#ffffff"
          fgColor="#0a0a14"
          level="M"
        />
      </div>

      {table?.code && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-white/40 text-xs font-medium">קוד הצטרפות לשולחן</span>
          <span className="text-white font-bold text-4xl tabular-nums tracking-[0.2em]">
            {table.code}
          </span>
        </div>
      )}

      <button
        onClick={handleCopy}
        className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
      >
        {copied ? '✓ הועתק!' : 'העתק קישור'}
      </button>
    </Card>
  );
}
