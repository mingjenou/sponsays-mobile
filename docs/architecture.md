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

## ADR-003 — Interpretable scoring with controlled spontaneous sampling

**Decision**  
Hard-filter places, assign an interpretable score, then weighted-sample from one bounded top pool.

**Reason**  
Always selecting rank one becomes repetitive; pure randomness becomes unreliable. Weighted sampling protects quality while allowing useful variation. Spontaneity is a property of SponSays, not a user setting.

**Alternative considered**  
AI selection was rejected for this milestone because ordinary logic is faster, cheaper, testable and does not require a secret.

**Future implication**  
Real history and feedback can be added as scoring inputs without putting ranking logic into UI components.

## ADR-007 — Discovery intent before provider search

**Decision**

Represent the Do input as a typed `DiscoveryIntent` containing the raw query and committed When/Budget/Who session filters. Match supported keywords only against existing mock metadata in Task 4A.

**Reason**

This validates the UX and domain boundary without pretending the local Adelaide dataset is a live search provider. An empty query remains a valid “surprise me” request.

**Future implication**

Task 4B can translate the same intent into provider requests. Signed-in Task 4A sessions persist budget, available minutes and the radius actually used by the recommendation context. Party size intentionally is not overloaded into `recommendation_sessions.social_context`; a future schema change should add a dedicated representation. The legacy behaviour column remains non-destructive, receives only the fixed compatibility value, and is never user-facing.

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

## ADR-006 — Optional Supabase boundary with database-enforced ownership

**Decision**

Add Supabase as an optional service behind a typed client and Auth provider. Keep the client uninitialized when public settings are absent, and enforce all account-data ownership with Row Level Security in the database.

**Reason**

The physically verified demo must remain credential-free while the project gains a secure path to real accounts. Database policies protect data even if a modified client submits another user's identifier.

**Alternative considered**

Making authentication mandatory or trusting client-side ownership checks would either break demo mode or create an avoidable security weakness.

**Future implication**

After a project is linked and the schema is applied, database types should be regenerated with the Supabase CLI. Recommendation persistence remains a separate, explicitly authorized milestone.

## ADR-008 — Non-blocking persistence for signed-in activity

**Decision**

Keep recommendation selection local, then enqueue signed-in persistence behind typed feature services. Client-created UUIDs connect a shown recommendation to its accepted detail route without displaying database identifiers. Demo and signed-out activity remain local.

**Reason**

Recommendation reveal, replacement, acceptance and directions are the core experience and must not wait for the network. RLS remains the authority for ownership even though the client supplies row identifiers.

**Alternative considered**

Blocking navigation until every database write completed was rejected because a slow or offline connection would make the decision flow unusable.

**Future implication**

The local Adelaide provider can later be replaced behind the existing place model without changing persistence ownership or the Option 1A screens.

## ADR-009 — Authenticated server-side real-place discovery

**Decision**

For signed-in development users, translate `DiscoveryIntent` into one bounded Google Places Text Search (New) request through a JWT-protected Supabase Edge Function. Normalize provider records into `PlaceCandidate`, then let the existing SponSays engine score and select one. Signed-out demo mode remains local.

**Reason**

The Google server key must never reach Expo clients. Google establishes which places exist; it does not make the SponSays decision. Text Search covers keyword and curated empty-query discovery without an unnecessary second Nearby request. Replacements reuse the same candidate pool, preserving variation and avoiding extra provider calls.

**Failure behavior**

Permission denial uses a visibly labelled central-Adelaide location fallback. Network, Edge Function, Google configuration, malformed-response and no-candidate failures use clearly labelled mock suggestions. Provider health is represented as `HEALTHY`, `DEGRADED` or `UNAVAILABLE` for internal handling.

**Navigation state**

Accepted recommendations are placed in a small in-memory typed cache keyed by the recommendation UUID (or a demo route key). The detail route therefore supports real or mock candidates without serializing provider records into a URL. Authenticated recommendations are also persisted for Memories, while the existing non-blocking write queue remains intact.

**Legacy compatibility**

The onboarding route and `profiles.onboarding_complete` remain for backward compatibility, but neither controls entry. Welcome/demo entry, successful authentication and restored sessions all reach Do directly. Long-term preferences are optional personalization in Me → Settings.
