export type EmailDeliveryStatus = {
  configured: boolean;
  provider: "resend" | "inactive";
  reason: string;
};

/** Credentials remain server-only. Callers must still enforce a member's opt-in preference. */
export function getEmailDeliveryStatus(): EmailDeliveryStatus {
  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!hasKey || !from) {
    return {
      configured: false,
      provider: "inactive",
      reason: "Email delivery is inactive until RESEND_API_KEY and a verified RESEND_FROM_EMAIL are configured.",
    };
  }
  return { configured: true, provider: "resend", reason: "Resend is configured. Delivery still requires the member's email opt-in and a verified recipient address." };
}

export async function sendOptedInEmail(input: { to: string; subject: string; html: string }) {
  const status = getEmailDeliveryStatus();
  if (!status.configured) return { sent: false as const, skipped: status.reason };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL!.trim(), to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}.`);
  const body = await response.json() as { id?: string };
  return { sent: true as const, id: body.id ?? null };
}
