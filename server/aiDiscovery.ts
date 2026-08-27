import { invokeLLM, listLLMModels, type Tool } from "./_core/llm";

const COMMUNITY_HOSTS = ["reddit.com", "x.com", "twitter.com", "instagram.com", "quora.com", "facebook.com", "tiktok.com"];
const ASSERTIVE_AVAILABILITY = /\b(currently available|now streaming|watch(?:ing)? on|is on (?:netflix|prime|disney|hulu|mubi|apple tv)|leaving soon|leaves? (?:netflix|prime|disney|hulu|mubi|apple tv)|has moved to|moved to (?:netflix|prime|disney|hulu|mubi|apple tv)|transferred to)\b/i;

export type ResearchSource = { title: string; url: string; domain: string; kind: "reporting" | "community" };
export type DiscoveryResearch = { status: "lead" | "insufficient"; sources: ResearchSource[]; communitySources: ResearchSource[]; summary: string; directResponse: string; searchedAt: string; limitation: string; resolvedQuery: string; correctionNote: string | null };
type Citation = { title?: string; url?: string };
type RawResponse = { choices?: Array<{ message?: { content?: string | Array<unknown>; metadata?: { source_citations?: Citation[] } } }> };
type StructuredLead = { status: "lead" | "insufficient"; summary: string; directResponse: string };

async function directProviderResearch(messages: Array<{ role: "system" | "user"; content: string }>) {
  if (process.env.AI_PROVIDER?.trim().toLowerCase() !== "openai") return null;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const response = await fetch(`${baseUrl}/responses`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model, input: messages.map(message => ({ role: message.role, content: [{ type: "input_text", text: message.content }] })), tools: [{ type: "web_search_preview" }], text: { format: { type: "json_schema", name: "streamwise_research_lead", strict: true, schema: { type: "object", properties: { status: { type: "string", enum: ["lead", "insufficient"] }, summary: { type: "string" }, directResponse: { type: "string" } }, required: ["status", "summary", "directResponse"], additionalProperties: false } } } }) });
  if (!response.ok) throw new Error(`Direct AI provider returned ${response.status}.`);
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ annotations?: Array<{ title?: string; url?: string }> }> }> };
  const citations = data.output?.flatMap(item => item.content?.flatMap(content => content.annotations?.map(annotation => ({ title: annotation.title, url: annotation.url })) ?? []) ?? []) ?? [];
  return { content: data.output_text ?? "", citations };
}

function textContent(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => typeof part === "object" && part && "text" in part ? String((part as { text: unknown }).text) : "").join(" ");
  return "";
}

export function cleanSummary(content: string) { return content.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 900); }
function validatedDirectResponse(content: string) { return content.length <= 1500 && content.trim() ? content : ""; }
function hasSensitiveContent(content: string) { return /\b(?:api[_ -]?key|password|secret|bearer\s+[a-z0-9._-]+)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(content); }

const titleAliases: Array<{ typo: RegExp; query: string; note: string }> = [
  { typo: /^tencet(?:\s+(?:movie|film))?$/i, query: "Tenet 2020 film", note: "Searched the likely title **Tenet** (2020) for “Tencet”." },
  { typo: /^(?:where\s+to\s+watch\s+)?2012(?:\s+(?:movie|film))?(?:\s+where\s+to\s+watch)?$/i, query: "2012 2009 film", note: "Searched the likely title **2012** (2009 film) for your question." },
];

/** Conservative, explainable title-intent correction before the grounded web search. */
export function resolveResearchQuery(query: string) {
  const normalized = query.trim().replace(/\s+/g, " ");
  const match = titleAliases.find(alias => alias.typo.test(normalized));
  return match ? { resolvedQuery: match.query, correctionNote: match.note } : { resolvedQuery: normalized, correctionNote: null };
}

function inlineCitations(content: unknown): Citation[] {
  const text = textContent(content);
  const markdown = Array.from(text.matchAll(/\[([^\]]{1,180})\]\((https?:\/\/[^)\s]+)\)/g), match => ({ title: match[1], url: match[2] }));
  const bare = Array.from(text.matchAll(/https?:\/\/[^\s)\]}>,]+/g), match => ({ url: match[0] }));
  return [...markdown, ...bare];
}

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
    const directResponse = validatedDirectResponse(typeof parsed.directResponse === "string" ? parsed.directResponse : parsed.summary);
    if (!summary || summary.length > 900 || !directResponse || directResponse.length > 1500 || ASSERTIVE_AVAILABILITY.test(summary) || hasSensitiveContent(directResponse)) return null;
    return { status: parsed.status, summary, directResponse };
  } catch { return null; }
}

