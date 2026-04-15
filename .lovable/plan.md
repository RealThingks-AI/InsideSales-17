

## Three Issues — Root Causes & Fix Plan

### Issue 1: Email sends from `crm@realthingks.com` instead of logged-in user's email

**Root Cause:** Line 71 in `send-campaign-email/index.ts` hardcodes `actualSenderEmail = azureConfig.senderEmail` (which is `crm@realthingks.com`). The previous fix forced this because the Azure app only has `Mail.Send` permission for the shared mailbox, not individual user mailboxes.

**Fix:** Switch to a two-step approach (create draft + send) but on the **shared mailbox**, then set the `from` address to the logged-in user's email. This uses `Mail.ReadWrite` + `Mail.Send` on the shared mailbox only. The email appears as sent "on behalf of" the user.

Alternatively, if the Azure app has `Mail.Send` delegated permission for user mailboxes, we can send directly as the user. But given the 403 error in logs when trying `deepak.dongare@realthingks.com`, the app lacks that permission.

**Practical fix:** Use the shared mailbox but set `from` field to the logged-in user's email in the Graph API payload. This requires the shared mailbox to grant "Send As" or "Send on Behalf" rights to users in Exchange Admin. The `sendMail` API supports a `from` field:

```json
{
  "message": {
    "from": { "emailAddress": { "address": "deepak.dongare@realthingks.com" } },
    "subject": "...",
    "toRecipients": [...]
  }
}
```

**Changes:**
- `_shared/azure-email.ts`: Add `senderDisplayEmail` parameter to `sendEmailViaGraph` and include `from` field in the Graph payload
- `send-campaign-email/index.ts`: Pass user's email as the `from` address, keep sending via shared mailbox

### Issue 2: Email replies not tracked — `conversation_id` is always null

**Root Cause:** The `sendMail` endpoint returns `202 No Content` — no response body. So `sendEmailViaGraph` returns `conversationId: null`, `internetMessageId: null`, `graphMessageId: null`. The `check-email-replies` function filters on `NOT conversation_id IS NULL`, so it finds zero trackable emails.

**Fix:** After sending via `sendMail`, query the Sent Items folder to retrieve the message metadata (conversationId, internetMessageId). Add a short delay then fetch the most recent sent message matching the subject/recipient:

```
GET /users/{mailbox}/mailFolders/sentitems/messages?$top=1&$orderby=sentDateTime desc&$filter=subject eq '{subject}'
```

**Changes:**
- `_shared/azure-email.ts`: After successful `sendMail`, query Sent Items to get `conversationId`, `internetMessageId`, `graphMessageId`
- `check-email-replies/index.ts`: No changes needed — it already works correctly once conversation_id is populated

### Issue 3: Preview in app differs from actual sent email

**Root Cause:** Looking at the screenshots — the preview shows the raw text with proper line breaks (`Email Template body 4` on one line, `Regards, Deepak Dongare` on another). But the sent email shows them concatenated: `Email Template body 4 Regards, Deepak Dongare`. This happens because:
- The body is sent as `contentType: "HTML"` in Graph API
- But the body content is plain text with `\n` newlines, not HTML `<br>` tags
- The preview uses `whitespace-pre-wrap` CSS which renders `\n` correctly
- But email clients render HTML where `\n` is just whitespace

**Fix:** Convert plain text body to HTML before sending — replace `\n` with `<br>` tags. If the body already contains HTML tags, leave it as-is.

**Changes:**
- `send-campaign-email/index.ts`: Before sending, convert plain text newlines to `<br>` tags in the body

---

### Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/_shared/azure-email.ts` | Add `from` address support; add post-send Sent Items query for metadata |
| `supabase/functions/send-campaign-email/index.ts` | Pass user email as `from`; convert `\n` to `<br>` in body |
| Redeploy both `send-campaign-email` and `check-email-replies` edge functions |

