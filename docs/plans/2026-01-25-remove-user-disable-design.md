# Remove User Disable/Enable + ESLint TS Parsing Fix (Design)

## Goal

Remove the user disable/enable feature end-to-end and make all previously disabled
users able to log in again. Keep "deleted" as the only blocked state. Fix CI lint
failures where ESLint parses TypeScript files as plain JS.

## Scope

- Data model: remove `disabledReason` from `User`; keep `status` for `DELETED`.
- Auth: only block login when status is `DELETED`.
- User list filter: include all non-deleted staff accounts.
- Migration: set all non-deleted users to `ACTIVE` and drop `disabledReason`.
- ESLint: enforce TypeScript parsing to avoid CI "Unexpected token" errors.
- Tests: update/add unit tests for user status rules and lint config.

Out of scope: UI changes for enable/disable (no UI exists), cache issues unrelated
to lint parsing.

## Data & API Behavior

- `User.disabledReason` removed from schema and all response mapping.
- `User.status` remains and is only used to gate login (`DELETED` only).
- `mapUserResponse` excludes `disabledReason`.
- `buildUserWhere` uses `status: { not: 'DELETED' }`.

## Migration Strategy

Create a Prisma migration that:

1. Drops `disabledReason` from `User`.
2. Updates all users with status != 'DELETED' to `ACTIVE`.

For SQLite, the migration uses table redefinition; add an `UPDATE` statement
after the table copy to enforce status normalization.

## ESLint Strategy

Ensure ESLint explicitly enables TypeScript parsing by:

- Adding required dev dependencies (`typescript`, `@typescript-eslint/*`).
- Setting `typescript: true` (and TS config path if needed) in `eslint.config.js`.

This makes `eslint .` parse `.ts` and `.d.ts` consistently in CI.

## Testing

- Update existing tests for `buildUserDeleteData` and `buildUserWhere`.
- Add a unit test to confirm login gating only blocks `DELETED`.
- Add a unit test that asserts ESLint config enables TS parsing.
- Run `pnpm run lint` and `bun test` (server).

## Risks

- Migration correctness: verify status normalization and column removal.
- ESLint config changes could affect lint rules; keep changes minimal.
