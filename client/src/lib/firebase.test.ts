import { describe, expect, it } from "vitest";
import { getFirebaseStatus, isFirebaseConfigured } from "./firebase";

describe("firebase configuration", () => {
  it("stays inactive when web configuration is blank", () => {
    expect(isFirebaseConfigured).toBe(false);
    expect(getFirebaseStatus()).toMatchObject({
      configured: false,
      provider: "manus-fallback",
    });
  });
});
