import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ANIMAL_EMOJIS, type SessionState, type CalculationResult } from '@bill/shared';
import { TablesService } from '../tables/tables.service';

interface DinerRecord {
  dinerId: string;
  animal: string;
  isAdmin: boolean;
  selectedItemIds: string[];
  isDone: boolean;
  socketId: string;
}

interface SessionRecord {
  tableId: string;
  diners: Map<string, DinerRecord>; // dinerId → DinerRecord
  socketToDiner: Map<string, string>; // socketId → dinerId
  results?: CalculationResult;
}

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionRecord>();

  private getOrCreateSession(tableId: string): SessionRecord {
    let session = this.sessions.get(tableId);
    if (!session) {
      session = {
        tableId,
        diners: new Map(),
        socketToDiner: new Map(),
      };
      this.sessions.set(tableId, session);
    }
    return session;
  }

  private assignAnimal(session: SessionRecord): string {
    const usedAnimals = new Set([...session.diners.values()].map((d) => d.animal));
    const available = ANIMAL_EMOJIS.find((a) => !usedAnimals.has(a));
    if (available) return available;
    const idx = session.diners.size % ANIMAL_EMOJIS.length;
    const suffix = Math.floor(session.diners.size / ANIMAL_EMOJIS.length) + 1;
    return `${ANIMAL_EMOJIS[idx]}${suffix}`;
  }

  joinTable(
    tableId: string,
    socketId: string,
    isAdmin: boolean,
  ): { dinerId: string; session: SessionRecord } {
    const session = this.getOrCreateSession(tableId);
    const animal = this.assignAnimal(session);
    const dinerId = uuidv4();
    const diner: DinerRecord = {
      dinerId,
      animal,
      isAdmin,
      selectedItemIds: [],
      isDone: false,
      socketId,
    };
    session.diners.set(dinerId, diner);
    session.socketToDiner.set(socketId, dinerId);
    return { dinerId, session };
  }

  leaveTable(socketId: string): { tableId: string | null; session: SessionRecord | null } {
    for (const [tableId, session] of this.sessions) {
      const dinerId = session.socketToDiner.get(socketId);
      if (dinerId !== undefined) {
        session.diners.delete(dinerId);
        session.socketToDiner.delete(socketId);
        return { tableId, session };
      }
    }
    return { tableId: null, session: null };
  }

  toggleItem(
    socketId: string,
    itemId: string,
  ): { tableId: string | null; session: SessionRecord | null } {
    for (const [tableId, session] of this.sessions) {
      const dinerId = session.socketToDiner.get(socketId);
      if (dinerId !== undefined) {
        const diner = session.diners.get(dinerId);
        if (diner) {
          const idx = diner.selectedItemIds.indexOf(itemId);
          if (idx === -1) {
            diner.selectedItemIds.push(itemId);
          } else {
            diner.selectedItemIds.splice(idx, 1);
          }
          diner.isDone = false;
        }
        return { tableId, session };
      }
    }
    return { tableId: null, session: null };
  }

  setDone(socketId: string): { tableId: string | null; session: SessionRecord | null } {
    for (const [tableId, session] of this.sessions) {
      const dinerId = session.socketToDiner.get(socketId);
      if (dinerId !== undefined) {
        const diner = session.diners.get(dinerId);
        if (diner) {
          diner.isDone = !diner.isDone;
        }
        return { tableId, session };
      }
    }
    return { tableId: null, session: null };
  }

  calculate(
    socketId: string,
    tablesService: TablesService,
  ): { tableId: string | null; session: SessionRecord | null; error?: string } {
    for (const [tableId, session] of this.sessions) {
      const dinerId = session.socketToDiner.get(socketId);
      if (dinerId !== undefined) {
        const diner = session.diners.get(dinerId);
        if (!diner?.isAdmin) {
          return { tableId, session, error: 'Only the admin can calculate' };
        }

        let table;
        try {
          table = tablesService.getTable(tableId);
        } catch {
          return { tableId, session, error: 'Table not found' };
        }

        if (!table.extraction) {
          return { tableId, session, error: 'No bill extracted yet' };
        }

        const { items, currency } = table.extraction;
        const priceMap = new Map<string, number>(items.map((item) => [item.id, item.price]));

        // Count how many diners selected each item (for equal split)
        const itemParticipantCount = new Map<string, number>();
        for (const d of session.diners.values()) {
          for (const itemId of d.selectedItemIds) {
            itemParticipantCount.set(itemId, (itemParticipantCount.get(itemId) ?? 0) + 1);
          }
        }

        const dinerResults = [...session.diners.values()].map((d) => {
          let total = 0;
          for (const itemId of d.selectedItemIds) {
            const price = priceMap.get(itemId) ?? 0;
            const count = itemParticipantCount.get(itemId) ?? 1;
            total += price / count;
          }
          return {
            dinerId: d.dinerId,
            animal: d.animal,
            selectedItemIds: [...d.selectedItemIds],
            total: Math.round(total * 100) / 100,
          };
        });

        const results: CalculationResult = {
          dinerResults,
          currency,
          calculatedAt: new Date().toISOString(),
        };
        session.results = results;
        return { tableId, session };
      }
    }
    return { tableId: null, session: null };
  }

  toSessionState(session: SessionRecord): SessionState {
    return {
      tableId: session.tableId,
      diners: [...session.diners.values()].map((d) => ({
        dinerId: d.dinerId,
        animal: d.animal,
        isAdmin: d.isAdmin,
        selectedItemIds: [...d.selectedItemIds],
        isDone: d.isDone,
      })),
      results: session.results,
    };
  }
}
