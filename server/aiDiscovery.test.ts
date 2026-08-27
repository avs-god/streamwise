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

import { cleanSummary, parseStructuredLead, researchDiscoveryLead, resolveResearchQuery, sourcesFrom } from "./aiDiscovery";

describe("AI discovery provenance", () => {
  it("keeps the managed research fallback active when direct-provider selection has no API key", async () => {
    const previousProvider = process.env.AI_PROVIDER;
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    try {
      const result = await researchDiscoveryLead({ query: "A platform update", region: "US", language: "en-US" });
      expect(result.status).toBe("lead");
      expect(mockedLlm.invokeLLM).toHaveBeenCalled();
    } finally {
      if (previousProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = previousProvider;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    }
  });
  it("separates social-network citations into generic community links", () => {
    const groups = sourcesFrom([{ title: "Official", url: "https://studio.example/news" }, { title: "Thread", url: "https://x.com/person/status/1" }, { title: "Post", url: "https://www.instagram.com/p/example" }]);
    expect(groups.sources).toEqual([{ title: "Official", url: "https://studio.example/news", domain: "studio.example", kind: "reporting" }]);
    expect(groups.communitySources).toEqual(expect.arrayContaining([expect.objectContaining({ title: "Public discussion on x.com", kind: "community" }), expect.objectContaining({ title: "Public discussion on instagram.com", kind: "community" })]));
  });
  it("returns a source-linked lead only from strict validated model JSON", async () => {
    const result = await researchDiscoveryLead({ query: "Where might this series move?", region: "IN", language: "en-IN" });
    expect(result.status).toBe("lead"); expect(result.sources).toHaveLength(1); expect(result.communitySources).toHaveLength(1); expect(result.limitation).toMatch(/licensed country-specific legal catalog/i);
    expect(mockedLlm.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ outputSchema: expect.any(Object) }));
  });
  it("resolves the reported Tencet typo before issuing a grounded title search", async () => {
    expect(resolveResearchQuery("Tencet")).toEqual({ resolvedQuery: "Tenet 2020 film", correctionNote: "Searched the likely title **Tenet** (2020) for “Tencet”." });
    const result = await researchDiscoveryLead({ query: "Tencet", region: "IN", language: "en-IN" });
    expect(result.resolvedQuery).toBe("Tenet 2020 film");
    expect(result.correctionNote).toMatch(/Tenet/);
    expect(mockedLlm.invokeLLM).toHaveBeenLastCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ content: expect.stringContaining("Resolved search intent: Tenet 2020 film") })]) }));
  });
  it("rejects malformed, assertive summary, or sensitive direct-answer content while retaining a direct web answer", () => {
    expect(parseStructuredLead('{"status":"lead","summary":"This series is now streaming on Netflix."}')).toBeNull();
    expect(parseStructuredLead('{"status":"lead","summary":"A public report may be relevant.","directResponse":"Search results say the film is now streaming on Netflix; confirm it in the legal catalog."}')).toEqual({ status: "lead", summary: "A public report may be relevant.", directResponse: "Search results say the film is now streaming on Netflix; confirm it in the legal catalog." });
    expect(parseStructuredLead('{"status":"lead","summary":"A public report may be relevant.","directResponse":"Use API key abc123 to continue."}')).toBeNull();
    expect(parseStructuredLead('{"status":"lead","summary":"A report may be relevant."}')).toEqual({ status: "lead", summary: "A report may be relevant.", directResponse: "A report may be relevant." });
    expect(parseStructuredLead("not JSON")).toBeNull();
  });
  it("preserves safe direct-answer line breaks rather than rewriting the model response", () => {
    expect(parseStructuredLead('{"status":"lead","summary":"A report may be relevant.","directResponse":"First model line.\\n\\nSecond model line."}')).toEqual({ status: "lead", summary: "A report may be relevant.", directResponse: "First model line.\n\nSecond model line." });
  });
  it("returns insufficient evidence when a valid AI summary lacks inspectable citations", async () => {
    mockedLlm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ status: "lead", summary: "A report may be relevant." }), metadata: { source_citations: [] } } }] });
    const result = await researchDiscoveryLead({ query: "A platform update", region: "US", language: "en-US" });

    expect(result.status).toBe("insufficient");
    expect(result.sources).toEqual([]);
    expect(result.communitySources).toEqual([]);
    expect(result.summary).toMatch(/could not ground an inspectable public reading link/i);
  });
  it("recovers inspectable sources from inline citations when tool metadata omits them", async () => {
    mockedLlm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: '{"status":"lead","summary":"Read [a film guide](https://film.example/tenet-guide) for context."}', metadata: { source_citations: [] } } }] });
    const result = await researchDiscoveryLead({ query: "Tenet", region: "IN", language: "en-IN" });
    expect(result.status).toBe("lead");
    expect(result.sources).toEqual([expect.objectContaining({ url: "https://film.example/tenet-guide", title: "a film guide" })]);
  });
  it("keeps inspectable links for a simple where-to-watch wording even when the model returns an insufficient status", async () => {
    mockedLlm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ status: "insufficient", summary: "No concise summary was found." }), metadata: { source_citations: [{ title: "Film guide", url: "https://film.example/2012-guide" }] } } }] });
    const result = await researchDiscoveryLead({ query: "where to watch 2012 movie", region: "IN", language: "en-IN" });
    expect(result.status).toBe("lead");
    expect(result.sources).toHaveLength(1);
    expect(result.summary).toMatch(/context, not current availability/i);
  });
  it("resolves 2012 and returns the direct source-attributed web answer", async () => {
    mockedLlm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ status: "lead", summary: "Public pages discuss ways to watch the 2009 film.", directResponse: "Search results point to public pages discussing where to watch 2012 (2009); open the links below for the details, then confirm your current India offer in the legal catalog." }), metadata: { source_citations: [{ title: "2012 guide", url: "https://film.example/2012-guide" }] } } }] });
    const result = await researchDiscoveryLead({ query: "where to watch 2012 movie", region: "IN", language: "en-IN" });
    expect(result.resolvedQuery).toBe("2012 2009 film");
    expect(result.directResponse).toMatch(/Search results point/i);
    expect(result.sources).toHaveLength(1);
  });
  it("strips inline citation URLs from summaries", () => { expect(cleanSummary("Read [this](https://example.com) now.")).toBe("Read this now."); });
  it("keeps community discussion visibly separate in the consumer UI", () => {
    const panel = readFileSync(resolve(process.cwd(), "client/src/components/AiResearchPanel.tsx"), "utf8");
    expect(panel).toContain("Community and web discussion — unverified");
    expect(panel).toContain("No copied post text or handles");
    expect(panel).toContain("availability, alert, tracking, or recommendation evidence");
    expect(panel).toContain('role="alert"');
    expect(panel).toContain("No grounded source returned");
    expect(panel).toContain("Direct web-grounded answer");
    expect(panel).toContain("Searching the public web and compiling a direct answer");
    const leavingSoon = readFileSync(resolve(process.cwd(), "client/src/pages/LeavingSoon.tsx"), "utf8");
    expect(leavingSoon).toContain("Direct web-grounded model response");
    expect(leavingSoon).toContain("research.data.directResponse");
    expect(leavingSoon).toContain("query: researchQuery.trim()");
  });
});
