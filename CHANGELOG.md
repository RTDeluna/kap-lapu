# Changelog

Newest first.

## Unreleased

### Stage 1 foundation

- Database: profiles, follows with approval, blocks, protected zones, spots with a split
  exact point table, saved spots, catches, likes, comments, boats, rates, papers, dock ID
  checks, inquiry chat with a scam filter, reports that auto hide after three people,
  an append only audit log and admin actions. RLS on every table.
- 103 pgTAP tests for spot privacy, pin rules, catches, reports, badges and chat, run in CI.
- Decision records 0001 to 0005, the Stage 1 API contract and CLAUDE.md.
- Expo SDK 57 app: map (MapLibre), spot detail, log a catch, pin a spot, phone sign in,
  boats, inquiry chat with the pay warning, and placeholders for Trips, Terms and Privacy.
  51 unit tests; typecheck, lint and tests run in CI. Not yet run on a device.
