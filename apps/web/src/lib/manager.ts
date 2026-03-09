const STORAGE_KEY = 'bill_managed_tables';

function getManagedTables(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function markAsManager(tableId: string): void {
  const tables = getManagedTables();
  if (!tables.includes(tableId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tables, tableId]));
  }
}

export function isManager(tableId: string): boolean {
  return getManagedTables().includes(tableId);
}
