-- Record how well the chosen milk complemented a specific Bean in one brew.
-- This is deliberately per-entry: the same Bean can pair differently with
-- dairy, oat, soy or another milk alternative.

alter table public.brew_logs
    add column if not exists milk_pairing text;
