import { Injectable, NotFoundException } from '@nestjs/common';
import { Table } from '@bill/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TablesService {
  private readonly tables = new Map<string, Table>();

  createTable(groupName: string): Table {
    const table: Table = {
      tableId: uuidv4(),
      groupName,
      createdAt: new Date().toISOString(),
    };
    this.tables.set(table.tableId, table);
    return table;
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
}
