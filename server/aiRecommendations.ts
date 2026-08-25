import { invokeLLM, listLLMModels } from "./_core/llm";
import type { RecommendationCatalogIntent } from "./catalog";

export type RecommendationInterpretation = RecommendationCatalogIntent & { explanation: string };

export function parseRecommendationInterpretation(content: unknown, fallbackQuery: string): RecommendationInterpretation | null {
  try {
    if (typeof content !== "string") return null;
    const value = JSON.parse(content) as Partial<RecommendationInterpretation>;
    const modelQuery = typeof value.query === "string" ? value.query.trim().replace(/\s+/g, " ").slice(0, 140) : "";
    const query = modelQuery || fallbackQuery.trim().replace(/\s+/g, " ").slice(0, 140);
    const referenceTitle = typeof value.referenceTitle === "string" && value.referenceTitle.trim() ? value.referenceTitle.trim().slice(0, 160) : null;
    const genreId = typeof value.genreId === "number" && Number.isInteger(value.genreId) && value.genreId > 0 ? value.genreId : null;
    const mediaType = value.mediaType === "movie" || value.mediaType === "tv" || value.mediaType === "all" ? value.mediaType : "all";
    const originalLanguage = typeof value.originalLanguage === "string" && /^[a-z]{2}$/.test(value.originalLanguage) ? value.originalLanguage : null;
    const modelExplanation = typeof value.explanation === "string" ? value.explanation.trim().replace(/\s+/g, " ").slice(0, 280) : "";
    const explanation = modelExplanation || "Catalog filters interpreted from your request.";
    return query.length >= 2 ? { query, referenceTitle, genreId, mediaType, originalLanguage, maxRuntimeMinutes: null, explanation } : null;
  } catch { return null; }
}

export async function interpretRecommendationPrompt(prompt: string): Promise<RecommendationInterpretation> {
  const models = await listLLMModels();
  const model = models.data.find(item => item.id === "gpt-5-mini")?.id;
  if (!model) throw new Error("The recommendation model is temporarily unavailable.");
  const response = await invokeLLM({
    model,
    maxCompletionTokens: 300,
    messages: [
      { role: "system", content: "Interpret a movie or series recommendation request into safe catalog filters. Never invent titles or facts. Pick genreId only from TMDb genre IDs: Action 28, Adventure 12, Animation 16, Comedy 35, Crime 80, Documentary 99, Drama 18, Family 10751, Fantasy 14, History 36, Horror 27, Music 10402, Mystery 9648, Romance 10749, Science Fiction 878, Thriller 53, War 10752, Western 37. Use originalLanguage only as a two-letter ISO 639-1 code when explicit. Use referenceTitle only if the user names a work. Output JSON only." },
      { role: "user", content: prompt },
    ],
    outputSchema: { name: "recommendation_intent", strict: true, schema: { type: "object", properties: { query: { type: "string", minLength: 2, maxLength: 140 }, referenceTitle: { type: ["string", "null"] }, genreId: { type: ["integer", "null"] }, mediaType: { type: "string", enum: ["movie", "tv", "all"] }, originalLanguage: { type: ["string", "null"] }, explanation: { type: "string", minLength: 1, maxLength: 280 } }, required: ["query", "referenceTitle", "genreId", "mediaType", "originalLanguage", "explanation"], additionalProperties: false } },
  });
  const result = parseRecommendationInterpretation(response.choices[0]?.message.content, prompt);
  if (!result) throw new Error("I could not interpret that recommendation request. Try a genre, language, mood, or title you liked.");
  return result;
}
