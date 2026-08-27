import { describe, expect, it, vi } from "vitest";

const researchDiscoveryLead = vi.hoisted(() => vi.fn());
const getTasteProfile = vi.hoisted(() => vi.fn(async () => null));
const recommendCatalogFromIntent = vi.hoisted(() => vi.fn(async () => ({ configured: true, explanation: "Catalog picks.", titles: [
  { id: 1, title: "First Pick", mediaType: "movie", releaseDate: "2024-01-01", overview: null },
  { id: 2, title: "Second Pick", mediaType: "movie", releaseDate: "2023-01-01", overview: null },
  { id: 3, title: "Third Pick", mediaType: "movie", releaseDate: null, overview: null },
] })));
vi.mock("./aiDiscovery", () => ({ researchDiscoveryLead }));
vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), getTasteProfile }));
vi.mock("./aiRecommendations", () => ({ interpretRecommendationPrompt: vi.fn(async () => ({ query: "science fiction", referenceTitle: null, genreId: 878, mediaType: "movie", originalLanguage: null, maxRuntimeMinutes: null, explanation: "Science-fiction catalog intent." })) }));
vi.mock("./catalog", () => ({
  isCatalogConfigured: vi.fn(() => true), searchCatalog: vi.fn(), getCatalogDetail: vi.fn(), discoverCatalog: vi.fn(), getSimilarCatalogTitles: vi.fn(), getRecommendedCatalogTitles: vi.fn(), mergePostWatchRecommendations: vi.fn(),
  recommendCatalogFromIntent,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return { user: { id: 1, openId: "member", name: "Member", email: "member@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("ai.recommend conversational research", () => {
  it("returns catalog-backed top-three picks and source-linked public reading without importing external ratings", async () => {
    researchDiscoveryLead.mockResolvedValue({ status: "lead", directResponse: "Critic coverage is divided but praises the visual imagination.", sources: [{ title: "Film essay", url: "https://example.com/essay", domain: "example.com", kind: "reporting" }], communitySources: [{ title: "Public discussion", url: "https://reddit.com/r/movies/example", domain: "reddit.com", kind: "community" }], limitation: "Public-web context stays separate from the legal catalog." });
    const result = await appRouter.createCaller(context()).ai.recommend({ prompt: "Is this science fiction movie good to watch?", conversationContext: [{ role: "user", content: "I like thoughtful science fiction." }], region: "IN", language: "en-US" });
    expect(result.conversation.topPicks.map(pick => pick.title)).toEqual(["First Pick", "Second Pick", "Third Pick"]);
    expect(result.conversation.research?.sources[0]?.url).toBe("https://example.com/essay");
    expect(result.conversation.reply).toContain("I’d start with First Pick");
    expect(result.conversation.rationale).toContain("Science-fiction catalog intent");
    expect(result.conversation.nextStep).toContain("Open a pick to compare current legal offers");
  });

  it("keeps the model-interpreted natural-language catalog intent without a separate chat filter", async () => {
    researchDiscoveryLead.mockResolvedValue(null);
    await appRouter.createCaller(context()).ai.recommend({ prompt: "Suggest a clever series", region: "IN", language: "en-US" });
    expect(recommendCatalogFromIntent).toHaveBeenLastCalledWith(expect.objectContaining({ mediaType: "movie", genreId: 878 }), "en-US");
  });
});
