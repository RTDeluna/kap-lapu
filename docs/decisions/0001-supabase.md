# 0001 Supabase, not Google Cloud

Date: 12 Oct 2026. Status: accepted.

**Decision.** Supabase (Singapore) for auth, Postgres with PostGIS, storage, Edge Functions
and Realtime.

**Why.** Bookings and privacy are relational. Postgres gives nearby spot search (PostGIS),
a no double booking rule (exclusion constraint, Stage 2) and row level privacy in one free
database. Firestore has no joins and is hard to leave; Cloud SQL alone costs more than
Supabase Free. Plain Postgres is easy to move.

**Costs.** Free until the first real payment, then Pro at $25 a month. The Free plan has
no backups, so back up nightly to R2 with a GitHub Action until then.

**Revisit when** the database passes about 8 GB or a job runs longer than an Edge Function
allows. Then add one small Cloud Run service. pgvector, not Qdrant, if similarity search
is ever needed.
