import { getAlertPreferences, getSubscriptions, getWatchlist } from "./db";
import { invokeLLM, listLLMModels } from "./_core/llm";

export type AssistantReply = { answer: string; usedInputs: string[]; limitation: string };

export function parseAssistantReply(content: unknown): AssistantReply | null {
  try {
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content) as Partial<AssistantReply>;
    if (typeof parsed.answer !== "string" || !Array.isArray(parsed.usedInputs) || typeof parsed.limitation !== "string") return null;
    const answer = parsed.answer.trim().slice(0, 1800);
    const usedInputs = parsed.usedInputs.filter((input): input is string => typeof input === "string").map(input => input.slice(0, 120)).slice(0, 6);
    if (!answer || !usedInputs.length) return null;
    return { answer, usedInputs, limitation: parsed.limitation.trim().slice(0, 500) || "This is guidance from your explicit Streamwise records, not a live catalog or financial instruction." };
  } catch { return null; }
}

export async function askPersonalAssistant(userId: number, question: string): Promise<AssistantReply> {
  const [wallet, watchlist, preferences] = await Promise.all([getSubscriptions(userId), getWatchlist(userId), getAlertPreferences(userId)]);
  const context = {
    subscriptions: wallet.map(item => ({ provider: item.providerName, plan: item.planName, price: String(item.price), currency: item.currency, cycle: item.billingCycle, renewalDate: item.renewalDate?.toISOString() ?? null, status: item.status, intent: item.viewingIntent, pauseReview: item.pauseUntil?.toISOString() ?? null })),
    savedTitles: watchlist.map(item => ({ title: item.title, plannedFor: item.plannedFor, snapshotProviders: (() => { try { return JSON.parse(item.providerNamesJson); } catch { return []; } })(), snapshotCheckedAt: item.availabilityCheckedAt?.toISOString() ?? null })),
    reminderChoices: { inApp: preferences.inAppEnabled, renewal: preferences.renewalRemindersEnabled, pause: preferences.pauseRemindersEnabled, leadDays: preferences.renewalLeadDays },
  };
  const models = await listLLMModels();
  const model = models.data.find(item => item.id === "gpt-5-mini")?.id;
  if (!model) throw new Error("The personal assistant model is temporarily unavailable.");
  const response = await invokeLLM({
    model, maxCompletionTokens: 700,
    messages: [
      { role: "system", content: "You are the Streamwise private planning assistant. Answer only from the explicit user context and the current question. Do not claim current streaming availability, provider prices, leaving-soon dates, personal affordability, or any data not supplied. Do not give instructions that perform cancellations or purchases. Treat saved provider snapshots as historic, not live facts. Be concise, practical, and say when information is missing. Output strict JSON only." },
      { role: "user", content: `Question: ${question}\n\nExplicit Streamwise context: ${JSON.stringify(context)}` },
    ],
    outputSchema: { name: "streamwise_private_assistant", strict: true, schema: { type: "object", properties: { answer: { type: "string", minLength: 1, maxLength: 1800 }, usedInputs: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 }, limitation: { type: "string", minLength: 1, maxLength: 500 } }, required: ["answer", "usedInputs", "limitation"], additionalProperties: false } },
  });
  const parsed = parseAssistantReply(response.choices[0]?.message.content);
  if (!parsed) throw new Error("The assistant returned an invalid response. Please try again.");
  return parsed;
}
