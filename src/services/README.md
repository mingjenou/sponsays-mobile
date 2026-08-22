# Service boundaries

Vendor SDKs remain behind service modules so screens do not own integration details. The optional Supabase client, authenticated context helper and generated database types live under `supabase/`; feature-specific queries live with their domains. Signed-in activity persists while demo activity stays local. Places, analytics, monitoring, subscriptions and AI adapters remain out of scope.
