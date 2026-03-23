import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SessionService } from './session.service';
import { TablesService } from '../tables/tables.service';

function isJoinPayload(data: unknown): data is { tableId: string; isAdmin: boolean; name?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>)['tableId'] === 'string' &&
    typeof (data as Record<string, unknown>)['isAdmin'] === 'boolean'
  );
}

function isTogglePayload(data: unknown): data is { itemId: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>)['itemId'] === 'string'
  );
}

@WebSocketGateway({ cors: { origin: true } })
export class SessionGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly sessionService: SessionService,
    private readonly tablesService: TablesService,
  ) {}

  @SubscribeMessage('join-table')
  handleJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    if (!isJoinPayload(payload)) {
      client.emit('error', { code: 'INVALID_PAYLOAD', message: 'Invalid join-table payload' });
      return;
    }

    const { tableId, isAdmin, name } = payload;

    try {
      this.tablesService.getTable(tableId);
    } catch {
      client.emit('error', { code: 'TABLE_NOT_FOUND', message: 'Table not found' });
      return;
    }

    const { dinerId, session } = this.sessionService.joinTable(tableId, client.id, isAdmin, name);
    void client.join(tableId);
    client.emit('joined', { dinerId });

    const state = this.sessionService.toSessionState(session);
    this.server.to(tableId).emit('session-state', state);
  }

  @SubscribeMessage('set-name')
  handleSetName(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    const name =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)['name']
        : undefined;
    if (typeof name !== 'string' || !name.trim()) return;

    const { tableId, session } = this.sessionService.setName(client.id, name.trim());
    if (tableId && session) {
      this.server.to(tableId).emit('session-state', this.sessionService.toSessionState(session));
    }
  }

  @SubscribeMessage('toggle-item')
  handleToggleItem(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    if (!isTogglePayload(payload)) {
      client.emit('error', { code: 'INVALID_PAYLOAD', message: 'Invalid toggle-item payload' });
      return;
    }

    const { tableId, session } = this.sessionService.toggleItem(client.id, payload.itemId);
    if (tableId && session) {
      this.server.to(tableId).emit('session-state', this.sessionService.toSessionState(session));
    }
  }

  @SubscribeMessage('set-done')
  handleSetDone(@ConnectedSocket() client: Socket) {
    const { tableId, session } = this.sessionService.setDone(client.id);
    if (tableId && session) {
      this.server.to(tableId).emit('session-state', this.sessionService.toSessionState(session));
    }
  }

  @SubscribeMessage('calculate')
  handleCalculate(@ConnectedSocket() client: Socket) {
    const { tableId, session, error } = this.sessionService.calculate(
      client.id,
      this.tablesService,
    );

    if (error) {
      client.emit('error', { code: 'CALCULATE_ERROR', message: error });
      return;
    }

    if (tableId && session) {
      this.server.to(tableId).emit('session-state', this.sessionService.toSessionState(session));
    }
  }

  handleDisconnect(client: Socket) {
    const { tableId, session } = this.sessionService.leaveTable(client.id);
    if (tableId && session) {
      this.server.to(tableId).emit('session-state', this.sessionService.toSessionState(session));
    }
  }
}
