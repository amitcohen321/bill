import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createTable } from '../../lib/api/tables';
import { setAdminToken } from '../../lib/manager';
import { Button } from '../../components/ui/Button';
import { ApiError } from '../../lib/api/client';

export function CreateTableForm() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createTable,
    onSuccess: (table) => {
      setAdminToken(table.tableId, table.adminToken);
      navigate(`/tables/${table.tableId}/scan`);
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="flex flex-col gap-6"
    >
      {mutation.isError && (
        <div className="rounded-2xl bg-red-950 border border-red-800/50 p-4 text-red-300 text-sm">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : 'שגיאה ביצירת השולחן. נסה שוב.'}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={mutation.isPending}>
        {mutation.isPending ? 'יוצר שולחן...' : 'צור שולחן'}
      </Button>
    </form>
  );
}
