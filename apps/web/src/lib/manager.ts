const TOKEN_KEY_PREFIX = 'bill_admin_token_';

export function setAdminToken(tableId: string, token: string): void {
  localStorage.setItem(`${TOKEN_KEY_PREFIX}${tableId}`, token);
}

export function getAdminToken(tableId: string): string | null {
  return localStorage.getItem(`${TOKEN_KEY_PREFIX}${tableId}`);
}
