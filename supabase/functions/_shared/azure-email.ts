// Shared Microsoft Graph email sending utility

export interface AzureEmailConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  senderEmail: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  graphMessageId?: string;
  internetMessageId?: string;
  conversationId?: string;
}

export function getAzureEmailConfig(): AzureEmailConfig | null {
  const tenantId = Deno.env.get("AZURE_EMAIL_TENANT_ID") || Deno.env.get("AZURE_TENANT_ID");
  const clientId = Deno.env.get("AZURE_EMAIL_CLIENT_ID") || Deno.env.get("AZURE_CLIENT_ID");
  const clientSecret = Deno.env.get("AZURE_EMAIL_CLIENT_SECRET") || Deno.env.get("AZURE_CLIENT_SECRET");
  const senderEmail = Deno.env.get("AZURE_SENDER_EMAIL");

  if (!tenantId || !clientId || !clientSecret || !senderEmail) {
    return null;
  }

  return { tenantId, clientId, clientSecret, senderEmail };
}

export async function getGraphAccessToken(config: AzureEmailConfig): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  const data = await resp.json();
  if (!data.access_token) {
    const errMsg = data.error_description || data.error || "Unknown token error";
    throw new Error(`Azure token error: ${errMsg}`);
  }
  return data.access_token;
}

/**
 * Send email via Graph sendMail API on the shared mailbox,
 * optionally setting the `from` address to the logged-in user's email.
 * After sending, queries Sent Items to retrieve conversationId/internetMessageId
 * for reply tracking.
 */
export async function sendEmailViaGraph(
  accessToken: string,
  senderEmail: string,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  htmlBody: string,
  fromEmail?: string,
): Promise<SendEmailResult> {
  const sendUrl = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;

  // Build message payload
  const message: Record<string, unknown> = {
    subject,
    body: { contentType: "HTML", content: htmlBody },
    toRecipients: [{ emailAddress: { address: recipientEmail, name: recipientName } }],
  };

  // Note: Setting a "from" address different from the mailbox requires
  // "Send As" or "Send on Behalf" permission in Exchange Admin.
  // Currently disabled because the Azure app lacks this permission.
  // To enable: grant "Send As" rights on the shared mailbox, then uncomment:
  // if (fromEmail && fromEmail.toLowerCase() !== senderEmail.toLowerCase()) {
  //   message.from = { emailAddress: { address: fromEmail } };
  // }

  const sendResp = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!sendResp.ok) {
    const errBody = await sendResp.text();
    let errorCode = "SEND_FAILED";
    try {
      const parsed = JSON.parse(errBody);
      errorCode = parsed?.error?.code || "SEND_FAILED";
    } catch { /* ignore */ }
    console.error(`Graph sendMail failed for ${recipientEmail}: ${sendResp.status} ${errBody}`);
    return { success: false, error: errBody, errorCode };
  }

  // sendMail returns 202 with empty body — consume it
  await sendResp.text();

  // Query Sent Items to retrieve message metadata for reply tracking
  // Small delay to allow Graph to index the sent message
  await new Promise((r) => setTimeout(r, 2000));

  let graphMessageId: string | null = null;
  let internetMessageId: string | null = null;
  let conversationId: string | null = null;

  try {
    // Escape single quotes in subject for OData filter
    const escapedSubject = subject.replace(/'/g, "''");
    const filter = encodeURIComponent(`subject eq '${escapedSubject}'`);
    const sentItemsUrl = `https://graph.microsoft.com/v1.0/users/${senderEmail}/mailFolders/sentitems/messages?$top=1&$orderby=sentDateTime desc&$filter=${filter}&$select=id,internetMessageId,conversationId`;

    const sentResp = await fetch(sentItemsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (sentResp.ok) {
      const sentData = await sentResp.json();
      const msgs = sentData.value || [];
      if (msgs.length > 0) {
        graphMessageId = msgs[0].id || null;
        internetMessageId = msgs[0].internetMessageId || null;
        conversationId = msgs[0].conversationId || null;
        console.log(`Retrieved sent message metadata: graphId=${graphMessageId}, internetMsgId=${internetMessageId}, convId=${conversationId}`);
      } else {
        console.warn("No sent message found in Sent Items after sendMail");
      }
    } else {
      const errText = await sentResp.text();
      console.warn(`Failed to query Sent Items: ${sentResp.status} ${errText}`);
    }
  } catch (metaErr) {
    console.warn("Error retrieving sent message metadata:", metaErr);
  }

  return {
    success: true,
    graphMessageId,
    internetMessageId,
    conversationId,
  };
}
