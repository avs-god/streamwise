import { describe, expect, it } from "vitest";
import { getEmailDeliveryStatus, sendOptedInEmail } from "./email";

describe("email delivery readiness", () => {
  it("stays inactive without both server-only Resend settings", () => {
    const previousKey = process.env.RESEND_API_KEY;
    const previousFrom = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    try {
      expect(getEmailDeliveryStatus()).toEqual(expect.objectContaining({ configured: false, provider: "inactive" }));
    } finally {
      if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey;
      if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = previousFrom;
    }
  });

  it("skips delivery without Resend configuration instead of attempting a network request", async () => {
    const previousKey = process.env.RESEND_API_KEY;
    const previousFrom = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    try {
      await expect(sendOptedInEmail({ to: "member@example.com", subject: "Update", html: "<p>Update</p>" })).resolves.toEqual(expect.objectContaining({ sent: false }));
    } finally {
      if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey;
      if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = previousFrom;
    }
  });
});
