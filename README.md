<div align="center">

<img src="docs/images/haizu-logo-lockup-horizontal.svg" alt="haizu" width="320">

### Decide who stands where, today, on a floor map

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

<!-- TODO: screenshots of the placement editor and the viewer -->

## Getting started

You need Node.js 24.18+ (see [`.nvmrc`](.nvmrc)), pnpm 10+, and Docker.

```bash
git clone https://github.com/uswebk/haizu.git
cd haizu
pnpm install

docker compose up -d                    # PostgreSQL + Mailpit (dev mail)

cp apps/api/.env.example apps/api/.env  # set BETTER_AUTH_SECRET to 32+ random chars

cd apps/api && pnpm db:migrate && pnpm db:seed && cd ../..

pnpm dev                                # web: 3000, api: 3001
```

Open http://localhost:3000 and create a company from the sign-up screen.

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

## Where to go next

| | |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Design decisions you will break if you don't know them |
| [docs/domain/](docs/domain/) | Domain knowledge, one file per concept *(Japanese)* |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development commands, conventions, and how to open a PR |

## License

Not decided yet. It will be chosen before the public release.

---

<div align="center">
<sub>Built with TanStack Start, Hono, and Drizzle.</sub>
</div>
