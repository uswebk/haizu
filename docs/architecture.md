# Architecture

Design decisions that are not obvious from the code, and that you will break if you do not know about them.

## Monorepo

pnpm workspaces + Turborepo.

```
apps/web         TanStack Start (React 19) + Vite + Tailwind CSS v4 + react-konva
apps/api         Hono + Node.js + Drizzle ORM + PostgreSQL + Better Auth
packages/shared  Zod schemas and the permission matrix (shared by web and api)
```

`packages/shared` is imported as `@haizu/shared`. It holds everything both sides must agree on: request/response schemas, role definitions, and the permission matrix.

## The current site lives in the URL

Every site-scoped screen is served under `/s/{siteId}/...`. **The URL is the single source of truth for the current site.** It is not stored in a cookie, in `localStorage`, or in React state.

This matters because a site is not a global preference — it is part of the resource you are looking at, the same way a repository is on GitHub. Keeping it in a cookie means two browser tabs cannot show two different sites, and switching in one tab silently changes what the other tab fetches.

Consequences:

- `apiFetch` derives the `x-site-id` header by reading `location.pathname`. Do not reintroduce a module-level variable for it; a variable set in `beforeLoad` is not re-assigned when a server-rendered page hydrates, and the header goes missing.
- A user's role is resolved per site, so `beforeLoad` on `/_app/s/$siteId` must run before any site-scoped screen renders.
- Screens that are not site-scoped (`/account`) live outside the site path, because a user with no site membership must still reach them.

## Roles have two scopes

Roles are split into an **organization role** and a **site role**.

```
user(id, organization_id, role: 'admin' | 'member', is_active)
member_sites(user_id, site_id, role: 'site_admin' | 'general' | 'viewer')
```

A member can be a site admin at site A and a general member at site B. `admin` is an organization-level concept: it behaves as a site admin everywhere and holds no `member_sites` rows. Splitting the types this way makes "an admin of only site A" — a meaningless state — a compile error.

`effectiveSiteRole(orgRole, siteRole)` resolves the two into the role that actually applies at a given site.

**Invariant: a member always belongs to at least one site.** A member with zero sites can reach no screen at all, which would produce a redirect loop. The invariant is enforced in `members.ts` on both invite and update. It is not enforced by a database constraint.

## One permission matrix, two consumers

`packages/shared/src/permissions.ts` is the single source of truth for who can do what. **Both the API's authorization middleware and the frontend's navigation and route guards read the same table.** Duplicating the rules on either side is how they drift apart.

- Organization-scoped actions: `canOrg(orgRole, permission)` — API uses `requireOrgPermission` / `requireOrgWritePermission`
- Site-scoped actions: `canSite(siteRole, permission)` — API uses `requireSitePermission` / `requireSiteWritePermission`, which may only run after `siteScope` has resolved the effective role
- Screens: `canAccessScreen(orgRole, siteRole, screen)` — used by the sidebar and by `beforeLoad` guards

The `requireXxxWritePermission` variants gate only `POST` / `PUT` / `PATCH` / `DELETE` and let `GET` through. This means a new write endpoint added to an existing route is protected automatically, rather than depending on someone remembering to add a check.

Two rules cannot be expressed as a role → permission table and live in `apps/api/src/lib/member-role-policy.ts`:

- Only an admin may grant the admin role (`evaluateOrgRoleAssignment`)
- A site admin may only manage members of sites where they are themselves a site admin (`assertSitesManageable`)

When changing permissions, update `permissions.ts` **and** the table in [`docs/domain/member_permission.md`](domain/member_permission.md).

## Placement specs are versioned and, once used, immutable

A placement area holds a series of spec versions. Once a version has been used for a placement, it can no longer be modified, deleted, or unpublished. Editing means duplicating it into a new version.

Placements resolve the version that was in effect on their date. A newly published version therefore never rewrites what a past date looks like. "Who stood where last Monday" stays fixed.

Shifts follow the same principle: they are soft-deleted rather than removed, so a historical placement can still name the shift it belonged to.

## Tenant isolation

Two independent layers guard every site-scoped request:

1. `requireAuth` resolves the session and puts the organization on the context.
2. `siteScope` checks that the requested `x-site-id` belongs to that organization and that the user is a member of it, then resolves the effective site role.

Beyond those, handlers that take a nested resource id must verify the ownership chain themselves. `areas.ts` guards `/:id/versions/:versionId` with `versionGuard` for exactly this reason: `areaGuard` only proves the area belongs to the current site, not that the version belongs to the area.
