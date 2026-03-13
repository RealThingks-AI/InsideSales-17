

## Campaign Module Deep Audit Report

### Audit Summary

After reading every Campaign component, hook, edge function, and database schema, I identified **12 concrete issues** ranging from bugs to missing validations and UX gaps. The module's core architecture is solid, but these issues must be fixed for production readiness.

---

### Issues Found

#### Bug 1: Campaign deletion does not cascade to related tables
**File:** `src/hooks/useCampaigns.tsx` line 66
**Problem:** `deleteCampaign` only deletes from `campaigns` table. The DB has no foreign key cascades defined (confirmed: no foreign keys on any campaign_* table). Deleting a campaign leaves orphan records in `campaign_accounts`, `campaign_contacts`, `campaign_communications`, `campaign_email_templates`, `campaign_phone_scripts`, `campaign_materials`.
**Fix:** Before deleting the campaign, delete from all child tables (or add foreign key constraints with ON DELETE CASCADE).

#### Bug 2: ConvertToDealDialog stores `lead_owner` as display name instead of UUID
**File:** `src/components/campaigns/ConvertToDealDialog.tsx` line 159
**Problem:** The owner Select uses `value={u.full_name || u.id}` -- so `lead_owner` gets set to a string like "John Smith" instead of the user's UUID. This breaks owner lookups elsewhere.
**Fix:** Change the SelectItem value to `u.id`.

#### Bug 3: No date validation on campaign creation/edit
**File:** `src/components/campaigns/CampaignModal.tsx`
**Problem:** Start date can be set after end date. No validation prevents this.
**Fix:** Add validation: if both dates are set, start_date must be <= end_date.

#### Bug 4: Owner does not default to current user on new campaign
**File:** `src/components/campaigns/CampaignModal.tsx` line 70
**Problem:** When creating a new campaign, `owner` defaults to empty string. The plan requires it to default to the current user.
**Fix:** Set `owner` default to `user?.id` when creating a new campaign.

#### Bug 5: Campaign accounts have no foreign key constraints
**Problem:** `campaign_accounts`, `campaign_contacts`, etc. have no foreign keys to `campaigns`, `accounts`, or `contacts` tables. This means:
- Deleted accounts/contacts remain as campaign_accounts/campaign_contacts entries pointing to non-existent records
- No referential integrity
**Fix:** Add foreign key constraints with ON DELETE CASCADE via migration.

#### Bug 6: Send email dialog doesn't refresh communications list after send
**File:** `src/components/campaigns/CampaignOutreachTab.tsx` line 159
**Problem:** After sending, it calls `contactsQuery.query.refetch()` but not `query.refetch()` (the communications query). The sent email won't appear in the communications table until manual refresh.
**Fix:** Also call `query.refetch()` after successful send (the edge function inserts into `campaign_communications`).

#### Bug 7: Account filter on contacts uses `company_name` string matching instead of account_id
**File:** `src/components/campaigns/CampaignContactsTab.tsx` line 53-55
**Problem:** Filter compares `c.company_name?.toLowerCase()` with `account.accounts?.account_name?.toLowerCase()`. This is fragile -- different casing, extra spaces, or renamed accounts will break the filter. The contacts table doesn't have an `account_id` column, so this is a design limitation.
**Severity:** Low -- works for most cases but imperfect.

#### Issue 8: No pagination on campaign list or sub-tabs
**Problem:** All queries fetch full datasets without limits. With 1000+ contacts or communications, this will hit the Supabase 1000-row default limit and degrade performance.
**Fix:** Add pagination to CampaignList, CampaignAccountsTab, CampaignContactsTab, and CampaignOutreachTab.

#### Issue 9: Action items tab doesn't support assigning tasks to other users
**File:** `src/components/campaigns/CampaignActionItemsTab.tsx`
**Problem:** The create dialog has no "Assigned To" field. Tasks can only be created by the current user with no assignment capability. The plan requires tasks to have an Owner field.
**Fix:** Add an "Assigned To" dropdown using profiles query.

#### Issue 10: No "Campaign Goal" field
**Problem:** The plan specifies a Campaign Goal field. The current form has Description and Message Strategy but no explicit Goal field.
**Severity:** Minor -- Description can serve as goal, but adding a dedicated field improves clarity.

#### Issue 11: Campaign settings `as any` type casts
**File:** `src/components/settings/CampaignSettings.tsx` lines 35-36, 59-61
**Problem:** Uses `as any` casts because `campaign_settings` table isn't in the generated types. This is cosmetic but indicates the types.ts wasn't regenerated after the migration.
**Severity:** Low -- functional but not type-safe.

#### Issue 12: Aggregates query can hit 1000-row limit
**File:** `src/hooks/useCampaigns.tsx` lines 459-463
**Problem:** `useCampaignAggregates` fetches ALL `campaign_accounts`, `campaign_contacts`, and `deals` to count per campaign. With scale, each query is capped at 1000 rows, producing incorrect counts.
**Fix:** Use a database function or RPC to compute aggregates server-side, or at minimum add `.limit(10000)` as a temporary measure.

---

### Implementation Plan

#### Phase 1: Critical Bug Fixes

1. **Fix campaign deletion cascade** -- Delete child records before campaign in `useCampaigns.tsx`
2. **Fix ConvertToDealDialog owner value** -- Change SelectItem value from `u.full_name` to `u.id`
3. **Fix communications refresh after email send** -- Add `query.refetch()` in CampaignOutreachTab
4. **Add date validation** -- Prevent start > end in CampaignModal
5. **Default owner to current user** -- Set owner = user.id on new campaign

#### Phase 2: Data Integrity

6. **Add foreign key constraints** -- Migration to add FKs with ON DELETE CASCADE on all campaign child tables (`campaign_accounts.campaign_id -> campaigns.id`, `campaign_accounts.account_id -> accounts.id`, etc.)

#### Phase 3: Missing Features

7. **Add "Assigned To" to campaign action items** -- Add user dropdown in create dialog
8. **Add pagination** to contacts and communications tabs (accounts and list are manageable)

#### Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useCampaigns.tsx` | Fix deleteCampaign cascade, fix aggregates limit |
| `src/components/campaigns/ConvertToDealDialog.tsx` | Fix owner value to UUID |
| `src/components/campaigns/CampaignOutreachTab.tsx` | Refresh comms after send |
| `src/components/campaigns/CampaignModal.tsx` | Date validation, default owner |
| `src/components/campaigns/CampaignActionItemsTab.tsx` | Add assigned_to field |
| DB migration | Add foreign key constraints with CASCADE |

