import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ANIMAL_EMOJIS, type SessionState, type CalculationResult } from '@bill/shared';
import { TablesService } from '../tables/tables.service';

interface DinerRecord {
  dinerId: string;
  animal: string;
  name?: string;
  isAdmin: boolean;
  selectedItemIds: string[];
  isDone: boolean;
  socketId: string;
}

interface SessionRecord {
  tableId: string;
  diners: Map<string, DinerRecord>; // dinerId → DinerRecord
  socketToDiner: Map<string, string>; // socketId → dinerId
  itemReductions: Map<string, number>; // itemId → amount already paid
  results?: CalculationResult;
  resultsStale: boolean;
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
        itemReductions: new Map(),
        resultsStale: false,
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
    name?: string,
  ): { dinerId: string; session: SessionRecord } {
    const session = this.getOrCreateSession(tableId);
    const alreadyHasAdmin = [...session.diners.values()].some((d) => d.isAdmin);
    const grantAdmin = isAdmin && !alreadyHasAdmin;
    const animal = this.assignAnimal(session);
    const dinerId = uuidv4();
    const diner: DinerRecord = {
      dinerId,
      animal,
      ...(name ? { name } : {}),
      isAdmin: grantAdmin,
      selectedItemIds: [],
      isDone: false,
      socketId,
    };
    session.diners.set(dinerId, diner);
    session.socketToDiner.set(socketId, dinerId);
    return { dinerId, session };
  }

  setName(socketId: string, name: string): { tableId: string | null; session: SessionRecord | null } {
    for (const [tableId, session] of this.sessions) {
      const dinerId = session.socketToDiner.get(socketId);
      if (dinerId !== undefined) {
        const diner = session.diners.get(dinerId);
        if (diner) {
          diner.name = name;
        }
        return { tableId, session };
      }
    }
    return { tableId: null, session: null };
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
          if (session.results) {
            session.resultsStale = true;
          }
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

  reduceItem(
    socketId: string,
    itemId: string,
    amount: number,
  ): { tableId: string | null; session: SessionRecord | null; error?: string } {
    for (const [tableId, session] of this.sessions) {
      const dinerId = session.socketToDiner.get(socketId);
      if (dinerId !== undefined) {
        const diner = session.diners.get(dinerId);
        if (!diner?.isAdmin) {
          return { tableId, session, error: 'Only the admin can reduce items' };
        }
        if (amount <= 0) {
          session.itemReductions.delete(itemId);
        } else {
          session.itemReductions.set(itemId, amount);
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
        const priceMap = new Map<string, number>(
          items.map((item) => {
            const reduction = session.itemReductions.get(item.id) ?? 0;
            return [item.id, Math.max(0, item.price - reduction)];
          }),
        );

        // Items fully ignored (reduction >= price) should not count
        const ignoredItems = new Set<string>();
        for (const item of items) {
          const reduction = session.itemReductions.get(item.id) ?? 0;
          if (reduction >= item.price) {
            ignoredItems.add(item.id);
          }
        }

        // Count how many diners selected each item (for equal split)
        const itemParticipantCount = new Map<string, number>();
        for (const d of session.diners.values()) {
          for (const itemId of d.selectedItemIds) {
            if (!ignoredItems.has(itemId)) {
              itemParticipantCount.set(itemId, (itemParticipantCount.get(itemId) ?? 0) + 1);
            }
          }
        }

        const dinerResults = [...session.diners.values()].map((d) => {
          let total = 0;
          for (const itemId of d.selectedItemIds) {
            if (ignoredItems.has(itemId)) continue;
            const price = priceMap.get(itemId) ?? 0;
            const count = itemParticipantCount.get(itemId) ?? 1;
            total += price / count;
          }
          return {
            dinerId: d.dinerId,
            animal: d.animal,
            name: d.name,
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
        session.resultsStale = false;
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
        name: d.name,
        isAdmin: d.isAdmin,
        selectedItemIds: [...d.selectedItemIds],
        isDone: d.isDone,
      })),
      itemReductions: Object.fromEntries(session.itemReductions),
      results: session.results,
      resultsStale: session.resultsStale,
    };
  }
}
