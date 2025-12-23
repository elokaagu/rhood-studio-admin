# Credits Actions Reference

Use this as the single place to review and adjust how credits are spent or awarded. Update the amounts/notes here whenever you change the underlying logic.

## Spend (debits)

| Action | Amount | Where | Notes |
| --- | --- | --- | --- |
| Boost opportunity | `-100` credits | `app/api/credits/boost-opportunity/route.ts` via RPC `spend_credits` | Requires DJ role, sufficient balance, active opportunity. Creates 24h boost record. |

## Award (credits added)

| Action | Amount | Where | Notes |
| --- | --- | --- | --- |
| Rating received | `+25` credits | `app/api/credits/award-rating-credits/route.ts` via RPC `award_credits` | Triggered when a rating is submitted; references `rating_received` transaction type. |
| Manual adjustment (fallback / refunds) | variable | same routes above when errors occur | Used as a refund path if boost creation fails, etc. |

## Other credit-related functions

- `supabase/migrations/COMPLETE_SETUP_AND_FIX.sql` – defines/refreshes leaderboard function and populates credits if missing.
- Leaderboard RPC: `get_credits_leaderboard(...)` (see the migration for logic and parameters).

## How to change amounts

1. Update the amount in the corresponding API route (see “Where” column).
2. Update this document to match.
3. If you change transaction types or add new ones, document them here.

## TODO / placeholders

- If you add more credit actions (e.g., uploading mixes, completing gigs), list them in the tables above with the exact amount and code location.
