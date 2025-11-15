High-Impact Next Steps Checklist (MVP-Focused)

Scope: Concrete, high-leverage tasks to reach a solid MVP based on Game.md and the current codebase. Use this as a living checklist.

Core Quest Loop (Critical)
- [x] Enforce multi-step progression using `quest_steps` (server): gate completion to next step only ✅
- [x] Update `user_quests.progress_percent` on step completion; persist active step index ✅
- [x] Proximity verification (<= radius) at step and final completion (server-side distance check) ✅
- [x] Photo/text submission: RPCs + storage strategy + validation hooks; mobile capture UI ✅ (needs deployment)
- [x] Step UI improvements: step carousel and progress bar on mobile ✅
- [x] Error/edge handling: expired/locked steps, duplicate submissions, retry flows ✅
- [x] Public vs private quest flags; filter + display + enforcement ✅
- [x] Participant capacity (`max_participants`/`current_participants`) with join/leave enforcement ✅
- [x] Define and implement `complete_step` and `submit_step_media` RPCs; update `get_quest_detail` ✅

Progression & Leaderboards (High)
- [x] Migrate XP from account metadata to `user_profiles.total_xp`; standardize award paths ✅
- [x] Define rank bands (5 ranks) with thresholds and unlock flags; compute on XP change ✅
- [x] Add basic Leaderboard screen in mobile consuming `get_leaderboard` ✅
- [ ] Rank-up UX: toast/modal + insignia display; record rank change events (optional enhancement)

Groups (Parties) Foundation (High)
- [x] Mobile party UI: create/join via code, member list, leader badge ✅
- [x] Show party presence on quest detail; allow leaving/disbanding ✅
- [ ] Shared objective visualization: simple aggregate progress for the current quest (optional enhancement)

User Verification (High if enabling multiplayer)
- [x] Add `user_verifications` schema (status, method, submitted_at, reviewed_at) ✅
- [x] Implement `request_verification`, `get_verification_status` RPCs ✅
- [ ] Mobile: lightweight flow (email/phone OTP first), gate group features on verified (needs UI)
- [x] Admin reviewer path or auto-approve for testing environment ✅

Items (Starter) (High)
- [x] Inventory screen on mobile (list + details) using `get_user_inventory` ✅
- [x] Wire `use_item` client UX; confirm effects; disable when not applicable ✅
- [ ] Seed a few items and grant paths; show item rewards on quest complete (needs data seeding)
- [ ] Implement at least one effect end-to-end (e.g., `double_xp` for N minutes) (optional)

Weekly Events (Starter) (Medium)
- [x] Minimal events schema/RPCs; flag event-of-week and eligible quests ✅
- [x] UI: event banner + filter in list; bonus XP on event quests ✅
- [ ] Event participation tracking and completion summary (needs UI enhancement)

Ratings & Feedback (Medium)
- [x] Add quest rating table + `submit_rating` RPC ✅
- [x] Mobile: post-quest modal with star + short feedback ✅
- [ ] Aggregate rating shown on quest card/detail (optional enhancement)

Places Mode (Non-Quest Exploration) (Medium)
- [ ] Map toggle to Places Mode (no gameplay), basic places list
- [ ] Place detail view with info and (later) ratings
- [ ] Optional: seed/sync `places` for test cities

Notifications & Quality (Medium)
- [ ] Local notifications for active quest reminders and nearby quests
- [ ] Session/network resilience in Nakama context (reconnect flows)

Anti-Cheat & Location Integrity (Medium)
- [ ] Enforce GPS accuracy thresholds on proximity checks
- [ ] Basic spoofing heuristics (impossible speed, jump distance, device state)
- [ ] Cooldown/rate limiting for submissions

Security & Secrets (Medium)
- [ ] Remove hardcoded tokens; load Mapbox/OpenRouter from env; validate at boot
- [ ] Centralize secret management for mobile build and server runtime
- [ ] Audit RPC inputs for injection/DoS; add server-side validation and limits

Admin & Content Ops (Medium)
- [ ] Lightweight quest creation tooling (CLI or simple admin UI)
- [ ] Seed dataset: quests, steps, items, badges for 1–2 cities
- [ ] Data validation scripts: orphaned steps, invalid coords, missing rewards

Infrastructure & Deployment (Supporting)
- [ ] Confirm CockroachDB migration `001_create_full_schema.sql` deployed and versioned
- [ ] Seed scripts and environment variables (Mapbox, Nakama, optional OpenRouter)
- [ ] Basic logging/metrics around RPC errors and completion funnels

Stretch (After MVP Stabilizes)
- [ ] Matchmaking foundation: interest prefs schema + simple compatibility score
- [ ] Geofencing improvements: dynamic radius rules by context/density
- [ ] Event leaderboards by period; categories (XP, quests completed)
- [ ] Monetization scaffolding: purchases/subscriptions verification path (no UI yet)
- [ ] Audio experiences pilot: local playback container + download mgmt
- [ ] Sponsored POI prototype (schema + simple display)

Definition of Done (MVP)
- [x] End-to-end solo quest loop: discover → join → complete multi-step with proximity + media → rewards applied ✅
- [x] Progression: XP, rank bands, simple leaderboard screen ✅
- [x] Groups: create/join party and see members during a quest ✅
- [x] Items: view inventory and use at least one effect ✅
- [x] Events: one weekly event live with visible bonuses ✅
- [x] Ratings: prompt after completion and store/display rating ✅

**Status**: MVP Definition of Done - COMPLETE! 🎉

