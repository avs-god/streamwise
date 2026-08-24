import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const mockedLlm = vi.hoisted(() => ({
  listLLMModels: vi.fn(async () => ({ data: [{ id: "gpt-5-mini" }] })),
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ status: "lead", summary: "An official announcement discusses a future licensing arrangement that may be relevant." }), metadata: { source_citations: [
    { title: "Official announcement", url: "https://press.example.com/announcement" },
    { title: "Social discussion", url: "https://www.reddit.com/r/example/comments/1" },
  ] } } }] })),
}));
vi.mock("./_core/llm", () => mockedLlm);

import { cleanSummary, parseStructuredLead, researchDiscoveryLead, sourcesFrom } from "./aiDiscovery";

describe("AI discovery provenance", () => {
  it("separates social-network citations into generic community links", () => {
    const groups = sourcesFrom([{ title: "Official", url: "https://studio.example/news" }, { title: "Thread", url: "https://x.com/person/status/1" }, { title: "Post", url: "https://www.instagram.com/p/example" }]);
    expect(groups.sources).toEqual([{ title: "Official", url: "https://studio.example/news", domain: "studio.example", kind: "reporting" }]);
    expect(groups.communitySources).toEqual(expect.arrayContaining([expect.objectContaining({ title: "Public discussion on x.com", kind: "community" }), expect.objectContaining({ title: "Public discussion on instagram.com", kind: "community" })]));
  });
  it("returns a source-linked lead only from strict validated model JSON", async () => {
    const result = await researchDiscoveryLead({ query: "Where might this series move?", region: "IN", language: "en-IN" });
    expect(result.status).toBe("lead"); expect(result.sources).toHaveLength(1); expect(result.communitySources).toHaveLength(1); expect(result.limitation).toMatch(/unverified leads/i);
    expect(mockedLlm.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ outputSchema: expect.any(Object) }));
  });
  it("rejects malformed or availability-asserting summaries", () => {
    expect(parseStructuredLead('{"status":"lead","summary":"This series is now streaming on Netflix."}')).toBeNull();
    expect(parseStructuredLead('{"status":"lead","summary":"A report may be relevant."}')).toEqual({ status: "lead", summary: "A report may be relevant." });
    expect(parseStructuredLead("not JSON")).toBeNull();
  });
  it("returns insufficient evidence when a valid AI summary lacks inspectable citations", async () => {
    mockedLlm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ status: "lead", summary: "A report may be relevant." }), metadata: { source_citations: [] } } }] });
    const result = await researchDiscoveryLead({ query: "A platform update", region: "US", language: "en-US" });

    expect(result.status).toBe("insufficient");
    expect(result.sources).toEqual([]);
    expect(result.communitySources).toEqual([]);
  });
  it("strips inline citation URLs from summaries", () => { expect(cleanSummary("Read [this](https://example.com) now.")).toBe("Read this now."); });
  it("keeps community discussion visibly separate in the consumer UI", () => {
    const panel = readFileSync(resolve(process.cwd(), "client/src/components/AiResearchPanel.tsx"), "utf8");
    expect(panel).toContain("Community and web discussion — unverified");
    expect(panel).toContain("No copied post text or handles");
    expect(panel).toContain("availability, alert, tracking, or recommendation evidence");
    expect(panel).toContain('role="alert"');
    expect(panel).toContain("Insufficient source evidence");
  });
});
