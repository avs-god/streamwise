import { describe, expect, it, vi } from "vitest";

const mockDb = vi.hoisted(() => ({
  getSubscriptions: vi.fn(async () => [{ providerName: "Netflix", planName: "Standard", price: "199.00", currency: "INR", billingCycle: "monthly", renewalDate: new Date("2026-09-01"), status: "active", viewingIntent: "watch_now", pauseUntil: null }]),
  getWatchlist: vi.fn(async () => [{ title: "A Saved Film", plannedFor: "this_month", providerNamesJson: "[\"Netflix\"]", availabilityCheckedAt: new Date("2026-08-20") }]),
  getViewingSignals: vi.fn(async () => [{ title: "A Recorded Film", mediaType: "movie", status: "watched", recordedAt: new Date("2026-08-21") }]),
  getAlertPreferences: vi.fn(async () => ({ inAppEnabled: true, renewalRemindersEnabled: true, pauseRemindersEnabled: false, renewalLeadDays: 7 })),
}));
const mockLlm = vi.hoisted(() => ({
  listLLMModels: vi.fn(async () => ({ data: [{ id: "gpt-5-mini" }] })),
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ answer: "Review your next renewal before it is due.", usedInputs: ["Netflix Standard renewal date", "Renewal reminder preference"], limitation: "This uses only your saved Streamwise data." }) } }] })),
}));

vi.mock("./db", () => mockDb);
vi.mock("./_core/llm", () => mockLlm);

import { askPersonalAssistant, parseAssistantReply } from "./personalAssistant";

describe("personal assistant privacy contract", () => {
  it("rejects incomplete assistant output", () => {
    expect(parseAssistantReply('{"answer":"Hi"}')).toBeNull();
    expect(parseAssistantReply("not-json")).toBeNull();
  });

  it("uses explicit profile records and validates structured output", async () => {
    const reply = await askPersonalAssistant(41, "What should I review next?");

    expect(mockDb.getSubscriptions).toHaveBeenCalledWith(41);
    expect(mockDb.getWatchlist).toHaveBeenCalledWith(41);
    expect(mockDb.getViewingSignals).toHaveBeenCalledWith(41);
    expect(mockDb.getAlertPreferences).toHaveBeenCalledWith(41);
    expect(reply.usedInputs).toContain("Netflix Standard renewal date");
    expect(mockLlm.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ outputSchema: expect.any(Object) }));
    expect(mockLlm.invokeLLM.mock.calls[0]?.[0].messages[0]?.content).toContain("never infer it from public discussion");
  });
});
