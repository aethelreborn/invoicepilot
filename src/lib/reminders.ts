import type { ReminderTone } from "@/lib/types";

export type ReminderTemplate = { subject: string; body: string };

export type TemplateVars = {
  client_name: string;
  invoice_number: string;
  amount: string;
  due_date: string;
  business_name: string;
  pay_url: string;
};

export const TEMPLATE_VARS = [
  "client_name",
  "invoice_number",
  "amount",
  "due_date",
  "business_name",
  "pay_url",
] as const;

export const DEFAULT_TEMPLATES: Record<ReminderTone, ReminderTemplate> = {
  friendly: {
    subject: "Invoice {{invoice_number}} from {{business_name}}",
    body: `Hi {{client_name}},

Invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.

You can pay it here:
{{pay_url}}

If it has already gone out, ignore this note.

{{business_name}}`,
  },
  firm: {
    subject: "Following up on invoice {{invoice_number}}",
    body: `Hi {{client_name}},

Following up on invoice {{invoice_number}} for {{amount}}, which was due on {{due_date}}.

Could you let me know when I can expect payment? If something is holding it up, reply and tell me what you need from me.

Pay here: {{pay_url}}

{{business_name}}`,
  },
  final: {
    subject: "Final notice: invoice {{invoice_number}}",
    body: `Hi {{client_name}},

This is a final notice for invoice {{invoice_number}} for {{amount}}, due {{due_date}}.

Please send payment, or reply today and tell me when it will arrive.

Pay here: {{pay_url}}

{{business_name}}`,
  },
};

export function renderTemplate(text: string, vars: TemplateVars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in vars) return vars[key as keyof TemplateVars];
    return match;
  });
}

export function renderReminder(
  template: ReminderTemplate,
  vars: TemplateVars
): ReminderTemplate {
  return {
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
  };
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type HtmlArgs = {
  businessName: string;
  amount: string;
  invoiceNumber: string;
  dueDate: string;
  payUrl: string;
  qrUrl: string | null;
  message: string;
};

export function renderReminderHtml({
  businessName,
  amount,
  invoiceNumber,
  dueDate,
  payUrl,
  qrUrl,
  message,
}: HtmlArgs) {
  const paragraphs = escapeHtml(message)
    .split("\n\n")
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font:400 15px/1.6 Georgia,'Times New Roman',serif;color:#2b2921">${block.replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  const qr = qrUrl
    ? `<tr><td style="padding:0 0 20px"><img src="${qrUrl}" width="180" height="180" alt="UPI QR code for invoice ${escapeHtml(invoiceNumber)}" style="display:block;border:1px solid #d3cdbe"></td></tr>`
    : "";

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f0e8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0e8;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fbfaf6;border:1px solid #d3cdbe">
<tr><td style="padding:28px 32px 8px">
<p style="margin:0 0 6px;font:400 10px/1.2 'Courier New',monospace;letter-spacing:2px;text-transform:uppercase;color:#5f5a4e">Invoice ${escapeHtml(invoiceNumber)}</p>
<p style="margin:0 0 4px;font:400 34px/1.1 Georgia,'Times New Roman',serif;color:#16150f">${escapeHtml(amount)}</p>
<p style="margin:0 0 20px;font:400 13px/1.4 Georgia,'Times New Roman',serif;color:#5f5a4e">Due ${escapeHtml(dueDate)}</p>
</td></tr>
<tr><td style="padding:0 32px">${paragraphs}</td></tr>
<tr><td style="padding:4px 32px 24px">
<a href="${payUrl}" style="display:inline-block;background:#16150f;color:#f3f0e8;text-decoration:none;padding:14px 24px;font:500 14px/1 Arial,Helvetica,sans-serif">Complete payment</a>
</td></tr>
${qr}
<tr><td style="padding:18px 32px;border-top:1px solid #d3cdbe">
<p style="margin:0;font:400 11px/1.5 Arial,Helvetica,sans-serif;color:#5f5a4e">Sent by ${escapeHtml(businessName)}. Reply to this email to reach them directly.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
