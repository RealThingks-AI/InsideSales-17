

## Campaign Module Enhancement Plan

### Current State
The Campaign module is already extensively built with: campaign CRUD, accounts/contacts tabs with bulk add, outreach logging, email templates, phone scripts, materials, action items, convert-to-deal, analytics, and campaign settings. All DB tables and RLS policies are in place.

### What Needs to Be Built

---

### 1. Send Emails Directly from Campaign (New Edge Function)

**Problem:** Currently the outreach tab only *logs* communications. Users cannot actually send emails from within the campaign.

**Solution:** Create a `send-campaign-email` edge function using the existing Microsoft Graph API integration (Azure credentials already configured as secrets: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SENDER_EMAIL`). Pattern copied from `daily-action-reminders/index.ts`.

**Changes:**
- **New file:** `supabase/functions/send-campaign-email/index.ts` -- accepts `recipientEmail`, `recipientName`, `subject`, `body`, `contactId`, `accountId`, `campaignId`; sends via Graph API; records in `email_history` and `campaign_communications`
- **Update `supabase/config.toml`:** Add `[functions.send-campaign-email]` with `verify_jwt = false`
- **Update `CampaignOutreachTab.tsx`:** Add a "Send Email" button alongside "Log Communication" that opens a compose dialog. The compose dialog will allow selecting a contact, choosing an email template (pre-fills subject/body), and sending. On send, it calls the edge function and also updates the campaign contact stage to "Email Sent"
- **Update `CampaignEmailTemplatesTab.tsx`:** Add a "Use Template" action on each template row that opens the send dialog pre-filled with that template

---

### 2. Enhanced Account & Contact Filters

**Problem:** Account add popover only has search. Contact add popover only filters by account and search. Missing: industry, country, owner, deal stage filters for accounts; position/seniority filters for contacts.

**Changes:**
- **`CampaignAccountsTab.tsx`:** Add filter dropdowns inside the add-accounts popover for Industry, Country. Extract unique values from the accounts query results for dynamic filter options
- **`CampaignContactsTab.tsx`:** Add a Position/Title filter dropdown inside the add-contacts popover. Extract unique positions from available contacts

No DB changes needed -- just UI filter logic on existing data.

---

### 3. Persist Campaign Settings

**Problem:** Follow-up rules (days between, max follow-ups) in `CampaignSettings.tsx` are local `useState` only -- they reset on page reload.

**Solution:**
- **DB migration:** Create a `campaign_settings` table with columns: `id`, `setting_key` (text, unique), `setting_value` (text), `updated_by` (uuid), `updated_at` (timestamptz). Add RLS: admins can read/write, users can read
- **Update `CampaignSettings.tsx`:** Load settings from the table on mount, save on change with a "Save" button that upserts values. Keys: `follow_up_days`, `max_follow_ups`

---

### 4. Review & Fix Existing Issues

After implementing the above, review the full flow:
- Verify campaign creation, account/contact adding, outreach logging, convert-to-deal
- Ensure email templates and phone scripts CRUD works
- Check analytics tab data accuracy
- Verify action items link properly to the Action Items module
- Test campaign settings persistence

---

### Implementation Order
1. DB migration for `campaign_settings` table
2. Persist campaign settings UI
3. Enhanced filters for accounts and contacts tabs
4. `send-campaign-email` edge function
5. Campaign email send UI in outreach tab
6. End-to-end review and fixes

### Files Modified/Created

| File | Action |
|------|--------|
| `supabase/functions/send-campaign-email/index.ts` | Create |
| `supabase/config.toml` | Edit (add function config) |
| `src/components/campaigns/CampaignOutreachTab.tsx` | Edit (add send email UI) |
| `src/components/campaigns/CampaignEmailTemplatesTab.tsx` | Edit (add "Use Template" action) |
| `src/components/campaigns/CampaignAccountsTab.tsx` | Edit (add industry/country filters) |
| `src/components/campaigns/CampaignContactsTab.tsx` | Edit (add position filter) |
| `src/components/settings/CampaignSettings.tsx` | Edit (persist to DB) |
| DB migration | Create `campaign_settings` table |

