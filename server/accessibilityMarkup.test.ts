import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("keyboard and semantic-accessibility regression checks", () => {
  it("keeps labelled primary navigation, sign-out, and visible focus treatments", () => {
    const frame = source("client/src/components/AppFrame.tsx");
    const styles = source("client/src/index.css");

    expect(frame).toContain('aria-label="Primary"');
    expect(frame).toContain('aria-label="Mobile navigation"');
    expect(frame).toContain('aria-label="Open menu"');
    expect(frame).toContain("<AssistantLauncher />");
    expect(frame).toContain('aria-label="Sign out"');
    expect(frame).toContain("focus-visible:ring-2");
    expect(styles).toContain("focus-visible");
  });

  it("keeps associated labels and accessible dialog primitives for keyboard input flows", () => {
    const home = source("client/src/pages/Home.tsx");
    const wallet = source("client/src/pages/Wallet.tsx");
    const titleDialog = source("client/src/components/TitleDialog.tsx");

    expect(home).toContain('htmlFor="title-search"');
    expect(home).toContain('htmlFor="country"');
    expect(wallet).toContain('htmlFor="provider"');
    expect(wallet).toContain('htmlFor="plan"');
    expect(wallet).toContain("<Dialog");
    expect(titleDialog).toContain("<Dialog");
    expect(titleDialog).toContain("<Select");
  });

  it("keeps distinct source-category labels separate from catalog evidence", () => {
    const panel = source("client/src/components/AiResearchPanel.tsx");
    expect(panel).toContain("Critic / film reading");
    expect(panel).toContain("Reporting / reference");
    expect(panel).toContain("Unverified discussion");
    expect(panel).toContain("never used as availability, alert, tracking, or recommendation evidence");
  });

  it("keeps external rating and critic links outbound-only on title pages", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("IMDb reference");
    expect(page).toContain("Rotten Tomatoes reference");
    expect(page).toContain("RogerEbert.com reading");
    expect(page).toContain("Variety reading");
    expect(page).toContain("The Guardian film reading");
    expect(page).toContain("does not reproduce protected scores, review text, or publication metadata");
    expect(page).toContain("outbound-only references");
    expect(page).toContain("No score, review text, or rating timestamp is imported");
    expect(page).toContain("critic-reading links are unavailable until the catalog resolves this title");
  });

  it("keeps title-level community rating, review, and report controls available", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("Write a community review");
    expect(page).toContain("Publish community review");
    expect(page).toContain("Report review");
    expect(page).toContain("setTitleRating");
  });

  it("keeps similar-title navigation explicitly catalog-derived", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("Catalog-derived similar");
    expect(page).toContain("catalog.similar.useQuery");
  });

  it("keeps public-web research loading, failure, sign-in, and provenance states visible", () => {
    const panel = source("client/src/components/AiResearchPanel.tsx");
    expect(panel).toContain("Sign in for web context");
    expect(panel).toContain("Searching the public web and compiling a direct answer");
    expect(panel).toContain("Public-web research could not be completed");
    expect(panel).toContain("No grounded source returned");
    expect(panel).toContain("Separate evidence");
  });

  it("keeps title-linked thread context and one-time signed-in composer behavior", () => {
    const community = source("client/src/pages/Community.tsx");
    expect(community).toContain('params.get("tmdbId")');
    expect(community).toContain("titleLinkHandled.current");
    expect(community).toContain("Catalog-linked discussion for");
    expect(community).toContain("The title ID is retained when this thread is published.");
  });

  it("keeps title-page legal offers provider-first and post-watch picks catalog-derived", () => {
    const page = source("client/src/pages/TitlePage.tsx");
    expect(page).toContain("Verified legal offers in");
    expect(page).toContain("Where to stream");
    expect(page.indexOf("<LegalOfferPanel")).toBeLessThan(page.indexOf("External ratings and critic reading"));
    expect(page).toContain("catalog.recommended.useQuery");
    expect(page).toContain("After this title");
    expect(page).toContain("Catalog-derived related titles");
    expect(page).toContain("Discuss this title with the community");
    expect(page).toContain("tmdbId=${title.id}");
  });

  it("keeps watched signals explicit, private, removable, and separately disclosed to the assistant", () => {
    const watchlist = source("client/src/pages/Watchlist.tsx");
    const assistant = source("client/src/pages/Assistant.tsx");
    expect(watchlist).toContain("Private viewing signal");
    expect(watchlist).toContain("Record as watched");
    expect(watchlist).toContain("Remove record");
    expect(watchlist).toContain("Loading your private watched-record status");
    expect(watchlist).toContain("Private watched-record status could not be loaded.");
    expect(watchlist).toContain("never inferred from activity or shared publicly");
    expect(watchlist).toContain("trpc.viewingSignals");
    expect(assistant).toContain("titles you explicitly record as watched");
    expect(assistant).toContain("does not infer viewing history");
  });

  it("keeps private post-watch picks consent-scoped and separate from public catalog discovery", () => {
    const recommendations = source("client/src/pages/Recommendations.tsx");
    expect(recommendations).toContain("Private post-watch picks");
    expect(recommendations).toContain("Only from titles you recorded.");
    expect(recommendations).toContain("trpc.viewingSignals.postWatchPicks");
    expect(recommendations).toContain("never inferred from activity or public discussion");
    expect(recommendations).toContain("Private post-watch picks could not be loaded.");
    expect(recommendations).toContain("No private post-watch picks are available yet.");
  });

  it("keeps reply-level moderation private and tied to the existing thread-report contract", () => {
    const community = source("client/src/pages/Community.tsx");
    expect(community).toContain("Report reply");
    expect(community).toContain("Report a {target}");
    expect(community).toContain("replyId: threadReporting.replyId");
    expect(community).toContain("Reports are private moderation signals");
  });

  it("gates moderation tools to administrators and keeps report targets distinct", () => {
    const moderation = source("client/src/pages/Moderation.tsx");
    expect(moderation).toContain('user?.role === "admin"');
    expect(moderation).toContain("Administrator access only");
    expect(moderation).toContain("Take down contribution");
    expect(moderation).toContain('Take down {report.replyId ? "reply" : "thread"}');
    expect(moderation).toContain("trpc.community.moderation.setReplyStatus");
    expect(source("client/src/pages/Community.tsx")).toContain("publish immediately");
  });

  it("preserves nested reply controls and visible parent-reply treatment", () => {
    const community = source("client/src/pages/Community.tsx");
    expect(community).toContain("Reply to this comment");
    expect(community).toContain("parentReplyId");
    expect(community).toContain("ml-5 border-l-4");
    expect(community).toContain("Write a top-level reply instead");
  });

  it("distinguishes consented private inputs, aggregate community context, and unverified public-web context", () => {
    const home = source("client/src/pages/Home.tsx");
    expect(home).toContain("Your consented signals:");
    expect(home).toContain("Streamwise never infers viewing history.");
    expect(home).toContain("Community context:");
    expect(home).toContain("never a private profile signal");
    expect(home).toContain("AI public-web context:");
  });

  it("keeps verified provider and offer categories ahead of public-web context on catalog cards", () => {
    const preview = source("client/src/components/CatalogOfferPreview.tsx");
    const home = source("client/src/pages/Home.tsx");
    const recommendations = source("client/src/pages/Recommendations.tsx");
    expect(preview).toContain("Where to stream in {region}");
    expect(preview).toContain("JustWatch via TMDb");
    expect(preview).toContain("offer.name");
    expect(preview).toContain("offerType[offer.type]");
    expect(preview).toContain("Verified legal offers could not be loaded for this card");
    expect(preview).toContain("Legal provider preview is unavailable");
    expect(home).toContain("<CatalogOfferPreview titleId={title.id}");
    expect(recommendations).toContain("<CatalogOfferPreview titleId={title.id}");
    expect(source("client/src/pages/TitlePage.tsx")).toContain("<CatalogOfferPreview titleId={item.id}");
  });

  it("does not guess adaptation relationships when no verified structured catalog field exists", () => {
    const recommendations = source("client/src/pages/Recommendations.tsx");
    expect(recommendations).toContain("Adaptation lists are not guessed.");
    expect(recommendations).toContain("complete, licensed");
    expect(recommendations).toContain('aria-expanded={adaptationNoticeOpen}');
  });

  it("preserves the public provider-first hierarchy without inventing a live catalog", () => {
    const home = source("client/src/pages/Home.tsx");
    const title = source("client/src/pages/TitlePage.tsx");
    const community = source("client/src/pages/Community.tsx");
    expect(home).toContain('aria-label="Verified legal catalog results"');
    expect(home).toContain("AI public-web context");
    const populatedBranch = title.slice(title.indexOf("<LegalOfferPanel"));
    expect(populatedBranch.indexOf("<LegalOfferPanel")).toBeLessThan(populatedBranch.indexOf("<ExternalReferencePanel"));
    expect(populatedBranch.indexOf("<ExternalReferencePanel")).toBeLessThan(populatedBranch.indexOf("<TitleCommunity"));
    expect(populatedBranch.indexOf("<TitleCommunity")).toBeLessThan(populatedBranch.indexOf("<RelatedTitleGrid"));
    expect(title).toContain("Legal catalog is safely on standby.");
    expect(community).toContain("Conversation feed");
    expect(community).toContain("unverified leads");
  });

  it("maps the original consumer problems to implemented product surfaces and candid catalog limits", () => {
    const audit = source("problem_coverage.md");
    const watchlist = source("client/src/pages/Watchlist.tsx");
    const community = source("client/src/pages/Community.tsx");
    const recommendations = source("client/src/pages/Recommendations.tsx");
    const title = source("client/src/pages/TitlePage.tsx");
    const decisions = source("client/src/pages/Decisions.tsx");
    expect(audit).toContain("Fragmented title discovery");
    expect(audit).toContain("Country-specific platform churn");
    expect(audit).toContain("Leaving-soon uncertainty");
    expect(audit).toContain("Subscription sprawl and cost ambiguity");
    expect(audit).toContain("Cancellation friction");
    expect(audit).toContain("Need for legal alternatives");
    expect(watchlist).toContain("Track observed changes");
    expect(community).toContain("Leaving-soon lead");
    expect(recommendations).toContain("Private post-watch picks");
    expect(title).toContain("Where to stream");
    expect(decisions).toContain("cancel candidate");
    expect(audit).toContain("require a permitted server-side credential");
  });

  it("keeps leaving-soon tracking in explicit confirmed, community, and grounded-public-web lanes", () => {
    const hub = source("client/src/pages/LeavingSoon.tsx");
    const community = source("client/src/pages/Community.tsx");
    const router = source("server/routers.ts");
    expect(hub).toContain("Leaving soon, without false certainty.");
    expect(hub).toContain("Confirmed provider checks");
    expect(hub).toContain("Community leads");
    expect(hub).toContain("Grounded public-web context");
    expect(hub).toContain("No OTT passwords or private watchlists.");
    expect(hub).toContain("official provider-authorized OAuth or API integration");
    expect(hub).toContain("Grounded public-web check");
    expect(hub).toContain("Ask directly. Read the grounded model response.");
    expect(hub).toContain("It never becomes a confirmed departure, alert, countdown, or legal offer.");
    expect(hub).toContain("Direct web-grounded model response");
    expect(community).toContain("reportedLeavingAt");
    expect(community).toContain("switchesToProviderName");
    expect(community).toContain("These fields are community leads, not confirmation.");
    expect(router).toContain("reportedLeavingAt: z.coerce.date().nullable().optional()");
    expect(router).toContain("switchesToProviderName: z.string().trim().min(1).max(150).nullable().optional()");
  });
});
