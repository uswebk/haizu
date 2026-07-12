# haizu User Guide

How to use haizu, screen by screen.

[日本語](index.ja.md)

haizu manages who stands where on a factory or warehouse floor. You draw the floor once, then decide the people on it every day.

## Start here

If this is a fresh installation, follow [Getting started](getting-started.md). It walks the whole path from sign-up to a placement on screen, in the order the app expects.

## Screens

| Screen | What it's for |
|---|---|
| [Site selection](site-selection.md) | Pick the site you're working in. The first screen after login |
| [Home](home.md) | Initial setup checklist, and today's placement status per shift |
| [Layout areas](editor.md) | Draw the floor: upload a plan, place spots, publish a spec version |
| [Assignment](assignment.md) | Pick a date and shift, drag employees onto spots, confirm |
| [Viewer](viewer.md) | Display-only screen for large monitors on the floor |
| [Employees](employees.md) | The people you place. CSV import/export, tags |
| [Members](members.md) | The people who log in. Invitations and permissions |
| [History](history.md) | Past confirmed placements, read-only |
| [Settings](settings.md) | Shifts, tags, viewer display, sites, organization, your account |

## The three concepts worth knowing

**Employees are not members.** Employees are the people you place on the map; they don't log in. Members are the administrators who use haizu; they log in. See [members.md](members.md).

**A spec must be published before you can assign to it.** The layout editor saves drafts, but assignment and the viewer only ever use *published* versions, resolved by effective date. See [editor.md](editor.md).

**A placement must be confirmed before the floor sees it.** A draft placement is invisible in the viewer. See [assignment.md](assignment.md).

## Reference

- [docs/domain/](../domain/) — the underlying rules, one file per concept (English + Japanese). Read these when the guide says "why does it behave like this".
- [docs/architecture.md](../architecture.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md) — for developers, not operators.
