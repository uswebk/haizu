<div align="center">

<img src="docs/images/haizu-logo-lockup-horizontal.svg" alt="haizu" width="320">

### Decide who will be assigned where today on a floor map.

Workforce placement management for factories and warehouses.

[![CI](https://github.com/uswebk/haizu/actions/workflows/ci.yml/badge.svg)](https://github.com/uswebk/haizu/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-24.18-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)

**English** · [日本語](README.ja.md)

</div>

---

On a factory or warehouse floor, someone decides every day which worker stands at which station on which line. Usually with a whiteboard and paper.

**haizu** turns that into a floor map you can drag people onto, and a screen the floor can read.

- Upload a floor plan, place spots on it, and build a **placement area spec**
- Pick a date and a shift, then **drag employees onto spots**
- Show the confirmed placement in a **display-only viewer** for large screens

<div align="center"><img src="docs/images/haizu_demo.gif" width="800"></div>

## Features

**→ [User guide](docs/guide/index.md)** — how to use each screen, step by step.

## Getting started

You need Node.js 24.18+ (see [`.nvmrc`](.nvmrc)), pnpm 10+, and Docker.

```bash
git clone https://github.com/uswebk/haizu.git
cd haizu
pnpm install

docker compose up -d                    # PostgreSQL + Mailpit (dev mail)

cp apps/api/.env.example apps/api/.env  # set BETTER_AUTH_SECRET to 32+ random chars
cp apps/web/.env.example apps/web/.env

cd apps/api && pnpm db:migrate && pnpm db:seed && cd ../..

pnpm dev                                # web: 3000, api: 3001
```

Open http://localhost:3000 and create a company from the sign-up screen.

> [!WARNING]
> `pnpm db:seed` inserts demo data including a demo admin account (`admin@haizu.co.jp` / `password123`). It is for local development only — never run it against a production database. You can skip it and start from the sign-up screen instead.

> [!NOTE]
> Email delivery and file storage are pluggable adapters. By default nothing is sent: verification codes, invitation links, and password resets are printed to the API server console (prefixed `[email:console]`), and uploaded images are stored on local disk (`apps/api/uploads`).

### Seeing real emails (Mailpit)

`docker compose up -d` also starts [Mailpit](https://github.com/axllent/mailpit), a dev mail server. Set `EMAIL_DRIVER=smtp` in `apps/api/.env` and outgoing mail is captured by Mailpit — view it at http://localhost:8025 (nothing leaves your machine).

### Production adapters

| Concern | Env var | Default | Swap for production |
|---|---|---|---|
| Email | `EMAIL_DRIVER` | `console` | Set `smtp` and point `SMTP_*` at a real SMTP provider (SendGrid / SES), or implement `EmailSender` and add a case in `src/email/` |
| File storage | `STORAGE_DRIVER` | `local` (local disk) | Implement `FileStorage` (e.g. S3 / GCS) and add a case in `src/storage/` |

The app runs fully on the defaults. Contributions for production adapters are welcome (see [CONTRIBUTING.md](CONTRIBUTING.md)).

### Language and timezone

The web app (`apps/web`) reads two deploy-time defaults from its environment (Vite bakes `VITE_`-prefixed vars in at build time):

| Concern | Env var | Default | Notes |
|---|---|---|---|
| Language | `VITE_DEFAULT_LOCALE` | `en` | `en` or `ja`. The deploy-wide default. Users can switch language from the in-app switcher (sidebar user menu / account settings); their choice is remembered in a cookie and overrides this default. |
| Timezone | `VITE_DEFAULT_TIMEZONE` | *(runtime TZ)* | An IANA name such as `Asia/Tokyo`. Used to decide "today" and shift times. If unset, it falls back to the runtime timezone (the server's `TZ` on SSR, the browser's timezone on the client). |

Set them in `apps/web/.env` (copied from `apps/web/.env.example`). There is no per-user timezone setting: the app assumes a single site/timezone per deployment. Running one instance across multiple timezones would need a site-level timezone setting (not implemented).

## Where to go next

| | |
|---|---|
| [docs/guide/](docs/guide/index.md) | User guide: what each screen does and how to operate it *(English + Japanese)* |
| [docs/architecture.md](docs/architecture.md) | Design decisions you will break if you don't know them |
| [docs/domain/](docs/domain/) | Domain knowledge, one file per concept *(English + Japanese)* |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development commands, conventions, and how to open a PR |

## License
MIT

---

<div align="center">
<sub>Built with TanStack Start, Hono, and Drizzle.</sub>
</div>
