import { invokeLLM, listLLMModels, type Tool } from "./_core/llm";

const COMMUNITY_HOSTS = ["reddit.com", "x.com", "twitter.com", "instagram.com", "quora.com", "facebook.com", "tiktok.com"];
const ASSERTIVE_AVAILABILITY = /\b(currently available|now streaming|watch(?:ing)? on|is on (?:netflix|prime|disney|hulu|mubi|apple tv)|leaving soon|leaves? (?:netflix|prime|disney|hulu|mubi|apple tv)|has moved to|moved to (?:netflix|prime|disney|hulu|mubi|apple tv)|transferred to)\b/i;

export type ResearchSource = { title: string; url: string; domain: string; kind: "reporting" | "community" };
export type DiscoveryResearch = { status: "lead" | "insufficient"; sources: ResearchSource[]; communitySources: ResearchSource[]; summary: string; searchedAt: string; limitation: string };
type Citation = { title?: string; url?: string };
type RawResponse = { choices?: Array<{ message?: { content?: string | Array<unknown>; metadata?: { source_citations?: Citation[] } } }> };
type StructuredLead = { status: "lead" | "insufficient"; summary: string };

function textContent(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => typeof part === "object" && part && "text" in part ? String((part as { text: unknown }).text) : "").join(" ");
  return "";
}

export function cleanSummary(content: string) { return content.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 900); }

function isCommunityHost(hostname: string) { return COMMUNITY_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`)); }

export function sourcesFrom(citations: Citation[] | undefined) {
  const reporting = new Map<string, ResearchSource>();
  const community = new Map<string, ResearchSource>();
  for (const citation of citations ?? []) {
    if (!citation.url) continue;
    try {
      const parsed = new URL(citation.url); const domain = parsed.hostname.toLowerCase();
      if (reporting.has(citation.url) || community.has(citation.url)) continue;
      if (isCommunityHost(domain)) community.set(citation.url, { title: `Public discussion on ${domain.replace(/^www\./, "")}`, url: citation.url, domain, kind: "community" });
      else reporting.set(citation.url, { title: citation.title?.trim() || domain, url: citation.url, domain, kind: "reporting" });
    } catch { /* discard malformed citations */ }
  }
  return { sources: Array.from(reporting.values()).slice(0, 5), communitySources: Array.from(community.values()).slice(0, 5) };
}

export function parseStructuredLead(content: unknown): StructuredLead | null {
  try {
    const parsed = JSON.parse(textContent(content)) as Partial<StructuredLead>;
    if ((parsed.status !== "lead" && parsed.status !== "insufficient") || typeof parsed.summary !== "string") return null;
    const summary = cleanSummary(parsed.summary);
    if (!summary || summary.length > 900 || ASSERTIVE_AVAILABILITY.test(summary)) return null;
    return { status: parsed.status, summary };
  } catch { return null; }
}

function insufficient(message: string): DiscoveryResearch {
  return { status: "insufficient", summary: message, sources: [], communitySources: [], searchedAt: new Date().toISOString(), limitation: "AI research is not a substitute for a licensed legal-availability source. Public discussion links, when shown, are unverified and never used as availability or recommendation evidence." };
}

export async function researchDiscoveryLead(input: { query: string; region: string; language: string }): Promise<DiscoveryResearch> {
  const models = await listLLMModels();
  const model = models.data.find(item => item.id === "gpt-5-mini")?.id;
  if (!model) throw new Error("The configured AI research model is temporarily unavailable.");
  const response = await invokeLLM({
    model,
    maxCompletionTokens: 850,
    messages: [
      { role: "system", content: "You are Streamwise Research. Search the public web for relevant reporting, film or television criticism, guides, and public community discussion. For a simple title query or wording such as ‘where to watch’, still search for useful title-linked reading and discussion links; prefer status=lead whenever one or more inspectable sources were found. Do not treat any result as an availability fact. Never state that a title is currently available, now streaming, leaving soon, has left a service, or has transferred platforms. Use cautious language such as ‘a report discusses’ or ‘a public discussion raises an unverified possibility’. Do not repeat handles, names, comments, ratings, personal data, prices, or subscription credentials from community sources. Prefer official provider/studio announcements and reputable reporting for the concise summary. Output only the requested JSON object; the application will attach and label source citations independently." },
      { role: "user", content: `Research question: ${input.query}\nViewer country: ${input.region.toUpperCase()}\nLanguage context: ${input.language}\nThe verified legal catalog remains the authority for current offers.` },
    ],
    outputSchema: { name: "streamwise_research_lead", strict: true, schema: { type: "object", properties: { status: { type: "string", enum: ["lead", "insufficient"] }, summary: { type: "string", minLength: 1, maxLength: 900 } }, required: ["status", "summary"], additionalProperties: false } },
    tools: [{ type: "web_search", web_search_tool_conf: { search_context_size: "medium" } } as unknown as Tool],
    toolChoice: "auto",
  } as Parameters<typeof invokeLLM>[0]);
  const raw = response as unknown as RawResponse;
  const message = raw.choices?.[0]?.message;
  const structured = parseStructuredLead(message?.content);
  const sourceGroups = sourcesFrom(message?.metadata?.source_citations);
  if (!structured || (!sourceGroups.sources.length && !sourceGroups.communitySources.length)) return insufficient(`No inspectable public links were returned for “${input.query}”. Try the title with its year or an alternate spelling, and use the legal catalog for current country-specific offers.`);
  const summary = structured.status === "lead" ? structured.summary : `Public-web reading and discussion links related to “${input.query}” are collected below. Treat them as context, not current availability.`;
  return { status: "lead", summary, ...sourceGroups, searchedAt: new Date().toISOString(), limitation: "All public-web and community items are unverified leads, not availability, leaving-soon, or platform-transfer facts. They do not affect tracking, alerts, or subscription decisions. Confirm current offers in the legal catalog and inspect each source directly." };
}
