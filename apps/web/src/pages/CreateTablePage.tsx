import { PageLayout } from '../components/ui/PageLayout';
import { CreateTableForm } from '../features/create-table/CreateTableForm';

export function CreateTablePage() {
  return (
    <PageLayout showBack title="שולחן חדש">
      <div className="flex flex-col gap-8 mt-6">
        <div>
          <h2 className="text-2xl font-bold text-white">מה שם השולחן?</h2>
          <p className="text-white/50 mt-1">תן שם שיעזור לזהות את הקבוצה</p>
        </div>
        <CreateTableForm />
      </div>
    </PageLayout>
  );
}
