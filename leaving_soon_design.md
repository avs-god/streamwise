# Leaving-Soon Tracking Design

## Evidence model

Streamwise will make **three evidence lanes** visually and semantically distinct. A legal-catalog change is the only lane that may update a confirmed availability state. Community reports and public-web research are useful discovery aids, but remain leads until a permitted catalog source confirms the change.

| Lane | What it records | Product use | Boundary |
|---|---|---|---|
| **Confirmed catalog change** | A country-specific legal offer snapshot that is present, removed, or changed | May drive opted-in tracking and in-app alerts | Requires the existing legal catalog boundary; never inferred from discussion or search results. |
| **Community lead** | A member-submitted leaving-soon or platform-switch observation with an optional public source URL | May appear in the Leaving Soon hub after moderation | Always labelled unverified; cannot alter a confirmed offer, alert, or subscription decision. |
| **Public-web lead** | A source-linked research result from a publisher or public discussion page | May appear as unverified context with source links | No account scraping, copied personal posts, handles, or conversion into a catalog fact. |

## Member tracking and account connections

Members will be able to opt into alerts for titles they have already saved and providers they choose. Those alerts will describe whether the signal is a confirmed catalog change or an unverified lead, include source/freshness information, and always direct the member to confirm with the provider before acting.

Streamwise must **not** present a Netflix, Prime Video, or other provider password form, scrape a member’s private watchlist, or request cookies. A provider account connection can be added only if that provider supplies an approved OAuth or API partnership with narrowly scoped, revocable consent. Until then, the product will offer an honest integration-readiness notice rather than a nonfunctional sign-in surrogate.

## Refresh approaches

| Approach | Trade-offs | Cost | Setup complexity |
|---|---|---:|---:|
| Legal catalog snapshots with a managed daily refresh | Deterministic, source-labelled, and suitable for opted-in alerts; needs a permitted catalog credential | Included in the deployed application runtime | Low after catalog credentials are supplied |
| Contracted partner availability feed with change data | Broader, more timely provider-change coverage and historical availability options; requires a commercial agreement and branding/linking compliance | Contract-dependent | Higher, because partner approval and credentials are required |
| Public-web and community lead intake | Helps members discover discussions and headlines early; cannot be treated as confirmation | Low | Moderate, with moderation and source-boundary controls |

## Official availability-data finding

JustWatch’s Content Partner materials describe API, data-dump, and widget integrations; the documentation says partner access follows a contract and uses a partner token. It describes daily availability updates and provider/offer change information, while also requiring branded JustWatch links next to qualifying availability integrations. [1] [2]

> The production design therefore keeps confirmed leaving-soon change detection on the permitted catalog lane, and treats public discussion or community observations only as separate, reviewable leads.

## References

[1]: https://apis.justwatch.com/docs/content_partner/ "JustWatch Content Partner: Getting Started"
[2]: https://apis.justwatch.com/docs/api/ "JustWatch Content Partner API Documentation"
