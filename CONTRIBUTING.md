# Contributing

Issues and pull requests are welcome.

## Before you start

Read the relevant document under [`docs/domain/`](docs/domain/) for the area you are touching, and [`docs/architecture.md`](docs/architecture.md) for the cross-cutting design decisions (site-in-URL, the permission model, spec versioning). Some of these are not obvious from the code and easy to break.

## Development commands

Run from the repository root unless noted.

```bash
pnpm dev            # Start all apps (web: 3000, api: 3001)
pnpm build          # Build every package
pnpm typecheck      # Type check every package
pnpm test           # Run tests

cd apps/web && pnpm check      # Biome: lint + format

cd apps/api
pnpm db:generate    # Generate a migration from schema.ts changes
pnpm db:migrate     # Apply migrations
pnpm db:push        # Push schema without a migration file — local experiments only
pnpm db:studio      # Drizzle Studio
```

## Conventions

- **Lint and format** are Biome, not ESLint/Prettier. Do not silence a warning with `biome-ignore`; fix the cause. If a rule genuinely needs an exception, raise it in the PR rather than deciding alone.
- **Comments** explain WHY — a non-obvious constraint or reason. Do not add comments that restate what the code already says.
- **Tailwind** uses the project's custom color tokens. Avoid arbitrary values like `text-[13px]` when a standard scale or token exists.

## Database changes

After editing `apps/api/src/db/schema.ts`:

1. `pnpm db:generate` to produce a migration file
2. `pnpm db:migrate` to apply it
3. Commit the generated `src/db/migrations/*.sql` and `meta/` files

Use `pnpm db:push` only for throwaway local experiments. Anything that lands must be a generated migration.

## Routing

`apps/web/src/routeTree.gen.ts` is generated — never edit it by hand. After adding, renaming, or moving a route file under `src/routes/`, run `pnpm generate-routes` (or `tsr generate`) and commit the result.

## Pull requests

- Make sure `pnpm typecheck` and `pnpm test` pass.
- Keep unrelated changes in separate commits. A bug fix and a refactor should not share a commit.
- The CI runs Biome, type checking, and tests on every pull request.
