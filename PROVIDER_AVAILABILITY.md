# Provider Availability Presentation

Streamwise compares country-specific legal offers from three separately labelled provider data sources: **TMDb / JustWatch**, **Watchmode**, and **Streaming Availability by Movie of the Night**. Source results remain independent; the interface does not merge disagreement into a single asserted offer.

The TMDb watch-provider contract supplies per-country streaming, rental, and purchase availability. Streamwise preserves those categories as `Included`, `Ad-supported`, `Free`, `Rent`, and `Buy`. This permits a source-returned **YouTube**, **YouTube Movies**, **Google TV**, or **Google Play Movies** option to appear exactly with its returned transactional type. It never converts a rental or purchase option into a subscription-streaming claim.

The compact card preview initially limits visual density but provides a `Show all` control whenever additional first-source offers exist. Comparison-source panels also expand with the same control. Public-web AI context may mention a provider only with inspectable sources, remains visibly distinct from the legal offer panels, and never becomes an availability fact, alert, or personal tracking signal.

## Source

- [TMDb Watch Providers — streaming, rental, and purchase availability by country](https://developer.themoviedb.org/reference/movie-watch-providers)
