import { Injectable, NotFoundException } from '@nestjs/common';
import { Table, ExtractionSnapshot } from '@bill/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TablesService {
  private readonly tables = new Map<string, Table>();
  private readonly codeIndex = new Map<string, string>(); // code → tableId
  private readonly adminTokens = new Map<string, string>(); // tableId → adminToken

  private generateUniqueCode(): string {
    let code: string;
    do {
      code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    } while (this.codeIndex.has(code));
    return code;
  }

  createTable(): Table & { adminToken: string } {
    const code = this.generateUniqueCode();
    const adminToken = uuidv4();
    const table: Table = {
      tableId: uuidv4(),
      createdAt: new Date().toISOString(),
      code,
    };
    this.tables.set(table.tableId, table);
    this.codeIndex.set(code, table.tableId);
    this.adminTokens.set(table.tableId, adminToken);
    return { ...table, adminToken };
  }

  validateAdminToken(tableId: string, token: string): boolean {
    return this.adminTokens.get(tableId) === token;
  }

  getTable(tableId: string): Table {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new NotFoundException({
        code: 'TABLE_NOT_FOUND',
        message: `Table ${tableId} not found`,
      });
    }
    return table;
  }

  getTableByCode(code: string): Table {
    const tableId = this.codeIndex.get(code);
    if (!tableId) {
      throw new NotFoundException({
        code: 'TABLE_NOT_FOUND',
        message: `No table found with code ${code}`,
      });
    }
    return this.getTable(tableId);
  }

  saveExtraction(tableId: string, extraction: ExtractionSnapshot): void {
    const table = this.getTable(tableId);
    this.tables.set(tableId, { ...table, extraction });
  }
}
