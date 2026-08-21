# Architecture decisions

## ADR-001 — Expo SDK 54 for the QR prototype

**Decision**  
Use Expo SDK 54 for Milestone 1.

**Reason**  
During the current SDK 57 transition, Expo’s official create-project guidance says physical-device Expo Go users should use an SDK 54 project. Physical phone testing is the milestone’s primary acceptance goal.

**Alternative considered**  
SDK 57 is the latest stable SDK, but currently requires a development build or a different Expo Go distribution for this use case.

**Future implication**  
Review the SDK after the founder confirms the prototype and before release hardening. Upgrade as a dedicated, tested change.

## ADR-002 — Local state and mock data first

**Decision**  
Use local React state and curated Adelaide `PlaceCandidate` records in Milestone 1.

**Reason**  
The complete product journey must be testable without credentials or network services.

**Alternative considered**  
Adding Supabase and Places immediately would make the first phone test depend on external setup and failure modes.

**Future implication**  
Later services must normalize their data into `PlaceCandidate`, preserving the UI and recommendation engine boundary.

## ADR-003 — Deterministic scoring with weighted sampling

**Decision**  
Hard-filter places, assign an interpretable score, then weighted-sample from a mode-specific top pool.

**Reason**  
Always selecting rank one becomes repetitive; pure randomness becomes unreliable. Weighted sampling protects quality while making Spontaneous and Chaos meaningfully different.

**Alternative considered**  
AI selection was rejected for this milestone because ordinary logic is faster, cheaper, testable and does not require a secret.

**Future implication**  
Real history and feedback can be added as scoring inputs without putting ranking logic into UI components.

## ADR-004 — No global state package in Milestone 1

**Decision**  
Keep short-lived demo session state inside its owning screen.

**Reason**  
There is no persisted account or history yet, so a global dependency would add complexity without solving a current problem.

**Alternative considered**  
A state library was deferred until Supabase-backed identity and cross-screen history exist.

**Future implication**  
Introduce the smallest suitable store only when a concrete cross-screen persistence need is proven.

## ADR-005 — Reference-led visual refresh without changing the decision engine

**Decision**  
Adopt the founder-supplied blue/cream/coral map, reveal and experience-detail visual direction while preserving one-result recommendation behaviour.

**Reason**  
The new reference is a clear visual approval. Its location context, rounded surfaces and concise detail hierarchy make the prototype feel more tangible and production-minded.

**Alternative considered**  
Copying the reference as a fully browsable map was rejected because it would conflict with SponSays’ decision-as-a-service promise.

**Future implication**  
Real map and photo data can replace the current code-native demo illustrations without changing the screens’ information architecture.
