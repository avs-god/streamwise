import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
  getAlertPreferences: vi.fn(),
  getBrowserPushSubscriptions: vi.fn(),
  removeBrowserPushSubscription: vi.fn(),
}));

vi.mock("web-push", () => ({ default: { sendNotification: mocks.sendNotification, setVapidDetails: mocks.setVapidDetails } }));
vi.mock("./db", () => ({ getAlertPreferences: mocks.getAlertPreferences, getBrowserPushSubscriptions: mocks.getBrowserPushSubscriptions, removeBrowserPushSubscription: mocks.removeBrowserPushSubscription }));

import { getBrowserPushDeliveryStatus, sendOptedInBrowserPush } from "./browserPush";

describe("browser push delivery guard", () => {
  beforeEach(() => {
    vi.unstubAllEnvs(); vi.clearAllMocks();
    mocks.getAlertPreferences.mockResolvedValue({ pushEnabled: false });
    mocks.getBrowserPushSubscriptions.mockResolvedValue([]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reports an inactive provider and does not send without a complete VAPID configuration", async () => {
    vi.stubEnv("VITE_WEB_PUSH_PUBLIC_KEY", ""); vi.stubEnv("WEB_PUSH_PRIVATE_KEY", ""); vi.stubEnv("WEB_PUSH_SUBJECT", "");
    expect(getBrowserPushDeliveryStatus()).toMatchObject({ configured: false });
    await expect(sendOptedInBrowserPush(3, { title: "Title", body: "Body", url: "/updates" })).resolves.toEqual({ status: "not_configured", delivered: 0 });
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it("does not deliver to a stored endpoint until the member explicitly enables push", async () => {
    vi.stubEnv("VITE_WEB_PUSH_PUBLIC_KEY", "public-key"); vi.stubEnv("WEB_PUSH_PRIVATE_KEY", "private-key"); vi.stubEnv("WEB_PUSH_SUBJECT", "mailto:admin@example.com");
    mocks.getBrowserPushSubscriptions.mockResolvedValue([{ endpoint: "https://push.example/subscription", p256dh: "p".repeat(32), auth: "a".repeat(16) }]);
    await expect(sendOptedInBrowserPush(3, { title: "Title", body: "Body", url: "/updates" })).resolves.toEqual({ status: "not_enabled", delivered: 0 });
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it("deletes an expired endpoint after a provider 410 response", async () => {
    vi.stubEnv("VITE_WEB_PUSH_PUBLIC_KEY", "public-key"); vi.stubEnv("WEB_PUSH_PRIVATE_KEY", "private-key"); vi.stubEnv("WEB_PUSH_SUBJECT", "mailto:admin@example.com");
    mocks.getAlertPreferences.mockResolvedValue({ pushEnabled: true });
    mocks.getBrowserPushSubscriptions.mockResolvedValue([{ endpoint: "https://push.example/subscription", p256dh: "p".repeat(32), auth: "a".repeat(16) }]);
    mocks.sendNotification.mockRejectedValue({ statusCode: 410 });
    await expect(sendOptedInBrowserPush(3, { title: "Title", body: "Body", url: "/updates" })).resolves.toEqual({ status: "sent", delivered: 0 });
    expect(mocks.removeBrowserPushSubscription).toHaveBeenCalledWith(3, "https://push.example/subscription");
  });
});
