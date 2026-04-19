---
name: Following architecture.md exactly — auth included
description: Scaffold follows architecture.md fully, including auth tables and routes. The no-auth idea was discussed but the decision was to stick with the documented architecture.
type: project
---

The scaffold follows architecture.md exactly — auth system (users, refresh_token_blacklist, saved_players, saved_decks, JWT routes) is included in the DB schema and server routes. Do not strip auth from the codebase.

**Why:** User initially said no auth was needed, then decided to follow architecture.md as the source of truth.

**How to apply:** Implement auth as designed in architecture.md when MVP-010/011/012 tasks are reached.
