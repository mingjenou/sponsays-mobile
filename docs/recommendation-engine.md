# Recommendation engine — Milestone 1

The engine lives outside the UI at `src/features/recommendations/engine/`.

```text
PlaceCandidate[]
  → hard filters
  → mock intent matching
  → interpretable scores
  → ranked eligible pool
  → controlled spontaneous weighted sampling
  → one RecommendationResult
```

## Hard filters

A candidate is removed if it is closed, has invalid coordinates, exceeds the chosen distance, exceeds the available time, exceeds a required budget, or was already rejected in the current session. Randomness never overrides these rules.

## Scoring

The initial centrally configured weights are:

- discovery intent match: 35%
- saved/demo interest match: 18%
- distance: 12%
- budget: 10%
- quality: 12%
- behaviour proxy: 6%
- novelty: 10%
- controlled spontaneity: 7%

Task 4A rebalances these weights to add a strong discovery-intent signal while retaining distance, budget, quality, novelty and bounded randomness. The query matcher uses only existing mock name/category/tag metadata. If no supported keyword is found, selection falls back to the normal recommendation score.

The behaviour score is only a transparent interest proxy in the local demo. It must be replaced with consent-respecting history signals after persistence exists.

## One product behaviour

SponSays uses one internal spontaneous configuration. There is no user-facing behaviour level. Historical `safe`, `spontaneous` and `chaos` database values remain valid legacy data but are ignored by the current UI.

## Replacements

Rejected place IDs are excluded for the rest of the current decision session. After three easy replacements, the UI asks the user to change context instead of offering infinite rerolls.

## Future testing

Focused tests cover intent preservation, filter mapping, legacy-mode compatibility, controlled variation, keyword influence and rejection cooldown. The engine accepts an injected random function for repeatable tests while production uses `Math.random`.
