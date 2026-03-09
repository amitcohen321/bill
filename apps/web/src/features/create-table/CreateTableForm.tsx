import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CreateTableRequestSchema, type CreateTableRequest } from '@bill/shared';
import { createTable } from '../../lib/api/tables';
import { markAsManager } from '../../lib/manager';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ApiError } from '../../lib/api/client';

export function CreateTableForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTableRequest>({
    resolver: zodResolver(CreateTableRequestSchema),
  });

  const mutation = useMutation({
    mutationFn: createTable,
    onSuccess: (table) => {
      markAsManager(table.tableId);
      navigate(`/tables/${table.tableId}/scan`);
    },
  });

  const onSubmit = (data: CreateTableRequest) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Input
        label="שם השולחן / הקבוצה"
        placeholder="למשל: חגיגת יום הולדת של דנה"
        error={errors.groupName?.message}
        autoFocus
        autoComplete="off"
        {...register('groupName')}
      />

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
