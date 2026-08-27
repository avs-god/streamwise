# Advertising Readiness

Streamwise uses **one manually placed, non-intrusive responsive display unit**. It is designed to appear in a neutral page section, with a clear Sponsored label and an explicit statement that it does not influence legal offers, rankings, AI outputs, recommendations, or community visibility.

The configured Google Ads connection is read-only account and campaign analytics. It does **not** provide a publisher display-ad tag or the publisher placement values required for a website to render an ad. To activate the existing placement, supply both public deployment-time values after the website is approved in Google AdSense:

| Setting | Purpose |
|---|---|
| `VITE_ADSENSE_CLIENT_ID` | Public AdSense publisher identifier, normally beginning with `ca-pub-`. |
| `VITE_ADSENSE_DISCOVERY_SLOT_ID` | Numeric ID of the approved responsive display-ad unit. |

The placement remains absent until both values exist. A responsive display unit can adapt to the available page width and supports mobile full-width behavior through `data-ad-format="auto"` and `data-full-width-responsive="true"`.[1][2]

## References

[1] [Google AdSense Help — About the responsive behavior of display ad units](https://support.google.com/adsense/answer/9183362?hl=en)

[2] [Google AdSense Help — How to use responsive ad tag parameters](https://support.google.com/adsense/answer/9183460?hl=en-GB)
