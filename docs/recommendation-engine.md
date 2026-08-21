# Recommendation engine — Milestone 1

The engine lives outside the UI at `src/features/recommendations/engine/`.

```text
PlaceCandidate[]
  → hard filters
  → interpretable scores
  → ranked eligible pool
  → mode-specific weighted sampling
  → one RecommendationResult
```

## Hard filters

A candidate is removed if it is closed, has invalid coordinates, exceeds the chosen distance, exceeds the available time, exceeds a required budget, or was already rejected in the current session. Randomness never overrides these rules.

## Scoring

The initial centrally configured weights are:

- interest match: 25%
- distance: 15%
- budget: 10%
- quality: 15%
- behaviour proxy: 15%
- novelty: 10%
- controlled spontaneity: 10%

The behaviour score is only a transparent interest proxy in the local demo. It must be replaced with consent-respecting history signals after persistence exists.

## Modes

- **Safe:** smaller pool and stronger bias toward the highest score.
- **Spontaneous:** balanced pool, novelty and randomness.
- **Chaos:** larger eligible pool and more novelty, while preserving hard constraints.

## Replacements

Rejected place IDs are excluded for the rest of the current decision session. After three easy replacements, the UI asks the user to change context instead of offering infinite rerolls.

## Future testing

Before real Places data ships, add focused tests covering each hard filter, score ordering, mode pool size, rejection cooldown and the replacement cap. Inject a seeded random function at that point so stochastic behaviour is repeatable in tests.
