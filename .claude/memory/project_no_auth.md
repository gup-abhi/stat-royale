---
name: No auth — player tag saved locally
description: ClashPulse has no user authentication. Player tags are saved on-device. Backend is a pure Supercell API cache proxy.
type: project
---

No user auth system (no registration, login, JWT, refresh tokens). Users just enter a player tag and the app shows stats. "Saved players" is stored locally on the device (Zustand + AsyncStorage), not in any backend database.

**Why:** User explicitly decided this — simpler UX, no sign-up friction for an analytics app.

**How to apply:** Do not build auth routes, user tables, or saved-players backend endpoints. The only DB table needed for MVP is `cards` (seeded from Supercell API). Saved players list lives in `app/src/store/savedPlayers.store.ts` persisted with AsyncStorage.
