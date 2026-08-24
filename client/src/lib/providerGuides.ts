export type ClientProviderGuide = {
  slug: string;
  name: string;
  supportUrl: string;
  cancellationUrl?: string;
  description: string;
};

export const clientProviderGuides: ClientProviderGuide[] = [
  { slug: "netflix", name: "Netflix", supportUrl: "https://help.netflix.com/", cancellationUrl: "https://help.netflix.com/en/node/407", description: "Use your account page for the plan and cancellation terms that apply in your country." },
  { slug: "prime-video", name: "Prime Video", supportUrl: "https://www.primevideo.com/help", description: "Membership and standalone-channel conditions can vary by territory and account type." },
  { slug: "apple-tv", name: "Apple TV", supportUrl: "https://support.apple.com/tv", description: "Confirm the current plan, bundle eligibility, and cancellation path with Apple before making changes." },
  { slug: "mubi", name: "MUBI", supportUrl: "https://help.mubi.com/hc/en-us", description: "MUBI’s rotating catalogue and member benefits can differ by country, so check the local service page before deciding." },
  { slug: "youtube", name: "YouTube", supportUrl: "https://support.google.com/youtube/", description: "Rental, purchase, and subscription offers are distinct; verify the exact offer on YouTube before completing a transaction." },
];
