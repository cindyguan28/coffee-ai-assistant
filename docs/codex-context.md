# Codex Project Context

This document is the canonical development brief for the next two product releases of `coffee-ai-assistant`. Codex should read it before planning or implementing work related to taste profiles or origin maps.

## Current repository state

- `feature/enrichment_engine` has been merged into `main` through pull request #1.
- Two release branches exist:
  - `release/radar-taste-profile`
  - `release/taste-geography-map`
- The release branches currently start from the same merged `main` baseline.
- Preserve the project's local-first approach and existing normalized English database values.

## Release 1: Personal Taste Radar

### Goal

Turn a user's scored coffee history into an understandable personal taste profile. The profile should be calculated dynamically from existing coffee and tasting data rather than persisted as a separate user profile.

### Sensory model

Use these six dimensions consistently in storage, calculations, and UI:

1. Acidity
2. Sweetness
3. Bitterness
4. Body
5. Balance
6. Aroma

`score` represents the user's personal liking for a coffee. It is not another sensory dimension.

### Liking-weighted fingerprint

The first version should weight each coffee's contribution to the six-dimensional fingerprint using:

```text
weight = max(liking_score - 5, 0)
```

For each sensory dimension, calculate the weighted mean across eligible coffees:

```text
weighted_dimension = sum(dimension_value * weight) / sum(weight)
```

Handle an empty history and a zero total weight explicitly in the UI; do not divide by zero or present a misleading profile. Keep the calculation logic isolated so the weighting formula can be revised later.

### User experience

- Add a **My Taste** radar visualization for the six dimensions.
- Add a flavor-family summary showing the flavor families most associated with coffees the user likes.
- Make sample size and insufficient-data states understandable.
- Calculate the profile on demand from source records.
- Do **not** create a `user_profile` table for this release.

### Out of scope

- Persisted or manually editable user taste profiles
- Multiple-user identity, authentication, or profile comparison
- Machine-learning recommendations or predictive preference models
- Changing the initial weighting formula beyond what is required for correctness
- Geographic visualization or origin aggregation

## Release 2: Taste Geography Map

### Goal

Show how the user's coffee experience and preferences vary by origin country through a **My Coffee World** choropleth.

### Country-level MVP

Normalize origin country values to a stable canonical country identifier suitable for aggregation and mapping. Aggregate the following metrics per country:

- `coffee_count`
- average liking
- averages for Acidity, Sweetness, Bitterness, Body, Balance, and Aroma
- preferred process
- top flavor families

The choropleth should let the user inspect these country-level summaries and should distinguish no-data countries from countries with low scores. Define deterministic handling for missing or unrecognized origin values and ties in preferred process or flavor-family ranking.

### Out of scope

- Region-, estate-, farm-, or lot-level maps
- GPS coordinates or precise location tracking
- Geocoding services or geocoding pipelines
- Automatic inference of a country from free-form regional text
- Route, travel, supply-chain, or producer-network visualization
- Predictive origin recommendations

## Linear backlog mapping

| Linear item | Release | Scope |
| --- | --- | --- |
| COF-11 | Personal Taste Radar | Parent feature / release tracking item |
| COF-13 | Personal Taste Radar | Extend the sensory data model to six dimensions |
| COF-14 | Personal Taste Radar | Calculate the liking-weighted taste fingerprint |
| COF-15 | Personal Taste Radar | Build the My Taste radar and flavor-family UI |
| COF-12 | Taste Geography Map | Parent feature / release tracking item |
| COF-18 | Taste Geography Map | Normalize origin country data for mapping |
| COF-16 | Taste Geography Map | Build country-level taste aggregation |
| COF-17 | Taste Geography Map | Build the My Coffee World choropleth UI |

## Recommended implementation order

Complete the releases sequentially so the map can reuse the normalized sensory and flavor-family foundations from the radar release.

1. **COF-13 — six-dimensional sensory model**
   - Inspect and migrate the existing schema safely.
   - Update data entry, validation, and read paths for all six dimensions.
   - Preserve existing records and define how missing legacy values behave.
2. **COF-14 — liking-weighted fingerprint**
   - Implement the dynamic aggregation as testable domain logic.
   - Cover empty, zero-weight, missing-value, and mixed-history cases.
3. **COF-15 — My Taste UI**
   - Add the radar, flavor-family summary, sample-size context, and empty states.
4. **COF-18 — origin normalization**
   - Define canonical country identifiers and normalize existing/input values without introducing geocoding.
5. **COF-16 — country aggregation**
   - Build testable country-level metrics on top of normalized origin and sensory data.
6. **COF-17 — My Coffee World UI**
   - Add the choropleth, country details, legends, and clear no-data behavior.

## Implementation guardrails

- Treat the formulas and scopes in this document as product requirements; record intentional deviations before implementing them.
- Prefer small, independently testable data and aggregation functions over calculations embedded directly in Streamlit views.
- Keep schema changes backward-compatible where practical and provide migrations for existing local databases.
- Do not silently discard records with incomplete sensory or origin data; define and test inclusion rules.
- Keep release-specific work on its corresponding release branch and link changes back to the relevant Linear item.