function insufficient(message: string, resolvedQuery: string, correctionNote: string | null): DiscoveryResearch {
  return { status: "insufficient", summary: message, directResponse: message, sources: [], communitySources: [], searchedAt: new Date().toISOString(), correctionNote, resolvedQuery, limitation: "AI research is not a substitute for a licensed legal-availability source. Public discussion links, when shown, are unverified and never used as availability or recommendation evidence." };
}

export async function researchDiscoveryLead(input: { query: string; region: string; language: string }): Promise<DiscoveryResearch> {
  const intent = resolveResearchQuery(input.query);
  const messages = [
      { role: "system" as const, content: "You are Streamwise’s conversational public-web movie assistant. Resolve likely title typos, then use web search and answer the user directly in natural language as a helpful web-search assistant would. Search reporting, official pages, guides, criticism, and public discussion. In directResponse, synthesise what the public web says, including provider names or prices when a source itself reports them, with natural attribution such as ‘search results indicate’ or ‘a public discussion says’. Do not copy posts, handles, personal data, credentials, or private material. The app separately displays inspectable source links and a licensed country-specific legal catalog; never call public-web findings verified, confirmed, or current legal availability. summary is a shorter neutral overview. Output JSON only." },
      { role: "user" as const, content: `Original research question: ${input.query}\nResolved search intent: ${intent.resolvedQuery}\nViewer country: ${input.region.toUpperCase()}\nLanguage context: ${input.language}\nThe verified legal catalog remains the authority for current offers.` },
    ];
  const direct = await directProviderResearch(messages);
  const models = direct ? null : await listLLMModels();
  const model = models?.data.find(item => item.id === "gpt-5-mini")?.id;
  if (!direct && !model) throw new Error("No direct or managed AI research model is configured.");
  const response = direct ? null : await invokeLLM({
    model: model!,
    maxCompletionTokens: 850,
    messages,
    outputSchema: { name: "streamwise_research_lead", strict: true, schema: { type: "object", properties: { status: { type: "string", enum: ["lead", "insufficient"] }, summary: { type: "string", minLength: 1, maxLength: 900 }, directResponse: { type: "string", minLength: 1, maxLength: 1200 } }, required: ["status", "summary", "directResponse"], additionalProperties: false } },
    tools: [{ type: "web_search", web_search_tool_conf: { search_context_size: "medium" } } as unknown as Tool],
    toolChoice: "auto",
  } as Parameters<typeof invokeLLM>[0]);
  const raw = response as unknown as RawResponse;
  const message = raw?.choices?.[0]?.message;
  const content = direct?.content ?? message?.content;
  const structured = parseStructuredLead(content);
  const sourceGroups = sourcesFrom([...(direct?.citations ?? []), ...(message?.metadata?.source_citations ?? []), ...inlineCitations(content)]);
  if (!structured || (!sourceGroups.sources.length && !sourceGroups.communitySources.length)) {
    const correction = intent.correctionNote ? ` ${intent.correctionNote.replace(/\*\*/g, "")}` : "";
    return insufficient(`I searched “${intent.resolvedQuery}” but could not ground an inspectable public reading link in this session.${correction} You can still use the legal catalog for current country-specific offers.`, intent.resolvedQuery, intent.correctionNote);
  }
  const isLeavingSoonQuery = /(?:leaving[- ]soon|platform[- ]switch|\bleaves?\b|\bexpiring\b)/i.test(input.query.trim());
  const summary = structured.status === "lead" ? (isLeavingSoonQuery ? structured.directResponse : structured.summary) : `Public-web reading and discussion links related to “${intent.resolvedQuery}” are collected below. Treat them as context, not current availability.`;
  const directResponse = structured.status === "lead" ? structured.directResponse : `I found public-web results related to “${intent.resolvedQuery}”. The linked pages below are the direct context for this answer; check the legal catalog for current country-specific offers.`;
  return { status: "lead", summary, directResponse, ...sourceGroups, searchedAt: new Date().toISOString(), resolvedQuery: intent.resolvedQuery, correctionNote: intent.correctionNote, limitation: "This direct answer compiles public-web context. It remains separate from the licensed country-specific legal catalog, which is the place to confirm current offers." };
}
