# Mylot data architecture

Status: Public Preview baseline  
Owner: COF-27  
Last updated: 2026-09-08

## Principles

- Use one Supabase PostgreSQL database per environment, not one database per feature or user.
- Keep Preview and Production in separate Supabase projects.
- Associate every private application row with the authenticated user and enforce access in PostgreSQL Row Level Security (RLS).
- Calculate personal insights from source records when requested; do not create profile tables until there is a demonstrated performance or history requirement.
- Add schema changes through new forward migrations. Do not edit a migration after it has been applied.
- Keep public product knowledge, private user data, and internal ingestion metadata logically separated.

## Public Preview schema

```text
Supabase Preview project
├── auth (managed by Supabase)
│   └── users
│
└── public (Mylot application)
    ├── user_profiles
    ├── beans
    ├── bean_profiles
    └── brew_logs
```

### Relationships

```text
auth.users
    │ 1
    ├──── 1 user_profiles
    │
    ├──── * beans
    │          │ 1
    │          └──── 0..1 bean_profiles
    │
    └──── * brew_logs ──── 0..1 beans
```

| Table | Purpose | Ownership and deletion |
|---|---|---|
| `auth.users` | Login identities and authentication state | Managed by Supabase Auth |
| `public.user_profiles` | User-facing profile metadata | One row per user; removed when the Auth user is deleted |
| `public.beans` | Coffees saved in a user's private shelf | Owned by `user_id`; removed when the owning user is deleted |
| `public.bean_profiles` | Automatically generated profile for a saved Bean | Owned through `bean_id`; removed when its Bean is deleted |
| `public.brew_logs` | Brew recipe, sensory observations, liking, and private notes | Owned by `user_id`; Bean reference becomes null if the Bean is deleted |

The implemented schema is defined in [`supabase/migrations/202609070001_public_preview.sql`](../supabase/migrations/202609070001_public_preview.sql).

## User isolation

All private tables use RLS. An authenticated user may select, insert, update, or delete only rows that belong to their own `auth.uid()`.

`bean_profiles` does not duplicate `user_id`; access is granted only when its parent Bean belongs to the current user. A Brew Log may reference only a Bean owned by the same current user.

Application queries also filter by `user_id`. These filters make intent explicit, but PostgreSQL RLS is the security boundary.

No per-user database or per-user schema is created.

## Derived personal views

These features are calculated dynamically and are not persisted as separate profile tables in the Public Preview:

| Feature | Source | Calculation |
|---|---|---|
| My Taste | `brew_logs` plus Bean flavor notes | Six-dimensional liking-weighted fingerprint; initial weight is `max(liking_score - 5, 0)` |
| Coffee World | `beans` plus `brew_logs` | Country normalization, saved/Brew counts, average liking, and top flavor families |

Missing sensory values and unrated countries remain missing or neutral; they are not converted to zero.

## Planned schema boundaries

The shared Coffee Product Catalog is not part of the initial private-data migration. When COF-20 is implemented, introduce explicit logical boundaries:

```text
Supabase environment
├── auth                 Supabase-managed identities
├── public / app         Private user-owned application data
├── catalog              Shared normalized coffee knowledge
└── internal             Ingestion jobs, source audits, and operational metadata
```

Candidate Catalog entities:

- `catalog.coffee_products`
- `catalog.roasters`
- `catalog.product_sources`
- `catalog.flavor_taxonomy`

Saving a Catalog product creates or links a private `beans` record. Personal notes, purchase data, Brew Logs, and liking never become shared Catalog fields.

Source URL, source domain, retrieval time, normalized factual fields, and license/provenance must be retained for Catalog records. Licensed datasets such as Open Food Facts must remain behind a clear storage and attribution boundary; a PostgreSQL schema alone does not resolve license obligations.

The `internal` schema should not be exposed through the public browser API. Use it for discovery attempts, refresh state, parsing diagnostics, and source audits without storing credentials or unnecessary copies of third-party descriptions.

## Environment separation

```text
Local development  → local Next.js + Preview Supabase test data
Public Preview     → Vercel Preview + dedicated Preview Supabase project
Production         → Vercel Production + separate Production Supabase project
```

Never point a Preview deployment at the Production database. Promote schema by applying reviewed migrations to Preview first, running the two-user RLS acceptance test, and only then applying the same migration to Production.

## Migration policy

The Public Preview baseline migration may be run on a new project. Its `drop ... if exists` statements replace named triggers and policies before recreating them; it does not drop application tables, truncate tables, or delete existing rows. The foreign-key `on delete` clauses describe what happens during a future explicit user or Bean deletion.

Before running against a database that already contains Mylot objects, inspect name collisions and take a backup. All later changes must use a new timestamped migration and a forward-only rollback/recovery plan.
