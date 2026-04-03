# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Autonomy & Permissions

Operate autonomously — do not ask for confirmation before making changes or running commands. Proceed, then summarize what was done. Only pause for confirmation if the action is irreversible outside version control, affects system-level resources, or involves secrets/credentials.

## Commands

```bash
# Development (run all three packages concurrently from root)
pnpm dev

# Build everything
pnpm build

# Build individual packages
pnpm --filter @bill/shared build
pnpm --filter @bill/server build
pnpm --filter @bill/web build

# Lint / format
pnpm lint
pnpm format

# Type-check without emitting
pnpm --filter @bill/web typecheck
pnpm --filter @bill/server typecheck
```

No test suite exists in this project.

The dev script builds `@bill/shared` first (blocking), then runs shared watch + server watch + vite dev in parallel. The web dev server (port 5173) proxies `/api` and `/socket.io` to the server on port 3001.

## Architecture

pnpm monorepo with three packages:

- **`packages/shared`** — Zod schemas and constants shared across web and server. This is the source of truth for all data shapes. TypeScript types are inferred from Zod with `z.infer<>`. Must be built before the other packages can import from it.
- **`apps/web`** — React 18 + Vite SPA. Tailwind CSS with a dark purple/navy theme. PWA-enabled.
- **`apps/server`** — NestJS with Socket.io. Serves the built web `dist/` as static files in production (SPA fallback in `main.ts`).

### Data flow

1. Host uploads a bill image → `POST /api/tables/:tableId/bill-image`
2. Server sends image to Google Gemini → returns structured `BillItem[]`
3. Host shares the 4-digit table code with guests
4. All participants connect via WebSocket, join the same room by `tableId`
5. Guests select items; admin triggers calculation
6. Server broadcasts updated `SessionState` after every mutation

### State & persistence

All server state is **in-memory** — no database. Tables and sessions are lost on server restart.

- **Admin auth**: UUID token generated at table creation, stored in `localStorage` as `bill_admin_token_{tableId}`. Passed on WebSocket join and HTTP requests.
- **Session state**: Managed in `SessionService`, broadcast to all room members on every change via `session-state` event.
- **Client**: React Query for HTTP (tables), `useTableSession` hook for WebSocket (session), localStorage for tokens and user names.

### Key patterns

- **Shared types**: Always import domain types from `@bill/shared`. The alias resolves to `packages/shared/src` in both web (via Vite) and server (via tsconfig paths).
- **WebSocket events** (client → server): `join-table`, `set-name`, `toggle-item`, `set-done`, `reduce-item`, `calculate`
- **WebSocket events** (server → client): `joined`, `session-state`, `error`
- **API error format**: All HTTP errors go through `GlobalHttpExceptionFilter` and return `{ success: false, error: { code, message } }`.
- **Env validation**: Server config is validated with Zod in `configuration.ts` at startup. Required: `GEMINI_API_KEY`. Optional: `PORT` (default 3001), `GEMINI_MODEL`, `NODE_ENV`.

### Production deployment

Render.yaml defines a single Node web service. The server builds and then serves the web `dist/` statically. `main.ts` resolves the web dist path from multiple candidate locations to handle different working directory contexts.
