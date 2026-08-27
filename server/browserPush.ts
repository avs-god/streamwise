import webpush from "web-push";
import { getAlertPreferences, getBrowserPushSubscriptions, removeBrowserPushSubscription } from "./db";

type PushPayload = { title: string; body: string; url: string };
function configured() {
  const publicKey = process.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim() ?? "";
  const subject = process.env.WEB_PUSH_SUBJECT?.trim() ?? "";
  return { publicKey, privateKey, subject, ready: Boolean(publicKey && privateKey && subject) };
}

export function getBrowserPushDeliveryStatus() {
  const state = configured();
  return { configured: state.ready, reason: state.ready ? null : "Browser push is inactive until VAPID public key, private key, and contact subject are configured." };
}

/** Sends only a member-selected in-app alert to previously permissioned browsers. */
export async function sendOptedInBrowserPush(userId: number, payload: PushPayload) {
  const state = configured();
  if (!state.ready) return { status: "not_configured" as const, delivered: 0 };
  const preferences = await getAlertPreferences(userId);
  if (!preferences.pushEnabled) return { status: "not_enabled" as const, delivered: 0 };
  const subscriptions = await getBrowserPushSubscriptions(userId);
  if (!subscriptions.length) return { status: "no_subscription" as const, delivered: 0 };
  webpush.setVapidDetails(state.subject, state.publicKey, state.privateKey);
  let delivered = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: payload.title.slice(0, 120), body: payload.body.slice(0, 280), url: payload.url.startsWith("/") ? payload.url : "/updates" }), { TTL: 3600, urgency: "low" });
      delivered += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await removeBrowserPushSubscription(userId, subscription.endpoint);
    }
  }
  return { status: "sent" as const, delivered };
}
