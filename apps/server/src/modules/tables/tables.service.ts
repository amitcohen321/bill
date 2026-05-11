import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Table, ExtractionSnapshot } from '@bill/shared';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface PersistedData {
  tables: Record<string, Table>;
  adminTokens: Record<string, string>;
}

function resolveDataDir(): string {
  // On Render the working directory is the project root; prefer a writable data dir
  const candidates = [
    join(process.cwd(), 'data'),
    join(__dirname, '..', '..', '..', '..', '..', 'data'),
  ];
  for (const dir of candidates) {
    try {
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // try next
    }
  }
  return candidates[0]!;
}

const DATA_FILE = join(resolveDataDir(), 'tables.json');

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);
  private readonly tables = new Map<string, Table>();
  private readonly codeIndex = new Map<string, string>(); // code → tableId
  private readonly adminTokens = new Map<string, string>(); // tableId → adminToken

  constructor() {
    this.load();
  }

  private load(): void {
    if (!existsSync(DATA_FILE)) return;
    try {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw) as PersistedData;
      for (const [id, table] of Object.entries(data.tables ?? {})) {
        this.tables.set(id, table);
        this.codeIndex.set(table.code, id);
      }
      for (const [id, token] of Object.entries(data.adminTokens ?? {})) {
        this.adminTokens.set(id, token);
      }
      this.logger.log(`Loaded ${this.tables.size} table(s) from ${DATA_FILE}`);
    } catch (err) {
      this.logger.warn(`Failed to load persisted tables: ${String(err)}`);
    }
  }

  private save(): void {
    try {
      const data: PersistedData = {
        tables: Object.fromEntries(this.tables),
        adminTokens: Object.fromEntries(this.adminTokens),
      };
      writeFileSync(DATA_FILE, JSON.stringify(data), 'utf-8');
    } catch (err) {
      this.logger.warn(`Failed to persist tables: ${String(err)}`);
    }
  }

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
    this.save();
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
    this.save();
  }
}
