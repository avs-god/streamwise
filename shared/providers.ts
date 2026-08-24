export type ProviderGuide = {
  slug: string;
  name: string;
  aliases: string[];
  supportUrl: string;
  cancellationUrl?: string;
  description: string;
};

export const providerGuides: ProviderGuide[] = [
  {
    slug: "netflix",
    name: "Netflix",
    aliases: ["netflix", "netflix basic with ads"],
    supportUrl: "https://help.netflix.com/",
    cancellationUrl: "https://help.netflix.com/en/node/407",
    description:
      "Use your account page for the plan and cancellation terms that apply in your country.",
  },
  {
    slug: "prime-video",
    name: "Prime Video",
    aliases: ["amazon prime video", "prime video", "amazon video"],
    supportUrl: "https://www.primevideo.com/help",
    description:
      "Membership and standalone-channel conditions can vary by territory and account type.",
  },
  {
    slug: "apple-tv",
    name: "Apple TV",
    aliases: ["apple tv", "apple tv+"],
    supportUrl: "https://support.apple.com/tv",
    description:
      "Confirm the current plan, bundle eligibility, and cancellation path with Apple before making changes.",
  },
  {
    slug: "mubi",
    name: "MUBI",
    aliases: ["mubi", "mubi amazon channel"],
    supportUrl: "https://help.mubi.com/hc/en-us",
    description:
      "MUBI’s rotating catalogue and member benefits can differ by country, so check the local service page before deciding.",
  },
  {
    slug: "youtube",
    name: "YouTube",
    aliases: ["youtube", "youtube premium"],
    supportUrl: "https://support.google.com/youtube/",
    description:
      "Rental, purchase, and subscription offers are distinct; verify the exact offer on YouTube before completing a transaction.",
  },
];

export function findProviderGuide(value: string) {
  const normalized = value.trim().toLowerCase();
  return providerGuides.find(
    provider => provider.slug === normalized || provider.aliases.includes(normalized),
  );
}

export function providerNamesMatch(a: string, b: string) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;

  const leftGuide = findProviderGuide(left);
  const rightGuide = findProviderGuide(right);
  return Boolean(leftGuide && rightGuide && leftGuide.slug === rightGuide.slug);
}
